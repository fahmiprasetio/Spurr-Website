import { readFileSync } from "node:fs";

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
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {}
}

const serverKey = (process.env.MIDTRANS_SERVER_KEY || "").trim();
const isProd = process.env.MIDTRANS_IS_PRODUCTION === "true" || process.env.MIDTRANS_IS_PRODUCTION === "1";
const base = isProd ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";

console.log("Mode        :", isProd ? "PRODUCTION" : "SANDBOX");
console.log("Endpoint    :", base);
console.log("Server key  :", serverKey ? serverKey.slice(0, 12) + "..." : "(KOSONG)");
console.log("Key type    :", serverKey.startsWith("SB-") ? "SANDBOX key" : "PRODUCTION key");
console.log("");

const auth = Buffer.from(serverKey + ":").toString("base64");
const res = await fetch(base + "/snap/v1/transactions", {
  method: "POST",
  headers: {
    Authorization: "Basic " + auth,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: JSON.stringify({
    transaction_details: { order_id: "TEST-" + Date.now(), gross_amount: 10000 },
  }),
});

console.log("HTTP status :", res.status);
console.log("Response    :", await res.text());