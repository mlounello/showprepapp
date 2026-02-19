"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
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

type SortableRowProps = {
  row: AssignmentRow;
  crew: CrewOption[];
  trucks: string[];
  isSaving: boolean;
  isSelected: boolean;
  onUpdateRow: (id: string, patch: Partial<AssignmentRow>) => void;
  onSaveRow: (row: AssignmentRow) => Promise<void>;
  onToggleSelected: (id: string) => void;
};

function SortableAssignmentRow({ row, crew, trucks, isSaving, isSelected, onUpdateRow, onSaveRow, onToggleSelected }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });

  return (
    <tr
      ref={setNodeRef}
      style={{
        borderBottom: "1px solid #f0f0f0",
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.75 : 1,
        background: isDragging ? "#f8fafc" : "transparent"
      }}
    >
      <td style={{ padding: 8 }}>
        <input type="checkbox" checked={isSelected} onChange={() => onToggleSelected(row.id)} />
      </td>
      <td style={{ padding: 8, width: 54 }}>
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`Drag ${row.caseId}`}
          title="Drag to reorder"
          style={{
            border: "1px solid #d1d5db",
            borderRadius: 8,
            background: "#fff",
            padding: "6px 8px",
            cursor: "grab"
          }}
          {...attributes}
          {...listeners}
        >
          :::
        </button>
      </td>
      <td style={{ padding: 8 }}>{row.caseId}</td>
      <td style={{ padding: 8, minWidth: 170 }}>
        <select
          value={row.ownerId ?? ""}
          onChange={(e) =>
            onUpdateRow(row.id, {
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
          onChange={(e) => onUpdateRow(row.id, { ownerRole: e.target.value })}
          placeholder="Dock Captain"
          disabled={Boolean(row.ownerId)}
        />
      </td>
      <td style={{ padding: 8, minWidth: 160 }}>
        <select value={row.truckLabel ?? ""} onChange={(e) => onUpdateRow(row.id, { truckLabel: e.target.value || null })}>
          <option value="">Unassigned</option>
          {trucks.map((truck) => (
            <option key={truck} value={truck}>
              {truck}
            </option>
          ))}
        </select>
      </td>
      <td style={{ padding: 8, minWidth: 160 }}>
        <select value={row.zoneLabel ?? ""} onChange={(e) => onUpdateRow(row.id, { zoneLabel: e.target.value || null })}>
          {zoneOptions.map((zone) => (
            <option key={zone || "none"} value={zone}>
              {zone || "Unassigned"}
            </option>
          ))}
        </select>
      </td>
      <td style={{ padding: 8, width: 100 }}>
        <input type="number" min={1} value={row.loadOrder} onChange={(e) => onUpdateRow(row.id, { loadOrder: Number(e.target.value || 1) })} />
      </td>
      <td style={{ padding: 8 }}>
        <StatusPill status={row.status} />
      </td>
      <td style={{ padding: 8 }}>{row.location}</td>
      <td style={{ padding: 8 }}>
        <button className="btn" type="button" onClick={() => void onSaveRow(row)} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </button>
      </td>
    </tr>
  );
}

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkTruckLabel, setBulkTruckLabel] = useState("");
  const [bulkZoneLabel, setBulkZoneLabel] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const sortedRows = useMemo(() => [...rows].sort((a, b) => a.loadOrder - b.loadOrder || a.caseId.localeCompare(b.caseId)), [rows]);
  const allSelected = sortedRows.length > 0 && selectedIds.length === sortedRows.length;

  const patchAssignment = async (row: AssignmentRow) => {
    return fetch(`/api/shows/${showId}/assignments/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerId: row.ownerId || null,
        ownerRole: row.ownerId ? null : row.ownerRole || null,
        truckLabel: row.truckLabel || null,
        zoneLabel: row.zoneLabel || null,
        loadOrder: Number.isFinite(row.loadOrder) ? row.loadOrder : 1
      })
    });
  };

  const updateRow = (id: string, patch: Partial<AssignmentRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => (prev.length === sortedRows.length ? [] : sortedRows.map((row) => row.id)));
  };

  const persistReorder = async (before: AssignmentRow[], after: AssignmentRow[], movedCaseId: string) => {
    const beforeMap = new Map(before.map((row) => [row.id, row.loadOrder]));
    const changed = after.filter((row) => beforeMap.get(row.id) !== row.loadOrder);

    if (changed.length === 0) {
      return;
    }

    setSavingId("__reorder__");
    setMessage("");

    const results = await Promise.all(changed.map((row) => patchAssignment(row)));
    if (results.some((res) => !res.ok)) {
      setMessage(`Failed to reorder ${movedCaseId}.`);
      setSavingId(null);
      router.refresh();
      return;
    }

    setMessage(`Reordered ${movedCaseId}.`);
    setSavingId(null);
    router.refresh();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedRows.findIndex((row) => row.id === String(active.id));
    const newIndex = sortedRows.findIndex((row) => row.id === String(over.id));

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const reordered = arrayMove(sortedRows, oldIndex, newIndex).map((row, idx) => ({
      ...row,
      loadOrder: idx + 1
    }));

    const movedCaseId = sortedRows[oldIndex]?.caseId ?? "assignment";
    setRows(reordered);
    void persistReorder(sortedRows, reordered, movedCaseId);
  };

  const saveRow = async (row: AssignmentRow) => {
    setSavingId(row.id);
    setMessage("");

    const res = await patchAssignment(row);
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

  const applyBulkAssignment = async () => {
    if (selectedIds.length === 0) {
      setMessage("Select one or more rows first.");
      return;
    }
    if (!bulkTruckLabel && !bulkZoneLabel) {
      setMessage("Choose truck and/or zone for bulk assignment.");
      return;
    }

    const selectedRows = sortedRows.filter((row) => selectedIds.includes(row.id));
    const nextRows = selectedRows.map((row) => ({
      ...row,
      truckLabel: bulkTruckLabel || row.truckLabel,
      zoneLabel: bulkZoneLabel || row.zoneLabel
    }));

    setRows((prev) =>
      prev.map((row) => {
        const next = nextRows.find((candidate) => candidate.id === row.id);
        return next ?? row;
      })
    );

    setSavingId("__bulk__");
    setMessage("");

    const results = await Promise.all(nextRows.map((row) => patchAssignment(row)));
    if (results.some((res) => !res.ok)) {
      setMessage("Bulk assignment failed for one or more rows.");
      setSavingId(null);
      router.refresh();
      return;
    }

    setMessage(`Applied bulk assignment to ${nextRows.length} case${nextRows.length > 1 ? "s" : ""}.`);
    setSavingId(null);
    setSelectedIds([]);
    router.refresh();
  };

  return (
    <section className="panel" style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Assigned Cases</h2>
      <div className="panel" style={{ padding: 12, marginBottom: 10 }}>
        <p style={{ marginTop: 0, color: "#5d6d63" }}>Bulk shortcut: assign selected rows to a truck/zone in one action.</p>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <select value={bulkTruckLabel} onChange={(e) => setBulkTruckLabel(e.target.value)}>
            <option value="">Leave truck unchanged</option>
            {trucks.map((truck) => (
              <option key={truck} value={truck}>
                {truck}
              </option>
            ))}
          </select>
          <select value={bulkZoneLabel} onChange={(e) => setBulkZoneLabel(e.target.value)}>
            <option value="">Leave zone unchanged</option>
            {zoneOptions
              .filter((zone) => zone)
              .map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
          </select>
          <button className="btn" type="button" onClick={() => void applyBulkAssignment()} disabled={savingId === "__bulk__"}>
            {savingId === "__bulk__" ? "Applying..." : `Apply to Selected (${selectedIds.length})`}
          </button>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: 8 }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                </th>
                <th style={{ padding: 8 }}>Drag</th>
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
            <SortableContext items={sortedRows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {sortedRows.map((row) => (
                  <SortableAssignmentRow
                    key={row.id}
                    row={row}
                    crew={crew}
                    trucks={trucks}
                    isSaving={savingId === row.id || savingId === "__reorder__" || savingId === "__bulk__"}
                    isSelected={selectedIds.includes(row.id)}
                    onUpdateRow={updateRow}
                    onSaveRow={saveRow}
                    onToggleSelected={toggleSelected}
                  />
                ))}
              </tbody>
            </SortableContext>
          </table>
        </DndContext>
      </div>
      {message && <p style={{ marginBottom: 0, color: "#5d6d63" }}>{message}</p>}
    </section>
  );
}
