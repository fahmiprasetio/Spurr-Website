import { createHash } from "node:crypto";
import { prisma } from "../src/lib/prisma";
import { loadEnvFile } from "node:process";

try {
  loadEnvFile(".env.local");
} catch (e) {}

const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
const orderId = process.argv[2];

if (!orderId) {
  console.error("Please provide orderId: npx tsx scripts/pay-order.ts <orderId>");
  process.exit(1);
}

async function main() {
  console.log(`Simulating payment success webhook for order: ${orderId}`);
  
  const payment = await prisma.payment.findUnique({
    where: { transactionRef: orderId },
  });

  if (!payment) {
    console.error(`Error: Payment record not found for transaction reference: ${orderId}`);
    process.exit(1);
  }

  const grossAmount = payment.amount.toString();
  const statusCode = "200";
  
  // signature_key = sha512(order_id + status_code + gross_amount + ServerKey)
  const signatureKey = createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");

  const payload = {
    order_id: orderId,
    status_code: statusCode,
    gross_amount: grossAmount,
    transaction_status: "settlement",
    fraud_status: "accept",
    signature_key: signatureKey,
    transaction_id: "mock-tx-" + Date.now(),
    payment_type: "bank_transfer",
  };

  const url = "http://localhost:3000/api/payments/midtrans/webhook";
  
  console.log("Sending POST webhook to:", url);
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const body = await res.text();
    console.log(`Response Status: ${res.status}`);
    console.log(`Response Body: ${body}`);
    
    if (res.ok) {
      console.log("SUCCESS! Database should be updated now. Refresh your browser page.");
    } else {
      console.log("FAILED to trigger webhook.");
    }
  } catch (err) {
    console.error("Connection failed. Make sure Next.js dev server is running on localhost:3000", err);
  }
}

main().finally(() => prisma.$disconnect());
