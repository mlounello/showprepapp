import { getCrewAssignments } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CrewPage() {
  const crew = await getCrewAssignments();

  return (
    <main className="grid" style={{ gap: 16 }}>
      <section className="panel" style={{ padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>Crew Assignments</h1>
        <p style={{ color: "#5d6d63" }}>No-login workflow for role and case ownership.</p>
      </section>

      <section className="panel" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Crew Members</h2>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
          {crew.map((person) => (
            <div key={person.id} className="panel" style={{ padding: 12 }}>
              {person.name}
            </div>
          ))}
        </div>
      </section>

      <section className="panel" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>My Cases (by owner)</h2>
        {crew.map((person) => {
          const assigned = person.assignments.map((row) => row.case.id);
          return (
            <article key={person.id} style={{ marginBottom: 12 }}>
              <strong>{person.name}</strong>
              <p style={{ marginTop: 4, color: "#5d6d63" }}>{assigned.join(", ") || "No assigned cases"}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
