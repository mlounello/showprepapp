import { NextRequest, NextResponse } from "next/server";
import { parseDimensionInput } from "@/lib/dimensions";
import { getTruckProfiles } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { normalizeString, validateOptionalText, validateRequiredText } from "@/lib/validation";

interface CreateTruckPayload {
  name?: string;
  notes?: string;
  length?: string | number | null;
  width?: string | number | null;
  height?: string | number | null;
}

function parseDimensionValue(value: string | number | null | undefined, label: string) {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) {
      return { error: `Invalid ${label} dimension` };
    }
    return { inches: value };
  }

  const parsed = parseDimensionInput(typeof value === "string" ? value : undefined);
  if (parsed.error) {
    return { error: `Invalid ${label} dimension. Use formats like 24, 24in, 2ft 3in, or 610mm.` };
  }
  return { inches: parsed.inches };
}

export async function GET() {
  const trucks = await getTruckProfiles();
  return NextResponse.json(trucks);
}

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as CreateTruckPayload;

  const name = normalizeString(payload.name);
  const notes = normalizeString(payload.notes);

  const baseError = validateRequiredText("Truck name", name, 80) ?? validateOptionalText("Notes", notes, 300);
  if (baseError) {
    return NextResponse.json({ error: baseError }, { status: 400 });
  }

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const length = parseDimensionValue(payload.length, "length");
  const width = parseDimensionValue(payload.width, "width");
  const height = parseDimensionValue(payload.height, "height");
  const dimensionError = length.error ?? width.error ?? height.error;
  if (dimensionError) {
    return NextResponse.json({ error: dimensionError }, { status: 400 });
  }

  try {
    const created = await prisma.truckProfile.create({
      data: {
        name,
        notes: notes || null,
        lengthIn: length.inches ?? null,
        widthIn: width.inches ?? null,
        heightIn: height.inches ?? null
      }
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create truck profile. Name may already exist." }, { status: 409 });
  }
}
