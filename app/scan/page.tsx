"use client";

import { FormEvent, useState } from "react";
import { caseLibrary } from "@/lib/sample-data";
import { CaseStatus } from "@/lib/types";

const statuses: CaseStatus[] = [
  "In Shop",
  "Packing",
  "Packed",
  "Staged (Dock)",
  "Loaded",
  "Arrived / Unloaded",
  "Returning",
  "Back in Shop",
  "Issue"
];

export default function ScanPage() {
  const [caseId, setCaseId] = useState("");
  const [status, setStatus] = useState<CaseStatus>("Packed");
  const [zone, setZone] = useState("Nose-Curb");
  const [message, setMessage] = useState("Ready to scan");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const found = caseLibrary.find((c) => c.id.toLowerCase() === caseId.trim().toLowerCase());
    if (!found) {
      setMessage(`Case ${caseId} not found.`);
      return;
    }
    setMessage(`Updated ${found.id} -> ${status}${status === "Loaded" ? ` (${zone})` : ""}`);
  };

  return (
    <main className="grid" style={{ gap: 16 }}>
      <section className="panel" style={{ padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>Scan Mode</h1>
        <p style={{ color: "#5d6d63" }}>Camera scanner hooks here. Manual entry fallback included for reliability.</p>
      </section>

      <form className="panel" style={{ padding: 16 }} onSubmit={onSubmit}>
        <label>Scan or enter Case ID</label>
        <input value={caseId} onChange={(e) => setCaseId(e.target.value)} placeholder="AUD-001" />

        <div style={{ marginTop: 12 }}>
          <label>New Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as CaseStatus)}>
            {statuses.map((entry) => (
              <option key={entry}>{entry}</option>
            ))}
          </select>
        </div>

        {status === "Loaded" && (
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
        )}

        <button className="btn" style={{ marginTop: 12 }} type="submit">
          Update Status
        </button>
        <p style={{ marginBottom: 0, color: "#5d6d63" }}>{message}</p>
      </form>
    </main>
  );
}
