import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDbStatus } from "@/lib/status";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const cases = await prisma.case.findMany({ orderBy: { id: "asc" } });

  const headers = ["id", "department", "caseType", "length", "width", "height", "defaultContents", "owner", "location", "status", "notes"];
  const rows = cases.map((item) => ({
    id: item.id,
    department: item.department,
    caseType: item.caseType,
    length: item.lengthIn == null ? "" : String(item.lengthIn),
    width: item.widthIn == null ? "" : String(item.widthIn),
    height: item.heightIn == null ? "" : String(item.heightIn),
    defaultContents: item.defaultContents,
    owner: item.ownerLabel ?? "",
    location: item.currentLocation,
    status: formatDbStatus(item.currentStatus),
    notes: item.notes ?? ""
  }));

  const csv = toCsv(rows, headers);
  const now = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cases-${now}.csv"`
    }
  });
}
