import { notFound } from "next/navigation";
import { DateRangePill } from "@/components/date-range-pill";
import { ShowAssignmentsEditor } from "@/components/show-assignments-editor";
import { ShowOfflineCache } from "@/components/show-offline-cache";
import { ShowEditor } from "@/components/show-editor";
import { ShowScanFeed } from "@/components/show-scan-feed";
import { ShowShareLink } from "@/components/show-share-link";
import { getCrewMembers, getShowDetail, getShowShareLinks } from "@/lib/data";
import { formatDbStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function ShowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [show, crewMembers, shareLinks] = await Promise.all([getShowDetail(id), getCrewMembers(), getShowShareLinks(id)]);

  if (!show) {
    notFound();
  }

  return (
    <main className="grid">
      <section className="panel" style={{ padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>{show.name}</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <DateRangePill dates={show.dates} />
          <span className="badge">Venue: {show.venue}</span>
          <span className="badge">Trucks: {show.showTrucks.map((item) => item.truck.name).join(", ") || "None"}</span>
        </div>
      </section>
      <ShowOfflineCache
        show={{
          id: show.id,
          name: show.name,
          dates: show.dates,
          venue: show.venue,
          trucks: show.showTrucks.map((item) => item.truck.name),
          updatedAt: show.updatedAt.toISOString(),
          cases: show.showCases.map((row) => ({
            caseId: row.case.id,
            owner: row.owner?.name ?? row.ownerRole ?? "Unassigned",
            truck: row.truckLabel ?? "-",
            zone: row.zoneLabel ?? "-",
            status: formatDbStatus(row.case.currentStatus),
            location: row.case.currentLocation
          }))
        }}
      />

      <ShowEditor show={{ id: show.id, name: show.name, dates: show.dates, venue: show.venue, notes: show.notes }} />
      <ShowShareLink showId={show.id} initialLinks={shareLinks.map((link) => ({ id: link.id, token: link.token, createdAt: link.createdAt.toISOString() }))} />
      <section className="panel" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Export</h2>
        <p style={{ color: "#5d6d63" }}>Open print views for dock/truck use, then Save as PDF from your browser.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a className="btn" href={`/shows/${show.id}/pack-sheet`} target="_blank" rel="noreferrer">
            Open Pack Sheet
          </a>
          <a className="btn" href={`/shows/${show.id}/load-sheet`} target="_blank" rel="noreferrer">
            Open Load Sheet
          </a>
        </div>
      </section>

      <ShowAssignmentsEditor
        showId={show.id}
        crew={crewMembers.map((member) => ({ id: member.id, name: member.name }))}
        trucks={show.showTrucks.map((truck) => truck.truck.name)}
        initialRows={show.showCases.map((row) => ({
          id: row.id,
          caseId: row.case.id,
          ownerId: row.ownerId,
          ownerRole: row.ownerRole,
          truckLabel: row.truckLabel,
          zoneLabel: row.zoneLabel,
          loadOrder: row.loadOrder,
          status: formatDbStatus(row.case.currentStatus),
          location: row.case.currentLocation
        }))}
      />

      <ShowScanFeed
        events={show.statusEvents.map((event) => ({
          id: event.id,
          scannedAtIso: event.scannedAt.toISOString(),
          caseId: event.case.id,
          status: event.status,
          location: event.location,
          truckLabel: event.truckLabel,
          note: event.note
        }))}
      />

      <section className="panel" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Issues</h2>
        {show.issues.length === 0 && <p style={{ color: "#5d6d63" }}>No issues logged.</p>}
        {show.issues.map((issue) => (
          <article key={issue.id} className="panel" style={{ padding: 12, marginBottom: 10 }}>
            <strong>{issue.type}</strong>
            <p style={{ marginBottom: 0, color: "#5d6d63" }}>
              {issue.caseId}: {issue.notes ?? "No note"}
            </p>
            {issue.photoUrl && (
              // v1 stores scan-captured images inline as data URL.
              <img src={issue.photoUrl} alt={`Issue ${issue.id}`} style={{ marginTop: 8, width: "100%", maxWidth: 280, borderRadius: 10, border: "1px solid #e5e7eb" }} />
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
