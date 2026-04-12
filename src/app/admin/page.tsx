import type { RentalStatus } from "@prisma/client";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dispatchQueuedNotifications, notifyRentalStatusChanged } from "@/lib/notification-service";
import { formatRupiah } from "@/lib/rental";
import { getCurrentUser, hasAdminAccess } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

const RENTAL_STATUS_VALUES: RentalStatus[] = [
  "PENDING",
  "CONFIRMED",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
];

const RENTAL_STATUS_LABEL: Record<RentalStatus, string> = {
  PENDING: "Menunggu Pembayaran",
  CONFIRMED: "Terkonfirmasi",
  ACTIVE: "Sedang Berjalan",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in?next=/admin");
  }

  const canAccess = await hasAdminAccess(user.id, user.role);

  if (!canAccess) {
    redirect("/profile");
  }

  const [
    totalUsers,
    totalRentals,
    pendingPayments,
    queuedNotifications,
    recentRentals,
    latestNotifications,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.rental.count(),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.emailNotification.count({ where: { status: "QUEUED" } }),
    prisma.rental.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        car: {
          include: { brand: true },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.emailNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    }),
  ]);

  async function updateRentalStatusAction(formData: FormData) {
    "use server";

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      redirect("/sign-in?next=/admin");
    }

    const isAdmin = await hasAdminAccess(currentUser.id, currentUser.role);

    if (!isAdmin) {
      redirect("/profile");
    }

    const rentalId = formData.get("rentalId");
    const statusValue = formData.get("status");

    if (typeof rentalId !== "string" || typeof statusValue !== "string") {
      return;
    }

    if (!RENTAL_STATUS_VALUES.includes(statusValue as RentalStatus)) {
      return;
    }

    const updatedRental = await prisma.rental.update({
      where: { id: rentalId },
      data: { status: statusValue as RentalStatus },
      include: {
        user: {
          select: { id: true },
        },
        car: {
          select: { name: true },
        },
      },
    });

    await notifyRentalStatusChanged({
      userId: updatedRental.user.id,
      carName: updatedRental.car.name,
      statusLabel: RENTAL_STATUS_LABEL[statusValue as RentalStatus],
    });

    revalidatePath("/admin");
    revalidatePath("/rentals");
    revalidatePath("/notifications");
  }

  async function processQueuedEmailsAction() {
    "use server";

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      redirect("/sign-in?next=/admin");
    }

    const isAdmin = await hasAdminAccess(currentUser.id, currentUser.role);

    if (!isAdmin) {
      redirect("/profile");
    }

    await dispatchQueuedNotifications(200);

    revalidatePath("/admin");
    revalidatePath("/notifications");
  }

  return (
    <main className="min-h-screen px-6 py-28" style={{ background: "#e8e8e8" }}>
      <section className="mx-auto w-full max-w-7xl rounded-sm border border-black/10 bg-white/90 p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-gray-400">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-500">
              Monitoring rental, pembayaran, dan email notification queue.
            </p>
          </div>
          <Link
            href="/profile"
            className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white"
          >
            Kembali ke Profile
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <article className="border border-black/10 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Users</p>
            <p className="mt-2 text-2xl font-semibold text-black">{totalUsers}</p>
          </article>
          <article className="border border-black/10 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Rentals</p>
            <p className="mt-2 text-2xl font-semibold text-black">{totalRentals}</p>
          </article>
          <article className="border border-black/10 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Pending Payments</p>
            <p className="mt-2 text-2xl font-semibold text-black">{pendingPayments}</p>
          </article>
          <article className="border border-black/10 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Queued Emails</p>
            <p className="mt-2 text-2xl font-semibold text-black">{queuedNotifications}</p>
          </article>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-black">Recent Rentals</h2>
            </div>

            <div className="space-y-3">
              {recentRentals.length === 0 ? (
                <p className="border border-black/10 bg-white p-4 text-sm text-gray-500">
                  Belum ada data rental.
                </p>
              ) : (
                recentRentals.map((rental) => (
                  <article key={rental.id} className="border border-black/10 bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
                          {rental.user.name || rental.user.email}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-black">
                          {rental.car.brand.name} {rental.car.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(rental.startDate)}
                          {" - "}
                          {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(rental.endDate)}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">Total: {formatRupiah(rental.totalAmount)}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-gray-500">
                          Status saat ini: {RENTAL_STATUS_LABEL[rental.status]}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-gray-500">
                          Payment: {rental.payment?.status ?? "-"}
                        </p>
                      </div>

                      <form action={updateRentalStatusAction} className="w-full max-w-xs space-y-2">
                        <input type="hidden" name="rentalId" value={rental.id} />
                        <label className="block text-xs uppercase tracking-[0.16em] text-gray-500">
                          Ubah Status
                          <select
                            name="status"
                            defaultValue={rental.status}
                            className="mt-1 w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-black"
                          >
                            {RENTAL_STATUS_VALUES.map((status) => (
                              <option key={status} value={status}>
                                {RENTAL_STATUS_LABEL[status]}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="submit"
                          className="w-full border border-black px-4 py-2 text-xs uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white"
                        >
                          Simpan Status
                        </button>
                      </form>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-black">Email Queue</h2>
              <form action={processQueuedEmailsAction}>
                <button
                  type="submit"
                  className="border border-black px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white"
                >
                  Process Queue
                </button>
              </form>
            </div>

            <div className="space-y-3">
              {latestNotifications.length === 0 ? (
                <p className="border border-black/10 bg-white p-4 text-sm text-gray-500">
                  Belum ada notifikasi email.
                </p>
              ) : (
                latestNotifications.map((item) => (
                  <article key={item.id} className="border border-black/10 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-gray-500">{item.type}</p>
                    <h3 className="mt-2 text-sm font-semibold text-black">{item.subject}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-gray-600">{item.message}</p>
                    <p className="mt-2 text-xs text-gray-400">To: {item.user.email}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-gray-500">
                      Status: {item.status}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
