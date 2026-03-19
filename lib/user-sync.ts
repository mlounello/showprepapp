import { prisma } from "@/lib/prisma";

const DEFAULT_SYNC_URL = "https://mlounello.com/api/admin/sync/app-users";
const DEFAULT_APP_SLUG = "showprep-app";

type ControlRoomUser = {
  fullName: string;
  email: string;
  globalRole: string;
  accountStatus: string;
  appRole: string;
  permissionLevel: string;
  membershipStatus: string;
  notes: string;
};

type ControlRoomPayload = {
  appSlug: string;
  fullSync: boolean;
  users: ControlRoomUser[];
};

type SyncResult = {
  ok: boolean;
  status?: number;
  userCount: number;
  schema?: string;
  error?: string;
};

function resolveSyncConfig() {
  return {
    url: process.env.CONTROL_ROOM_USER_SYNC_URL || DEFAULT_SYNC_URL,
    secret: process.env.APP_SYNC_SECRET || process.env.CONTROL_ROOM_SYNC_SECRET || process.env.APP_USER_SYNC_SECRET || "",
    appSlug: process.env.CONTROL_ROOM_APP_SLUG || DEFAULT_APP_SLUG,
    schema: process.env.APP_SCHEMA || process.env.NEXT_PUBLIC_APP_SCHEMA || "app_showprep"
  };
}

function buildUserNotes(name: string, assignmentCount: number) {
  const parts = ["Imported from ShowPrep App", "No email stored in ShowPrep App"];

  if (assignmentCount > 0) {
    parts.push(`Assigned to ${assignmentCount} case${assignmentCount === 1 ? "" : "s"}`);
  }

  return `${name}: ${parts.join(". ")}.`;
}

function mapCrewMemberToControlRoomUser(member: { name: string; assignments: { id: string }[] }): ControlRoomUser {
  return {
    fullName: member.name,
    email: "",
    globalRole: "member",
    accountStatus: "active",
    appRole: "crew_member",
    permissionLevel: "managed",
    membershipStatus: "active",
    notes: buildUserNotes(member.name, member.assignments.length)
  };
}

export async function syncAppUsersToControlRoom(trigger: string): Promise<SyncResult> {
  const config = resolveSyncConfig();

  if (!config.secret) {
    console.warn(`[USER SYNC] skipped trigger=${trigger} reason=missing_secret`);
    return {
      ok: false,
      userCount: 0,
      schema: config.schema,
      error: "Missing APP_SYNC_SECRET"
    };
  }

  const members = await prisma.crewMember.findMany({
    orderBy: { name: "asc" },
    include: {
      assignments: {
        select: { id: true }
      }
    }
  });

  const payload: ControlRoomPayload = {
    appSlug: config.appSlug,
    fullSync: true,
    users: members.map(mapCrewMemberToControlRoomUser)
  };

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-App-Sync-Secret": config.secret
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error(
        `[USER SYNC] trigger=${trigger} status=${response.status} schema=${config.schema} users=${payload.users.length} detail=${detail || "empty"}`
      );
      return {
        ok: false,
        status: response.status,
        userCount: payload.users.length,
        schema: config.schema,
        error: detail || `HTTP ${response.status}`
      };
    }

    console.info(`[USER SYNC] trigger=${trigger} status=${response.status} schema=${config.schema} users=${payload.users.length}`);
    return {
      ok: true,
      status: response.status,
      userCount: payload.users.length,
      schema: config.schema
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown network error";
    console.error(`[USER SYNC] trigger=${trigger} schema=${config.schema} users=${payload.users.length} network_error=${detail}`);
    return {
      ok: false,
      userCount: payload.users.length,
      schema: config.schema,
      error: detail
    };
  }
}
