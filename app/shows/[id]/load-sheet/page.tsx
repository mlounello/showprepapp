import Link from "next/link";
import { notFound } from "next/navigation";
import { DateRangePill } from "@/components/date-range-pill";
import { PrintButton } from "@/components/print-button";
import { getShowDetail } from "@/lib/data";
import "@/app/print.css";

export const dynamic = "force-dynamic";

export default async function LoadSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const show = await getShowDetail(id);

  if (!show) {
    notFound();
  }

  const rows = [...show.showCases].sort((a, b) => {
    const truckCompare = (a.truckLabel ?? "").localeCompare(b.truckLabel ?? "");
    if (truckCompare !== 0) {
      return truckCompare;
    }
    return a.loadOrder - b.loadOrder;
  });

  return (
    <main className="grid" style={{ gap: 16 }}>
      <section className="panel print-sheet" style={{ padding: 16 }}>
        <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <Link href={`/shows/${show.id}`} className="badge">
            Back to Show
          </Link>
          <PrintButton />
        </div>

        <h1 style={{ marginBottom: 8 }}>Load Sheet</h1>
        <p style={{ marginTop: 0, marginBottom: 8, color: "#5d6d63" }}>{show.name}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <DateRangePill dates={show.dates} />
          <span className="badge">Venue: {show.venue}</span>
          <span className="badge">Rows: {rows.length}</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #d1d5db" }}>
                <th style={{ padding: 8 }}>Truck</th>
                <th style={{ padding: 8 }}>Load #</th>
                <th style={{ padding: 8 }}>Case</th>
                <th style={{ padding: 8 }}>Zone</th>
                <th style={{ padding: 8 }}>Owner</th>
                <th style={{ padding: 8 }}>Handling / Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: 8 }}>{row.truckLabel ?? "Unassigned"}</td>
                  <td style={{ padding: 8 }}>{row.loadOrder}</td>
                  <td style={{ padding: 8 }}>{row.case.id}</td>
                  <td style={{ padding: 8 }}>{row.zoneLabel ?? "-"}</td>
                  <td style={{ padding: 8 }}>{row.owner?.name ?? row.ownerRole ?? row.case.ownerLabel ?? "Unassigned"}</td>
                  <td style={{ padding: 8 }}>{row.overrideNotes ?? row.case.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
