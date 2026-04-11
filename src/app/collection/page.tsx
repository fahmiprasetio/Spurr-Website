import CollectionPageClient from "@/components/CollectionPageClient";
import { getCarsFromDb } from "@/lib/cars-db";

export default async function CollectionPage() {
  const cars = await getCarsFromDb();

  return <CollectionPageClient cars={cars} />;
}
