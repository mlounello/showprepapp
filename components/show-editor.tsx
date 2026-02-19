"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function ShowEditor({
  show
}: {
  show: { id: string; name: string; dates: string; venue: string; notes?: string | null };
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: show.name,
    dates: show.dates,
    venue: show.venue,
    notes: show.notes ?? ""
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");

    const res = await fetch(`/api/shows/${show.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const payload = (await res.json()) as { error?: string };

    if (!res.ok) {
      setMessage(payload.error ?? "Failed to update show.");
      setIsSaving(false);
      return;
    }

    setMessage("Show updated.");
    setIsSaving(false);
    router.refresh();
  };

  return (
    <section className="panel" style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Edit Show</h2>
      <form className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }} onSubmit={onSubmit}>
        <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Show Name" required />
        <input value={form.dates} onChange={(e) => setForm((prev) => ({ ...prev, dates: e.target.value }))} placeholder="Dates" required />
        <input value={form.venue} onChange={(e) => setForm((prev) => ({ ...prev, venue: e.target.value }))} placeholder="Venue" required />
        <input value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes" />
        <button className="btn" type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Show"}
        </button>
      </form>
      {message && <p style={{ color: "#5d6d63", marginBottom: 0 }}>{message}</p>}
    </section>
  );
}
