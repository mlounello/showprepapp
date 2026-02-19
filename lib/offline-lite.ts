export const OFFLINE_SHOWS_KEY = "showprep.offline.shows";
export const OFFLINE_ACTIVE_SHOW_KEY = "showprep.offline.activeShow";
export const OFFLINE_CASES_KEY = "showprep.offline.cases";
export const OFFLINE_SCAN_QUEUE_KEY = "showprep.offline.scanQueue";
export const OFFLINE_EVENT = "showprep-offline-updated";

export type QueuedScan = {
  id: string;
  createdAt: string;
  payload: Record<string, unknown>;
};

function hasWindow() {
  return typeof window !== "undefined";
}

function emitOfflineEvent() {
  if (!hasWindow()) {
    return;
  }
  window.dispatchEvent(new Event(OFFLINE_EVENT));
}

export function readJson<T>(key: string, fallback: T): T {
  if (!hasWindow()) {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T) {
  if (!hasWindow()) {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    emitOfflineEvent();
  } catch {
    // Ignore storage failures.
  }
}

export function queueScan(payload: Record<string, unknown>) {
  const queue = readJson<QueuedScan[]>(OFFLINE_SCAN_QUEUE_KEY, []);
  const next: QueuedScan = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    payload
  };
  queue.push(next);
  writeJson(OFFLINE_SCAN_QUEUE_KEY, queue);
  return next;
}

export function getQueuedScans() {
  return readJson<QueuedScan[]>(OFFLINE_SCAN_QUEUE_KEY, []);
}

export function removeQueuedScan(id: string) {
  const queue = readJson<QueuedScan[]>(OFFLINE_SCAN_QUEUE_KEY, []);
  writeJson(
    OFFLINE_SCAN_QUEUE_KEY,
    queue.filter((item) => item.id !== id)
  );
}
