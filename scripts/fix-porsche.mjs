import { readFileSync } from "node:fs";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

for (const file of [".env.local", ".env"]) {
  try {
    const content = readFileSync(file, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {}
}

const prisma = new PrismaClient();
const CAR_ID = "porsche-911";

async function main() {
  const car = await prisma.car.findUnique({ where: { id: CAR_ID } });
  if (!car) {
    console.log(`Car '${CAR_ID}' TIDAK ditemukan. Daftar semua mobil:`);
    const cars = await prisma.car.findMany({ select: { id: true, name: true, status: true } });
    for (const c of cars) console.log(`  id=${c.id} | ${c.name} | ${c.status}`);
    return;
  }

  console.log(`MOBIL: ${car.name} | status sekarang: ${car.status}`);
  console.log("--- Semua booking untuk mobil ini ---");
  const rentals = await prisma.rental.findMany({
    where: { carId: CAR_ID },
    include: { payment: { select: { status: true } } },
    orderBy: { createdAt: "desc" },
  });
  if (rentals.length === 0) {
    console.log("  (tidak ada booking)");
  } else {
    for (const r of rentals) {
      const s = r.startDate.toISOString().slice(0, 10);
      const e = r.endDate.toISOString().slice(0, 10);
      console.log(`  ${r.status.padEnd(10)} | ${s} -> ${e} | payment: ${r.payment?.status ?? "none"}`);
    }
  }

  const cancelled = await prisma.rental.updateMany({
    where: { carId: CAR_ID, status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] } },
    data: { status: "CANCELLED" },
  });

  await prisma.car.update({ where: { id: CAR_ID }, data: { status: "AVAILABLE" } });

  console.log("");
  console.log(`>> Booking aktif yang dibatalin di mobil ini: ${cancelled.count}`);
  console.log(`>> Mobil '${CAR_ID}' sekarang di-set: AVAILABLE`);
  console.log(">> Coba refresh halaman & booking lagi.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });