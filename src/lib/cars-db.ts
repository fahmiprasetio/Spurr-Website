import { prisma } from "@/lib/prisma";
import type { Car } from "@/data/cars";
import { cars as fallbackCars } from "@/data/cars";

const DB_RETRY_DELAY_MS = 60_000;
const CARS_CACHE_TTL_MS = 15_000;
let skipDbUntil = 0;
let carsCache: { data: Car[]; expiresAt: number } | null = null;

function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown database error";
  }
}

export async function getCarsFromDb(): Promise<Car[]> {
  if (carsCache && Date.now() < carsCache.expiresAt) {
    return carsCache.data;
  }

  if (Date.now() < skipDbUntil) {
    carsCache = {
      data: fallbackCars,
      expiresAt: Date.now() + CARS_CACHE_TTL_MS,
    };
    return fallbackCars;
  }

  try {
    const rows = await prisma.car.findMany({
      include: { brand: true },
      orderBy: { name: "asc" },
    });

    if (rows.length === 0) {
      carsCache = {
        data: fallbackCars,
        expiresAt: Date.now() + CARS_CACHE_TTL_MS,
      };
      return fallbackCars;
    }

    const mappedCars = rows.map((row) => ({
      id: row.id,
      name: row.name,
      brand: row.brand.name,
      year: row.year,
      power: row.power,
      topSpeed: row.topSpeed,
      acceleration: row.acceleration,
      description: row.description,
      color: row.color,
      bgGradient: row.bgGradient,
      baseImage: row.baseImage ?? undefined,
      sequenceFolder: row.sequenceFolder ?? undefined,
      sequenceCount: row.sequenceCount ?? undefined,
      sequencePrefix: row.sequencePrefix ?? undefined,
      sequenceExt: row.sequenceExt ?? undefined,
    }));

    carsCache = {
      data: mappedCars,
      expiresAt: Date.now() + CARS_CACHE_TTL_MS,
    };

    return mappedCars;
  } catch (error) {
    const errorMessage = getSafeErrorMessage(error);
    const isConnectionIssue = /Can't reach database server|ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i.test(
      errorMessage
    );

    if (isConnectionIssue) {
      skipDbUntil = Date.now() + DB_RETRY_DELAY_MS;
      console.warn(
        `[cars-db] Database tidak bisa dijangkau. Menggunakan fallback data lokal selama ${
          DB_RETRY_DELAY_MS / 1000
        } detik. Detail: ${errorMessage}`
      );
      carsCache = {
        data: fallbackCars,
        expiresAt: Date.now() + CARS_CACHE_TTL_MS,
      };
      return fallbackCars;
    }

    console.warn(
      `[cars-db] Gagal membaca data mobil dari DB. Menggunakan fallback lokal. Detail: ${errorMessage}`
    );
    carsCache = {
      data: fallbackCars,
      expiresAt: Date.now() + CARS_CACHE_TTL_MS,
    };
    return fallbackCars;
  }
}
