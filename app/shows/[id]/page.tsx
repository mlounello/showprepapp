import { notFound } from "next/navigation";
import { ShowEditor } from "@/components/show-editor";
import { StatusPill } from "@/components/status-pill";
import { getShowDetail } from "@/lib/data";
import { formatDbStatus } from "@/lib/status";

export default async function ShowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const show = await getShowDetail(id);

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

      <section className="panel" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Assigned Cases</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: 8 }}>Case</th>
                <th style={{ padding: 8 }}>Owner</th>
                <th style={{ padding: 8 }}>Truck</th>
                <th style={{ padding: 8 }}>Zone</th>
                <th style={{ padding: 8 }}>Status</th>
                <th style={{ padding: 8 }}>Location</th>
              </tr>
            </thead>
            <tbody>
              {show.showCases.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: 8 }}>{row.case.id}</td>
                  <td style={{ padding: 8 }}>{row.owner?.name ?? row.ownerRole ?? "Unassigned"}</td>
                  <td style={{ padding: 8 }}>{row.truckLabel ?? "-"}</td>
                  <td style={{ padding: 8 }}>{row.zoneLabel ?? "-"}</td>
                  <td style={{ padding: 8 }}>
                    <StatusPill status={formatDbStatus(row.case.currentStatus)} />
                  </td>
                  <td style={{ padding: 8 }}>{row.case.currentLocation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
