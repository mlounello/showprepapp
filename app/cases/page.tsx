"use client";

import { useMemo, useState } from "react";
import { StatusPill } from "@/components/status-pill";
import { caseLibrary } from "@/lib/sample-data";
import { Department } from "@/lib/types";

const departments: Department[] = ["Audio", "Lighting", "Video", "Power", "Rigging", "Misc"];

export default function CasesPage() {
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState<string>("All");

  const filtered = useMemo(
    () =>
      caseLibrary.filter((item) => {
        const q = query.toLowerCase();
        const text = `${item.id} ${item.caseType} ${item.defaultContents}`.toLowerCase();
        const matchesSearch = q.length === 0 || text.includes(q);
        const matchesDept = dept === "All" || item.department === dept;
        return matchesSearch && matchesDept;
      }),
    [query, dept]
  );

  return (
    <main className="grid">
      <section className="panel" style={{ padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>Case Library</h1>
        <p style={{ color: "#5d6d63" }}>Permanent source of truth for all production cases.</p>
        <div className="grid" style={{ gridTemplateColumns: "1fr 170px" }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search case ID, type, or contents" />
          <select value={dept} onChange={(e) => setDept(e.target.value)}>
            <option>All</option>
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
      </section>

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
          </article>
        ))}
      </section>
    </main>
  );
}
