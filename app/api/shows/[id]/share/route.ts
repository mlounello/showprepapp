import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const links = await prisma.showShareLink.findMany({
      where: { showId: id, revokedAt: null },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(
      links.map((link) => ({
        id: link.id,
        token: link.token,
        createdAt: link.createdAt
      }))
    );
  } catch {
    return NextResponse.json({ error: "Share links table unavailable. Run prisma db push." }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const force = req.nextUrl.searchParams.get("force") === "true";

  const show = await prisma.show.findUnique({ where: { id } });
  if (!show) {
    return NextResponse.json({ error: "Show not found" }, { status: 404 });
  }

  try {
    if (!force) {
      const existing = await prisma.showShareLink.findFirst({
        where: { showId: id, revokedAt: null },
        orderBy: { createdAt: "desc" }
      });

      if (existing) {
        return NextResponse.json({ token: existing.token, createdAt: existing.createdAt });
      }
    }

    const token = randomBytes(24).toString("hex");
    const created = await prisma.showShareLink.create({
      data: {
        showId: id,
        token
      }
    });

    return NextResponse.json({ token: created.token, createdAt: created.createdAt }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create share link. Run prisma db push if schema changed." }, { status: 500 });
  }
}
