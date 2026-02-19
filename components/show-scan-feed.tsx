"use client";

import { useMemo, useState } from "react";
import { parseStatusEventNote } from "@/lib/scan-events";
import { formatDbStatus } from "@/lib/status";

type ScanEventRow = {
  id: string;
  scannedAtIso: string;
  caseId: string;
  status: string;
  location?: string | null;
  truckLabel?: string | null;
  note?: string | null;
};

export function ShowScanFeed({ events }: { events: ScanEventRow[] }) {
  const [statusFilter, setStatusFilter] = useState("All");
  const [operatorFilter, setOperatorFilter] = useState("All");
  const [caseFilter, setCaseFilter] = useState("All");

  const normalized = useMemo(
    () =>
      events.map((event) => {
        const parsed = parseStatusEventNote(event.note);
        return {
          ...event,
          statusUi: formatDbStatus(event.status),
          operator: parsed.operatorLabel ?? "Unknown"
        };
      }),
    [events]
  );

  const statuses = useMemo(() => ["All", ...new Set(normalized.map((event) => event.statusUi))], [normalized]);
  const operators = useMemo(() => ["All", ...new Set(normalized.map((event) => event.operator))], [normalized]);
  const cases = useMemo(() => ["All", ...new Set(normalized.map((event) => event.caseId))], [normalized]);

  const filtered = useMemo(
    () =>
      normalized.filter((event) => {
        const statusOk = statusFilter === "All" || event.statusUi === statusFilter;
        const operatorOk = operatorFilter === "All" || event.operator === operatorFilter;
        const caseOk = caseFilter === "All" || event.caseId === caseFilter;
        return statusOk && operatorOk && caseOk;
      }),
    [normalized, statusFilter, operatorFilter, caseFilter]
  );

  const formatScanTime = (iso: string) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(new Date(iso));

  return (
    <section className="panel" style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Latest Scans</h2>
      <p style={{ color: "#5d6d63" }}>Most recent 50 status updates for this show.</p>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {statuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <select value={operatorFilter} onChange={(e) => setOperatorFilter(e.target.value)}>
          {operators.map((operator) => (
            <option key={operator}>{operator}</option>
          ))}
        </select>
        <select value={caseFilter} onChange={(e) => setCaseFilter(e.target.value)}>
          {cases.map((caseId) => (
            <option key={caseId}>{caseId}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 && <p style={{ color: "#5d6d63", marginBottom: 0 }}>No scans match current filters.</p>}
      {filtered.length > 0 && (
        <div style={{ overflowX: "auto", marginTop: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: 8 }}>Time</th>
                <th style={{ padding: 8 }}>Case</th>
                <th style={{ padding: 8 }}>Status</th>
                <th style={{ padding: 8 }}>Operator</th>
                <th style={{ padding: 8 }}>Location</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => (
                <tr key={event.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: 8 }}>{formatScanTime(event.scannedAtIso)}</td>
                  <td style={{ padding: 8 }}>{event.caseId}</td>
                  <td style={{ padding: 8 }}>{event.statusUi}</td>
                  <td style={{ padding: 8 }}>{event.operator}</td>
                  <td style={{ padding: 8 }}>{event.location ?? event.truckLabel ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
