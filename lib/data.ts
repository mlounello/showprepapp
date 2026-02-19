import { prisma } from "@/lib/prisma";
import { formatDbStatus } from "@/lib/status";

export async function getDashboardCounts() {
  const [cases, shows, issues, inMotion] = await Promise.all([
    prisma.case.count(),
    prisma.show.count(),
    prisma.issue.count(),
    prisma.case.count({
      where: {
        currentStatus: {
          notIn: ["IN_SHOP", "BACK_IN_SHOP"]
        }
      }
    })
  ]);

  return { cases, shows, issues, inMotion };
}

export async function getCases() {
  const cases = await prisma.case.findMany({ orderBy: { id: "asc" } });
  return cases.map((item) => ({
    id: item.id,
    department: item.department,
    caseType: item.caseType,
    lengthIn: item.lengthIn,
    widthIn: item.widthIn,
    heightIn: item.heightIn,
    defaultContents: item.defaultContents,
    status: formatDbStatus(item.currentStatus),
    location: item.currentLocation,
    owner: item.ownerLabel,
    notes: item.notes
  }));
}

export async function getCaseDetail(caseId: string) {
  return prisma.case.findUnique({
    where: { id: caseId },
    include: {
      statusHistory: {
        orderBy: { scannedAt: "desc" },
        include: {
          show: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });
}

export async function getShowsList() {
  return prisma.show.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      showTrucks: {
        orderBy: { loadRank: "asc" },
        include: { truck: true }
      }
    }
  });
}

export async function getTruckNames() {
  const trucks = await prisma.truckProfile.findMany({ orderBy: { name: "asc" } });
  return trucks.map((item) => item.name);
}

export async function getTruckProfiles() {
  return prisma.truckProfile.findMany({ orderBy: { name: "asc" } });
}

export async function getShowDetail(showId: string) {
  return prisma.show.findUnique({
    where: { id: showId },
    include: {
      showTrucks: {
        orderBy: { loadRank: "asc" },
        include: { truck: true }
      },
      showCases: {
        orderBy: { loadOrder: "asc" },
        include: {
          case: true,
          owner: true
        }
      },
      issues: {
        orderBy: { createdAt: "desc" }
      },
      statusEvents: {
        orderBy: { scannedAt: "desc" },
        take: 50,
        include: {
          case: {
            select: {
              id: true
            }
          }
        }
      }
    }
  });
}

export async function getShowShareLinks(showId: string) {
  try {
    return await prisma.showShareLink.findMany({
      where: {
        showId,
        revokedAt: null
      },
      orderBy: { createdAt: "desc" }
    });
  } catch {
    // If schema has not been pushed yet, keep the page usable.
    return [];
  }
}

export async function getSharedShowByToken(token: string) {
  const link = await prisma.showShareLink.findFirst({
    where: {
      token,
      revokedAt: null
    }
  });

  if (!link) {
    return null;
  }

  return getShowDetail(link.showId);
}

export async function getCrewAssignments() {
  return prisma.crewMember.findMany({
    orderBy: { name: "asc" },
    include: {
      assignments: {
        include: { case: true, show: true },
        orderBy: { loadOrder: "asc" }
      }
    }
  });
}

export async function getCrewMembers() {
  return prisma.crewMember.findMany({ orderBy: { name: "asc" } });
}

export async function getLoadSheetRows() {
  return prisma.showCase.findMany({
    orderBy: [{ truckLabel: "asc" }, { loadOrder: "asc" }],
    include: {
      case: true,
      owner: true,
      show: true
    }
  });
}
