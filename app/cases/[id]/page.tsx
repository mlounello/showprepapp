import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseStatusTimeline } from "@/components/case-status-timeline";
import { StatusPill } from "@/components/status-pill";
import { getCaseDetail } from "@/lib/data";
import { formatCaseDimensions } from "@/lib/dimensions";
import { formatDbStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getCaseDetail(id);

  if (!item) {
    notFound();
  }

  const status = formatDbStatus(item.currentStatus);

  return (
    <main className="grid" style={{ gap: 16 }}>
      <section className="panel" style={{ padding: 16 }}>
        <Link href="/cases" className="badge">
          Back to Case Library
        </Link>
        <h1 style={{ marginBottom: 8 }}>{item.id}</h1>
        <p style={{ marginTop: 0, color: "#5d6d63" }}>
          {item.department} · {item.caseType}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <StatusPill status={status} />
          <span className="badge">Location: {item.currentLocation}</span>
          <span className="badge">Owner: {item.ownerLabel ?? "Unassigned"}</span>
          <span className="badge">Outside: {formatCaseDimensions(item.lengthIn, item.widthIn, item.heightIn)}</span>
        </div>
        <p style={{ marginBottom: 0, color: "#5d6d63" }}>Contents: {item.defaultContents}</p>
        {item.notes && <p style={{ marginBottom: 0, color: "#5d6d63" }}>Notes: {item.notes}</p>}
      </section>

      <CaseStatusTimeline
        events={item.statusHistory.map((event) => ({
          id: event.id,
          status: formatDbStatus(event.status),
          scannedAtIso: event.scannedAt.toISOString(),
          location: event.location ?? "Unknown",
          truckLabel: event.truckLabel ?? undefined,
          zoneLabel: event.zoneLabel ?? undefined,
          showId: event.show?.id ?? undefined,
          showName: event.show?.name ?? undefined,
          note: event.note ?? undefined
        }))}
      />
    </main>
  );
}
