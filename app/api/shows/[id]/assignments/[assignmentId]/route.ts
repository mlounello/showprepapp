import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface UpdateAssignmentPayload {
  ownerId?: string | null;
  ownerRole?: string | null;
  truckLabel?: string | null;
  zoneLabel?: string | null;
  loadOrder?: number;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  const { id: showId, assignmentId } = await params;
  const payload = (await req.json()) as UpdateAssignmentPayload;

  const assignment = await prisma.showCase.findFirst({
    where: {
      id: assignmentId,
      showId
    }
  });

  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found for this show" }, { status: 404 });
  }

  if (payload.ownerId) {
    const ownerExists = await prisma.crewMember.findUnique({ where: { id: payload.ownerId } });
    if (!ownerExists) {
      return NextResponse.json({ error: "Owner not found" }, { status: 404 });
    }
  }

  const nextLoadOrder =
    typeof payload.loadOrder === "number" && Number.isFinite(payload.loadOrder)
      ? Math.max(0, Math.floor(payload.loadOrder))
      : assignment.loadOrder;

  const updated = await prisma.showCase.update({
    where: { id: assignment.id },
    data: {
      ownerId: payload.ownerId ? payload.ownerId : null,
      ownerRole: payload.ownerId ? null : payload.ownerRole?.trim() || null,
      truckLabel: payload.truckLabel?.trim() || null,
      zoneLabel: payload.zoneLabel?.trim() || null,
      loadOrder: nextLoadOrder
    },
    include: {
      owner: true,
      case: true
    }
  });

  return NextResponse.json({
    id: updated.id,
    caseId: updated.case.id,
    ownerId: updated.ownerId,
    ownerName: updated.owner?.name ?? null,
    ownerRole: updated.ownerRole,
    truckLabel: updated.truckLabel,
    zoneLabel: updated.zoneLabel,
    loadOrder: updated.loadOrder
  });
}
