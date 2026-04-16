import type { PaymentMethod } from "@prisma/client";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import {
  calculateDailyRate,
  calculateRentalDays,
  createTransactionReference,
  formatRupiah,
  PAYMENT_METHOD_OPTIONS,
} from "@/lib/rental";
import {
  notifyPaymentReceived,
  notifyRentalCreated,
  notifyRentalStatusChanged,
} from "@/lib/notification-service";
import { prisma } from "@/lib/prisma";

const PAYMENT_METHOD_VALUES: PaymentMethod[] = [
  "BANK_TRANSFER",
  "E_WALLET",
  "CREDIT_CARD",
  "VIRTUAL_ACCOUNT",
];

const RENTAL_STATUS_LABEL: Record<string, string> = {
  PENDING: "Awaiting Payment",
  CONFIRMED: "Confirmed",
  ACTIVE: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function parseDateInput(value: string): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export default async function RentalsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in?next=/rentals");
  }

  const [cars, rentals] = await Promise.all([
    prisma.car.findMany({
      where: { status: { not: "INACTIVE" } },
      include: { brand: true },
      orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.rental.findMany({
      where: { userId: user.id },
      include: {
        car: {
          include: { brand: true },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  async function createRentalAction(formData: FormData) {
    "use server";

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      redirect("/sign-in?next=/rentals");
    }

    const carId = formData.get("carId");
    const startDateValue = formData.get("startDate");
    const endDateValue = formData.get("endDate");
    const notesValue = formData.get("notes");

    if (
      typeof carId !== "string" ||
      typeof startDateValue !== "string" ||
      typeof endDateValue !== "string"
    ) {
      return;
    }

    const startDate = parseDateInput(startDateValue);
    const endDate = parseDateInput(endDateValue);

    if (!startDate || !endDate || endDate < startDate) {
      return;
    }

    const car = await prisma.car.findUnique({
      where: { id: carId },
      select: {
        id: true,
        name: true,
        power: true,
      },
    });

    if (!car) {
      return;
    }

    const totalDays = calculateRentalDays(startDate, endDate);
    const dailyRate = calculateDailyRate(car.power);
    const totalAmount = totalDays * dailyRate;
    const notes = typeof notesValue === "string" ? notesValue.trim() : "";

    const { rental, payment } = await prisma.$transaction(async (tx) => {
      const createdRental = await tx.rental.create({
        data: {
          userId: currentUser.id,
          carId: car.id,
          startDate,
          endDate,
          totalDays,
          totalAmount,
          status: "PENDING",
          notes: notes || null,
        },
      });

      const createdPayment = await tx.payment.create({
        data: {
          rentalId: createdRental.id,
          userId: currentUser.id,
          amount: totalAmount,
          method: "BANK_TRANSFER",
          status: "PENDING",
          transactionRef: createTransactionReference(),
        },
      });

      return { rental: createdRental, payment: createdPayment };
    });

    await notifyRentalCreated({
      userId: currentUser.id,
      carName: car.name,
      startDate: rental.startDate,
      endDate: rental.endDate,
      totalAmount: payment.amount,
    });

    revalidatePath("/rentals");
    revalidatePath("/notifications");
    revalidatePath("/admin");
  }

  async function payRentalAction(formData: FormData) {
    "use server";

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      redirect("/sign-in?next=/rentals");
    }

    const rentalId = formData.get("rentalId");
    const methodValue = formData.get("method");

    if (typeof rentalId !== "string" || typeof methodValue !== "string") {
      return;
    }

    if (!PAYMENT_METHOD_VALUES.includes(methodValue as PaymentMethod)) {
      return;
    }

    const rental = await prisma.rental.findFirst({
      where: {
        id: rentalId,
        userId: currentUser.id,
      },
      include: {
        car: {
          select: { name: true },
        },
        payment: true,
      },
    });

    if (!rental || !rental.payment) {
      return;
    }

    if (rental.payment.status === "PAID") {
      return;
    }

    const paidAt = new Date();

    const payment = await prisma.payment.update({
      where: { id: rental.payment.id },
      data: {
        method: methodValue as PaymentMethod,
        status: "PAID",
        paidAt,
      },
    });

    await prisma.rental.update({
      where: { id: rental.id },
      data: { status: "CONFIRMED" },
    });

    await notifyPaymentReceived({
      userId: currentUser.id,
      carName: rental.car.name,
      amount: payment.amount,
      transactionRef: payment.transactionRef,
    });

    await notifyRentalStatusChanged({
      userId: currentUser.id,
      carName: rental.car.name,
      statusLabel: "Confirmed",
    });

    revalidatePath("/rentals");
    revalidatePath("/notifications");
    revalidatePath("/admin");
  }

  return (
    <main className="min-h-screen px-6 py-28" style={{ background: "#e8e8e8" }}>
      <section className="mx-auto w-full max-w-6xl rounded-sm border border-black/10 bg-white/90 p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-gray-400">Account</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">Rental Management</h1>
            <p className="mt-2 text-sm text-gray-500">
              Create bookings, continue payments, and track your rental status.
            </p>
          </div>
          <Link
            href="/profile"
            className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white"
          >
            Back to Profile
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
          <article className="border border-black/10 bg-white p-5">
            <h2 className="text-lg font-semibold text-black">Create New Rental</h2>
            <form action={createRentalAction} className="mt-5 flex flex-col gap-4">
              <label className="text-sm text-gray-600">
                Car
                <select
                  name="carId"
                  required
                  className="mt-2 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
                >
                  <option value="">Select a car</option>
                  {cars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.brand.name} {car.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm text-gray-600">
                  Start Date
                  <input
                    type="date"
                    name="startDate"
                    required
                    className="mt-2 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
                  />
                </label>

                <label className="text-sm text-gray-600">
                  End Date
                  <input
                    type="date"
                    name="endDate"
                    required
                    className="mt-2 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
                  />
                </label>
              </div>

              <label className="text-sm text-gray-600">
                Notes (optional)
                <textarea
                  name="notes"
                  rows={3}
                  className="mt-2 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
                  placeholder="Example: prefer a dark-colored unit"
                />
              </label>

              <button
                type="submit"
                className="mt-2 border border-black bg-black px-4 py-3 text-xs uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black"
              >
                Create Rental Booking
              </button>
            </form>
          </article>

          <article className="border border-black/10 bg-white p-5">
            <h2 className="text-lg font-semibold text-black">Rental Summary</h2>
            <p className="mt-2 text-sm text-gray-500">Total bookings: {rentals.length}</p>
            <div className="mt-5 space-y-3">
              {rentals.slice(0, 3).map((rental) => (
                <div key={rental.id} className="border border-black/10 px-3 py-2">
                  <p className="text-sm font-medium text-black">{rental.car.brand.name} {rental.car.name}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(rental.startDate)}
                    {" - "}
                    {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(rental.endDate)}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-gray-500">
                    {RENTAL_STATUS_LABEL[rental.status] ?? rental.status}
                  </p>
                </div>
              ))}
              {rentals.length === 0 ? (
                <p className="text-sm text-gray-500">No rental bookings yet.</p>
              ) : null}
            </div>
          </article>
        </div>

        <div className="mt-10 space-y-5">
          <h2 className="text-xl font-semibold text-black">Your Rentals</h2>
          {rentals.length === 0 ? (
            <p className="border border-black/10 bg-white p-4 text-sm text-gray-500">
              You do not have any rentals yet.
            </p>
          ) : (
            rentals.map((rental) => (
              <article key={rental.id} className="border border-black/10 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-400">{rental.car.brand.name}</p>
                    <h3 className="mt-1 text-lg font-semibold text-black">{rental.car.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(rental.startDate)}
                      {" - "}
                      {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(rental.endDate)}
                      {" • "}
                      {rental.totalDays} days
                    </p>
                    <p className="mt-1 text-sm text-gray-500">Total: {formatRupiah(rental.totalAmount)}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-gray-500">
                      Status: {RENTAL_STATUS_LABEL[rental.status] ?? rental.status}
                    </p>
                  </div>

                  {rental.payment && rental.payment.status !== "PAID" ? (
                    <form action={payRentalAction} className="w-full max-w-xs space-y-2">
                      <input type="hidden" name="rentalId" value={rental.id} />
                      <label className="block text-xs uppercase tracking-[0.16em] text-gray-500">
                        Payment Method
                        <select
                          name="method"
                          required
                          defaultValue={rental.payment.method}
                          className="mt-1 w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-black"
                        >
                          {PAYMENT_METHOD_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="submit"
                        className="w-full border border-black px-4 py-2 text-xs uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white"
                      >
                        Pay Now
                      </button>
                    </form>
                  ) : (
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.14em] text-emerald-600">
                        Payment completed
                      </p>
                      {rental.payment ? (
                        <p className="mt-1 text-xs text-gray-500">Ref: {rental.payment.transactionRef}</p>
                      ) : null}
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
