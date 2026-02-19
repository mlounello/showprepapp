"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import {
  getQueuedScans,
  clearQueuedScans,
  OFFLINE_ACTIVE_SHOW_KEY,
  OFFLINE_CASES_KEY,
  OFFLINE_EVENT,
  OFFLINE_SHOWS_KEY,
  queueScan,
  readJson,
  removeQueuedScan,
  getScanSyncMeta,
  setScanSyncMeta,
  writeJson
} from "@/lib/offline-lite";
import { CaseStatus } from "@/lib/types";
import { uiStatuses } from "@/lib/status";

type CaseRow = {
  id: string;
};

type ShowRow = {
  id: string;
  name: string;
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

type ScanRequestPayload = {
  caseId: string;
  status: CaseStatus;
  zone?: string;
  truck?: string;
  showId?: string;
  operatorLabel?: string;
  issueType?: "Missing" | "Damaged" | "Other";
  issueNotes?: string;
  issuePhotoDataUrl?: string;
};

async function compressImageFile(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read image data"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode image"));
    img.src = dataUrl;
  });

  const maxDim = 1400;
  const scale = Math.min(1, maxDim / Math.max(image.width, image.height));
  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    return dataUrl;
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const htmlScannerRef = useRef<Html5ScannerLike | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const retryDelayMsRef = useRef(3000);

  const [cases, setCases] = useState<CaseRow[]>([]);
  const [shows, setShows] = useState<ShowRow[]>([]);
  const [caseId, setCaseId] = useState("");
  const [status, setStatus] = useState<CaseStatus>("Packed");
  const [zone, setZone] = useState("Nose-Curb");
  const [truck, setTruck] = useState("Truck 1");
  const [showId, setShowId] = useState("");
  const [operatorLabel, setOperatorLabel] = useState("");
  const [logIssue, setLogIssue] = useState(false);
  const [issueType, setIssueType] = useState<"Missing" | "Damaged" | "Other">("Missing");
  const [issueNotes, setIssueNotes] = useState("");
  const [issuePhotoDataUrl, setIssuePhotoDataUrl] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState("Ready to scan");
  const [cameraState, setCameraState] = useState<"idle" | "active-native" | "active-fallback" | "unsupported">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncingQueue, setIsSyncingQueue] = useState(false);
  const [oldestQueuedAt, setOldestQueuedAt] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [nextRetryAt, setNextRetryAt] = useState<string | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  const shouldLogIssue = logIssue || status === "Issue";

  const formatMetaTime = (iso: string | null) => {
    if (!iso) {
      return "-";
    }
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit"
    }).format(new Date(iso));
  };

  const clearRetryTimer = () => {
    if (retryTimerRef.current != null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  const refreshQueueState = () => {
    const queue = getQueuedScans();
    setQueueCount(queue.length);
    setOldestQueuedAt(queue.length > 0 ? queue[0].createdAt : null);
  };

  useEffect(() => {
    const cachedCases = readJson<CaseRow[]>(OFFLINE_CASES_KEY, []);
    if (cachedCases.length > 0) {
      setCases(cachedCases);
    }

    const cachedShowsMap = readJson<Record<string, { id: string; name: string }>>(OFFLINE_SHOWS_KEY, {});
    const cachedShows = Object.values(cachedShowsMap).map((entry) => ({ id: entry.id, name: entry.name }));
    if (cachedShows.length > 0) {
      setShows(cachedShows);
    }

    const activeShow = readJson<{ id?: string } | null>(OFFLINE_ACTIVE_SHOW_KEY, null);
    if (activeShow?.id) {
      setShowId(activeShow.id);
    }

    refreshQueueState();
    const syncMeta = getScanSyncMeta();
    setLastSyncAt(syncMeta.lastSuccessAt ?? null);
    setNextRetryAt(syncMeta.nextRetryAt ?? null);
    setLastSyncError(syncMeta.lastError ?? null);
    const cachedOperator = window.localStorage.getItem("scan-operator-label");
    if (cachedOperator) {
      setOperatorLabel(cachedOperator);
    }

    const load = async () => {
      try {
        const [casesRes, showsRes] = await Promise.all([fetch("/api/cases"), fetch("/api/shows")]);

        if (casesRes.ok) {
          const caseData = (await casesRes.json()) as CaseRow[];
          setCases(caseData);
          writeJson(OFFLINE_CASES_KEY, caseData);
        }

        if (showsRes.ok) {
          const showData = (await showsRes.json()) as ShowRow[];
          setShows(showData);
          const showMap = showData.reduce<Record<string, ShowRow>>((acc, show) => {
            acc[show.id] = show;
            return acc;
          }, {});
          writeJson(OFFLINE_SHOWS_KEY, showMap);

          if (showData.length > 0) {
            setShowId((prev) => prev || showData[0].id);
          }
        }
      } catch {
        setMessage("Offline mode: using cached shows/cases.");
      }
    };

    void load();

    const onOnline = () => {
      void flushQueuedScans();
    };
    const onOfflineStateChanged = () => {
      refreshQueueState();
      const syncMeta = getScanSyncMeta();
      setLastSyncAt(syncMeta.lastSuccessAt ?? null);
      setNextRetryAt(syncMeta.nextRetryAt ?? null);
      setLastSyncError(syncMeta.lastError ?? null);
    };
    window.addEventListener("online", onOnline);
    window.addEventListener(OFFLINE_EVENT, onOfflineStateChanged);
    void flushQueuedScans();

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener(OFFLINE_EVENT, onOfflineStateChanged);
      clearRetryTimer();
      void stopCamera();
    };
  }, []);

  useEffect(() => {
    if (!showId) {
      return;
    }
    writeJson(OFFLINE_ACTIVE_SHOW_KEY, { id: showId, updatedAt: new Date().toISOString() });
  }, [showId]);

  useEffect(() => {
    window.localStorage.setItem("scan-operator-label", operatorLabel);
  }, [operatorLabel]);

  const sendScanRequest = async (payload: ScanRequestPayload) => {
    return fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  };

  const scheduleQueueRetry = (reason: string) => {
    if (!navigator.onLine) {
      return;
    }
    clearRetryTimer();
    const delayMs = retryDelayMsRef.current;
    const retryAtIso = new Date(Date.now() + delayMs).toISOString();
    setNextRetryAt(retryAtIso);
    setLastSyncError(reason);
    setScanSyncMeta({
      lastError: reason,
      nextRetryAt: retryAtIso
    });
    retryTimerRef.current = window.setTimeout(() => {
      retryDelayMsRef.current = Math.min(retryDelayMsRef.current * 2, 60000);
      void flushQueuedScans();
    }, delayMs);
  };

  const flushQueuedScans = async () => {
    if (!navigator.onLine) {
      return;
    }

    const queue = getQueuedScans();
    if (queue.length === 0) {
      refreshQueueState();
      setNextRetryAt(null);
      setLastSyncError(null);
      setScanSyncMeta({ nextRetryAt: undefined, lastError: undefined });
      clearRetryTimer();
      return;
    }

    setIsSyncingQueue(true);
    const attemptedAt = new Date().toISOString();
    setScanSyncMeta({ lastAttemptAt: attemptedAt });
    let synced = 0;
    let failed = false;

    for (const item of queue) {
      try {
        const res = await sendScanRequest(item.payload as ScanRequestPayload);
        if (res.ok) {
          removeQueuedScan(item.id);
          synced += 1;
        } else {
          failed = true;
          break;
        }
      } catch {
        failed = true;
        break;
      }
    }

    refreshQueueState();
    const remaining = getQueuedScans().length;
    setIsSyncingQueue(false);

    if (synced > 0) {
      const successAt = new Date().toISOString();
      setLastSyncAt(successAt);
      setLastSyncError(null);
      setNextRetryAt(null);
      setScanSyncMeta({
        lastSuccessAt: successAt,
        lastError: undefined,
        nextRetryAt: undefined
      });
      retryDelayMsRef.current = 3000;
      clearRetryTimer();
      setMessage(`Synced ${synced} queued scan${synced > 1 ? "s" : ""}.`);
    }

    if (remaining > 0 && failed) {
      scheduleQueueRetry("Sync paused: server/network error, retrying automatically.");
    }
  };

  const onPhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setIssuePhotoDataUrl(undefined);
      return;
    }

    try {
      const compressed = await compressImageFile(file);
      setIssuePhotoDataUrl(compressed || undefined);
      if (compressed.length > 2_000_000) {
        setMessage("Photo still large after compression; consider a smaller image.");
      } else {
        setMessage("Photo compressed and attached.");
      }
    } catch {
      setMessage("Could not process photo file.");
      setIssuePhotoDataUrl(undefined);
    }
  };

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

    if (shouldLogIssue && !showId) {
      setMessage("Select a show to log an issue.");
      return;
    }

    setIsSubmitting(true);

    const requestPayload: ScanRequestPayload = {
      caseId: nextCaseId,
      status,
      zone: status === "Loaded" ? zone : undefined,
      truck: status === "Loaded" ? truck : undefined,
      showId: showId || undefined,
      operatorLabel: operatorLabel.trim() || undefined,
      issueType: shouldLogIssue ? issueType : undefined,
      issueNotes: shouldLogIssue ? issueNotes : undefined,
      issuePhotoDataUrl: shouldLogIssue ? issuePhotoDataUrl : undefined
    };

    let res: Response;
    try {
      res = await sendScanRequest(requestPayload);
    } catch {
      const queued = queueScan(requestPayload as unknown as Record<string, unknown>);
      refreshQueueState();
      setMessage(`Offline: queued scan ${queued.id}. Will sync when online.`);
      setIsSubmitting(false);
      return;
    }

    const payload = (await res.json()) as {
      error?: string;
      id?: string;
      status?: string;
      issueLogged?: boolean;
      issuePhotoStored?: boolean;
      issuePhotoWarning?: string;
    };

    if (!res.ok) {
      if (!navigator.onLine) {
        const queued = queueScan(requestPayload as unknown as Record<string, unknown>);
        refreshQueueState();
        setMessage(`Offline: queued scan ${queued.id}. Will sync when online.`);
        setIsSubmitting(false);
        return;
      }
      setMessage(payload.error ?? "Update failed.");
      setIsSubmitting(false);
      return;
    }

    setCaseId(nextCaseId);
    const issueMessage = payload.issueLogged ? (payload.issuePhotoStored ? " + issue logged (photo saved)" : " + issue logged") : "";
    const warningMessage = payload.issuePhotoWarning ? ` Warning: ${payload.issuePhotoWarning}` : "";
    setMessage(`Updated ${payload.id} -> ${payload.status}${status === "Loaded" ? ` (${zone})` : ""}${issueMessage}${warningMessage}`);
    setIsSubmitting(false);

    if (payload.issueLogged) {
      setLogIssue(false);
      setIssueType("Missing");
      setIssueNotes("");
      setIssuePhotoDataUrl(undefined);
    }
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

  const clearQueueWithSafeguard = () => {
    const token = window.prompt("Type CLEAR to remove all queued scans.");
    if (token !== "CLEAR") {
      setMessage("Queue clear canceled.");
      return;
    }
    clearQueuedScans();
    setScanSyncMeta({ lastError: "Queue cleared by admin action.", nextRetryAt: undefined });
    refreshQueueState();
    setNextRetryAt(null);
    setLastSyncError("Queue cleared by admin action.");
    clearRetryTimer();
    setMessage("Queued scans cleared.");
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
          <button className="btn" type="button" onClick={() => void flushQueuedScans()} disabled={isSyncingQueue || queueCount === 0} style={{ background: "#7c3aed" }}>
            {isSyncingQueue ? "Syncing..." : `Sync Queue (${queueCount})`}
          </button>
        </div>
        <div className="panel" style={{ padding: 10, marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="badge">Queued: {queueCount}</span>
            <span className="badge">Oldest: {formatMetaTime(oldestQueuedAt)}</span>
            <span className="badge">Last Sync: {formatMetaTime(lastSyncAt)}</span>
            <span className="badge">Next Retry: {formatMetaTime(nextRetryAt)}</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <button className="badge" type="button" onClick={() => void flushQueuedScans()} style={{ cursor: "pointer" }}>
              Retry Now
            </button>
            <button className="badge" type="button" onClick={clearQueueWithSafeguard} style={{ cursor: "pointer", borderColor: "#b91c1c", color: "#b91c1c" }}>
              Clear Queue (Admin)
            </button>
          </div>
          {lastSyncError && <p style={{ margin: "8px 0 0", color: "#b45309" }}>{lastSyncError}</p>}
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
          <label>Show Context (optional for status updates)</label>
          <select value={showId} onChange={(e) => setShowId(e.target.value)}>
            <option value="">No show selected</option>
            {shows.map((show) => (
              <option key={show.id} value={show.id}>
                {show.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Operator Label</label>
          <input value={operatorLabel} onChange={(e) => setOperatorLabel(e.target.value)} placeholder="Dock Captain / Your Name" />
        </div>

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

        <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid #e5e7eb" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={logIssue} onChange={(e) => setLogIssue(e.target.checked)} style={{ width: 18, height: 18 }} />
            Log Issue (Missing/Damaged/Other)
          </label>

          {shouldLogIssue && (
            <div className="grid" style={{ marginTop: 10 }}>
              <div>
                <label>Issue Type</label>
                <select value={issueType} onChange={(e) => setIssueType(e.target.value as "Missing" | "Damaged" | "Other")}>
                  <option>Missing</option>
                  <option>Damaged</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label>Issue Notes</label>
                <textarea value={issueNotes} onChange={(e) => setIssueNotes(e.target.value)} placeholder="What is wrong?" rows={3} />
              </div>
              <div>
                <label>Issue Photo (optional)</label>
                <input type="file" accept="image/*" capture="environment" onChange={onPhotoChange} />
                {issuePhotoDataUrl && <p style={{ marginBottom: 0, color: "#5d6d63" }}>Photo attached.</p>}
              </div>
              {!showId && <p style={{ margin: 0, color: "#b91c1c" }}>Select a show to submit this issue.</p>}
            </div>
          )}
        </div>

        <button className="btn" style={{ marginTop: 12 }} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Status"}
        </button>
        <p style={{ marginBottom: 0, color: "#5d6d63" }}>{message}</p>
      </form>
    </main>
  );
}
