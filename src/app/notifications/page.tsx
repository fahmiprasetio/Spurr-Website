import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

const STATUS_LABEL: Record<string, string> = {
  QUEUED: "Queued",
  SENT: "Sent",
  FAILED: "Failed",
};

const TYPE_LABEL: Record<string, string> = {
  RENTAL_CREATED: "Rental Created",
  PAYMENT_RECEIVED: "Payment Received",
  RENTAL_STATUS_CHANGED: "Rental Status Changed",
  GENERAL_UPDATE: "General Update",
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in?next=/notifications");
  }

  const notifications = await prisma.emailNotification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <main className="min-h-screen px-6 py-28" style={{ background: "#e8e8e8" }}>
      <section className="mx-auto w-full max-w-5xl rounded-sm border border-black/10 bg-white/90 p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-gray-400">Account</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">Email Notifications</h1>
            <p className="mt-2 text-sm text-gray-500">
              Automatic email history for bookings, payments, and rental status updates.
            </p>
          </div>
          <Link
            href="/profile"
            className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white"
          >
            Back to Profile
          </Link>
        </div>

        <div className="mt-8 space-y-3">
          {notifications.length === 0 ? (
            <p className="border border-black/10 bg-white p-4 text-sm text-gray-500">
              No notifications yet.
            </p>
          ) : (
            notifications.map((notification) => (
              <article key={notification.id} className="border border-black/10 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
                    {TYPE_LABEL[notification.type] ?? notification.type}
                  </p>
                  <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
                    {STATUS_LABEL[notification.status] ?? notification.status}
                  </p>
                </div>
                <h2 className="mt-2 text-base font-semibold text-black">{notification.subject}</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{notification.message}</p>
                <p className="mt-3 text-xs text-gray-400">
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(notification.createdAt)}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
