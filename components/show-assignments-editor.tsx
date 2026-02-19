"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusPill } from "@/components/status-pill";
import { CaseStatus } from "@/lib/types";

type AssignmentRow = {
  id: string;
  caseId: string;
  ownerId?: string | null;
  ownerRole?: string | null;
  truckLabel?: string | null;
  zoneLabel?: string | null;
  loadOrder: number;
  status: CaseStatus;
  location: string;
};

type CrewOption = {
  id: string;
  name: string;
};

const zoneOptions = ["", "Nose-Curb", "Nose-Street", "Mid-Curb", "Mid-Street", "Tail-Curb", "Tail-Street"];

export function ShowAssignmentsEditor({
  showId,
  initialRows,
  crew,
  trucks
}: {
  showId: string;
  initialRows: AssignmentRow[];
  crew: CrewOption[];
  trucks: string[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const updateRow = (id: string, patch: Partial<AssignmentRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const saveRow = async (row: AssignmentRow) => {
    setSavingId(row.id);
    setMessage("");

    const res = await fetch(`/api/shows/${showId}/assignments/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerId: row.ownerId || null,
        ownerRole: row.ownerId ? null : row.ownerRole || null,
        truckLabel: row.truckLabel || null,
        zoneLabel: row.zoneLabel || null,
        loadOrder: Number.isFinite(row.loadOrder) ? row.loadOrder : 0
      })
    });

    const payload = (await res.json()) as { error?: string };

    if (!res.ok) {
      setMessage(payload.error ?? `Failed to update ${row.caseId}.`);
      setSavingId(null);
      return;
    }

    setMessage(`Updated ${row.caseId}.`);
    setSavingId(null);
    router.refresh();
  };

  return (
    <section className="panel" style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Assigned Cases</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: 8 }}>Case</th>
              <th style={{ padding: 8 }}>Owner</th>
              <th style={{ padding: 8 }}>Role (optional)</th>
              <th style={{ padding: 8 }}>Truck</th>
              <th style={{ padding: 8 }}>Zone</th>
              <th style={{ padding: 8 }}>Load #</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }}>Location</th>
              <th style={{ padding: 8 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: 8 }}>{row.caseId}</td>
                <td style={{ padding: 8, minWidth: 170 }}>
                  <select
                    value={row.ownerId ?? ""}
                    onChange={(e) =>
                      updateRow(row.id, {
                        ownerId: e.target.value || null,
                        ownerRole: e.target.value ? null : row.ownerRole
                      })
                    }
                  >
                    <option value="">Unassigned</option>
                    {crew.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: 8, minWidth: 170 }}>
                  <input
                    value={row.ownerRole ?? ""}
                    onChange={(e) => updateRow(row.id, { ownerRole: e.target.value })}
                    placeholder="Dock Captain"
                    disabled={Boolean(row.ownerId)}
                  />
                </td>
                <td style={{ padding: 8, minWidth: 160 }}>
                  <select value={row.truckLabel ?? ""} onChange={(e) => updateRow(row.id, { truckLabel: e.target.value || null })}>
                    <option value="">Unassigned</option>
                    {trucks.map((truck) => (
                      <option key={truck} value={truck}>
                        {truck}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: 8, minWidth: 160 }}>
                  <select value={row.zoneLabel ?? ""} onChange={(e) => updateRow(row.id, { zoneLabel: e.target.value || null })}>
                    {zoneOptions.map((zone) => (
                      <option key={zone || "none"} value={zone}>
                        {zone || "Unassigned"}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: 8, width: 100 }}>
                  <input
                    type="number"
                    min={0}
                    value={row.loadOrder}
                    onChange={(e) => updateRow(row.id, { loadOrder: Number(e.target.value || 0) })}
                  />
                </td>
                <td style={{ padding: 8 }}>
                  <StatusPill status={row.status} />
                </td>
                <td style={{ padding: 8 }}>{row.location}</td>
                <td style={{ padding: 8 }}>
                  <button className="btn" type="button" onClick={() => void saveRow(row)} disabled={savingId === row.id}>
                    {savingId === row.id ? "Saving..." : "Save"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {message && <p style={{ marginBottom: 0, color: "#5d6d63" }}>{message}</p>}
    </section>
  );
}
