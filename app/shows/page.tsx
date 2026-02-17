import Link from "next/link";
import { shows } from "@/lib/sample-data";

export default function ShowsPage() {
  return (
    <main className="grid">
      <section className="panel" style={{ padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>Show Builder</h1>
        <p style={{ color: "#5d6d63" }}>Create shows, assign trucks and owners, then track progress live.</p>
      </section>
      {shows.map((show) => (
        <Link key={show.id} href={`/shows/${show.id}`} className="panel" style={{ padding: 14 }}>
          <h3 style={{ margin: 0 }}>{show.name}</h3>
          <p style={{ marginBottom: 6, color: "#5d6d63" }}>{show.dates}</p>
          <p style={{ margin: 0, color: "#5d6d63" }}>
            {show.venue} · {show.trucks.join(", ")}
          </p>
        </Link>
      ))}
    </main>
  );
}
