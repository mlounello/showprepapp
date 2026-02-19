import { prisma } from "@/lib/prisma";
import { formatDbStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const startedAt = Date.now();

  try {
    const [showCount, caseCount, latestScan] = await Promise.all([
      prisma.show.count(),
      prisma.case.count(),
      prisma.statusEvent.findFirst({
        orderBy: { scannedAt: "desc" },
        include: {
          case: { select: { id: true } },
          show: { select: { id: true, name: true } }
        }
      })
    ]);

    const latency = Date.now() - startedAt;

    return (
      <main className="grid" style={{ gap: 16 }}>
        <section className="panel" style={{ padding: 16 }}>
          <h1 style={{ marginTop: 0 }}>Admin Health</h1>
          <p style={{ marginBottom: 0, color: "#5d6d63" }}>Quick runtime diagnostics for DB-backed production debugging.</p>
        </section>

        <section className="panel" style={{ padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Database</h2>
          <p style={{ margin: 0 }}>
            <span className="badge" style={{ borderColor: "#166534", color: "#166534" }}>
              Connected
            </span>
          </p>
          <p style={{ marginBottom: 0, color: "#5d6d63" }}>Latency: {latency} ms</p>
        </section>

        <section className="panel" style={{ padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Counts</h2>
          <p style={{ margin: 0, color: "#5d6d63" }}>Shows: {showCount}</p>
          <p style={{ margin: "6px 0 0", color: "#5d6d63" }}>Cases: {caseCount}</p>
        </section>

        <section className="panel" style={{ padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Latest Scan</h2>
          {!latestScan && <p style={{ marginBottom: 0, color: "#5d6d63" }}>No scan events found.</p>}
          {latestScan && (
            <>
              <p style={{ margin: 0, color: "#5d6d63" }}>Case: {latestScan.case.id}</p>
              <p style={{ margin: "6px 0 0", color: "#5d6d63" }}>Status: {formatDbStatus(latestScan.status)}</p>
              <p style={{ margin: "6px 0 0", color: "#5d6d63" }}>Location: {latestScan.location ?? "Unknown"}</p>
              <p style={{ margin: "6px 0 0", color: "#5d6d63" }}>
                Show: {latestScan.show?.name ?? "None"}
              </p>
              <p style={{ margin: "6px 0 0", color: "#5d6d63" }}>At: {latestScan.scannedAt.toISOString()}</p>
            </>
          )}
        </section>
      </main>
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";

    return (
      <main className="grid" style={{ gap: 16 }}>
        <section className="panel" style={{ padding: 16 }}>
          <h1 style={{ marginTop: 0 }}>Admin Health</h1>
          <p>
            <span className="badge" style={{ borderColor: "#b91c1c", color: "#b91c1c" }}>
              DB Error
            </span>
          </p>
          <p style={{ marginBottom: 0, color: "#5d6d63" }}>{detail}</p>
        </section>
      </main>
    );
  }
}
