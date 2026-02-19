import { notFound } from "next/navigation";
import { DateRangePill } from "@/components/date-range-pill";
import { StatusPill } from "@/components/status-pill";
import { getSharedShowByToken } from "@/lib/data";
import { formatDbStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function SharedShowPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const show = await getSharedShowByToken(token);

  if (!show) {
    notFound();
  }

  const loadRows = [...show.showCases].sort((a, b) => a.loadOrder - b.loadOrder);

  return (
    <main className="grid" style={{ gap: 16 }}>
      <section className="panel" style={{ padding: 16 }}>
        <p style={{ margin: 0, fontSize: 12, color: "#5d6d63" }}>Read-only link</p>
        <h1 style={{ marginTop: 6 }}>{show.name}</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <DateRangePill dates={show.dates} />
          <span className="badge">Venue: {show.venue}</span>
          <span className="badge">Cases: {show.showCases.length}</span>
        </div>
      </section>

      <section className="panel" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Pack Sheet</h2>
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
              {loadRows.map((row) => (
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
          <article key={issue.id} className="panel" style={{ padding: 10, marginBottom: 10 }}>
            <strong>{issue.type}</strong>
            <p style={{ marginBottom: 0, color: "#5d6d63" }}>
              {issue.caseId}: {issue.notes ?? "No note"}
            </p>
            {issue.photoUrl && (
              <img src={issue.photoUrl} alt={`Issue ${issue.id}`} style={{ marginTop: 8, width: "100%", maxWidth: 280, borderRadius: 10, border: "1px solid #e5e7eb" }} />
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
