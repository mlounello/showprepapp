"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusPill } from "@/components/status-pill";
import { uiStatuses } from "@/lib/status";

type CaseRow = {
  id: string;
  department: string;
  caseType: string;
  defaultContents: string;
  status: Parameters<typeof StatusPill>[0]["status"];
  location: string;
  owner?: string | null;
  notes?: string | null;
};

type EditorState = {
  id: string;
  department: string;
  caseType: string;
  defaultContents: string;
  owner: string;
  location: string;
  status: Parameters<typeof StatusPill>[0]["status"];
  notes: string;
};

const DEPARTMENTS = ["Audio", "Lighting", "Video", "Power", "Rigging", "Misc"];

export function CasesLibrary({ rows }: { rows: CaseRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("All");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);

  const [newCase, setNewCase] = useState({
    id: "",
    department: "Audio",
    caseType: "",
    defaultContents: "",
    owner: "",
    location: "Shop"
  });

  const departments = useMemo(() => ["All", ...new Set(rows.map((item) => item.department))], [rows]);

  const filtered = useMemo(() => {
    return rows.filter((item) => {
      const q = query.toLowerCase().trim();
      const text = `${item.id} ${item.caseType} ${item.defaultContents}`.toLowerCase();
      const matchesSearch = !q || text.includes(q);
      const matchesDept = dept === "All" || item.department === dept;
      return matchesSearch && matchesDept;
    });
  }, [rows, query, dept]);

  const startEdit = (item: CaseRow) => {
    setEditingId(item.id);
    setEditor({
      id: item.id,
      department: item.department,
      caseType: item.caseType,
      defaultContents: item.defaultContents,
      owner: item.owner ?? "",
      location: item.location,
      status: item.status,
      notes: item.notes ?? ""
    });
    setMessage("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditor(null);
  };

  const submitCreate = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");

    const res = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCase)
    });

    const payload = (await res.json()) as { error?: string };

    if (!res.ok) {
      setMessage(payload.error ?? "Failed to create case.");
      setIsSaving(false);
      return;
    }

    setNewCase({ id: "", department: "Audio", caseType: "", defaultContents: "", owner: "", location: "Shop" });
    setMessage("Case created.");
    setIsSaving(false);
    router.refresh();
  };

  const submitEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editor) {
      return;
    }

    setIsSaving(true);
    setMessage("");

    const res = await fetch(`/api/cases/${editor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editor)
    });

    const payload = (await res.json()) as { error?: string };

    if (!res.ok) {
      setMessage(payload.error ?? "Failed to update case.");
      setIsSaving(false);
      return;
    }

    setMessage(`Case ${editor.id} updated.`);
    setIsSaving(false);
    cancelEdit();
    router.refresh();
  };

  return (
    <>
      <section className="panel" style={{ padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>Case Library</h1>
        <p style={{ color: "#5d6d63" }}>Permanent source of truth for all production cases.</p>
        <div className="grid" style={{ gridTemplateColumns: "1fr 170px" }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search case ID, type, or contents" />
          <select value={dept} onChange={(e) => setDept(e.target.value)}>
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Add Case</h2>
        <form className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }} onSubmit={submitCreate}>
          <input value={newCase.id} onChange={(e) => setNewCase((prev) => ({ ...prev, id: e.target.value }))} placeholder="Case ID (AUD-003)" required />
          <select value={newCase.department} onChange={(e) => setNewCase((prev) => ({ ...prev, department: e.target.value }))}>
            {DEPARTMENTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <input value={newCase.caseType} onChange={(e) => setNewCase((prev) => ({ ...prev, caseType: e.target.value }))} placeholder="Case Type" required />
          <input
            value={newCase.defaultContents}
            onChange={(e) => setNewCase((prev) => ({ ...prev, defaultContents: e.target.value }))}
            placeholder="Default Contents"
            required
          />
          <input value={newCase.owner} onChange={(e) => setNewCase((prev) => ({ ...prev, owner: e.target.value }))} placeholder="Owner (optional)" />
          <input value={newCase.location} onChange={(e) => setNewCase((prev) => ({ ...prev, location: e.target.value }))} placeholder="Location" />
          <button className="btn" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Create Case"}
          </button>
        </form>
        {message && <p style={{ color: "#5d6d63", marginBottom: 0 }}>{message}</p>}
      </section>

      {editingId && editor && (
        <section className="panel" style={{ padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Edit Case {editingId}</h2>
          <form className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }} onSubmit={submitEdit}>
            <select value={editor.department} onChange={(e) => setEditor((prev) => (prev ? { ...prev, department: e.target.value } : prev))}>
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <input value={editor.caseType} onChange={(e) => setEditor((prev) => (prev ? { ...prev, caseType: e.target.value } : prev))} required />
            <input
              value={editor.defaultContents}
              onChange={(e) => setEditor((prev) => (prev ? { ...prev, defaultContents: e.target.value } : prev))}
              required
            />
            <input value={editor.owner} onChange={(e) => setEditor((prev) => (prev ? { ...prev, owner: e.target.value } : prev))} placeholder="Owner" />
            <input value={editor.location} onChange={(e) => setEditor((prev) => (prev ? { ...prev, location: e.target.value } : prev))} placeholder="Location" />
            <select value={editor.status} onChange={(e) => setEditor((prev) => (prev ? { ...prev, status: e.target.value as EditorState["status"] } : prev))}>
              {uiStatuses.map((entry) => (
                <option key={entry}>{entry}</option>
              ))}
            </select>
            <input value={editor.notes} onChange={(e) => setEditor((prev) => (prev ? { ...prev, notes: e.target.value } : prev))} placeholder="Notes" />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button className="btn" type="button" onClick={cancelEdit} style={{ background: "#64748b" }}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="grid">
        {filtered.map((item) => (
          <article key={item.id} className="panel" style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <strong>{item.id}</strong>
              <StatusPill status={item.status} />
            </div>
            <p style={{ marginTop: 8, marginBottom: 6 }}>
              {item.department} · {item.caseType}
            </p>
            <p style={{ margin: 0, color: "#5d6d63" }}>Owner: {item.owner ?? "Unassigned"}</p>
            <p style={{ margin: "6px 0 0", color: "#5d6d63" }}>Location: {item.location}</p>
            <p style={{ margin: "6px 0 0", color: "#5d6d63" }}>Contents: {item.defaultContents}</p>
            <button className="btn" type="button" style={{ marginTop: 10 }} onClick={() => startEdit(item)}>
              Edit
            </button>
          </article>
        ))}
      </section>
    </>
  );
}
