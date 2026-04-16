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
    subject: "Rental booking received",
    message: `Your booking for ${args.carName} from ${args.startDate.toLocaleDateString("en-US")} - ${args.endDate.toLocaleDateString("en-US")} has been created with a total payment of Rp ${args.totalAmount.toLocaleString("en-US")}.`,
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
    subject: "Rental payment received",
    message: `Payment for ${args.carName} of Rp ${args.amount.toLocaleString("en-US")} has been received. Reference: ${args.transactionRef}.`,
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
    subject: "Rental status updated",
    message: `The rental status for ${args.carName} has been updated to ${args.statusLabel}.`,
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
