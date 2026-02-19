import { NextResponse } from "next/server";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const headers = ["id", "department", "caseType", "length", "width", "height", "defaultContents", "owner", "location", "status", "notes"];
  const rows = [
    {
      id: "AUD-001",
      department: "Audio",
      caseType: "Console Rack",
      length: "40in",
      width: "30in",
      height: "28in",
      defaultContents: "X32, rack power, cat5 spool",
      owner: "Audio Lead",
      location: "Shop",
      status: "In Shop",
      notes: "Stays built"
    }
  ];

  const csv = toCsv(rows, headers);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="cases-template.csv"'
    }
  });
}
