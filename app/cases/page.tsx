import { CasesLibrary } from "@/components/cases-library";
import { getCases } from "@/lib/data";

export default async function CasesPage() {
  const rows = await getCases();

  return (
    <main className="grid">
      <CasesLibrary rows={rows} />
    </main>
  );
}
