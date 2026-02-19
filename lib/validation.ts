import { parseDateRange } from "@/lib/show-dates";

export const DEPARTMENTS = ["Audio", "Lighting", "Video", "Power", "Rigging", "Misc"] as const;

export function normalizeString(value?: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateCaseId(value: string) {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{1,31}$/.test(value)) {
    return "Case ID must be 2-32 chars and use letters, numbers, '-' or '_'.";
  }
  return null;
}

export function validateDepartment(value: string) {
  if (!(DEPARTMENTS as readonly string[]).includes(value)) {
    return "Invalid department.";
  }
  return null;
}

export function validateRequiredText(label: string, value: string, maxLength: number) {
  if (!value) {
    return `${label} is required.`;
  }
  if (value.length > maxLength) {
    return `${label} must be ${maxLength} characters or fewer.`;
  }
  return null;
}

export function validateOptionalText(label: string, value: string, maxLength: number) {
  if (!value) {
    return null;
  }
  if (value.length > maxLength) {
    return `${label} must be ${maxLength} characters or fewer.`;
  }
  return null;
}

function parseIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export function validateDateRangeString(raw: string) {
  const { startDate, endDate } = parseDateRange(raw);
  if (!startDate) {
    return "Dates must use YYYY-MM-DD or YYYY-MM-DD to YYYY-MM-DD.";
  }

  const start = parseIsoDate(startDate);
  if (!start) {
    return "Start date is invalid.";
  }

  if (endDate) {
    const end = parseIsoDate(endDate);
    if (!end) {
      return "End date is invalid.";
    }
    if (end.getTime() < start.getTime()) {
      return "End date cannot be earlier than start date.";
    }
  }

  return null;
}

export function uniqueTrimmed(values?: string[]) {
  const out: string[] = [];
  for (const value of values ?? []) {
    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }
    if (!out.includes(trimmed)) {
      out.push(trimmed);
    }
  }
  return out;
}
