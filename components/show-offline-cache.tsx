"use client";

import { useEffect } from "react";
import { OFFLINE_ACTIVE_SHOW_KEY, OFFLINE_SHOWS_KEY, readJson, writeJson } from "@/lib/offline-lite";

type CachedShow = {
  id: string;
  name: string;
  dates: string;
  venue: string;
  trucks: string[];
  updatedAt: string;
  cases: Array<{
    caseId: string;
    owner: string;
    truck: string;
    zone: string;
    status: string;
    location: string;
  }>;
};

export function ShowOfflineCache({ show }: { show: CachedShow }) {
  useEffect(() => {
    const existing = readJson<Record<string, CachedShow>>(OFFLINE_SHOWS_KEY, {});
    existing[show.id] = show;
    writeJson(OFFLINE_SHOWS_KEY, existing);
    writeJson(OFFLINE_ACTIVE_SHOW_KEY, { id: show.id, name: show.name, updatedAt: show.updatedAt });
  }, [show]);

  return null;
}
