"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { DateRangePill } from "@/components/date-range-pill";
import { formatCaseDimensions } from "@/lib/dimensions";
import { formatDateRange } from "@/lib/show-dates";

type ShowRow = {
  id: string;
  name: string;
  dates: string;
  venue: string;
  notes?: string | null;
  trucks: string[];
};

type TruckProfileRow = {
  id: string;
  name: string;
  notes?: string | null;
  lengthIn?: number | null;
  widthIn?: number | null;
  heightIn?: number | null;
};

export function ShowsManager({
  shows,
  availableTrucks,
  truckProfiles
}: {
  shows: ShowRow[];
  availableTrucks: string[];
  truckProfiles: TruckProfileRow[];
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingTruck, setIsSavingTruck] = useState(false);
  const [savingTruckId, setSavingTruckId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [truckMessage, setTruckMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    venue: "",
    notes: "",
    trucksText: availableTrucks.join(", ")
  });
  const [newTruck, setNewTruck] = useState({
    name: "",
    length: "",
    width: "",
    height: "",
    notes: ""
  });
  const [truckDrafts, setTruckDrafts] = useState<Record<string, { name: string; length: string; width: string; height: string; notes: string }>>(
    () =>
      Object.fromEntries(
        truckProfiles.map((truck) => [
          truck.id,
          {
            name: truck.name,
            length: truck.lengthIn?.toString() ?? "",
            width: truck.widthIn?.toString() ?? "",
            height: truck.heightIn?.toString() ?? "",
            notes: truck.notes ?? ""
          }
        ])
      )
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");

    const trucks = form.trucksText
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);

    const dates = formatDateRange(form.startDate, form.endDate);

    const res = await fetch("/api/shows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        dates,
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

    setForm({ name: "", startDate: "", endDate: "", venue: "", notes: "", trucksText: availableTrucks.join(", ") });
    setMessage("Show created.");
    setIsSaving(false);
    router.refresh();
  };

  const createTruckProfile = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingTruck(true);
    setTruckMessage("");

    const res = await fetch("/api/trucks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTruck)
    });
    const payload = (await res.json()) as { error?: string };

    if (!res.ok) {
      setTruckMessage(payload.error ?? "Failed to create truck profile.");
      setIsSavingTruck(false);
      return;
    }

    setNewTruck({ name: "", length: "", width: "", height: "", notes: "" });
    setTruckMessage("Truck profile created.");
    setIsSavingTruck(false);
    router.refresh();
  };

  const saveTruckProfile = async (truckId: string) => {
    const draft = truckDrafts[truckId];
    if (!draft) {
      return;
    }

    setSavingTruckId(truckId);
    setTruckMessage("");
    const res = await fetch(`/api/trucks/${truckId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft)
    });
    const payload = (await res.json()) as { error?: string };

    if (!res.ok) {
      setTruckMessage(payload.error ?? "Failed to update truck profile.");
      setSavingTruckId(null);
      return;
    }

    setTruckMessage(`Updated ${draft.name}.`);
    setSavingTruckId(null);
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
          <input type="date" value={form.startDate} onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))} required />
          <input type="date" value={form.endDate} onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))} min={form.startDate || undefined} />
          <input value={form.venue} onChange={(e) => setForm((prev) => ({ ...prev, venue: e.target.value }))} placeholder="Venue" required />
          <input value={form.trucksText} onChange={(e) => setForm((prev) => ({ ...prev, trucksText: e.target.value }))} placeholder="Trucks (comma-separated)" />
          <input value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes" />
          <button className="btn" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Create Show"}
          </button>
        </form>
        {message && <p style={{ color: "#5d6d63", marginBottom: 0 }}>{message}</p>}
      </section>

      <section className="panel" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Truck Profiles</h2>
        <p style={{ color: "#5d6d63" }}>Save truck dimensions once. Use inches, feet+inches, or metric (mm/cm/m).</p>
        <form className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }} onSubmit={createTruckProfile}>
          <input value={newTruck.name} onChange={(e) => setNewTruck((prev) => ({ ...prev, name: e.target.value }))} placeholder="Truck Name" required />
          <input value={newTruck.length} onChange={(e) => setNewTruck((prev) => ({ ...prev, length: e.target.value }))} placeholder='Length (24in, 2ft 3in, 610mm)' />
          <input value={newTruck.width} onChange={(e) => setNewTruck((prev) => ({ ...prev, width: e.target.value }))} placeholder='Width (24in, 2ft 3in, 610mm)' />
          <input value={newTruck.height} onChange={(e) => setNewTruck((prev) => ({ ...prev, height: e.target.value }))} placeholder='Height (24in, 2ft 3in, 610mm)' />
          <input value={newTruck.notes} onChange={(e) => setNewTruck((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes (wheel wells, ramp, etc.)" />
          <button className="btn" type="submit" disabled={isSavingTruck}>
            {isSavingTruck ? "Saving..." : "Add Truck Profile"}
          </button>
        </form>

        <div className="grid" style={{ marginTop: 12 }}>
          {truckProfiles.map((truck) => {
            const draft = truckDrafts[truck.id] ?? {
              name: truck.name,
              length: truck.lengthIn?.toString() ?? "",
              width: truck.widthIn?.toString() ?? "",
              height: truck.heightIn?.toString() ?? "",
              notes: truck.notes ?? ""
            };

            return (
              <div key={truck.id} className="panel" style={{ padding: 12 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  <span className="badge">Outside: {formatCaseDimensions(truck.lengthIn, truck.widthIn, truck.heightIn)}</span>
                </div>
                <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                  <input value={draft.name} onChange={(e) => setTruckDrafts((prev) => ({ ...prev, [truck.id]: { ...draft, name: e.target.value } }))} />
                  <input
                    value={draft.length}
                    onChange={(e) => setTruckDrafts((prev) => ({ ...prev, [truck.id]: { ...draft, length: e.target.value } }))}
                    placeholder='Length (24in, 2ft 3in, 610mm)'
                  />
                  <input
                    value={draft.width}
                    onChange={(e) => setTruckDrafts((prev) => ({ ...prev, [truck.id]: { ...draft, width: e.target.value } }))}
                    placeholder='Width (24in, 2ft 3in, 610mm)'
                  />
                  <input
                    value={draft.height}
                    onChange={(e) => setTruckDrafts((prev) => ({ ...prev, [truck.id]: { ...draft, height: e.target.value } }))}
                    placeholder='Height (24in, 2ft 3in, 610mm)'
                  />
                  <input value={draft.notes} onChange={(e) => setTruckDrafts((prev) => ({ ...prev, [truck.id]: { ...draft, notes: e.target.value } }))} placeholder="Notes" />
                  <button className="btn" type="button" onClick={() => void saveTruckProfile(truck.id)} disabled={savingTruckId === truck.id}>
                    {savingTruckId === truck.id ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {truckMessage && <p style={{ color: "#5d6d63", marginBottom: 0 }}>{truckMessage}</p>}
      </section>

      {shows.map((show) => (
        <Link key={show.id} href={`/shows/${show.id}`} className="panel" style={{ padding: 14 }}>
          <h3 style={{ margin: 0 }}>{show.name}</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <DateRangePill dates={show.dates} />
            <span className="badge">Venue: {show.venue}</span>
            <span className="badge">Trucks: {show.trucks.join(", ") || "No trucks assigned"}</span>
          </div>
        </Link>
      ))}
    </>
  );
}
