import { NextRequest, NextResponse } from "next/server";
import { parseCsv } from "@/lib/csv";
import { parseDimensionInput } from "@/lib/dimensions";
import { prisma } from "@/lib/prisma";
import { uiToDbStatus } from "@/lib/status";
import { normalizeString, validateCaseId, validateDepartment, validateOptionalText, validateRequiredText } from "@/lib/validation";

interface ImportPayload {
  csv?: string;
}

type HeaderMap = Record<string, number>;

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[\s_-]+/g, "");
}

function findHeaderIndex(headers: HeaderMap, aliases: string[]) {
  for (const alias of aliases) {
    const idx = headers[normalizeHeader(alias)];
    if (idx != null) {
      return idx;
    }
  }
  return -1;
}

function parseDimensionValue(value: string, label: string) {
  const parsed = parseDimensionInput(value);
  if (parsed.error) {
    return { error: `Invalid ${label} dimension. Use 24, 24in, 2ft 3in, or 610mm.` };
  }
  return { inches: parsed.inches };
}

function parseStatus(value: string) {
  if (!value) {
    return { dbStatus: null as string | null };
  }
  const trimmed = value.trim();
  if ((uiToDbStatus as Record<string, string>)[trimmed]) {
    return { dbStatus: (uiToDbStatus as Record<string, string>)[trimmed] };
  }
  if (["IN_SHOP", "PACKING", "PACKED", "STAGED_DOCK", "LOADED", "ARRIVED_UNLOADED", "RETURNING", "BACK_IN_SHOP", "ISSUE"].includes(trimmed)) {
    return { dbStatus: trimmed };
  }
  return { error: "Invalid status value." };
}

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as ImportPayload;
  if (!payload.csv?.trim()) {
    return NextResponse.json({ error: "csv is required" }, { status: 400 });
  }

  const rows = parseCsv(payload.csv);
  if (rows.length < 2) {
    return NextResponse.json({ error: "CSV must include a header row and at least one data row." }, { status: 400 });
  }

  const rawHeaders = rows[0];
  const headerMap: HeaderMap = {};
  rawHeaders.forEach((header, index) => {
    headerMap[normalizeHeader(header)] = index;
  });

  const idIndex = findHeaderIndex(headerMap, ["id", "caseId", "case id"]);
  const departmentIndex = findHeaderIndex(headerMap, ["department"]);
  const caseTypeIndex = findHeaderIndex(headerMap, ["caseType", "case type"]);
  const defaultContentsIndex = findHeaderIndex(headerMap, ["defaultContents", "default contents", "contents"]);
  const ownerIndex = findHeaderIndex(headerMap, ["owner"]);
  const locationIndex = findHeaderIndex(headerMap, ["location"]);
  const statusIndex = findHeaderIndex(headerMap, ["status"]);
  const notesIndex = findHeaderIndex(headerMap, ["notes"]);
  const lengthIndex = findHeaderIndex(headerMap, ["length", "lengthin", "l"]);
  const widthIndex = findHeaderIndex(headerMap, ["width", "widthin", "w"]);
  const heightIndex = findHeaderIndex(headerMap, ["height", "heightin", "h"]);

  if (idIndex < 0 || departmentIndex < 0 || caseTypeIndex < 0 || defaultContentsIndex < 0) {
    return NextResponse.json(
      {
        error: "CSV must include headers: id, department, caseType, defaultContents (aliases accepted)."
      },
      { status: 400 }
    );
  }

  const ids = rows
    .slice(1)
    .map((row) => normalizeString(row[idIndex]).toUpperCase())
    .filter(Boolean);

  const existingRows = await prisma.case.findMany({ where: { id: { in: ids } } });
  const existingById = new Map(existingRows.map((row) => [row.id, row]));

  const errors: Array<{ line: number; id?: string; error: string }> = [];
  let created = 0;
  let updated = 0;

  for (let i = 1; i < rows.length; i += 1) {
    const lineNo = i + 1;
    const row = rows[i];
    const id = normalizeString(row[idIndex]).toUpperCase();

    if (!id) {
      errors.push({ line: lineNo, error: "Missing case id." });
      continue;
    }

    const existing = existingById.get(id);
    const departmentRaw = normalizeString(row[departmentIndex]);
    const caseTypeRaw = normalizeString(row[caseTypeIndex]);
    const defaultContentsRaw = normalizeString(row[defaultContentsIndex]);
    const ownerRaw = ownerIndex >= 0 ? normalizeString(row[ownerIndex]) : "";
    const locationRaw = locationIndex >= 0 ? normalizeString(row[locationIndex]) : "";
    const statusRaw = statusIndex >= 0 ? normalizeString(row[statusIndex]) : "";
    const notesRaw = notesIndex >= 0 ? normalizeString(row[notesIndex]) : "";
    const lengthRaw = lengthIndex >= 0 ? normalizeString(row[lengthIndex]) : "";
    const widthRaw = widthIndex >= 0 ? normalizeString(row[widthIndex]) : "";
    const heightRaw = heightIndex >= 0 ? normalizeString(row[heightIndex]) : "";

    const department = departmentRaw || existing?.department || "";
    const caseType = caseTypeRaw || existing?.caseType || "";
    const defaultContents = defaultContentsRaw || existing?.defaultContents || "";
    const location = locationRaw || existing?.currentLocation || "Shop";

    const baseError =
      validateCaseId(id) ??
      validateDepartment(department) ??
      validateRequiredText("Case type", caseType, 80) ??
      validateRequiredText("Default contents", defaultContents, 500) ??
      validateOptionalText("Owner", ownerRaw, 80) ??
      validateOptionalText("Location", location, 80) ??
      validateOptionalText("Notes", notesRaw, 400);

    if (baseError) {
      errors.push({ line: lineNo, id, error: baseError });
      continue;
    }

    const length = parseDimensionValue(lengthRaw, "length");
    const width = parseDimensionValue(widthRaw, "width");
    const height = parseDimensionValue(heightRaw, "height");
    const status = parseStatus(statusRaw);
    const dimensionError = length.error ?? width.error ?? height.error ?? status.error;
    if (dimensionError) {
      errors.push({ line: lineNo, id, error: dimensionError });
      continue;
    }

    await prisma.case.upsert({
      where: { id },
      create: {
        id,
        department,
        caseType,
        defaultContents,
        ownerLabel: ownerRaw || null,
        currentLocation: location,
        currentStatus: status.dbStatus ?? "IN_SHOP",
        notes: notesRaw || null,
        lengthIn: length.inches ?? null,
        widthIn: width.inches ?? null,
        heightIn: height.inches ?? null
      },
      update: {
        department,
        caseType,
        defaultContents,
        ownerLabel: ownerRaw || null,
        currentLocation: location,
        currentStatus: status.dbStatus ?? existing?.currentStatus ?? "IN_SHOP",
        notes: notesRaw || null,
        lengthIn: length.inches ?? null,
        widthIn: width.inches ?? null,
        heightIn: height.inches ?? null
      }
    });

    if (existing) {
      updated += 1;
    } else {
      created += 1;
      existingById.set(id, { id } as (typeof existingRows)[number]);
    }
  }

  return NextResponse.json({
    created,
    updated,
    skipped: errors.length,
    errors
  });
}
