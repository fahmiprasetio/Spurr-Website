import { createHash } from "node:crypto";
import type { CarStatus, PaymentStatus, RentalStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { POST as midtransWebhookPOST } from "../src/app/api/payments/midtrans/webhook/route";
import { prisma } from "../src/lib/prisma";

type Scenario = "success" | "pending" | "expire" | "cancel" | "deny";

type ScenarioConfig = {
  name: Scenario;
  transactionStatus: string;
  statusCode: string;
  expectedPaymentStatus: PaymentStatus;
  expectedRentalStatuses: RentalStatus[];
};

type Fixture = {
  orderId: string;
  rentalId: string;
  paymentId: string;
  carId: string;
  carName: string;
};

const SCENARIOS: ScenarioConfig[] = [
  {
    name: "success",
    transactionStatus: "settlement",
    statusCode: "200",
    expectedPaymentStatus: "PAID",
    expectedRentalStatuses: ["CONFIRMED", "ACTIVE", "COMPLETED"],
  },
  {
    name: "pending",
    transactionStatus: "pending",
    statusCode: "201",
    expectedPaymentStatus: "PENDING",
    expectedRentalStatuses: ["PENDING"],
  },
  {
    name: "expire",
    transactionStatus: "expire",
    statusCode: "202",
    expectedPaymentStatus: "FAILED",
    expectedRentalStatuses: ["CANCELLED"],
  },
  {
    name: "cancel",
    transactionStatus: "cancel",
    statusCode: "202",
    expectedPaymentStatus: "FAILED",
    expectedRentalStatuses: ["CANCELLED"],
  },
  {
    name: "deny",
    transactionStatus: "deny",
    statusCode: "202",
    expectedPaymentStatus: "FAILED",
    expectedRentalStatuses: ["CANCELLED"],
  },
];

const ACTIVE_RENTAL_STATUSES: RentalStatus[] = ["PENDING", "CONFIRMED", "ACTIVE"];

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }

  return value;
}

function buildSignature(payload: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  serverKey: string;
}): string {
  const raw = `${payload.order_id}${payload.status_code}${payload.gross_amount}${payload.serverKey}`;
  return createHash("sha512").update(raw).digest("hex");
}

function createOrderId(scenario: Scenario, index: number): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `UAT-${scenario.toUpperCase()}-${Date.now()}-${index}-${rand}`;
}

async function createFixture(scenario: Scenario, index: number): Promise<Fixture> {
  const user = await prisma.user.findFirst({
    select: { id: true, email: true },
    orderBy: { createdAt: "asc" },
  });

  if (!user) {
    throw new Error("No user found. Create at least one user before running UAT.");
  }

  const car = await prisma.car.findFirst({
    where: { status: { not: "INACTIVE" } },
    select: { id: true, name: true, status: true },
    orderBy: { createdAt: "asc" },
  });

  if (!car) {
    throw new Error("No active car found. Seed at least one car before running UAT.");
  }

  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() + (index + 1) * 2);
  startDate.setUTCHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 1);

  const totalDays = 2;
  const totalAmount = 5_000_000 + index * 100_000;
  const orderId = createOrderId(scenario, index);

  const result = await prisma.$transaction(async (tx) => {
    const rental = await tx.rental.create({
      data: {
        userId: user.id,
        carId: car.id,
        startDate,
        endDate,
        totalDays,
        totalAmount,
        status: "PENDING",
        notes: `[UAT:${scenario}]`,
      },
    });

    const payment = await tx.payment.create({
      data: {
        rentalId: rental.id,
        userId: user.id,
        amount: totalAmount,
        method: "BANK_TRANSFER",
        status: "PENDING",
        transactionRef: orderId,
      },
    });

    await tx.car.updateMany({
      where: {
        id: car.id,
        status: "AVAILABLE",
      },
      data: {
        status: "BOOKED",
      },
    });

    return {
      rentalId: rental.id,
      paymentId: payment.id,
      carId: car.id,
      carName: car.name,
    };
  });

  return {
    orderId,
    rentalId: result.rentalId,
    paymentId: result.paymentId,
    carId: result.carId,
    carName: result.carName,
  };
}

async function invokeWebhook(args: {
  fixture: Fixture;
  scenario: ScenarioConfig;
  serverKey: string;
}) {
  const payment = await prisma.payment.findUnique({
    where: { id: args.fixture.paymentId },
    select: { amount: true },
  });

  if (!payment) {
    throw new Error(`Payment not found for fixture ${args.fixture.orderId}`);
  }

  const grossAmount = payment.amount.toString();

  const payload = {
    order_id: args.fixture.orderId,
    status_code: args.scenario.statusCode,
    gross_amount: grossAmount,
    transaction_status: args.scenario.transactionStatus,
    fraud_status: "accept",
    signature_key: buildSignature({
      order_id: args.fixture.orderId,
      status_code: args.scenario.statusCode,
      gross_amount: grossAmount,
      serverKey: args.serverKey,
    }),
  };

  const request = new NextRequest("http://localhost/api/payments/midtrans/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const response = await midtransWebhookPOST(request);
  const responseJson = (await response.json().catch(() => null)) as
    | { duplicate?: boolean; ok?: boolean; error?: string }
    | null;

  return {
    status: response.status,
    ok: response.ok,
    body: responseJson,
  };
}

async function evaluateScenario(args: {
  fixture: Fixture;
  scenario: ScenarioConfig;
}): Promise<string[]> {
  const payment = await prisma.payment.findUnique({
    where: { id: args.fixture.paymentId },
    include: {
      rental: {
        include: {
          car: {
            select: {
              status: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    return ["Payment disappeared after webhook processing."];
  }

  const errors: string[] = [];

  if (payment.status !== args.scenario.expectedPaymentStatus) {
    errors.push(
      `Expected payment ${args.scenario.expectedPaymentStatus}, got ${payment.status}`
    );
  }

  if (!args.scenario.expectedRentalStatuses.includes(payment.rental.status)) {
    errors.push(
      `Expected rental in [${args.scenario.expectedRentalStatuses.join(", ")}], got ${payment.rental.status}`
    );
  }

  const activeRentalCount = await prisma.rental.count({
    where: {
      carId: args.fixture.carId,
      status: { in: ACTIVE_RENTAL_STATUSES },
    },
  });

  const expectedCarStatus: CarStatus = activeRentalCount > 0 ? "BOOKED" : "AVAILABLE";

  if (payment.rental.car.status !== expectedCarStatus) {
    errors.push(
      `Expected car ${expectedCarStatus}, got ${payment.rental.car.status}`
    );
  }

  const latestEvent = await prisma.paymentWebhookEvent.findFirst({
    where: {
      provider: "MIDTRANS",
      orderId: args.fixture.orderId,
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  if (!latestEvent) {
    errors.push("Missing PaymentWebhookEvent for order.");
  } else {
    if (latestEvent.processingStatus !== "PROCESSED") {
      errors.push(`Webhook event status expected PROCESSED, got ${latestEvent.processingStatus}`);
    }

    if (latestEvent.mappedStatus !== payment.status) {
      errors.push(`Webhook mappedStatus expected ${payment.status}, got ${latestEvent.mappedStatus}`);
    }
  }

  return errors;
}

async function runDuplicateCheck(args: {
  fixture: Fixture;
  scenario: ScenarioConfig;
  serverKey: string;
}): Promise<string[]> {
  const errors: string[] = [];

  const beforeEvent = await prisma.paymentWebhookEvent.findFirst({
    where: {
      provider: "MIDTRANS",
      orderId: args.fixture.orderId,
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      eventKey: true,
      receivedCount: true,
    },
  });

  if (!beforeEvent) {
    return ["Cannot run duplicate check because no event exists."];
  }

  const beforeState = await prisma.payment.findUnique({
    where: { id: args.fixture.paymentId },
    select: {
      status: true,
      rental: {
        select: {
          status: true,
          car: {
            select: {
              status: true,
            },
          },
        },
      },
    },
  });

  if (!beforeState) {
    return ["Cannot run duplicate check because payment state is missing."];
  }

  const replayOne = await invokeWebhook({
    fixture: args.fixture,
    scenario: args.scenario,
    serverKey: args.serverKey,
  });

  const replayTwo = await invokeWebhook({
    fixture: args.fixture,
    scenario: args.scenario,
    serverKey: args.serverKey,
  });

  if (!replayOne.ok || !replayTwo.ok) {
    errors.push(
      `Duplicate replay request failed: first=${replayOne.status}, second=${replayTwo.status}`
    );
  }

  if (replayTwo.body?.duplicate !== true) {
    errors.push("Second duplicate replay did not return duplicate=true.");
  }

  const afterEvent = await prisma.paymentWebhookEvent.findUnique({
    where: { eventKey: beforeEvent.eventKey },
    select: { receivedCount: true },
  });

  if (!afterEvent || afterEvent.receivedCount < beforeEvent.receivedCount + 2) {
    errors.push("Webhook receivedCount did not increase by 2 after duplicate replay.");
  }

  const afterState = await prisma.payment.findUnique({
    where: { id: args.fixture.paymentId },
    select: {
      status: true,
      rental: {
        select: {
          status: true,
          car: {
            select: {
              status: true,
            },
          },
        },
      },
    },
  });

  if (!afterState) {
    errors.push("Payment state missing after duplicate replay.");
    return errors;
  }

  if (afterState.status !== beforeState.status) {
    errors.push("Payment status changed after duplicate replay.");
  }

  if (afterState.rental.status !== beforeState.rental.status) {
    errors.push("Rental status changed after duplicate replay.");
  }

  if (afterState.rental.car.status !== beforeState.rental.car.status) {
    errors.push("Car status changed after duplicate replay.");
  }

  return errors;
}

async function cleanupFixtures(fixtures: Fixture[]) {
  if (fixtures.length === 0) {
    return;
  }

  const orderIds = fixtures.map((item) => item.orderId);
  const rentalIds = fixtures.map((item) => item.rentalId);

  await prisma.paymentWebhookEvent.deleteMany({
    where: {
      provider: "MIDTRANS",
      orderId: { in: orderIds },
    },
  });

  await prisma.rental.deleteMany({
    where: {
      id: { in: rentalIds },
    },
  });
}

async function main() {
  const serverKey = getRequiredEnv("MIDTRANS_SERVER_KEY");
  const keepData = process.argv.includes("keep-data");
  const fixtures: Fixture[] = [];

  console.log("Running Midtrans webhook scenario UAT...");

  try {
    const results: Array<{ scenario: Scenario; ok: boolean; errors: string[]; orderId: string }> = [];

    for (let index = 0; index < SCENARIOS.length; index += 1) {
      const scenario = SCENARIOS[index];
      const fixture = await createFixture(scenario.name, index);
      fixtures.push(fixture);

      const callbackResult = await invokeWebhook({
        fixture,
        scenario,
        serverKey,
      });

      const errors: string[] = [];

      if (!callbackResult.ok) {
        errors.push(`Webhook callback failed with status ${callbackResult.status}`);
      }

      const validationErrors = await evaluateScenario({ fixture, scenario });
      errors.push(...validationErrors);

      if (scenario.name === "success") {
        const duplicateErrors = await runDuplicateCheck({ fixture, scenario, serverKey });
        errors.push(...duplicateErrors);
      }

      const ok = errors.length === 0;
      results.push({ scenario: scenario.name, ok, errors, orderId: fixture.orderId });

      if (ok) {
        console.log(`  PASS ${scenario.name.toUpperCase()} | order=${fixture.orderId}`);
      } else {
        console.log(`  FAIL ${scenario.name.toUpperCase()} | order=${fixture.orderId}`);
        for (const err of errors) {
          console.log(`    - ${err}`);
        }
      }
    }

    const passed = results.filter((item) => item.ok).length;
    const failed = results.length - passed;

    console.log("\nUAT Scenario Summary");
    console.log(`  Passed: ${passed}`);
    console.log(`  Failed: ${failed}`);

    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    if (!keepData) {
      await cleanupFixtures(fixtures);
      console.log("Temporary UAT fixtures cleaned up.");
    } else {
      console.log("UAT fixtures kept (argument keep-data detected).");
    }
  }
}

main()
  .catch((error) => {
    console.error("Scenario UAT failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
