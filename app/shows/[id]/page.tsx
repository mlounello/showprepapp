import { notFound } from "next/navigation";
import { ShowAssignmentsEditor } from "@/components/show-assignments-editor";
import { ShowEditor } from "@/components/show-editor";
import { getCrewMembers, getShowDetail } from "@/lib/data";
import { formatDbStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function ShowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [show, crewMembers] = await Promise.all([getShowDetail(id), getCrewMembers()]);

  if (!show) {
    notFound();
  }

  return (
    <main className="grid">
      <section className="panel" style={{ padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>{show.name}</h1>
        <p style={{ marginBottom: 0, color: "#5d6d63" }}>
          {show.dates} · {show.venue}
        </p>
        <p style={{ marginBottom: 0, color: "#5d6d63" }}>Trucks: {show.showTrucks.map((item) => item.truck.name).join(", ")}</p>
      </section>

      <ShowEditor show={{ id: show.id, name: show.name, dates: show.dates, venue: show.venue, notes: show.notes }} />

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

      <section className="panel" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Issues</h2>
        {show.issues.length === 0 && <p style={{ color: "#5d6d63" }}>No issues logged.</p>}
        {show.issues.map((issue) => (
          <article key={issue.id} className="panel" style={{ padding: 12, marginBottom: 10 }}>
            <strong>{issue.type}</strong>
            <p style={{ marginBottom: 0, color: "#5d6d63" }}>
              {issue.caseId}: {issue.notes ?? "No note"}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
