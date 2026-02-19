"use client";

import { useMemo, useState } from "react";

type LinkRow = {
  id: string;
  token: string;
  createdAt: string;
};

export function ShowShareLink({ showId, initialLinks }: { showId: string; initialLinks: LinkRow[] }) {
  const [links, setLinks] = useState(initialLinks);
  const [message, setMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const baseUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "";
  }, []);

  const createLink = async () => {
    setIsCreating(true);
    setMessage("");

    const res = await fetch(`/api/shows/${showId}/share`, { method: "POST" });
    const payload = (await res.json()) as { error?: string; token?: string; createdAt?: string };

    if (!res.ok || !payload.token || !payload.createdAt) {
      setMessage(payload.error ?? "Failed to create share link.");
      setIsCreating(false);
      return;
    }

    const token = payload.token;
    const createdAt = payload.createdAt;

    setLinks((prev) => {
      const exists = prev.find((item) => item.token === token);
      if (exists) {
        return prev;
      }
      return [{ id: token, token, createdAt }, ...prev];
    });

    setMessage("Share link ready.");
    setIsCreating(false);
  };

  const copyLink = async (token: string) => {
    const link = `${baseUrl}/shared/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      setMessage("Copied share link.");
    } catch {
      setMessage(link);
    }
  };

  return (
    <section className="panel" style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Read-only Share Link</h2>
      <p style={{ color: "#5d6d63" }}>Share this with crew/teachers for view-only status and load plan.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn" type="button" onClick={() => void createLink()} disabled={isCreating}>
          {isCreating ? "Creating..." : "Create / Reuse Link"}
        </button>
      </div>

      {links.length > 0 && (
        <div className="grid" style={{ marginTop: 12 }}>
          {links.map((link) => (
            <div key={link.token} className="panel" style={{ padding: 10 }}>
              <p style={{ margin: 0, wordBreak: "break-all", color: "#5d6d63" }}>{`${baseUrl}/shared/${link.token}`}</p>
              <div style={{ marginTop: 8 }}>
                <span className="badge">Created: {new Date(link.createdAt).toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                <button className="btn" type="button" onClick={() => void copyLink(link.token)}>
                  Copy
                </button>
                <a className="badge" href={`${baseUrl}/shared/${link.token}`} target="_blank" rel="noreferrer">
                  Open
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {message && <p style={{ marginBottom: 0, color: "#5d6d63" }}>{message}</p>}
    </section>
  );
}
