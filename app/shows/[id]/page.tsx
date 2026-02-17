import { notFound } from "next/navigation";
import { StatusPill } from "@/components/status-pill";
import { caseLibrary, issues, shows } from "@/lib/sample-data";

export default async function ShowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const show = shows.find((s) => s.id === id);

  if (!show) {
    notFound();
  }

  const rows = show.caseOverrides.map((override) => {
    const baseCase = caseLibrary.find((c) => c.id === override.caseId);
    return {
      id: override.caseId,
      owner: override.owner,
      truck: override.truck,
      zone: override.zone,
      status: baseCase?.status ?? "In Shop",
      location: baseCase?.location ?? "Unknown",
      notes: override.overrideNotes
    };
  });

  const showIssues = issues.filter((i) => i.showId === show.id);

  return (
    <main className="grid">
      <section className="panel" style={{ padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>{show.name}</h1>
        <p style={{ marginBottom: 0, color: "#5d6d63" }}>
          {show.dates} · {show.venue}
        </p>
        <p style={{ marginBottom: 0, color: "#5d6d63" }}>Trucks: {show.trucks.join(", ")}</p>
      </section>

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
              {rows.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: 8 }}>{row.id}</td>
                  <td style={{ padding: 8 }}>{row.owner ?? "Unassigned"}</td>
                  <td style={{ padding: 8 }}>{row.truck ?? "-"}</td>
                  <td style={{ padding: 8 }}>{row.zone ?? "-"}</td>
                  <td style={{ padding: 8 }}>
                    <StatusPill status={row.status} />
                  </td>
                  <td style={{ padding: 8 }}>{row.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Issues</h2>
        {showIssues.length === 0 && <p style={{ color: "#5d6d63" }}>No issues logged.</p>}
        {showIssues.map((issue) => (
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
