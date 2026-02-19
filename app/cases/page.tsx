import { CasesLibrary } from "@/components/cases-library";
import { getCases } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const rows = await getCases();

  return (
    <main className="grid">
      <CasesLibrary rows={rows} />
    </main>
  );
}
