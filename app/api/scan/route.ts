import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildStatusEventNote } from "@/lib/scan-events";
import { dbToUiStatus, uiToDbStatus } from "@/lib/status";
import { uploadIssuePhotoToSupabase } from "@/lib/supabase-storage";
import { CaseStatus } from "@/lib/types";

interface ScanPayload {
  caseId?: string;
  status?: CaseStatus;
  zone?: string;
  truck?: string;
  location?: string;
  showId?: string;
  note?: string;
  operatorLabel?: string;
  issueType?: "Missing" | "Damaged" | "Other";
  issueNotes?: string;
  issuePhotoDataUrl?: string;
}

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as ScanPayload;

  if (!payload.caseId || !payload.status) {
    return NextResponse.json({ error: "caseId and status are required" }, { status: 400 });
  }

  const found = await prisma.case.findUnique({ where: { id: payload.caseId } });
  if (!found) {
    return NextResponse.json({ error: `Case ${payload.caseId} not found` }, { status: 404 });
  }

  const dbStatus = uiToDbStatus[payload.status];
  const nextLocation = payload.location ?? (payload.status === "Loaded" && payload.truck ? payload.truck : found.currentLocation);

  const updated = await prisma.case.update({
    where: { id: found.id },
    data: {
      currentStatus: dbStatus,
      currentLocation: nextLocation
    }
  });

  await prisma.statusEvent.create({
    data: {
      caseId: found.id,
      showId: payload.showId,
      status: dbStatus,
      location: nextLocation,
      truckLabel: payload.truck,
      zoneLabel: payload.zone,
      note: buildStatusEventNote(payload.note, payload.operatorLabel)
    }
  });

  let issueLogged = false;
  let issuePhotoStored = false;
  let issuePhotoWarning: string | undefined;

  if (payload.issueType) {
    if (!payload.showId) {
      return NextResponse.json({ error: "showId is required to log an issue" }, { status: 400 });
    }

    const issueId = crypto.randomUUID();
    let photoUrl: string | null = null;

    if (payload.issuePhotoDataUrl?.trim()) {
      try {
        const uploaded = await uploadIssuePhotoToSupabase({
          showId: payload.showId,
          caseId: found.id,
          issueId,
          dataUrl: payload.issuePhotoDataUrl.trim()
        });

        if (uploaded.publicUrl) {
          photoUrl = uploaded.publicUrl;
          issuePhotoStored = true;
        } else if (uploaded.error) {
          issuePhotoWarning = uploaded.error;
        }
      } catch {
        issuePhotoWarning = "Issue logged, but photo upload failed.";
      }
    }

    await prisma.issue.create({
      data: {
        id: issueId,
        showId: payload.showId,
        caseId: found.id,
        type: payload.issueType,
        notes: payload.issueNotes?.trim() || null,
        photoUrl
      }
    });

    issueLogged = true;
  }

  return NextResponse.json({
    id: updated.id,
    status: dbToUiStatus[updated.currentStatus] ?? "In Shop",
    location: updated.currentLocation,
    issueLogged,
    issuePhotoStored,
    issuePhotoWarning
  });
}
