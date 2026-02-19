import { NextRequest, NextResponse } from "next/server";
import { getCases } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { uiToDbStatus } from "@/lib/status";
import { CaseStatus } from "@/lib/types";

interface CreateCasePayload {
  id?: string;
  department?: string;
  caseType?: string;
  defaultContents?: string;
  owner?: string;
  location?: string;
  status?: CaseStatus;
  notes?: string;
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

  try {
    const created = await prisma.case.create({
      data: {
        id: payload.id.trim().toUpperCase(),
        department: payload.department.trim(),
        caseType: payload.caseType.trim(),
        defaultContents: payload.defaultContents.trim(),
        ownerLabel: payload.owner?.trim() || null,
        currentLocation: payload.location?.trim() || "Shop",
        currentStatus: payload.status ? uiToDbStatus[payload.status] : "IN_SHOP",
        notes: payload.notes?.trim() || null
      }
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create case. Case ID may already exist." }, { status: 409 });
  }
}
