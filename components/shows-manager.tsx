"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { DateRangePill } from "@/components/date-range-pill";
import { formatCaseDimensions, parseDimensionInput } from "@/lib/dimensions";
import { formatDateRange } from "@/lib/show-dates";
import { normalizeString, validateOptionalText, validateRequiredText } from "@/lib/validation";

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
  const [showErrors, setShowErrors] = useState<Record<string, string>>({});
  const [newTruckErrors, setNewTruckErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    venue: "",
    notes: "",
    selectedTrucks: [] as string[]
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
    setMessage("");
    setShowErrors({});

    const name = normalizeString(form.name);
    const venue = normalizeString(form.venue);
    const notes = normalizeString(form.notes);
    const dateRange = formatDateRange(form.startDate, form.endDate);
    const nextErrors: Record<string, string> = {};
    const nameError = validateRequiredText("Show name", name, 120);
    if (nameError) nextErrors.name = nameError;
    if (!form.startDate) nextErrors.startDate = "Start date is required.";
    if (form.endDate && form.endDate < form.startDate) nextErrors.endDate = "End date cannot be earlier than start date.";
    const venueError = validateRequiredText("Venue", venue, 120);
    if (venueError) nextErrors.venue = venueError;
    const notesError = validateOptionalText("Notes", notes, 500);
    if (notesError) nextErrors.notes = notesError;
    if (form.selectedTrucks.length === 0) nextErrors.selectedTrucks = "Select at least one truck profile.";
    if (Object.keys(nextErrors).length > 0) {
      setShowErrors(nextErrors);
      setMessage("Fix highlighted fields.");
      return;
    }

    setIsSaving(true);

    const dates = dateRange;

    const res = await fetch("/api/shows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        dates,
        venue,
        notes,
        trucks: form.selectedTrucks
      })
    });

    const payload = (await res.json()) as { error?: string };

    if (!res.ok) {
      setMessage(payload.error ?? "Failed to create show.");
      setIsSaving(false);
      return;
    }

    setForm({ name: "", startDate: "", endDate: "", venue: "", notes: "", selectedTrucks: [] });
    setMessage("Show created.");
    setIsSaving(false);
    router.refresh();
  };

  const toggleSelectedTruck = (truckName: string) => {
    setForm((prev) => {
      const exists = prev.selectedTrucks.includes(truckName);
      return {
        ...prev,
        selectedTrucks: exists ? prev.selectedTrucks.filter((name) => name !== truckName) : [...prev.selectedTrucks, truckName]
      };
    });
  };

  const createTruckProfile = async (e: FormEvent) => {
    e.preventDefault();
    setTruckMessage("");
    setNewTruckErrors({});

    const name = normalizeString(newTruck.name);
    const notes = normalizeString(newTruck.notes);
    const dimensionError =
      parseDimensionInput(newTruck.length).error ?? parseDimensionInput(newTruck.width).error ?? parseDimensionInput(newTruck.height).error;
    const nextErrors: Record<string, string> = {};
    const nameError = validateRequiredText("Truck name", name, 80);
    if (nameError) nextErrors.name = nameError;
    const notesError = validateOptionalText("Notes", notes, 300);
    if (notesError) nextErrors.notes = notesError;
    if (dimensionError) nextErrors.dimensions = "Invalid dimension format. Use 24, 24in, 2ft 3in, or 610mm.";
    if (Object.keys(nextErrors).length > 0) {
      setNewTruckErrors(nextErrors);
      setTruckMessage("Fix highlighted fields.");
      return;
    }

    setIsSavingTruck(true);

    const res = await fetch("/api/trucks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newTruck, name, notes })
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

    setTruckMessage("");
    const name = normalizeString(draft.name);
    const notes = normalizeString(draft.notes);
    const dimensionError =
      parseDimensionInput(draft.length).error ?? parseDimensionInput(draft.width).error ?? parseDimensionInput(draft.height).error;
    const truckError =
      validateRequiredText("Truck name", name, 80) ??
      validateOptionalText("Notes", notes, 300) ??
      (dimensionError ? "Invalid dimension format. Use 24, 24in, 2ft 3in, or 610mm." : null);
    if (truckError) {
      setTruckMessage(truckError);
      return;
    }

    setSavingTruckId(truckId);
    const res = await fetch(`/api/trucks/${truckId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, name, notes })
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
          <div>
            <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Show Name" required maxLength={120} />
            {showErrors.name && <p className="field-error">{showErrors.name}</p>}
          </div>
          <div>
            <input type="date" value={form.startDate} onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))} required />
            {showErrors.startDate && <p className="field-error">{showErrors.startDate}</p>}
          </div>
          <div>
            <input type="date" value={form.endDate} onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))} min={form.startDate || undefined} />
            {showErrors.endDate && <p className="field-error">{showErrors.endDate}</p>}
          </div>
          <div>
            <input value={form.venue} onChange={(e) => setForm((prev) => ({ ...prev, venue: e.target.value }))} placeholder="Venue" required maxLength={120} />
            {showErrors.venue && <p className="field-error">{showErrors.venue}</p>}
          </div>
          <div>
            <input value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes" maxLength={500} />
            {showErrors.notes && <p className="field-error">{showErrors.notes}</p>}
          </div>
          <button className="btn" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Create Show"}
          </button>
        </form>
        <div className="panel" style={{ padding: 10, marginTop: 10 }}>
          <p style={{ marginTop: 0, color: "#5d6d63" }}>Trucks (multi-select)</p>
          {availableTrucks.length === 0 && <p style={{ marginBottom: 0, color: "#5d6d63" }}>No saved truck profiles yet. Add one below first.</p>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <button className="badge" type="button" onClick={() => setForm((prev) => ({ ...prev, selectedTrucks: [...availableTrucks] }))} style={{ cursor: "pointer" }}>
              Select All
            </button>
            <button className="badge" type="button" onClick={() => setForm((prev) => ({ ...prev, selectedTrucks: [] }))} style={{ cursor: "pointer" }}>
              Clear All
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {availableTrucks.map((truck) => {
              const selected = form.selectedTrucks.includes(truck);
              return (
                <button
                  key={truck}
                  type="button"
                  className="badge"
                  onClick={() => toggleSelectedTruck(truck)}
                  style={{
                    cursor: "pointer",
                    borderColor: selected ? "#0f766e" : undefined,
                    color: selected ? "#0f766e" : undefined,
                    background: selected ? "#ecfdf5" : undefined
                  }}
                >
                  {selected ? "Selected: " : ""}
                  {truck}
                </button>
              );
            })}
          </div>
        </div>
        <p style={{ marginBottom: 0, color: "#5d6d63" }}>Selected: {form.selectedTrucks.join(", ") || "None"}</p>
        {showErrors.selectedTrucks && <p className="field-error">{showErrors.selectedTrucks}</p>}
        {message && <p style={{ color: "#5d6d63", marginBottom: 0 }}>{message}</p>}
      </section>

      <section className="panel" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Truck Profiles</h2>
        <p style={{ color: "#5d6d63" }}>Save truck dimensions once. Use inches, feet+inches, or metric (mm/cm/m).</p>
        <form className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }} onSubmit={createTruckProfile}>
          <div>
            <input value={newTruck.name} onChange={(e) => setNewTruck((prev) => ({ ...prev, name: e.target.value }))} placeholder="Truck Name" required maxLength={80} />
            {newTruckErrors.name && <p className="field-error">{newTruckErrors.name}</p>}
          </div>
          <input value={newTruck.length} onChange={(e) => setNewTruck((prev) => ({ ...prev, length: e.target.value }))} placeholder='Length (24in, 2ft 3in, 610mm)' />
          <input value={newTruck.width} onChange={(e) => setNewTruck((prev) => ({ ...prev, width: e.target.value }))} placeholder='Width (24in, 2ft 3in, 610mm)' />
          <input value={newTruck.height} onChange={(e) => setNewTruck((prev) => ({ ...prev, height: e.target.value }))} placeholder='Height (24in, 2ft 3in, 610mm)' />
          <div>
            <input value={newTruck.notes} onChange={(e) => setNewTruck((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes (wheel wells, ramp, etc.)" maxLength={300} />
            {newTruckErrors.notes && <p className="field-error">{newTruckErrors.notes}</p>}
            {newTruckErrors.dimensions && <p className="field-error">{newTruckErrors.dimensions}</p>}
          </div>
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
                  <input value={draft.name} onChange={(e) => setTruckDrafts((prev) => ({ ...prev, [truck.id]: { ...draft, name: e.target.value } }))} maxLength={80} />
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
                  <input value={draft.notes} onChange={(e) => setTruckDrafts((prev) => ({ ...prev, [truck.id]: { ...draft, notes: e.target.value } }))} placeholder="Notes" maxLength={300} />
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
