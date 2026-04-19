import { type RentalStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { notifyPaymentReceived, notifyRentalStatusChanged } from "@/lib/notification-service";
import {
  isMidtransConfigured,
  isMidtransTerminalFailure,
  mapMidtransTransactionToPaymentStatus,
  verifyMidtransSignature,
  type MidtransNotificationPayload,
} from "@/lib/midtrans";
import { prisma } from "@/lib/prisma";

const ACTIVE_RENTAL_STATUSES: RentalStatus[] = ["PENDING", "CONFIRMED", "ACTIVE"];

const RENTAL_STATUS_LABEL: Record<RentalStatus, string> = {
  PENDING: "Awaiting Payment",
  CONFIRMED: "Confirmed",
  ACTIVE: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isMidtransConfigured()) {
    return NextResponse.json({ error: "Midtrans is not configured." }, { status: 503 });
  }

  let payload: MidtransNotificationPayload;

  try {
    payload = (await request.json()) as MidtransNotificationPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!verifyMidtransSignature(payload)) {
    return NextResponse.json({ error: "Invalid Midtrans signature." }, { status: 401 });
  }

  const orderId = typeof payload.order_id === "string" ? payload.order_id.trim() : "";

  if (!orderId) {
    return NextResponse.json({ error: "Missing order_id." }, { status: 400 });
  }

  const nextPaymentStatus = mapMidtransTransactionToPaymentStatus(payload);

  const transactionResult = await prisma
    .$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { transactionRef: orderId },
        include: {
          rental: {
            select: {
              id: true,
              userId: true,
              status: true,
              carId: true,
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
        return { kind: "not-found" as const };
      }

      const shouldSetPaidAt = nextPaymentStatus === "PAID" && !payment.paidAt;

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: nextPaymentStatus,
          ...(shouldSetPaidAt ? { paidAt: new Date() } : {}),
        },
      });

      let nextRentalStatus = payment.rental.status;

      if (nextPaymentStatus === "PAID" && payment.rental.status === "PENDING") {
        nextRentalStatus = "CONFIRMED";
      }

      if (isMidtransTerminalFailure(payload) && payment.rental.status === "PENDING") {
        nextRentalStatus = "CANCELLED";
      }

      if (
        nextPaymentStatus === "REFUNDED" &&
        (payment.rental.status === "PENDING" || payment.rental.status === "CONFIRMED")
      ) {
        nextRentalStatus = "CANCELLED";
      }

      if (nextRentalStatus !== payment.rental.status) {
        await tx.rental.update({
          where: { id: payment.rental.id },
          data: { status: nextRentalStatus },
        });
      }

      const shouldKeepCarBooked = ACTIVE_RENTAL_STATUSES.includes(nextRentalStatus);

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
            status: { in: ACTIVE_RENTAL_STATUSES },
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

      return {
        kind: "ok" as const,
        userId: payment.userId,
        carName: payment.rental.car.name,
        amount: payment.amount,
        transactionRef: payment.transactionRef,
        previousPaymentStatus: payment.status,
        previousRentalStatus: payment.rental.status,
        nextRentalStatus,
      };
    })
    .catch((error) => {
      console.error("midtrans webhook transaction failed:", error);
      return { kind: "error" as const };
    });

  if (transactionResult.kind === "not-found") {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  if (transactionResult.kind === "error") {
    return NextResponse.json({ error: "Failed to process callback." }, { status: 500 });
  }

  if (nextPaymentStatus === "PAID" && transactionResult.previousPaymentStatus !== "PAID") {
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
    orderId,
    paymentStatus: nextPaymentStatus,
  });
}