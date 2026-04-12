import CollectionPageClient from "@/components/CollectionPageClient";
import { getCarsFromDb } from "@/lib/cars-db";

export const revalidate = 60;

export default async function CollectionPage() {
  const cars = await getCarsFromDb();

  return <CollectionPageClient cars={cars} />;
}
