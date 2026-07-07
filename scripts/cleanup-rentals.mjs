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

async function main() {
  const stale = await prisma.rental.findMany({
    where: {
      status: "PENDING",
      OR: [{ payment: { is: null } }, { payment: { status: { not: "PAID" } } }],
    },
    select: { id: true },
  });
  const ids = stale.map((r) => r.id);
  if (ids.length) {
    await prisma.rental.updateMany({
      where: { id: { in: ids } },
      data: { status: "CANCELLED" },
    });
  }

  const bookedCars = await prisma.car.findMany({
    where: { status: "BOOKED" },
    select: { id: true },
  });
  let freed = 0;
  for (const car of bookedCars) {
    const active = await prisma.rental.findFirst({
      where: { carId: car.id, status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] } },
      select: { id: true },
    });
    if (!active) {
      await prisma.car.update({ where: { id: car.id }, data: { status: "AVAILABLE" } });
      freed += 1;
    }
  }

  console.log("Cancelled stale PENDING rentals:", ids.length);
  console.log("Cars freed to AVAILABLE:", freed);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });