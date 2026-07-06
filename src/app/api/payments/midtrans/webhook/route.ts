import { Prisma, type PaymentStatus, type RentalStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { notifyPaymentReceived, notifyRentalStatusChanged } from "@/lib/notification-service";
import {
  buildMidtransWebhookEventKey,
  getMidtransOrderId,
  getMidtransTransactionStatus,
  isMidtransConfigured,
  isMidtransTerminalFailure,
  mapMidtransTransactionToPaymentStatus,
  resolvePaymentStatusTransition,
  verifyMidtransSignature,
  type MidtransNotificationPayload,
} from "@/lib/midtrans";
import { prisma } from "@/lib/prisma";

const BLOCKING_RENTAL_STATUSES: RentalStatus[] = ["CONFIRMED", "ACTIVE"];

const RENTAL_STATUS_LABEL: Record<RentalStatus, string> = {
  PENDING: "Awaiting Payment",
  CONFIRMED: "Confirmed",
  ACTIVE: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const dynamic = "force-dynamic";

type WebhookTransactionResult =
  | {
      kind: "processed";
      orderId: string;
      userId: string;
      carName: string;
      amount: number;
      transactionRef: string;
      previousPaymentStatus: PaymentStatus;
      nextPaymentStatus: PaymentStatus;
      previousRentalStatus: RentalStatus;
      nextRentalStatus: RentalStatus;
    }
  | {
      kind: "duplicate";
      orderId: string;
      paymentStatus: PaymentStatus;
    }
  | {
      kind: "not-found";
      orderId: string;
    }
  | {
      kind: "error";
    };

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected webhook processing error.";
}

function toPayloadJsonObject(raw: unknown): Prisma.JsonObject | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  return raw as Prisma.JsonObject;
}

export async function POST(request: NextRequest) {
  if (!isMidtransConfigured()) {
    return NextResponse.json({ error: "Midtrans is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();

  let payloadRaw: unknown;

  try {
    payloadRaw = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const payloadJson = toPayloadJsonObject(payloadRaw);

  if (!payloadJson) {
    return NextResponse.json({ error: "Invalid Midtrans payload object." }, { status: 400 });
  }

  const payload = payloadJson as unknown as MidtransNotificationPayload;

  if (!verifyMidtransSignature(payload)) {
    return NextResponse.json({ error: "Invalid Midtrans signature." }, { status: 401 });
  }

  const orderId = getMidtransOrderId(payload);

  if (!orderId) {
    return NextResponse.json({ error: "Missing order_id." }, { status: 400 });
  }

  const transactionStatus = getMidtransTransactionStatus(payload);
  const candidatePaymentStatus = mapMidtransTransactionToPaymentStatus(payload);
  const eventKey = buildMidtransWebhookEventKey(payload);
  const auditPayload: Prisma.InputJsonObject = {
    ...payloadJson,
    _meta: {
      receivedAt: new Date().toISOString(),
      rawBodyLength: rawBody.length,
    },
  };

  const transactionResult: WebhookTransactionResult = await prisma
    .$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${orderId}))`;

        const existingEvent = await tx.paymentWebhookEvent.findUnique({
          where: { eventKey },
          select: {
            id: true,
            processingStatus: true,
          },
        });

        const eventRecord = existingEvent
          ? await tx.paymentWebhookEvent.update({
              where: { id: existingEvent.id },
              data: {
                receivedCount: {
                  increment: 1,
                },
                lastReceivedAt: new Date(),
                transactionStatus: transactionStatus || null,
                mappedStatus: candidatePaymentStatus,
                payload: auditPayload,
              },
            })
          : await tx.paymentWebhookEvent.create({
              data: {
                provider: "MIDTRANS",
                orderId,
                eventKey,
                transactionStatus: transactionStatus || null,
                mappedStatus: candidatePaymentStatus,
                payload: auditPayload,
              },
            });

        if (existingEvent?.processingStatus === "PROCESSED") {
          const existingPayment = await tx.payment.findUnique({
            where: { transactionRef: orderId },
            select: { status: true },
          });

          return {
            kind: "duplicate" as const,
            orderId,
            paymentStatus: existingPayment?.status ?? candidatePaymentStatus,
          };
        }

        const payment = await tx.payment.findUnique({
          where: { transactionRef: orderId },
          include: {
            rental: {
              select: {
                id: true,
                userId: true,
                status: true,
                carId: true,
                startDate: true,
                endDate: true,
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

        if (!payment) {
          await tx.paymentWebhookEvent.update({
            where: { id: eventRecord.id },
            data: {
              processingStatus: "FAILED",
              errorMessage: "Payment not found for order_id.",
            },
          });

          return { kind: "not-found" as const, orderId };
        }

        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"car:" + payment.rental.carId}))`;

        const nextPaymentStatus = resolvePaymentStatusTransition(
          payment.status,
          candidatePaymentStatus
        );
        const paymentStatusChanged = nextPaymentStatus !== payment.status;
        const shouldSetPaidAt = nextPaymentStatus === "PAID" && !payment.paidAt;

        if (paymentStatusChanged || shouldSetPaidAt) {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: nextPaymentStatus,
              ...(shouldSetPaidAt ? { paidAt: new Date() } : {}),
            },
          });
        }

        let nextRentalStatus = payment.rental.status;

        if (nextPaymentStatus === "PAID" && payment.rental.status === "PENDING") {
          const conflictingRental = await tx.rental.findFirst({
            where: {
              carId: payment.rental.carId,
              id: { not: payment.rental.id },
              status: { in: BLOCKING_RENTAL_STATUSES },
              startDate: { lte: payment.rental.endDate },
              endDate: { gte: payment.rental.startDate },
            },
            select: { id: true },
          });

          if (conflictingRental) {
            nextRentalStatus = "CANCELLED";
          } else {
            nextRentalStatus = "CONFIRMED";
          }
        }

        const shouldCancelPendingRental =
          payment.rental.status === "PENDING" &&
          (isMidtransTerminalFailure(payload) || nextPaymentStatus === "REFUNDED");

        if (shouldCancelPendingRental) {
          nextRentalStatus = "CANCELLED";
        }

        if (nextPaymentStatus === "REFUNDED" && payment.rental.status === "CONFIRMED") {
          nextRentalStatus = "CANCELLED";
        }

        const rentalStatusChanged = nextRentalStatus !== payment.rental.status;

        if (rentalStatusChanged) {
          await tx.rental.update({
            where: { id: payment.rental.id },
            data: { status: nextRentalStatus },
          });
        }

        if (nextRentalStatus === "CONFIRMED") {
          await tx.rental.updateMany({
            where: {
              carId: payment.rental.carId,
              id: { not: payment.rental.id },
              status: "PENDING",
              startDate: { lte: payment.rental.endDate },
              endDate: { gte: payment.rental.startDate },
            },
            data: { status: "CANCELLED" },
          });
        }

        const shouldKeepCarBooked = BLOCKING_RENTAL_STATUSES.includes(nextRentalStatus);

        if (shouldKeepCarBooked) {
          await tx.car.updateMany({
            where: {
              id: payment.rental.carId,
              status: "AVAILABLE",
            },
            data: {
              status: "BOOKED",
            },
          });
        } else if (payment.rental.car.status === "BOOKED") {
          const hasOtherActiveRentals = await tx.rental.findFirst({
            where: {
              carId: payment.rental.carId,
              id: { not: payment.rental.id },
              status: { in: BLOCKING_RENTAL_STATUSES },
            },
            select: { id: true },
          });

          if (!hasOtherActiveRentals) {
            await tx.car.update({
              where: { id: payment.rental.carId },
              data: { status: "AVAILABLE" },
            });
          }
        }

        await tx.paymentWebhookEvent.update({
          where: { id: eventRecord.id },
          data: {
            paymentId: payment.id,
            mappedStatus: nextPaymentStatus,
            processingStatus: "PROCESSED",
            processedAt: new Date(),
            errorMessage: null,
          },
        });

        return {
          kind: "processed" as const,
          orderId,
          userId: payment.userId,
          carName: payment.rental.car.name,
          amount: payment.amount,
          transactionRef: payment.transactionRef,
          previousPaymentStatus: payment.status,
          nextPaymentStatus,
          previousRentalStatus: payment.rental.status,
          nextRentalStatus,
        };
      },
      {
        maxWait: 10_000,
        timeout: 20_000,
      }
    )
    .catch((error) => {
      console.error("midtrans webhook transaction failed:", error);
      const errorMessage = toErrorMessage(error).slice(0, 600);

      void prisma.paymentWebhookEvent
        .updateMany({
          where: {
            eventKey,
            processingStatus: { not: "PROCESSED" },
          },
          data: {
            processingStatus: "FAILED",
            errorMessage,
            lastReceivedAt: new Date(),
          },
        })
        .catch((updateError) => {
          console.error("midtrans webhook event failure update failed:", updateError);
        });

      return { kind: "error" as const };
    });

  if (transactionResult.kind === "not-found") {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  if (transactionResult.kind === "error") {
    return NextResponse.json({ error: "Failed to process callback." }, { status: 500 });
  }

  if (transactionResult.kind === "duplicate") {
    return NextResponse.json({
      ok: true,
      duplicate: true,
      orderId: transactionResult.orderId,
      paymentStatus: transactionResult.paymentStatus,
    });
  }

  if (
    transactionResult.nextPaymentStatus === "PAID" &&
    transactionResult.previousPaymentStatus !== "PAID"
  ) {
    await notifyPaymentReceived({
      userId: transactionResult.userId,
      carName: transactionResult.carName,
      amount: transactionResult.amount,
      transactionRef: transactionResult.transactionRef,
    }).catch((error) => {
      console.error("notifyPaymentReceived from webhook failed:", error);
    });
  }

  if (transactionResult.previousRentalStatus !== transactionResult.nextRentalStatus) {
    await notifyRentalStatusChanged({
      userId: transactionResult.userId,
      carName: transactionResult.carName,
      statusLabel: RENTAL_STATUS_LABEL[transactionResult.nextRentalStatus],
    }).catch((error) => {
      console.error("notifyRentalStatusChanged from webhook failed:", error);
    });
  }

  return NextResponse.json({
    ok: true,
    duplicate: false,
    orderId: transactionResult.orderId,
    paymentStatus: transactionResult.nextPaymentStatus,
  });
}