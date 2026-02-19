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

export function parseDateRange(raw: string) {
  const trimmed = raw.trim();
  const rangeMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})$/);
  if (rangeMatch) {
    return { startDate: rangeMatch[1], endDate: rangeMatch[2] };
  }

  const singleMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (singleMatch) {
    return { startDate: singleMatch[1], endDate: "" };
  }

  return { startDate: "", endDate: "" };
}

export function formatDateRange(startDate: string, endDate: string, fallback = "") {
  if (startDate && endDate) {
    return `${startDate} to ${endDate}`;
  }
  if (startDate) {
    return startDate;
  }
  return fallback;
}

export function formatDateRangeLabel(raw: string) {
  const { startDate, endDate } = parseDateRange(raw);
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (!start) {
    return raw;
  }

  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (!end) {
    return fmt.format(start);
  }
  return `${fmt.format(start)} - ${fmt.format(end)}`;
}
