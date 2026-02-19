import { NextRequest, NextResponse } from "next/server";
import { getShowDetail } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { formatDbStatus } from "@/lib/status";
import { normalizeString, validateDateRangeString, validateOptionalText, validateRequiredText } from "@/lib/validation";

interface UpdateShowPayload {
  name?: string;
  dates?: string;
  venue?: string;
  notes?: string;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const show = await getShowDetail(id);

  if (!show) {
    return NextResponse.json({ error: "Show not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: show.id,
    name: show.name,
    dates: show.dates,
    venue: show.venue,
    trucks: show.showTrucks.map((item) => item.truck.name),
    cases: show.showCases.map((row) => ({
      caseId: row.caseId,
      owner: row.owner?.name ?? row.ownerRole,
      truck: row.truckLabel,
      zone: row.zoneLabel,
      status: formatDbStatus(row.case.currentStatus),
      location: row.case.currentLocation,
      notes: row.overrideNotes
    })),
    issues: show.issues
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = (await req.json()) as UpdateShowPayload;

  const existing = await prisma.show.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Show not found" }, { status: 404 });
  }

  const hasName = Object.prototype.hasOwnProperty.call(payload, "name");
  const hasDates = Object.prototype.hasOwnProperty.call(payload, "dates");
  const hasVenue = Object.prototype.hasOwnProperty.call(payload, "venue");
  const hasNotes = Object.prototype.hasOwnProperty.call(payload, "notes");

  const name = hasName ? normalizeString(payload.name) : existing.name;
  const dates = hasDates ? normalizeString(payload.dates) : existing.dates;
  const venue = hasVenue ? normalizeString(payload.venue) : existing.venue;
  const notes = hasNotes ? normalizeString(payload.notes) : existing.notes ?? "";

  const baseError =
    validateRequiredText("Show name", name, 120) ??
    validateDateRangeString(dates) ??
    validateRequiredText("Venue", venue, 120) ??
    validateOptionalText("Notes", notes, 500);
  if (baseError) {
    return NextResponse.json({ error: baseError }, { status: 400 });
  }

  const updated = await prisma.show.update({
    where: { id },
    data: {
      name,
      dates,
      venue,
      notes: notes || null
    }
  });

  return NextResponse.json({ id: updated.id });
}
