import { NextRequest, NextResponse } from "next/server";
import { parseDimensionInput } from "@/lib/dimensions";
import { prisma } from "@/lib/prisma";
import { uiToDbStatus } from "@/lib/status";
import { CaseStatus } from "@/lib/types";
import { normalizeString, validateDepartment, validateOptionalText, validateRequiredText } from "@/lib/validation";

interface UpdateCasePayload {
  department?: string;
  caseType?: string;
  defaultContents?: string;
  owner?: string;
  location?: string;
  status?: CaseStatus;
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
  const payload = (await req.json()) as UpdateCasePayload;

  const existing = await prisma.case.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: `Case ${id} not found` }, { status: 404 });
  }

  const hasLength = Object.prototype.hasOwnProperty.call(payload, "length");
  const hasWidth = Object.prototype.hasOwnProperty.call(payload, "width");
  const hasHeight = Object.prototype.hasOwnProperty.call(payload, "height");
  const hasDepartment = Object.prototype.hasOwnProperty.call(payload, "department");
  const hasCaseType = Object.prototype.hasOwnProperty.call(payload, "caseType");
  const hasDefaultContents = Object.prototype.hasOwnProperty.call(payload, "defaultContents");
  const hasOwner = Object.prototype.hasOwnProperty.call(payload, "owner");
  const hasLocation = Object.prototype.hasOwnProperty.call(payload, "location");
  const hasNotes = Object.prototype.hasOwnProperty.call(payload, "notes");

  const department = hasDepartment ? normalizeString(payload.department) : existing.department;
  const caseType = hasCaseType ? normalizeString(payload.caseType) : existing.caseType;
  const defaultContents = hasDefaultContents ? normalizeString(payload.defaultContents) : existing.defaultContents;
  const owner = hasOwner ? normalizeString(payload.owner) : existing.ownerLabel ?? "";
  const location = hasLocation ? normalizeString(payload.location) : existing.currentLocation;
  const notes = hasNotes ? normalizeString(payload.notes) : existing.notes ?? "";

  const baseError =
    validateDepartment(department) ??
    validateRequiredText("Case type", caseType, 80) ??
    validateRequiredText("Default contents", defaultContents, 500) ??
    validateOptionalText("Owner", owner, 80) ??
    validateRequiredText("Location", location, 80) ??
    validateOptionalText("Notes", notes, 400);
  if (baseError) {
    return NextResponse.json({ error: baseError }, { status: 400 });
  }

  if (payload.status && !uiToDbStatus[payload.status]) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const parsedLength = hasLength ? parseDimensionValue(payload.length, "length") : { inches: existing.lengthIn };
  const parsedWidth = hasWidth ? parseDimensionValue(payload.width, "width") : { inches: existing.widthIn };
  const parsedHeight = hasHeight ? parseDimensionValue(payload.height, "height") : { inches: existing.heightIn };

  const dimensionError = parsedLength.error ?? parsedWidth.error ?? parsedHeight.error;
  if (dimensionError) {
    return NextResponse.json({ error: dimensionError }, { status: 400 });
  }

  const updated = await prisma.case.update({
    where: { id },
    data: {
      department,
      caseType,
      defaultContents,
      ownerLabel: owner || null,
      currentLocation: location,
      currentStatus: payload.status ? uiToDbStatus[payload.status] : existing.currentStatus,
      notes: notes || null,
      lengthIn: parsedLength.inches ?? null,
      widthIn: parsedWidth.inches ?? null,
      heightIn: parsedHeight.inches ?? null
    }
  });

  return NextResponse.json({ id: updated.id });
}
