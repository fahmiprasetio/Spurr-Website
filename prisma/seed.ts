import { PrismaClient } from "@prisma/client";
import { brands, cars } from "../src/data/cars";

const prisma = new PrismaClient();

async function main() {
  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { name: brand.name },
      update: {
        country: brand.country,
        founded: brand.founded,
        logo: brand.logo,
      },
      create: {
        name: brand.name,
        country: brand.country,
        founded: brand.founded,
        logo: brand.logo,
      },
    });
  }

  for (const car of cars) {
    const brand = await prisma.brand.upsert({
      where: { name: car.brand },
      update: {},
      create: { name: car.brand },
    });

    await prisma.car.upsert({
      where: { id: car.id },
      update: {
        name: car.name,
        year: car.year,
        power: car.power,
        topSpeed: car.topSpeed,
        acceleration: car.acceleration,
        description: car.description,
        color: car.color,
        bgGradient: car.bgGradient,
        baseImage: car.baseImage ?? null,
        sequenceFolder: car.sequenceFolder ?? null,
        sequenceCount: car.sequenceCount ?? null,
        sequencePrefix: car.sequencePrefix ?? null,
        sequenceExt: car.sequenceExt ?? null,
        brandId: brand.id,
      },
      create: {
        id: car.id,
        name: car.name,
        year: car.year,
        power: car.power,
        topSpeed: car.topSpeed,
        acceleration: car.acceleration,
        description: car.description,
        color: car.color,
        bgGradient: car.bgGradient,
        baseImage: car.baseImage ?? null,
        sequenceFolder: car.sequenceFolder ?? null,
        sequenceCount: car.sequenceCount ?? null,
        sequencePrefix: car.sequencePrefix ?? null,
        sequenceExt: car.sequenceExt ?? null,
        brandId: brand.id,
      },
    });
  }

  console.log(`Seed selesai: ${cars.length} mobil dan ${brands.length} brand.`);
}

main()
  .catch((error) => {
    console.error("Seed gagal:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
