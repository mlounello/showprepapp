import { NextRequest, NextResponse } from "next/server";
import { getCases } from "@/lib/data";
import { parseDimensionInput } from "@/lib/dimensions";
import { prisma } from "@/lib/prisma";
import { uiToDbStatus } from "@/lib/status";
import { CaseStatus } from "@/lib/types";
import { normalizeString, validateCaseId, validateDepartment, validateOptionalText, validateRequiredText } from "@/lib/validation";

interface CreateCasePayload {
  id?: string;
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

export async function GET() {
  const rows = await getCases();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as CreateCasePayload;

  if (!payload.id || !payload.department || !payload.caseType || !payload.defaultContents) {
    return NextResponse.json({ error: "id, department, caseType, and defaultContents are required" }, { status: 400 });
  }

  const id = normalizeString(payload.id).toUpperCase();
  const department = normalizeString(payload.department);
  const caseType = normalizeString(payload.caseType);
  const defaultContents = normalizeString(payload.defaultContents);
  const owner = normalizeString(payload.owner);
  const location = normalizeString(payload.location);
  const notes = normalizeString(payload.notes);

  const baseError =
    validateCaseId(id) ??
    validateDepartment(department) ??
    validateRequiredText("Case type", caseType, 80) ??
    validateRequiredText("Default contents", defaultContents, 500) ??
    validateOptionalText("Owner", owner, 80) ??
    validateOptionalText("Location", location, 80) ??
    validateOptionalText("Notes", notes, 400);

  if (baseError) {
    return NextResponse.json({ error: baseError }, { status: 400 });
  }

  if (payload.status && !uiToDbStatus[payload.status]) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const length = parseDimensionValue(payload.length, "length");
  const width = parseDimensionValue(payload.width, "width");
  const height = parseDimensionValue(payload.height, "height");

  const dimensionError = length.error ?? width.error ?? height.error;
  if (dimensionError) {
    return NextResponse.json({ error: dimensionError }, { status: 400 });
  }

  try {
    const created = await prisma.case.create({
      data: {
        id,
        department,
        caseType,
        defaultContents,
        ownerLabel: owner || null,
        currentLocation: location || "Shop",
        currentStatus: payload.status ? uiToDbStatus[payload.status] : "IN_SHOP",
        notes: notes || null,
        lengthIn: length.inches ?? null,
        widthIn: width.inches ?? null,
        heightIn: height.inches ?? null
      }
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create case. Case ID may already exist." }, { status: 409 });
  }
}
