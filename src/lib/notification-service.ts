import { Prisma, type NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type NotificationInput = {
  userId: string;
  type: NotificationType;
  subject: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
};

export async function queueNotification(input: NotificationInput) {
  return prisma.emailNotification.create({
    data: {
      userId: input.userId,
      type: input.type,
      subject: input.subject,
      message: input.message,
      metadata: input.metadata ?? Prisma.JsonNull,
    },
  });
}

export async function notifyRentalCreated(args: {
  userId: string;
  carName: string;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
}) {
  await queueNotification({
    userId: args.userId,
    type: "RENTAL_CREATED",
    subject: "Rental booking diterima",
    message: `Booking ${args.carName} untuk periode ${args.startDate.toLocaleDateString("id-ID")} - ${args.endDate.toLocaleDateString("id-ID")} telah dibuat dengan total pembayaran Rp ${args.totalAmount.toLocaleString("id-ID")}.`,
    metadata: {
      carName: args.carName,
      startDate: args.startDate.toISOString(),
      endDate: args.endDate.toISOString(),
      totalAmount: args.totalAmount,
    },
  });
}

export async function notifyPaymentReceived(args: {
  userId: string;
  carName: string;
  amount: number;
  transactionRef: string;
}) {
  await queueNotification({
    userId: args.userId,
    type: "PAYMENT_RECEIVED",
    subject: "Pembayaran rental berhasil",
    message: `Pembayaran untuk ${args.carName} sebesar Rp ${args.amount.toLocaleString("id-ID")} berhasil diterima. Referensi: ${args.transactionRef}.`,
    metadata: {
      carName: args.carName,
      amount: args.amount,
      transactionRef: args.transactionRef,
    },
  });
}

export async function notifyRentalStatusChanged(args: {
  userId: string;
  carName: string;
  statusLabel: string;
}) {
  await queueNotification({
    userId: args.userId,
    type: "RENTAL_STATUS_CHANGED",
    subject: "Status rental diperbarui",
    message: `Status rental ${args.carName} diperbarui menjadi ${args.statusLabel}.`,
    metadata: {
      carName: args.carName,
      statusLabel: args.statusLabel,
    },
  });
}

export async function dispatchQueuedNotifications(limit = 100) {
  const queued = await prisma.emailNotification.findMany({
    where: { status: "QUEUED" },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: {
      user: {
        select: { email: true },
      },
    },
  });

  if (queued.length === 0) {
    return { processed: 0 };
  }

  for (const item of queued) {
    console.info(
      `[mail-simulated] to=${item.user.email} subject=${item.subject} message=${item.message}`
    );
  }

  await prisma.emailNotification.updateMany({
    where: {
      id: { in: queued.map((item) => item.id) },
      status: "QUEUED",
    },
    data: {
      status: "SENT",
      sentAt: new Date(),
    },
  });

  return { processed: queued.length };
}
