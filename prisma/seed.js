const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.issue.deleteMany();
  await prisma.statusEvent.deleteMany();
  await prisma.showCase.deleteMany();
  await prisma.showTruck.deleteMany();
  await prisma.crewMember.deleteMany();
  await prisma.show.deleteMany();
  await prisma.truckProfile.deleteMany();
  await prisma.case.deleteMany();

  await prisma.case.createMany({
    data: [
      {
        id: "AUD-001",
        department: "Audio",
        caseType: "Console Rack",
        lengthIn: 40,
        widthIn: 30,
        heightIn: 28,
        weightLbs: 180,
        defaultContents: "X32, rack power, cat5 spool",
        notes: "Stays built",
        currentStatus: "IN_SHOP",
        currentLocation: "Audio Cage",
        ownerLabel: "Audio Lead"
      },
      {
        id: "LGT-014",
        department: "Lighting",
        caseType: "Fixture Case",
        lengthIn: 48,
        widthIn: 24,
        heightIn: 28,
        weightLbs: 160,
        defaultContents: "8x LED PAR + clamps",
        currentStatus: "PACKED",
        currentLocation: "Dock",
        ownerLabel: "Lighting Lead"
      },
      {
        id: "VID-002",
        department: "Video",
        caseType: "Switcher",
        defaultContents: "ATEM, stream laptop, adapters",
        notes: "Handle screen side up",
        currentStatus: "LOADED",
        currentLocation: "Truck 2",
        ownerLabel: "Video Op"
      }
    ]
  });

  const [truck1, truck2] = await Promise.all([
    prisma.truckProfile.create({
      data: {
        name: "Truck 1",
        lengthIn: 360,
        widthIn: 96,
        heightIn: 96,
        notes: "Lift gate slow"
      }
    }),
    prisma.truckProfile.create({
      data: {
        name: "Truck 2",
        lengthIn: 300,
        widthIn: 90,
        heightIn: 90,
        notes: "Wheel wells high"
      }
    })
  ]);

  const [maya, jordan, riley] = await Promise.all([
    prisma.crewMember.create({ data: { name: "Maya" } }),
    prisma.crewMember.create({ data: { name: "Jordan" } }),
    prisma.crewMember.create({ data: { name: "Riley" } })
  ]);

  const show = await prisma.show.create({
    data: {
      name: "Spring Dance Showcase",
      dates: "2026-03-27 to 2026-03-29",
      venue: "Siena Main Theater",
      notes: "Load in starts 08:00"
    }
  });

  await prisma.showTruck.createMany({
    data: [
      { showId: show.id, truckId: truck1.id, loadRank: 1 },
      { showId: show.id, truckId: truck2.id, loadRank: 2 }
    ]
  });

  await prisma.showCase.createMany({
    data: [
      {
        showId: show.id,
        caseId: "AUD-001",
        ownerId: maya.id,
        truckLabel: "Truck 1",
        zoneLabel: "Nose-Curb",
        loadOrder: 1
      },
      {
        showId: show.id,
        caseId: "LGT-014",
        ownerRole: "Lighting Lead",
        truckLabel: "Truck 1",
        zoneLabel: "Mid-Street",
        loadOrder: 2
      },
      {
        showId: show.id,
        caseId: "VID-002",
        ownerId: jordan.id,
        truckLabel: "Truck 2",
        zoneLabel: "Tail-Curb",
        overrideNotes: "Unload first",
        loadOrder: 3
      }
    ]
  });

  await prisma.issue.create({
    data: {
      showId: show.id,
      caseId: "LGT-014",
      type: "Damaged",
      notes: "Latch bent during unload"
    }
  });

  await prisma.statusEvent.createMany({
    data: [
      {
        caseId: "AUD-001",
        showId: show.id,
        status: "IN_SHOP",
        location: "Audio Cage",
        note: "Initial seeded state"
      },
      {
        caseId: "LGT-014",
        showId: show.id,
        status: "PACKED",
        location: "Dock",
        note: "Packed and staged"
      },
      {
        caseId: "VID-002",
        showId: show.id,
        status: "LOADED",
        location: "Truck 2",
        truckLabel: "Truck 2",
        zoneLabel: "Tail-Curb",
        note: "Loaded and secured"
      }
    ]
  });

  console.log(`Seed complete for show ${show.id}; crew: ${[maya.name, jordan.name, riley.name].join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
