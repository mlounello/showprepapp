import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDbStatus } from "@/lib/status";

export async function GET() {
  const startedAt = Date.now();

  try {
    const [showCount, caseCount, latestScan] = await Promise.all([
      prisma.show.count(),
      prisma.case.count(),
      prisma.statusEvent.findFirst({
        orderBy: { scannedAt: "desc" },
        include: {
          case: {
            select: {
              id: true
            }
          },
          show: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    ]);

    const dbLatencyMs = Date.now() - startedAt;

    return NextResponse.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      dbLatencyMs,
      counts: {
        shows: showCount,
        cases: caseCount
      },
      latestScan: latestScan
        ? {
            id: latestScan.id,
            caseId: latestScan.case.id,
            showId: latestScan.show?.id ?? null,
            showName: latestScan.show?.name ?? null,
            status: formatDbStatus(latestScan.status),
            location: latestScan.location,
            scannedAt: latestScan.scannedAt
          }
        : null
    });
  } catch (error) {
    const dbLatencyMs = Date.now() - startedAt;
    const detail = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        checkedAt: new Date().toISOString(),
        dbLatencyMs,
        error: detail
      },
      { status: 503 }
    );
  }
}
