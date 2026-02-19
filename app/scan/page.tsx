"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { CaseStatus } from "@/lib/types";
import { uiStatuses } from "@/lib/status";

type CaseRow = {
  id: string;
};

type DetectorLike = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
};

type Html5ScannerLike = {
  start: (
    cameraConfig: string | MediaTrackConstraints,
    config: { fps?: number; qrbox?: { width: number; height: number } },
    qrCodeSuccessCallback: (decodedText: string) => void,
    qrCodeErrorCallback?: (errorMessage: string) => void
  ) => Promise<unknown>;
  stop: () => Promise<void>;
  clear: () => void | Promise<void>;
};

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const htmlScannerRef = useRef<Html5ScannerLike | null>(null);

  const [cases, setCases] = useState<CaseRow[]>([]);
  const [caseId, setCaseId] = useState("");
  const [status, setStatus] = useState<CaseStatus>("Packed");
  const [zone, setZone] = useState("Nose-Curb");
  const [truck, setTruck] = useState("Truck 1");
  const [message, setMessage] = useState("Ready to scan");
  const [cameraState, setCameraState] = useState<"idle" | "active-native" | "active-fallback" | "unsupported">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/cases");
      if (!res.ok) {
        return;
      }
      const data = (await res.json()) as CaseRow[];
      setCases(data);
    };

    void load();

    return () => {
      void stopCamera();
    };
  }, []);

  const stopCamera = async () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (htmlScannerRef.current) {
      try {
        await htmlScannerRef.current.stop();
      } catch {
        // Scanner may already be stopped.
      }
      try {
        await htmlScannerRef.current.clear();
      } catch {
        // Container may already be cleared.
      }
      htmlScannerRef.current = null;
    }

    setCameraState("idle");
  };

  const submitScan = async (overrideCaseId?: string) => {
    const nextCaseId = (overrideCaseId ?? caseId).trim();
    if (!nextCaseId) {
      setMessage("Scan or enter a Case ID first.");
      return;
    }

    setIsSubmitting(true);

    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId: nextCaseId,
        status,
        zone: status === "Loaded" ? zone : undefined,
        truck: status === "Loaded" ? truck : undefined
      })
    });

    const payload = (await res.json()) as { error?: string; id?: string; status?: string };

    if (!res.ok) {
      setMessage(payload.error ?? "Update failed.");
      setIsSubmitting(false);
      return;
    }

    setCaseId(nextCaseId);
    setMessage(`Updated ${payload.id} -> ${payload.status}${status === "Loaded" ? ` (${zone})` : ""}`);
    setIsSubmitting(false);
  };

  const runDetectionLoop = (detector: DetectorLike, video: HTMLVideoElement) => {
    const tick = async () => {
      if (!streamRef.current) {
        return;
      }

      try {
        const barcodes = await detector.detect(video);
        const hit = barcodes.find((item) => item.rawValue?.trim());

        if (hit?.rawValue) {
          const scannedValue = hit.rawValue.trim();
          setCaseId(scannedValue);
          setMessage(`Scanned ${scannedValue}. Sending update...`);
          await stopCamera();
          void submitScan(scannedValue);
          return;
        }
      } catch {
        setMessage("Native camera scan failed. Switching to fallback scanner...");
        await stopCamera();
        void startFallbackCamera();
        return;
      }

      rafRef.current = requestAnimationFrame(() => {
        void tick();
      });
    };

    rafRef.current = requestAnimationFrame(() => {
      void tick();
    });
  };

  const startFallbackCamera = async () => {
    try {
      await stopCamera();

      const mod = (await import("html5-qrcode")) as unknown as {
        Html5Qrcode: new (elementId: string) => Html5ScannerLike;
      };

      const scanner = new mod.Html5Qrcode("fallback-reader");
      htmlScannerRef.current = scanner;

      setCameraState("active-fallback");
      setMessage("Fallback scanner active. Point at a case QR code.");

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          const scannedValue = decodedText.trim();
          if (!scannedValue) {
            return;
          }
          setCaseId(scannedValue);
          setMessage(`Scanned ${scannedValue}. Sending update...`);
          void stopCamera();
          void submitScan(scannedValue);
        }
      );
    } catch {
      setCameraState("unsupported");
      setMessage("Unable to start camera scanner on this browser. Use manual entry.");
      await stopCamera();
    }
  };

  const startCamera = async () => {
    if (cameraState === "active-native" || cameraState === "active-fallback") {
      return;
    }

    const BarcodeDetectorCtor = (globalThis as { BarcodeDetector?: new (options: { formats: string[] }) => DetectorLike }).BarcodeDetector;

    if (!navigator.mediaDevices?.getUserMedia || !BarcodeDetectorCtor) {
      void startFallbackCamera();
      return;
    }

    try {
      await stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }
        },
        audio: false
      });

      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        setMessage("Video element unavailable.");
        return;
      }

      streamRef.current = stream;
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();

      setCameraState("active-native");
      setMessage("Camera active. Point at a case QR code.");

      const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });
      runDetectionLoop(detector, video);
    } catch {
      setMessage("Native camera unavailable. Trying fallback scanner...");
      await stopCamera();
      void startFallbackCamera();
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await submitScan();
  };

  return (
    <main className="grid" style={{ gap: 16 }}>
      <section className="panel" style={{ padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>Scan Mode</h1>
        <p style={{ color: "#5d6d63" }}>Uses native QR scanner first, then auto-falls back for broader iOS support.</p>
      </section>

      <section className="panel" style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <button className="btn" type="button" onClick={() => void startCamera()} disabled={cameraState === "active-native" || cameraState === "active-fallback"}>
            Start Camera Scan
          </button>
          <button className="btn" type="button" onClick={() => void stopCamera()} style={{ background: "#64748b" }}>
            Stop Camera
          </button>
        </div>

        <video
          ref={videoRef}
          style={{
            width: "100%",
            maxHeight: 320,
            borderRadius: 12,
            background: "#0f172a",
            display: cameraState === "active-native" ? "block" : "none"
          }}
          muted
        />

        <div
          id="fallback-reader"
          style={{
            width: "100%",
            maxWidth: 520,
            margin: cameraState === "active-fallback" ? "0 auto" : "0",
            display: cameraState === "active-fallback" ? "block" : "none"
          }}
        />

        {cameraState === "unsupported" && <p style={{ color: "#b91c1c", marginBottom: 0 }}>Camera scanner unavailable. Use manual entry.</p>}
      </section>

      <form className="panel" style={{ padding: 16 }} onSubmit={onSubmit}>
        <label>Scan or enter Case ID</label>
        <input value={caseId} onChange={(e) => setCaseId(e.target.value)} placeholder="AUD-001" list="case-ids" />
        <datalist id="case-ids">
          {cases.map((item) => (
            <option key={item.id} value={item.id} />
          ))}
        </datalist>

        <div style={{ marginTop: 12 }}>
          <label>New Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as CaseStatus)}>
            {uiStatuses.map((entry) => (
              <option key={entry}>{entry}</option>
            ))}
          </select>
        </div>

        {status === "Loaded" && (
          <>
            <div style={{ marginTop: 12 }}>
              <label>Truck</label>
              <select value={truck} onChange={(e) => setTruck(e.target.value)}>
                <option>Truck 1</option>
                <option>Truck 2</option>
              </select>
            </div>
            <div style={{ marginTop: 12 }}>
              <label>Truck Zone</label>
              <select value={zone} onChange={(e) => setZone(e.target.value)}>
                <option>Nose-Curb</option>
                <option>Nose-Street</option>
                <option>Mid-Curb</option>
                <option>Mid-Street</option>
                <option>Tail-Curb</option>
                <option>Tail-Street</option>
              </select>
            </div>
          </>
        )}

        <button className="btn" style={{ marginTop: 12 }} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Status"}
        </button>
        <p style={{ marginBottom: 0, color: "#5d6d63" }}>{message}</p>
      </form>
    </main>
  );
}
