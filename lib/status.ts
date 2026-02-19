import { CaseStatus } from "@/lib/types";

export const dbToUiStatus: Record<string, CaseStatus> = {
  IN_SHOP: "In Shop",
  PACKING: "Packing",
  PACKED: "Packed",
  STAGED_DOCK: "Staged (Dock)",
  LOADED: "Loaded",
  ARRIVED_UNLOADED: "Arrived / Unloaded",
  RETURNING: "Returning",
  BACK_IN_SHOP: "Back in Shop",
  ISSUE: "Issue"
};

export const uiToDbStatus: Record<CaseStatus, string> = {
  "In Shop": "IN_SHOP",
  Packing: "PACKING",
  Packed: "PACKED",
  "Staged (Dock)": "STAGED_DOCK",
  Loaded: "LOADED",
  "Arrived / Unloaded": "ARRIVED_UNLOADED",
  Returning: "RETURNING",
  "Back in Shop": "BACK_IN_SHOP",
  Issue: "ISSUE"
};

export const uiStatuses: CaseStatus[] = [
  "In Shop",
  "Packing",
  "Packed",
  "Staged (Dock)",
  "Loaded",
  "Arrived / Unloaded",
  "Returning",
  "Back in Shop",
  "Issue"
];

export function formatDbStatus(status: string): CaseStatus {
  return dbToUiStatus[status] ?? "In Shop";
}
