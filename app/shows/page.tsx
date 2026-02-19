import { ShowsManager } from "@/components/shows-manager";
import { getShowsList, getTruckNames } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ShowsPage() {
  const [shows, trucks] = await Promise.all([getShowsList(), getTruckNames()]);

  return (
    <main className="grid">
      <ShowsManager
        shows={shows.map((show) => ({
          id: show.id,
          name: show.name,
          dates: show.dates,
          venue: show.venue,
          notes: show.notes,
          trucks: show.showTrucks.map((truck) => truck.truck.name)
        }))}
        availableTrucks={trucks}
      />
    </main>
  );
}
