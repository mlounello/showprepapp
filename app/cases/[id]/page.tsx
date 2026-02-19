import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusPill } from "@/components/status-pill";
import { getCaseDetail } from "@/lib/data";
import { formatDbStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getCaseDetail(id);

  if (!item) {
    notFound();
  }

  const status = formatDbStatus(item.currentStatus);

  return (
    <main className="grid" style={{ gap: 16 }}>
      <section className="panel" style={{ padding: 16 }}>
        <Link href="/cases" className="badge">
          Back to Case Library
        </Link>
        <h1 style={{ marginBottom: 8 }}>{item.id}</h1>
        <p style={{ marginTop: 0, color: "#5d6d63" }}>
          {item.department} · {item.caseType}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <StatusPill status={status} />
          <span className="badge">Location: {item.currentLocation}</span>
          <span className="badge">Owner: {item.ownerLabel ?? "Unassigned"}</span>
        </div>
        <p style={{ marginBottom: 0, color: "#5d6d63" }}>Contents: {item.defaultContents}</p>
        {item.notes && <p style={{ marginBottom: 0, color: "#5d6d63" }}>Notes: {item.notes}</p>}
      </section>

      <section className="panel" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Status Timeline</h2>
        {item.statusHistory.length === 0 && <p style={{ color: "#5d6d63" }}>No status events yet.</p>}
        <div className="grid" style={{ gap: 10 }}>
          {item.statusHistory.map((event) => {
            const eventStatus = formatDbStatus(event.status);
            return (
              <article key={event.id} className="panel" style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <StatusPill status={eventStatus} />
                  <span className="badge">{formatDateTime(event.scannedAt)}</span>
                </div>
                <p style={{ margin: "8px 0 0", color: "#5d6d63" }}>Location: {event.location ?? "Unknown"}</p>
                {(event.truckLabel || event.zoneLabel) && (
                  <p style={{ margin: "6px 0 0", color: "#5d6d63" }}>
                    Load: {event.truckLabel ?? "-"} {event.zoneLabel ? `· ${event.zoneLabel}` : ""}
                  </p>
                )}
                {event.show?.name && <p style={{ margin: "6px 0 0", color: "#5d6d63" }}>Show: {event.show.name}</p>}
                {event.note && <p style={{ margin: "6px 0 0", color: "#5d6d63" }}>Note: {event.note}</p>}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
