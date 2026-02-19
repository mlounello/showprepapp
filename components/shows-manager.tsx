"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ShowRow = {
  id: string;
  name: string;
  dates: string;
  venue: string;
  notes?: string | null;
  trucks: string[];
};

export function ShowsManager({ shows, availableTrucks }: { shows: ShowRow[]; availableTrucks: string[] }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    dates: "",
    venue: "",
    notes: "",
    trucksText: availableTrucks.join(", ")
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");

    const trucks = form.trucksText
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);

    const res = await fetch("/api/shows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        dates: form.dates,
        venue: form.venue,
        notes: form.notes,
        trucks
      })
    });

    const payload = (await res.json()) as { error?: string };

    if (!res.ok) {
      setMessage(payload.error ?? "Failed to create show.");
      setIsSaving(false);
      return;
    }

    setForm({ name: "", dates: "", venue: "", notes: "", trucksText: availableTrucks.join(", ") });
    setMessage("Show created.");
    setIsSaving(false);
    router.refresh();
  };

  return (
    <>
      <section className="panel" style={{ padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>Show Builder</h1>
        <p style={{ color: "#5d6d63" }}>Create shows, assign trucks and owners, then track progress live.</p>
      </section>

      <section className="panel" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Create Show</h2>
        <form className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }} onSubmit={onSubmit}>
          <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Show Name" required />
          <input value={form.dates} onChange={(e) => setForm((prev) => ({ ...prev, dates: e.target.value }))} placeholder="Dates" required />
          <input value={form.venue} onChange={(e) => setForm((prev) => ({ ...prev, venue: e.target.value }))} placeholder="Venue" required />
          <input value={form.trucksText} onChange={(e) => setForm((prev) => ({ ...prev, trucksText: e.target.value }))} placeholder="Trucks (comma-separated)" />
          <input value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes" />
          <button className="btn" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Create Show"}
          </button>
        </form>
        {message && <p style={{ color: "#5d6d63", marginBottom: 0 }}>{message}</p>}
      </section>

      {shows.map((show) => (
        <Link key={show.id} href={`/shows/${show.id}`} className="panel" style={{ padding: 14 }}>
          <h3 style={{ margin: 0 }}>{show.name}</h3>
          <p style={{ marginBottom: 6, color: "#5d6d63" }}>{show.dates}</p>
          <p style={{ margin: 0, color: "#5d6d63" }}>
            {show.venue} · {show.trucks.join(", ") || "No trucks assigned"}
          </p>
        </Link>
      ))}
    </>
  );
}
