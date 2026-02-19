import { ShowsManager } from "@/components/shows-manager";
import { getShowsList, getTruckNames, getTruckProfiles } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ShowsPage() {
  const [shows, trucks, truckProfiles] = await Promise.all([getShowsList(), getTruckNames(), getTruckProfiles()]);

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
        truckProfiles={truckProfiles.map((truck) => ({
          id: truck.id,
          name: truck.name,
          notes: truck.notes,
          lengthIn: truck.lengthIn,
          widthIn: truck.widthIn,
          heightIn: truck.heightIn
        }))}
      />
    </main>
  );
}
