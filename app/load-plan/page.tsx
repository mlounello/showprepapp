import { getLoadSheetRows } from "@/lib/data";

export default async function LoadPlanPage() {
  const rows = await getLoadSheetRows();

  return (
    <main className="grid" style={{ gap: 16 }}>
      <section className="panel" style={{ padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>Truck Load Plan</h1>
        <p style={{ color: "#5d6d63" }}>Editable load order list grouped by truck and zone.</p>
      </section>

      <section className="panel" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Load Sheet</h2>
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          {rows.map((row) => (
            <li key={row.id} style={{ marginBottom: 8 }}>
              <strong>{row.case.id}</strong> · {row.truckLabel ?? "Unassigned Truck"} · {row.zoneLabel ?? "No Zone"} · {row.owner?.name ?? row.ownerRole ?? "Unassigned"}
            </li>
          ))}
        </ol>
      </section>

      <section className="panel" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Output</h2>
        <p style={{ color: "#5d6d63" }}>`/api/export/pack-sheet` and `/api/export/load-sheet` endpoints are the next implementation step for PDF/share links.</p>
      </section>
    </main>
  );
}
