"use client";

import { useEffect, useState } from "react";
import { getQueuedScans, OFFLINE_EVENT } from "@/lib/offline-lite";

export function OfflineStatusBadge() {
  const [isOnline, setIsOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
      setQueueCount(getQueuedScans().length);
    };

    refresh();

    const onOnline = () => refresh();
    const onOffline = () => refresh();
    const onOfflineEvent = () => refresh();

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener(OFFLINE_EVENT, onOfflineEvent);

    const interval = window.setInterval(refresh, 2000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener(OFFLINE_EVENT, onOfflineEvent);
      window.clearInterval(interval);
    };
  }, []);

  const label = `${isOnline ? "Online" : "Offline"} · Queue ${queueCount}`;
  const color = isOnline ? (queueCount > 0 ? "#b45309" : "#166534") : "#b91c1c";

  return (
    <span className="badge" style={{ borderColor: color, color }}>
      {label}
    </span>
  );
}
