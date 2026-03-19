"use client";

import { useState } from "react";

type SyncResponse = {
  ok: boolean;
  status?: number;
  userCount: number;
  schema?: string;
  error?: string;
};

export function AdminUserSyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState("");

  const onSync = async () => {
    setIsSyncing(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/user-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const payload = (await response.json()) as SyncResponse;
      if (!response.ok || !payload.ok) {
        setMessage(payload.error || "User sync failed.");
        setIsSyncing(false);
        return;
      }

      setMessage(`Synced ${payload.userCount} user${payload.userCount === 1 ? "" : "s"} to control room.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "User sync failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <section className="panel" style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Control Room Sync</h2>
      <p style={{ color: "#5d6d63" }}>Push the current crew roster to the central control room without exposing the sync secret to the browser.</p>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn" type="button" onClick={() => void onSync()} disabled={isSyncing}>
          {isSyncing ? "Syncing..." : "Sync Users Now"}
        </button>
        {message && <span style={{ color: "#5d6d63" }}>{message}</span>}
      </div>
    </section>
  );
}
