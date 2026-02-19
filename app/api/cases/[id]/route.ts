import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uiToDbStatus } from "@/lib/status";
import { CaseStatus } from "@/lib/types";

interface UpdateCasePayload {
  department?: string;
  caseType?: string;
  defaultContents?: string;
  owner?: string;
  location?: string;
  status?: CaseStatus;
  notes?: string;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = (await req.json()) as UpdateCasePayload;

  const existing = await prisma.case.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: `Case ${id} not found` }, { status: 404 });
  }

  const updated = await prisma.case.update({
    where: { id },
    data: {
      department: payload.department?.trim() || existing.department,
      caseType: payload.caseType?.trim() || existing.caseType,
      defaultContents: payload.defaultContents?.trim() || existing.defaultContents,
      ownerLabel: payload.owner?.trim() || null,
      currentLocation: payload.location?.trim() || existing.currentLocation,
      currentStatus: payload.status ? uiToDbStatus[payload.status] : existing.currentStatus,
      notes: payload.notes?.trim() || null
    }
  });

  return NextResponse.json({ id: updated.id });
}
