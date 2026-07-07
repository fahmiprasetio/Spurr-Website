import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import {
  mapMidtransTransactionToPaymentStatus,
  resolvePaymentStatusTransition,
  type MidtransNotificationPayload,
} from "@/lib/midtrans";
import {
  notifyPaymentReceived,
  notifyRentalStatusChanged,
} from "@/lib/notification-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getStatusApiConfig(): { serverKey: string; apiBaseUrl: string } | null {
  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
  if (!serverKey) {
    return null;
  }
  const isProduction =
    process.env.MIDTRANS_IS_PRODUCTION === "true" ||
    process.env.MIDTRANS_IS_PRODUCTION === "1";
  return {
    serverKey,
    apiBaseUrl: isProduction
      ? "https://api.midtrans.com"
      : "https://api.sandbox.midtrans.com",
  };
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  const orderId =
    body && typeof body === "object" && "orderId" in body
      ? String((body as { orderId?: unknown }).orderId ?? "").trim()
      : "";

  if (!orderId) {
    return NextResponse.json({ error: "missing-order-id" }, { status: 400 });
  }

  const config = getStatusApiConfig();
  if (!config) {
    return NextResponse.json({ error: "not-configured" }, { status: 503 });
  }

  const payment = await prisma.payment.findUnique({
    where: { transactionRef: orderId },
    include: {
      rental: {
        select: {
          id: true,
          status: true,
          car: { select: { name: true } },
        },
      },
    },
  });

  if (!payment || payment.userId !== user.id) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const authToken = Buffer.from(`${config.serverKey}:`).toString("base64");

  const statusResponse = await fetch(
    `${config.apiBaseUrl}/v2/${encodeURIComponent(orderId)}/status`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${authToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  ).catch(() => null);

  if (!statusResponse) {
    return NextResponse.json({ error: "gateway-unreachable" }, { status: 502 });
  }

  const rawStatus = await statusResponse.text();

  if (!statusResponse.ok) {
    return NextResponse.json(
      { error: "gateway-error", detail: rawStatus.slice(0, 300) },
      { status: 502 },
    );
  }

  let payload: MidtransNotificationPayload;
  try {
    payload = JSON.parse(rawStatus) as MidtransNotificationPayload;
  } catch {
    return NextResponse.json({ error: "bad-gateway-response" }, { status: 502 });
  }

  const candidateStatus = mapMidtransTransactionToPaymentStatus(payload);
  const nextPaymentStatus = resolvePaymentStatusTransition(payment.status, candidateStatus);

  const previousPaymentStatus = payment.status;
  const previousRentalStatus = payment.rental.status;

  const nextRentalStatus = await prisma.$transaction(async (tx) => {
    const shouldSetPaidAt = nextPaymentStatus === "PAID" && !payment.paidAt;

    if (nextPaymentStatus !== payment.status || shouldSetPaidAt) {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: nextPaymentStatus,
          ...(shouldSetPaidAt ? { paidAt: new Date() } : {}),
        },
      });
    }

    if (nextPaymentStatus === "PAID" && payment.rental.status === "PENDING") {
      await tx.rental.update({
        where: { id: payment.rental.id },
        data: { status: "CONFIRMED" },
      });
      return "CONFIRMED" as const;
    }

    return payment.rental.status;
  });

  if (nextPaymentStatus === "PAID" && previousPaymentStatus !== "PAID") {
    await notifyPaymentReceived({
      userId: payment.userId,
      carName: payment.rental.car.name,
      amount: payment.amount,
      transactionRef: payment.transactionRef,
    }).catch(() => {});
  }

  if (previousRentalStatus !== nextRentalStatus) {
    await notifyRentalStatusChanged({
      userId: payment.userId,
      carName: payment.rental.car.name,
      statusLabel: "Confirmed",
    }).catch(() => {});
  }

  return NextResponse.json({
    ok: true,
    paymentStatus: nextPaymentStatus,
    rentalStatus: nextRentalStatus,
  });
}