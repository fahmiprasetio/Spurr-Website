import { type CarStatus, type PaymentStatus, type RentalStatus } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

type Scenario = "success" | "pending" | "expire" | "cancel" | "deny";

type CaseInput = {
  scenario: Scenario;
  orderId: string;
};

type CaseState = {
  paymentStatus: PaymentStatus;
  rentalStatus: RentalStatus;
  carStatus: CarStatus;
  hasActiveRentalForCar: boolean;
};

const VALID_SCENARIOS: Scenario[] = ["success", "pending", "expire", "cancel", "deny"];
const ACTIVE_RENTAL_STATUSES: RentalStatus[] = ["PENDING", "CONFIRMED", "ACTIVE"];

function printUsage() {
  console.log("Midtrans sandbox UAT checker");
  console.log("Usage:");
  console.log("  npm run uat:midtrans -- list-recent");
  console.log("  npm run uat:midtrans -- success:PAY-123 pending:PAY-456");
  console.log("  npm run uat:midtrans -- success:PAY-123 simulate-duplicate base-url=http://localhost:3000");
  console.log("");
  console.log("Options:");
  console.log("  list-recent                 Show recent payments with statuses to help choose orderId");
  console.log("  <scenario:orderId>          Repeatable positional args. Scenario: success|pending|expire|cancel|deny");
  console.log("  --case <scenario:orderId>   Optional explicit format (also supports --case=scenario:orderId)");
  console.log("  simulate-duplicate          Replay latest webhook payload twice to test idempotency");
  console.log("  base-url=<url>              Required when simulate-duplicate is used");
}

function parseCaseValue(rawValue: string): CaseInput {
  const [scenarioRaw, orderIdRaw] = rawValue.split(":");
  const scenario = scenarioRaw?.toLowerCase() as Scenario;
  const orderId = orderIdRaw?.trim();

  if (!VALID_SCENARIOS.includes(scenario)) {
    throw new Error(`Invalid scenario '${scenarioRaw}'. Use: ${VALID_SCENARIOS.join(", ")}`);
  }

  if (!orderId) {
    throw new Error(`Invalid case '${rawValue}'. Format must be scenario:orderId`);
  }

  return { scenario, orderId };
}

function parseArgs(argv: string[]): {
  cases: CaseInput[];
  simulateDuplicate: boolean;
  baseUrl: string | null;
  listRecent: boolean;
} {
  const cases: CaseInput[] = [];
  let simulateDuplicate = false;
  let baseUrl: string | null = null;
  let listRecent = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h" || arg === "help") {
      printUsage();
      process.exit(0);
    }

    if (arg === "--simulate-duplicate" || arg === "simulate-duplicate") {
      simulateDuplicate = true;
      continue;
    }

    if (arg === "--list-recent" || arg === "list-recent") {
      listRecent = true;
      continue;
    }

    if (arg === "--base-url") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("Missing value for --base-url");
      }
      baseUrl = value.replace(/\/$/, "");
      i += 1;
      continue;
    }

    if (arg.startsWith("base-url=") || arg.startsWith("base-url:")) {
      const separatorIndex = arg.includes("=") ? arg.indexOf("=") : arg.indexOf(":");
      const value = arg.slice(separatorIndex + 1).trim();

      if (!value) {
        throw new Error("Missing value for base-url.");
      }

      baseUrl = value.replace(/\/$/, "");
      continue;
    }

    if (arg === "--case") {
      const value = argv[i + 1];

      if (!value) {
        throw new Error("Missing value for --case");
      }

      cases.push(parseCaseValue(value));
      i += 1;
      continue;
    }

    if (arg.startsWith("--case=")) {
      const value = arg.slice("--case=".length);
      cases.push(parseCaseValue(value));
      continue;
    }

    if (!arg.startsWith("-") && arg.includes(":")) {
      cases.push(parseCaseValue(arg));
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (cases.length === 0 && !listRecent) {
    throw new Error("Provide at least one scenario:orderId or use --list-recent.");
  }

  if (simulateDuplicate && !baseUrl) {
    throw new Error("--base-url is required when --simulate-duplicate is enabled.");
  }

  return {
    cases,
    simulateDuplicate,
    baseUrl,
    listRecent,
  };
}

async function listRecentPayments(limit = 15) {
  const rows = await prisma.payment.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      transactionRef: true,
      status: true,
      rental: {
        select: {
          status: true,
          car: {
            select: {
              name: true,
              status: true,
            },
          },
        },
      },
    },
  });

  console.log(`\nRecent payments (latest ${rows.length})`);

  if (rows.length === 0) {
    console.log("  No payments found.");
    return;
  }

  for (const row of rows) {
    console.log(
      `  ${row.transactionRef} | payment=${row.status} | rental=${row.rental.status} | car=${row.rental.car.status} (${row.rental.car.name})`
    );
  }
}

function validateCoreScenario(caseInput: CaseInput, state: CaseState): string[] {
  const errors: string[] = [];

  if (caseInput.scenario === "success") {
    if (state.paymentStatus !== "PAID") {
      errors.push(`Expected payment status PAID but got ${state.paymentStatus}`);
    }

    if (!["CONFIRMED", "ACTIVE", "COMPLETED"].includes(state.rentalStatus)) {
      errors.push(
        `Expected rental status CONFIRMED/ACTIVE/COMPLETED but got ${state.rentalStatus}`
      );
    }
  }

  if (caseInput.scenario === "pending") {
    if (state.paymentStatus !== "PENDING") {
      errors.push(`Expected payment status PENDING but got ${state.paymentStatus}`);
    }

    if (state.rentalStatus !== "PENDING") {
      errors.push(`Expected rental status PENDING but got ${state.rentalStatus}`);
    }
  }

  if (caseInput.scenario === "expire" || caseInput.scenario === "cancel" || caseInput.scenario === "deny") {
    if (state.paymentStatus !== "FAILED") {
      errors.push(`Expected payment status FAILED but got ${state.paymentStatus}`);
    }

    if (state.rentalStatus !== "CANCELLED") {
      errors.push(`Expected rental status CANCELLED but got ${state.rentalStatus}`);
    }
  }

  return errors;
}

function validateCarSync(state: CaseState): string[] {
  const expectedCarStatus: CarStatus = state.hasActiveRentalForCar ? "BOOKED" : "AVAILABLE";

  if (state.carStatus !== expectedCarStatus) {
    return [
      `Car sync mismatch. Expected ${expectedCarStatus} based on active rentals, got ${state.carStatus}`,
    ];
  }

  return [];
}

function normalizeReplayPayload(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const next = { ...(payload as Record<string, unknown>) };
  delete next._meta;
  return next;
}

async function fetchCaseState(orderId: string) {
  const payment = await prisma.payment.findUnique({
    where: { transactionRef: orderId },
    include: {
      rental: {
        include: {
          car: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    return null;
  }

  const activeRentalsForCar = await prisma.rental.count({
    where: {
      carId: payment.rental.car.id,
      status: { in: ACTIVE_RENTAL_STATUSES },
    },
  });

  return {
    payment,
    state: {
      paymentStatus: payment.status,
      rentalStatus: payment.rental.status,
      carStatus: payment.rental.car.status,
      hasActiveRentalForCar: activeRentalsForCar > 0,
    } satisfies CaseState,
  };
}

async function runCase(caseInput: CaseInput, args: { simulateDuplicate: boolean; baseUrl: string | null }) {
  console.log(`\n[UAT] Scenario=${caseInput.scenario.toUpperCase()} Order=${caseInput.orderId}`);

  const snapshot = await fetchCaseState(caseInput.orderId);

  if (!snapshot) {
    console.log("  FAIL - Order not found in Payment.transactionRef");
    return {
      ok: false,
      errors: ["Order not found in Payment.transactionRef"],
    };
  }

  const scenarioErrors = validateCoreScenario(caseInput, snapshot.state);
  const syncErrors = validateCarSync(snapshot.state);

  const latestEvent = await prisma.paymentWebhookEvent.findFirst({
    where: {
      provider: "MIDTRANS",
      orderId: caseInput.orderId,
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  const eventErrors: string[] = [];

  if (!latestEvent) {
    eventErrors.push("No PaymentWebhookEvent found for this order.");
  } else {
    if (latestEvent.processingStatus !== "PROCESSED") {
      eventErrors.push(
        `Latest webhook event is ${latestEvent.processingStatus}, expected PROCESSED.`
      );
    }
  }

  const replayErrors: string[] = [];

  if (args.simulateDuplicate) {
    if (!latestEvent) {
      replayErrors.push("Cannot replay duplicate callback because webhook event is missing.");
    } else if (!args.baseUrl) {
      replayErrors.push("Missing base URL for duplicate simulation.");
    } else {
      const payloadToReplay = normalizeReplayPayload(latestEvent.payload);

      if (!payloadToReplay) {
        replayErrors.push("Stored webhook payload is not a valid object.");
      } else {
        const beforeCount = latestEvent.receivedCount;
        const beforeState = snapshot.state;
        const webhookUrl = `${args.baseUrl}/api/payments/midtrans/webhook`;

        const firstResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadToReplay),
        });

        const secondResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadToReplay),
        });

        const firstJson = (await firstResponse.json().catch(() => null)) as
          | { duplicate?: boolean }
          | null;
        const secondJson = (await secondResponse.json().catch(() => null)) as
          | { duplicate?: boolean }
          | null;

        if (!firstResponse.ok || !secondResponse.ok) {
          replayErrors.push(
            `Replay request failed. First=${firstResponse.status}, Second=${secondResponse.status}`
          );
        }

        if (secondJson?.duplicate !== true) {
          replayErrors.push("Second replay response did not indicate duplicate=true.");
        }

        const refreshedEvent = await prisma.paymentWebhookEvent.findUnique({
          where: { eventKey: latestEvent.eventKey },
          select: { receivedCount: true },
        });

        if (!refreshedEvent || refreshedEvent.receivedCount < beforeCount + 2) {
          replayErrors.push("Webhook receivedCount did not increase by at least 2 after replay.");
        }

        const afterSnapshot = await fetchCaseState(caseInput.orderId);

        if (!afterSnapshot) {
          replayErrors.push("Order disappeared after replay.");
        } else {
          if (afterSnapshot.state.paymentStatus !== beforeState.paymentStatus) {
            replayErrors.push("Payment status changed after duplicate replay.");
          }

          if (afterSnapshot.state.rentalStatus !== beforeState.rentalStatus) {
            replayErrors.push("Rental status changed after duplicate replay.");
          }

          if (afterSnapshot.state.carStatus !== beforeState.carStatus) {
            replayErrors.push("Car status changed after duplicate replay.");
          }
        }

        if (firstJson?.duplicate !== true) {
          console.log("  - Replay first call duplicate flag was false (acceptable if retried from failed state).");
        }
      }
    }
  }

  const allErrors = [...scenarioErrors, ...syncErrors, ...eventErrors, ...replayErrors];

  if (allErrors.length === 0) {
    console.log("  PASS - scenario expectation, car sync, and webhook audit checks are valid.");
    return { ok: true, errors: [] as string[] };
  }

  for (const err of allErrors) {
    console.log(`  FAIL - ${err}`);
  }

  return {
    ok: false,
    errors: allErrors,
  };
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));

  console.log("Running Midtrans sandbox UAT checks...");

  if (parsed.listRecent) {
    await listRecentPayments();
  }

  if (parsed.cases.length === 0) {
    return;
  }

  let passed = 0;
  let failed = 0;

  for (const item of parsed.cases) {
    const result = await runCase(item, {
      simulateDuplicate: parsed.simulateDuplicate,
      baseUrl: parsed.baseUrl,
    });

    if (result.ok) {
      passed += 1;
    } else {
      failed += 1;
    }
  }

  console.log("\nUAT Summary");
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("UAT script failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
