"use client";

import { useMemo, useState } from "react";
import { StatusPill } from "@/components/status-pill";
import { CaseStatus } from "@/lib/types";

type TimelineEvent = {
  id: string;
  status: CaseStatus;
  scannedAtIso: string;
  location: string;
  truckLabel?: string;
  zoneLabel?: string;
  showId?: string;
  showName?: string;
  note?: string;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function CaseStatusTimeline({ events }: { events: TimelineEvent[] }) {
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showFilter, setShowFilter] = useState<string>("All");

  const statuses = useMemo(() => ["All", ...new Set(events.map((event) => event.status))], [events]);
  const shows = useMemo(
    () => ["All", ...new Set(events.map((event) => event.showName).filter((value): value is string => Boolean(value)))],
    [events]
  );

  const filtered = useMemo(
    () =>
      events.filter((event) => {
        const statusOk = statusFilter === "All" || event.status === statusFilter;
        const showOk = showFilter === "All" || event.showName === showFilter;
        return statusOk && showOk;
      }),
    [events, statusFilter, showFilter]
  );

  return (
    <section className="panel" style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Status Timeline</h2>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 10 }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {statuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <select value={showFilter} onChange={(e) => setShowFilter(e.target.value)}>
          {shows.map((show) => (
            <option key={show}>{show}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 && <p style={{ color: "#5d6d63" }}>No timeline entries match these filters.</p>}
      <div className="grid" style={{ gap: 10 }}>
        {filtered.map((event) => (
          <article key={event.id} className="panel" style={{ padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <StatusPill status={event.status} />
              <span className="badge">{formatDateTime(event.scannedAtIso)}</span>
            </div>
            <p style={{ margin: "8px 0 0", color: "#5d6d63" }}>Location: {event.location}</p>
            {(event.truckLabel || event.zoneLabel) && (
              <p style={{ margin: "6px 0 0", color: "#5d6d63" }}>
                Load: {event.truckLabel ?? "-"} {event.zoneLabel ? `· ${event.zoneLabel}` : ""}
              </p>
            )}
            {event.showName && <p style={{ margin: "6px 0 0", color: "#5d6d63" }}>Show: {event.showName}</p>}
            {event.note && <p style={{ margin: "6px 0 0", color: "#5d6d63" }}>Note: {event.note}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
