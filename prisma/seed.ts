import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";
import { brands, cars } from "../src/data/cars";

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to run seed script against a production environment.");
}

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function randomSeedPassword(): string {
  return randomBytes(24).toString("base64url");
}

const seedReviews = [
  {
    sourceKey: "seed-review-raka-gt3rs",
    userName: "Raka Pratama",
    email: "raka.pratama@spurr.demo",
    carId: "porsche-911",
    content:
      "The service was neat and professional. From booking to handover, everything was on time and clearly handled.",
  },
  {
    sourceKey: "seed-review-nadine-chiron",
    userName: "Nadine Valencia",
    email: "nadine.valencia@spurr.demo",
    carId: "bugatti-chiron",
    content:
      "I booked this for a brand event in South Jakarta. The car arrived spotless and in perfect condition, and the team was very responsive.",
  },
  {
    sourceKey: "seed-review-fajar-jesko",
    userName: "Fajar Mahendra",
    email: "fajar.mahendra@spurr.demo",
    carId: "koenigsegg-jesko",
    content:
      "My first exotic car rental and the process felt simple. The briefing was detailed, so I felt confident throughout the drive.",
  },
  {
    sourceKey: "seed-review-keisha-huayra",
    userName: "Keisha Adeline",
    email: "keisha.adeline@spurr.demo",
    carId: "pagani-huayra",
    content:
      "A premium experience from start to finish. Perfect for special occasions, with fast and helpful support from the admin team.",
  },
] as const;

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

  for (const review of seedReviews) {
    const targetCar = await prisma.car.findUnique({
      where: { id: review.carId },
      select: { id: true },
    });

    if (!targetCar) {
      continue;
    }

    const user = await prisma.user.upsert({
      where: { email: review.email },
      update: {
        name: review.userName,
      },
      create: {
        name: review.userName,
        email: review.email,
        passwordHash: hashPassword(randomSeedPassword()),
      },
      select: { id: true },
    });

    await prisma.carReview.upsert({
      where: { sourceKey: review.sourceKey },
      update: {
        content: review.content,
        carId: review.carId,
        userId: user.id,
      },
      create: {
        sourceKey: review.sourceKey,
        content: review.content,
        carId: review.carId,
        userId: user.id,
      },
    });
  }

  console.log(
    `Seed complete: ${cars.length} cars, ${brands.length} brands, ${seedReviews.length} reviews.`
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
