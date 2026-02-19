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

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const [cases, setCases] = useState<CaseRow[]>([]);
  const [caseId, setCaseId] = useState("");
  const [status, setStatus] = useState<CaseStatus>("Packed");
  const [zone, setZone] = useState("Nose-Curb");
  const [truck, setTruck] = useState("Truck 1");
  const [message, setMessage] = useState("Ready to scan");
  const [cameraState, setCameraState] = useState<"idle" | "active" | "unsupported">("idle");
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
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
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
          stopCamera();
          void submitScan(scannedValue);
          return;
        }
      } catch {
        setMessage("Camera scan failed. Try manual entry.");
        stopCamera();
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

  const startCamera = async () => {
    if (cameraState === "active") {
      return;
    }

    const BarcodeDetectorCtor = (globalThis as { BarcodeDetector?: new (options: { formats: string[] }) => DetectorLike }).BarcodeDetector;

    if (!navigator.mediaDevices?.getUserMedia || !BarcodeDetectorCtor) {
      setCameraState("unsupported");
      setMessage("Camera scanning is not supported on this browser. Use manual entry.");
      return;
    }

    try {
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

      setCameraState("active");
      setMessage("Camera active. Point at a case QR code.");

      const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });
      runDetectionLoop(detector, video);
    } catch {
      setMessage("Unable to access camera. Check browser permissions.");
      stopCamera();
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
        <p style={{ color: "#5d6d63" }}>Use camera scan for QR updates. Manual entry remains as fallback.</p>
      </section>

      <section className="panel" style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <button className="btn" type="button" onClick={startCamera} disabled={cameraState === "active"}>
            Start Camera Scan
          </button>
          <button className="btn" type="button" onClick={stopCamera} style={{ background: "#64748b" }}>
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
            display: cameraState === "active" ? "block" : "none"
          }}
          muted
        />

        {cameraState === "unsupported" && <p style={{ color: "#b91c1c", marginBottom: 0 }}>BarcodeDetector is unavailable on this browser.</p>}
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
