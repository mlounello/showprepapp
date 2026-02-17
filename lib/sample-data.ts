import { CaseRecord, CrewMember, IssueRecord, ShowRecord, TruckProfile } from "@/lib/types";

export const caseLibrary: CaseRecord[] = [
  {
    id: "AUD-001",
    department: "Audio",
    caseType: "Console Rack",
    dimensions: { l: 40, w: 30, h: 28 },
    weightLbs: 180,
    defaultContents: "X32, rack power, cat5 spool",
    notes: "Stays built",
    status: "In Shop",
    location: "Audio Cage",
    owner: "Audio Lead",
    truck: "Truck 1",
    zone: "Nose-Curb"
  },
  {
    id: "LGT-014",
    department: "Lighting",
    caseType: "Fixture Case",
    dimensions: { l: 48, w: 24, h: 28 },
    weightLbs: 160,
    defaultContents: "8x LED PAR + clamps",
    status: "Packed",
    location: "Dock",
    owner: "Lighting Lead",
    truck: "Truck 1",
    zone: "Mid-Street"
  },
  {
    id: "VID-002",
    department: "Video",
    caseType: "Switcher",
    defaultContents: "ATEM, stream laptop, adapters",
    notes: "Handle screen side up",
    status: "Loaded",
    location: "Truck 2",
    owner: "Video Op",
    truck: "Truck 2",
    zone: "Tail-Curb"
  }
];

export const crew: CrewMember[] = [
  { id: "c1", name: "Maya" },
  { id: "c2", name: "Jordan" },
  { id: "c3", name: "Riley" }
];

export const trucks: TruckProfile[] = [
  { id: "t1", name: "Truck 1", interiorDimensions: { l: 360, w: 96, h: 96 }, notes: "Lift gate slow" },
  { id: "t2", name: "Truck 2", interiorDimensions: { l: 300, w: 90, h: 90 }, notes: "Wheel wells high" }
];

export const shows: ShowRecord[] = [
  {
    id: "s1",
    name: "Spring Dance Showcase",
    dates: "2026-03-27 to 2026-03-29",
    venue: "Siena Main Theater",
    trucks: ["Truck 1", "Truck 2"],
    notes: "Load in starts 08:00",
    caseOverrides: [
      { caseId: "AUD-001", owner: "Maya", truck: "Truck 1", zone: "Nose-Curb" },
      { caseId: "VID-002", owner: "Jordan", truck: "Truck 2", zone: "Tail-Curb", overrideNotes: "Unload first" }
    ]
  }
];

export const issues: IssueRecord[] = [
  {
    id: "i1",
    showId: "s1",
    caseId: "LGT-014",
    type: "Damaged",
    notes: "Latch bent during unload",
    createdAt: "2026-02-16T18:32:00Z"
  }
];
