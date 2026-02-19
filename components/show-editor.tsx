"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateRange, parseDateRange } from "@/lib/show-dates";
import { normalizeString, validateOptionalText, validateRequiredText } from "@/lib/validation";

export function ShowEditor({
  show
}: {
  show: { id: string; name: string; dates: string; venue: string; notes?: string | null };
}) {
  const router = useRouter();
  const initialDates = useMemo(() => parseDateRange(show.dates), [show.dates]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: show.name,
    startDate: initialDates.startDate,
    endDate: initialDates.endDate,
    venue: show.venue,
    notes: show.notes ?? ""
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setFieldErrors({});

    const name = normalizeString(form.name);
    const venue = normalizeString(form.venue);
    const notes = normalizeString(form.notes);
    const dates = formatDateRange(form.startDate, form.endDate, show.dates);
    const nextErrors: Record<string, string> = {};
    const nameError = validateRequiredText("Show name", name, 120);
    if (nameError) nextErrors.name = nameError;
    if (!form.startDate) nextErrors.startDate = "Start date is required.";
    if (form.endDate && form.endDate < form.startDate) nextErrors.endDate = "End date cannot be earlier than start date.";
    const venueError = validateRequiredText("Venue", venue, 120);
    if (venueError) nextErrors.venue = venueError;
    const notesError = validateOptionalText("Notes", notes, 500);
    if (notesError) nextErrors.notes = notesError;
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setMessage("Fix highlighted fields.");
      return;
    }

    setIsSaving(true);

    const res = await fetch(`/api/shows/${show.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        dates,
        venue,
        notes
      })
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
        <div>
          <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Show Name" required maxLength={120} />
          {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
        </div>
        <div>
          <input type="date" value={form.startDate} onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))} required />
          {fieldErrors.startDate && <p className="field-error">{fieldErrors.startDate}</p>}
        </div>
        <div>
          <input type="date" value={form.endDate} onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))} min={form.startDate || undefined} />
          {fieldErrors.endDate && <p className="field-error">{fieldErrors.endDate}</p>}
        </div>
        <div>
          <input value={form.venue} onChange={(e) => setForm((prev) => ({ ...prev, venue: e.target.value }))} placeholder="Venue" required maxLength={120} />
          {fieldErrors.venue && <p className="field-error">{fieldErrors.venue}</p>}
        </div>
        <div>
          <input value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes" maxLength={500} />
          {fieldErrors.notes && <p className="field-error">{fieldErrors.notes}</p>}
        </div>
        <button className="btn" type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Show"}
        </button>
      </form>
      {message && <p style={{ color: "#5d6d63", marginBottom: 0 }}>{message}</p>}
    </section>
  );
}
