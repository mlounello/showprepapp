import { NextResponse } from "next/server";
import { syncAppUsersToControlRoom } from "@/lib/user-sync";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await syncAppUsersToControlRoom("manual_admin");
  const status = result.ok ? 200 : 502;

  return NextResponse.json(result, { status });
}
