export type Department = "Audio" | "Lighting" | "Video" | "Power" | "Rigging" | "Misc";

export type CaseStatus =
  | "In Shop"
  | "Packing"
  | "Packed"
  | "Staged (Dock)"
  | "Loaded"
  | "Arrived / Unloaded"
  | "Returning"
  | "Back in Shop"
  | "Issue";

export type TruckZone = "Nose-Curb" | "Nose-Street" | "Mid-Curb" | "Mid-Street" | "Tail-Curb" | "Tail-Street";

export interface CaseRecord {
  id: string;
  department: Department;
  caseType: string;
  dimensions?: { l: number; w: number; h: number };
  weightLbs?: number;
  defaultContents: string;
  notes?: string;
  photoUrl?: string;
  status: CaseStatus;
  location: string;
  owner?: string;
  truck?: string;
  zone?: TruckZone;
}

export interface CrewMember {
  id: string;
  name: string;
}

export interface ShowCaseOverride {
  caseId: string;
  owner?: string;
  truck?: string;
  zone?: TruckZone;
  overrideNotes?: string;
}

export interface ShowRecord {
  id: string;
  name: string;
  dates: string;
  venue: string;
  trucks: string[];
  notes?: string;
  caseOverrides: ShowCaseOverride[];
}

export interface TruckProfile {
  id: string;
  name: string;
  interiorDimensions?: { l: number; w: number; h: number };
  notes?: string;
}

export interface IssueRecord {
  id: string;
  showId: string;
  caseId: string;
  type: "Missing" | "Damaged" | "Other";
  notes?: string;
  createdAt: string;
}
