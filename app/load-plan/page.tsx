import { caseLibrary } from "@/lib/sample-data";

export default function LoadPlanPage() {
  const sorted = [...caseLibrary].sort((a, b) => (a.truck ?? "").localeCompare(b.truck ?? "") || (a.zone ?? "").localeCompare(b.zone ?? ""));

  return (
    <main className="grid" style={{ gap: 16 }}>
      <section className="panel" style={{ padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>Truck Load Plan</h1>
        <p style={{ color: "#5d6d63" }}>Editable load order list grouped by truck and zone.</p>
      </section>

      <section className="panel" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Load Sheet</h2>
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          {sorted.map((item) => (
            <li key={item.id} style={{ marginBottom: 8 }}>
              <strong>{item.id}</strong> · {item.truck ?? "Unassigned Truck"} · {item.zone ?? "No Zone"} · {item.owner ?? "Unassigned"}
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
