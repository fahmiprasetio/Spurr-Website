import HomeParallax from "@/components/HomeParallax";
import { getCarsFromDb } from "@/lib/cars-db";

export default async function Home() {
  const cars = await getCarsFromDb();

  return <HomeParallax cars={cars} />;
}

