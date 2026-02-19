import Link from "next/link";
import { getDashboardCounts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const counts = await getDashboardCounts();

  return (
    <main className="grid" style={{ gap: 16 }}>
      <section className="panel" style={{ padding: 18 }}>
        <p style={{ margin: 0, fontSize: 12, color: "#4b5b52" }}>Mobile-first show planning</p>
        <h1 style={{ marginTop: 8, marginBottom: 8 }}>Case-centric workflow for student crews</h1>
        <p style={{ marginTop: 0, color: "#5d6d63" }}>
          Track ownership, status, location, and truck order from one scan-first interface.
        </p>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
          <div className="panel" style={{ padding: 12 }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{counts.cases}</div>
            <div style={{ color: "#5d6d63" }}>Cases</div>
          </div>
          <div className="panel" style={{ padding: 12 }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{counts.shows}</div>
            <div style={{ color: "#5d6d63" }}>Active Shows</div>
          </div>
          <div className="panel" style={{ padding: 12 }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{counts.inMotion}</div>
            <div style={{ color: "#5d6d63" }}>In Motion</div>
          </div>
          <div className="panel" style={{ padding: 12 }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{counts.issues}</div>
            <div style={{ color: "#5d6d63" }}>Open Issues</div>
          </div>
        </div>
      </section>

      <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <Link href="/scan" className="panel" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 4 }}>Quick Scan</h3>
          <p style={{ marginBottom: 0, color: "#5d6d63" }}>Scan QR and update case status in 2 taps.</p>
        </Link>
        <Link href="/shows" className="panel" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 4 }}>Show Builder</h3>
          <p style={{ marginBottom: 0, color: "#5d6d63" }}>Assign cases to trucks, owners, and zones.</p>
        </Link>
        <Link href="/load-plan" className="panel" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 4 }}>Load Plan</h3>
          <p style={{ marginBottom: 0, color: "#5d6d63" }}>Editable order list for dock and truck flow.</p>
        </Link>
      </section>
    </main>
  );
}
