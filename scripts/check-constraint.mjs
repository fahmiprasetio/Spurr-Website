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
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {}
}
const prisma = new PrismaClient();
async function main() {
  const rows = await prisma.$queryRawUnsafe(
    "SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conname ILIKE '%overlap%' OR conname ILIKE '%rental%'"
  );
  if (!rows.length) console.log("TIDAK ADA constraint overlap/rental di database (murni app-level).");
  else console.log(JSON.stringify(rows, null, 2));
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());