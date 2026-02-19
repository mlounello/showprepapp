import Link from "next/link";
import { notFound } from "next/navigation";
import { DateRangePill } from "@/components/date-range-pill";
import { PrintButton } from "@/components/print-button";
import { getShowDetail } from "@/lib/data";
import { formatCaseDimensions } from "@/lib/dimensions";
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

  const formatPercent = (value: number) => `${Math.round(value * 10) / 10}%`;
  const occupancyColor = (value: number) => {
    if (value >= 90) {
      return "#b91c1c";
    }
    if (value >= 70) {
      return "#b45309";
    }
    return "#166534";
  };
  const getVolume = (length?: number | null, width?: number | null, height?: number | null) => {
    if (length == null || width == null || height == null) {
      return null;
    }
    if (length <= 0 || width <= 0 || height <= 0) {
      return null;
    }
    return length * width * height;
  };

  const occupancyByTruck = show.showTrucks.map((showTruck) => {
    const truckName = showTruck.truck.name;
    const assignedRows = rows.filter((row) => row.truckLabel === truckName);
    const truckVolume = getVolume(showTruck.truck.lengthIn, showTruck.truck.widthIn, showTruck.truck.heightIn);

    const knownCaseVolumes = assignedRows
      .map((row) => getVolume(row.case.lengthIn, row.case.widthIn, row.case.heightIn))
      .filter((value): value is number => value != null);

    const knownCaseVolumeTotal = knownCaseVolumes.reduce((sum, value) => sum + value, 0);
    const unknownCaseCount = assignedRows.length - knownCaseVolumes.length;

    return {
      truckName,
      truckDimensions: formatCaseDimensions(showTruck.truck.lengthIn, showTruck.truck.widthIn, showTruck.truck.heightIn),
      assignedCount: assignedRows.length,
      unknownCaseCount,
      occupancyPercent: truckVolume ? (knownCaseVolumeTotal / truckVolume) * 100 : null
    };
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

        <section className="panel" style={{ padding: 10, marginBottom: 12 }}>
          <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>Truck Occupancy (Volume Estimate)</h2>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
            {occupancyByTruck.map((entry) => (
              <div key={entry.truckName} className="panel" style={{ padding: 10 }}>
                <strong>{entry.truckName}</strong>
                <p style={{ margin: "6px 0 0", color: "#5d6d63" }}>Inside: {entry.truckDimensions}</p>
                <p style={{ margin: "6px 0 0", color: "#5d6d63" }}>
                  Est. occupancy:{" "}
                  {entry.occupancyPercent == null ? (
                    "Unknown (missing dimensions)"
                  ) : (
                    <span className="badge" style={{ borderColor: occupancyColor(entry.occupancyPercent), color: occupancyColor(entry.occupancyPercent) }}>
                      {formatPercent(entry.occupancyPercent)}
                    </span>
                  )}
                </p>
                <p style={{ margin: "6px 0 0", color: "#5d6d63" }}>
                  Assigned: {entry.assignedCount} case{entry.assignedCount === 1 ? "" : "s"}
                  {entry.unknownCaseCount > 0 ? ` · ${entry.unknownCaseCount} missing case dimensions` : ""}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #d1d5db" }}>
                <th style={{ padding: 8 }}>Truck</th>
                <th style={{ padding: 8 }}>Load #</th>
                <th style={{ padding: 8 }}>Case</th>
                <th style={{ padding: 8 }}>Case Outside</th>
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
                  <td style={{ padding: 8 }}>{formatCaseDimensions(row.case.lengthIn, row.case.widthIn, row.case.heightIn)}</td>
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
