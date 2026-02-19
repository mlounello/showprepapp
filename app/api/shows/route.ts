import { NextRequest, NextResponse } from "next/server";
import { getShowsList } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { normalizeString, uniqueTrimmed, validateDateRangeString, validateOptionalText, validateRequiredText } from "@/lib/validation";

interface CreateShowPayload {
  name?: string;
  dates?: string;
  venue?: string;
  notes?: string;
  trucks?: string[];
}

export async function GET() {
  const shows = await getShowsList();
  return NextResponse.json(
    shows.map((show) => ({
      id: show.id,
      name: show.name,
      dates: show.dates,
      venue: show.venue,
      trucks: show.showTrucks.map((item) => item.truck.name)
    }))
  );
}

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as CreateShowPayload;

  if (!payload.name || !payload.dates || !payload.venue) {
    return NextResponse.json({ error: "name, dates, and venue are required" }, { status: 400 });
  }

  const name = normalizeString(payload.name);
  const dates = normalizeString(payload.dates);
  const venue = normalizeString(payload.venue);
  const notes = normalizeString(payload.notes);
  const trucks = uniqueTrimmed(payload.trucks);

  const baseError =
    validateRequiredText("Show name", name, 120) ??
    validateDateRangeString(dates) ??
    validateRequiredText("Venue", venue, 120) ??
    validateOptionalText("Notes", notes, 500);
  if (baseError) {
    return NextResponse.json({ error: baseError }, { status: 400 });
  }
  if (trucks.length > 8) {
    return NextResponse.json({ error: "Select up to 8 trucks." }, { status: 400 });
  }
  if (trucks.some((truckName) => truckName.length > 80)) {
    return NextResponse.json({ error: "Truck names must be 80 characters or fewer." }, { status: 400 });
  }

  let truckProfileByName = new Map<string, { id: string }>();
  if (trucks.length > 0) {
    const truckProfiles = await prisma.truckProfile.findMany({
      where: { name: { in: trucks } },
      orderBy: { name: "asc" }
    });
    truckProfileByName = new Map(truckProfiles.map((truck) => [truck.name, truck]));
    const missing = trucks.filter((nameEntry) => !truckProfileByName.has(nameEntry));
    if (missing.length > 0) {
      return NextResponse.json({ error: `Unknown truck profile: ${missing.join(", ")}` }, { status: 400 });
    }
  }

  const show = await prisma.show.create({
    data: {
      name,
      dates,
      venue,
      notes: notes || null
    }
  });

  if (trucks.length > 0) {
    await prisma.showTruck.createMany({
      data: trucks.map((truckName, index) => ({
        showId: show.id,
        truckId: truckProfileByName.get(truckName)!.id,
        loadRank: index + 1
      }))
    });
  }

  return NextResponse.json({ id: show.id }, { status: 201 });
}
