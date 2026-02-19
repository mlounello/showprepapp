import { NextRequest, NextResponse } from "next/server";
import { getShowsList } from "@/lib/data";
import { prisma } from "@/lib/prisma";

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

  const trucks = (payload.trucks ?? []).map((name) => name.trim()).filter(Boolean);

  const show = await prisma.show.create({
    data: {
      name: payload.name.trim(),
      dates: payload.dates.trim(),
      venue: payload.venue.trim(),
      notes: payload.notes?.trim() || null
    }
  });

  if (trucks.length > 0) {
    const truckProfiles = await Promise.all(
      trucks.map(async (truckName) => {
        const existing = await prisma.truckProfile.findUnique({ where: { name: truckName } });
        if (existing) {
          return existing;
        }
        return prisma.truckProfile.create({ data: { name: truckName } });
      })
    );

    await prisma.showTruck.createMany({
      data: truckProfiles.map((truck, index) => ({
        showId: show.id,
        truckId: truck.id,
        loadRank: index + 1
      }))
    });
  }

  return NextResponse.json({ id: show.id }, { status: 201 });
}
