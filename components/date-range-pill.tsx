import { formatDateRangeLabel } from "@/lib/show-dates";

export function DateRangePill({ dates }: { dates: string }) {
  return <span className="badge">Dates: {formatDateRangeLabel(dates)}</span>;
}
