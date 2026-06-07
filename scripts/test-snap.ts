import { createMidtransSnapTransaction } from "../src/lib/midtrans";
import { loadEnvFile } from "node:process";

try {
  loadEnvFile(".env.local");
} catch (e) {
  console.log("No .env.local file found, falling back to default process.env");
}

async function test() {
  console.log("Testing Midtrans Snap Transaction...");
  console.log("Server Key length:", process.env.MIDTRANS_SERVER_KEY?.length);
  console.log("Server Key starts with:", process.env.MIDTRANS_SERVER_KEY?.slice(0, 10));
  try {
    const res = await createMidtransSnapTransaction({
      orderId: "TEST-ORDER-" + Date.now(),
      grossAmount: 150000,
      customerName: "Test Customer",
      customerEmail: "test@example.com",
      itemName: "Test Car Rental",
    });
    console.log("SUCCESS!", res);
  } catch (err) {
    console.error("FAILED!", err);
  }
}

test();
