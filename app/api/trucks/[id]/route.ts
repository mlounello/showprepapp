import { NextRequest, NextResponse } from "next/server";
import { parseDimensionInput } from "@/lib/dimensions";
import { prisma } from "@/lib/prisma";

interface UpdateTruckPayload {
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = (await req.json()) as UpdateTruckPayload;
  const existing = await prisma.truckProfile.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ error: "Truck profile not found" }, { status: 404 });
  }

  const hasLength = Object.prototype.hasOwnProperty.call(payload, "length");
  const hasWidth = Object.prototype.hasOwnProperty.call(payload, "width");
  const hasHeight = Object.prototype.hasOwnProperty.call(payload, "height");

  const length = hasLength ? parseDimensionValue(payload.length, "length") : { inches: existing.lengthIn };
  const width = hasWidth ? parseDimensionValue(payload.width, "width") : { inches: existing.widthIn };
  const height = hasHeight ? parseDimensionValue(payload.height, "height") : { inches: existing.heightIn };
  const dimensionError = length.error ?? width.error ?? height.error;
  if (dimensionError) {
    return NextResponse.json({ error: dimensionError }, { status: 400 });
  }

  try {
    const updated = await prisma.truckProfile.update({
      where: { id },
      data: {
        name: payload.name?.trim() || existing.name,
        notes: payload.notes?.trim() || null,
        lengthIn: length.inches ?? null,
        widthIn: width.inches ?? null,
        heightIn: height.inches ?? null
      }
    });
    return NextResponse.json({ id: updated.id });
  } catch {
    return NextResponse.json({ error: "Unable to update truck profile. Name may already exist." }, { status: 409 });
  }
}
