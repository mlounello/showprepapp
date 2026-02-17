import { CaseStatus } from "@/lib/types";

const colorMap: Record<CaseStatus, string> = {
  "In Shop": "#334155",
  Packing: "#0369a1",
  Packed: "#0f766e",
  "Staged (Dock)": "#6d28d9",
  Loaded: "#166534",
  "Arrived / Unloaded": "#15803d",
  Returning: "#9a3412",
  "Back in Shop": "#1f2937",
  Issue: "#b91c1c"
};

export function StatusPill({ status }: { status: CaseStatus }) {
  return (
    <span className="badge" style={{ borderColor: colorMap[status], color: colorMap[status] }}>
      {status}
    </span>
  );
}
