import { Prisma, type PaymentMethod, type RentalStatus } from "@prisma/client";
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
  notifyRentalCreated,
  notifyRentalStatusChanged,
} from "@/lib/notification-service";
import { createMidtransSnapTransaction, isMidtransConfigured } from "@/lib/midtrans";
import { prisma } from "@/lib/prisma";
import SnapPaymentHandler from "@/components/SnapPaymentHandler";

const PAYMENT_METHOD_VALUES: PaymentMethod[] = [
  "BANK_TRANSFER",
  "E_WALLET",
  "CREDIT_CARD",
  "VIRTUAL_ACCOUNT",
];

const ACTIVE_RENTAL_STATUSES: RentalStatus[] = ["PENDING", "CONFIRMED", "ACTIVE"];

const CANCELLABLE_RENTAL_STATUSES: RentalStatus[] = ["PENDING", "CONFIRMED"];

const RENTAL_STATUS_LABEL: Record<string, string> = {
  PENDING: "Awaiting Payment",
  CONFIRMED: "Confirmed",
  ACTIVE: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_MESSAGES: Record<string, string> = {
  "rental-created": "Rental booking created successfully.",
  "payment-completed": "Payment completed successfully.",
  "payment-pending": "Payment is being verified. Your booking status will update shortly.",
  "payment-already-paid": "This rental has already been paid.",
  "rental-cancelled": "Rental booking cancelled successfully.",
};

const ERROR_MESSAGES: Record<string, string> = {
  "invalid-input": "Invalid input. Please check your form and try again.",
  "invalid-date-range": "End date must be the same as or later than the start date.",
  "start-date-past": "Start date cannot be in the past.",
  "notes-too-long": "Notes are too long. Maximum 500 characters.",
  "car-not-found": "Selected car was not found.",
  "car-unavailable": "Selected car is not available for the chosen dates.",
  "rental-create-failed": "Unable to create rental at the moment. Please try again.",
  "invalid-payment-input": "Invalid payment request.",
  "invalid-payment-method": "Invalid payment method.",
  "rental-not-found": "Rental record was not found.",
  "payment-not-allowed": "Payment is not allowed for this rental status.",
  "payment-failed": "Payment processing failed. Please try again.",
  "payment-gateway-unavailable": "Payment gateway is not configured yet.",
  "payment-gateway-failed": "Unable to start payment session. Please try again.",
  "cancel-not-allowed": "This rental cannot be cancelled from your account.",
  "cancel-failed": "Failed to cancel rental. Please try again.",
};

type RentalsPageProps = {
  searchParams: Promise<{
    status?: string;
    error?: string;
    snap_token?: string;
    carId?: string;
  }>;
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

function isRentalOverlapConstraintError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const meta = JSON.stringify(error.meta ?? {});
    return (
      meta.includes("Rental_no_overlap_active_status_excl") ||
      error.message.includes("Rental_no_overlap_active_status_excl")
    );
  }
  if (error instanceof Error) {
    return (
      error.message.includes("Rental_no_overlap_active_status_excl") ||
      error.message.includes("conflicting key value violates exclusion constraint")
    );
  }
  return false;
}

export default async function RentalsPage({ searchParams }: RentalsPageProps) {
  const [user, resolvedSearchParams] = await Promise.all([
    getCurrentUser(),
    searchParams,
  ]);

  const clientKey = process.env.MIDTRANS_CLIENT_KEY || "";
  const isProduction =
    process.env.MIDTRANS_IS_PRODUCTION === "true" ||
    process.env.MIDTRANS_IS_PRODUCTION === "1";

  if (!user) {
    redirect("/sign-in?next=/rentals");
  }

  const statusMessage = resolvedSearchParams.status
    ? STATUS_MESSAGES[resolvedSearchParams.status] ?? null
    : null;
  const errorMessage = resolvedSearchParams.error
    ? ERROR_MESSAGES[resolvedSearchParams.error] ?? null
    : null;

  const todayMinDate = new Date().toISOString().slice(0, 10);

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

  const requestedCarId = resolvedSearchParams.carId?.trim() || "";
  const lockedCar = requestedCarId
    ? cars.find((car) => car.id === requestedCarId) ?? null
    : null;
  const lockedCarUnavailable =
    !!lockedCar &&
    (lockedCar.status === "INACTIVE" || lockedCar.status === "MAINTENANCE");
  const lockedDailyRate = lockedCar ? calculateDailyRate(lockedCar.power) : null;

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
      redirect("/rentals?error=invalid-input");
    }

    const startDate = parseDateInput(startDateValue);
    const endDate = parseDateInput(endDateValue);
    const notes = typeof notesValue === "string" ? notesValue.trim() : "";

    if (!startDate || !endDate || endDate < startDate) {
      redirect("/rentals?error=invalid-date-range");
    }

    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);
    if (startDate < todayUtc) {
      redirect("/rentals?error=start-date-past");
    }

    if (notes.length > 500) {
      redirect("/rentals?error=notes-too-long");
    }

    const car = await prisma.car.findUnique({
      where: { id: carId },
      select: {
        id: true,
        name: true,
        power: true,
        status: true,
      },
    });

    if (!car) {
      redirect("/rentals?error=car-not-found");
    }

    if (car.status === "INACTIVE" || car.status === "MAINTENANCE") {
      redirect("/rentals?error=car-unavailable");
    }

    const overlappingRental = await prisma.rental.findFirst({
      where: {
        carId: car.id,
        status: { in: ACTIVE_RENTAL_STATUSES },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      select: { id: true },
    });

    if (overlappingRental) {
      redirect("/rentals?error=car-unavailable");
    }

    const totalDays = calculateRentalDays(startDate, endDate);
    const dailyRate = calculateDailyRate(car.power);
    const totalAmount = totalDays * dailyRate;

    const transactionResult = await prisma
      .$transaction(async (tx) => {
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

        await tx.car.updateMany({
          where: {
            id: car.id,
            status: "AVAILABLE",
          },
          data: {
            status: "BOOKED",
          },
        });

        return { ok: true as const, rental: createdRental, payment: createdPayment };
      })
      .catch((error) => {
        if (isRentalOverlapConstraintError(error)) {
          return { ok: false as const, reason: "overlap" as const };
        }
        console.error("createRentalAction failed:", error);
        return { ok: false as const, reason: "unknown" as const };
      });

    if (!transactionResult.ok) {
      if (transactionResult.reason === "overlap") {
        redirect("/rentals?error=car-unavailable");
      }
      redirect("/rentals?error=rental-create-failed");
    }

    const { rental, payment } = transactionResult;

    try {
      await notifyRentalCreated({
        userId: currentUser.id,
        carName: car.name,
        startDate: rental.startDate,
        endDate: rental.endDate,
        totalAmount: payment.amount,
      });
    } catch (error) {
      console.error("notifyRentalCreated failed:", error);
    }

    revalidatePath("/rentals");
    revalidatePath("/notifications");
    revalidatePath("/admin");
    redirect("/rentals?status=rental-created");
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
      redirect("/rentals?error=invalid-payment-input");
    }

    if (!PAYMENT_METHOD_VALUES.includes(methodValue as PaymentMethod)) {
      redirect("/rentals?error=invalid-payment-method");
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
      redirect("/rentals?error=rental-not-found");
    }

    if (rental.status === "CANCELLED" || rental.status === "COMPLETED") {
      redirect("/rentals?error=payment-not-allowed");
    }

    if (rental.payment.status === "PAID") {
      redirect("/rentals?status=payment-already-paid");
    }

    if (!isMidtransConfigured()) {
      redirect("/rentals?error=payment-gateway-unavailable");
    }

    const transactionResult = await prisma
      .$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
          where: { id: rental.payment!.id },
          data: {
            method: methodValue as PaymentMethod,
            status: "PENDING",
          },
        });
        return { payment: updatedPayment };
      })
      .catch((error) => {
        console.error("payRentalAction failed:", error);
        return null;
      });

    if (!transactionResult) {
      redirect("/rentals?error=payment-failed");
    }

    const { payment } = transactionResult;

    const customerName =
      currentUser.name?.trim() || currentUser.email.split("@")[0] || "SPURR Driver";

    const gatewaySession = await createMidtransSnapTransaction({
      orderId: payment.transactionRef,
      grossAmount: payment.amount,
      customerName,
      customerEmail: currentUser.email,
      itemName: `${rental.car.name} Rental`,
    }).catch((error) => {
      console.error("createMidtransSnapTransaction failed:", error);
      return null;
    });

    if (!gatewaySession) {
      redirect("/rentals?error=payment-gateway-failed");
    }

    revalidatePath("/rentals");
    revalidatePath("/notifications");
    revalidatePath("/admin");
    redirect(`/rentals?snap_token=${gatewaySession.token}`);
  }

  async function cancelRentalAction(formData: FormData) {
    "use server";
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      redirect("/sign-in?next=/rentals");
    }

    const rentalId = formData.get("rentalId");
    if (typeof rentalId !== "string") {
      redirect("/rentals?error=invalid-input");
    }

    const rental = await prisma.rental.findFirst({
      where: {
        id: rentalId,
        userId: currentUser.id,
      },
      include: {
        car: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        payment: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!rental) {
      redirect("/rentals?error=rental-not-found");
    }

    if (
      !CANCELLABLE_RENTAL_STATUSES.includes(rental.status) ||
      rental.payment?.status === "PAID"
    ) {
      redirect("/rentals?error=cancel-not-allowed");
    }

    const cancelResult = await prisma
      .$transaction(async (tx) => {
        await tx.rental.update({
          where: { id: rental.id },
          data: { status: "CANCELLED" },
        });

        if (rental.car.status === "BOOKED") {
          const hasOtherBookedRentals = await tx.rental.findFirst({
            where: {
              carId: rental.car.id,
              id: { not: rental.id },
              status: { in: ACTIVE_RENTAL_STATUSES },
            },
            select: { id: true },
          });

          if (!hasOtherBookedRentals) {
            await tx.car.update({
              where: { id: rental.car.id },
              data: { status: "AVAILABLE" },
            });
          }
        }

        return true;
      })
      .catch((error) => {
        console.error("cancelRentalAction failed:", error);
        return false;
      });

    if (!cancelResult) {
      redirect("/rentals?error=cancel-failed");
    }

    try {
      await notifyRentalStatusChanged({
        userId: currentUser.id,
        carName: rental.car.name,
        statusLabel: "Cancelled",
      });
    } catch (error) {
      console.error("cancelRentalAction notification failed:", error);
    }

    revalidatePath("/rentals");
    revalidatePath("/notifications");
    revalidatePath("/admin");
    redirect("/rentals?status=rental-cancelled");
  }

  return (
    <main className="min-h-screen px-6 py-28">
      <section className="mx-auto w-full max-w-6xl rounded-sm border border-black/10 bg-white/90 p-6 shadow-sm md:p-8">
        {statusMessage ? (
          <div className="mb-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {statusMessage}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-gray-400">Account</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">
              Rental Management
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {lockedCar
                ? "Confirm the dates for the car you selected."
                : "Create bookings, continue payments, and track your rental status."}
            </p>
          </div>
          <Link
            href="/profile"
            className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white"
          >
            Back to Profile
          </Link>
        </div>

        <div className="mt-8">
          <article className="mx-auto w-full max-w-2xl border border-black/10 bg-white p-5">
            <h2 className="text-lg font-semibold text-black">Create New Rental</h2>
            <form action={createRentalAction} className="mt-5 flex flex-col gap-4">
              {lockedCar ? (
                <div className="text-sm text-gray-600">
                  <span>Car</span>
                  <div className="mt-2 flex items-center justify-between border border-black/20 bg-gray-50 px-3 py-2">
                    <span className="font-medium text-black">
                      {lockedCar.brand.name} {lockedCar.name}
                    </span>
                    <span className="text-xs uppercase tracking-[0.14em] text-gray-400">
                      Locked
                    </span>
                  </div>
                  <input type="hidden" name="carId" value={lockedCar.id} />
                  {lockedDailyRate !== null ? (
                    <p className="mt-2 text-xs text-gray-500">
                      Daily rate: {formatRupiah(lockedDailyRate)}
                    </p>
                  ) : null}
                  {lockedCarUnavailable ? (
                    <p className="mt-2 text-xs text-red-600">
                      This car is currently unavailable for the selected period.
                    </p>
                  ) : null}
                </div>
              ) : (
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
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm text-gray-600">
                  Start Date
                  <input
                    type="date"
                    name="startDate"
                    required
                    min={todayMinDate}
                    className="mt-2 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
                  />
                </label>
                <label className="text-sm text-gray-600">
                  End Date
                  <input
                    type="date"
                    name="endDate"
                    required
                    min={todayMinDate}
                    className="mt-2 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
                  />
                </label>
              </div>

              <label className="text-sm text-gray-600">
                Notes (optional)
                <textarea
                  name="notes"
                  rows={3}
                  maxLength={500}
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
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                      {rental.car.brand.name}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-black">
                      {rental.car.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
                        rental.startDate,
                      )}
                      {" - "}
                      {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
                        rental.endDate,
                      )}
                      {" \u2022 "}
                      {rental.totalDays} days
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Total: {formatRupiah(rental.totalAmount)}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-gray-500">
                      Status: {RENTAL_STATUS_LABEL[rental.status] ?? rental.status}
                    </p>
                  </div>
                  {rental.payment &&
                  rental.payment.status !== "PAID" &&
                  rental.status !== "CANCELLED" &&
                  rental.status !== "COMPLETED" ? (
                    <div className="w-full max-w-xs space-y-2">
                      <form action={payRentalAction} className="space-y-2">
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
                      {CANCELLABLE_RENTAL_STATUSES.includes(rental.status) ? (
                        <form action={cancelRentalAction}>
                          <input type="hidden" name="rentalId" value={rental.id} />
                          <button
                            type="submit"
                            className="w-full border border-red-300 px-4 py-2 text-xs uppercase tracking-[0.2em] text-red-700 hover:bg-red-50"
                          >
                            Cancel Booking
                          </button>
                        </form>
                      ) : null}
                    </div>
                  ) : (
                    <div className="text-right">
                      {rental.payment?.status === "PAID" ? (
                        <p className="text-xs uppercase tracking-[0.14em] text-emerald-600">
                          Payment completed
                        </p>
                      ) : (
                        <p className="text-xs uppercase tracking-[0.14em] text-gray-500">
                          Payment not available
                        </p>
                      )}
                      {rental.payment ? (
                        <p className="mt-1 text-xs text-gray-500">
                          Ref: {rental.payment.transactionRef}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {resolvedSearchParams.snap_token ? (
        <SnapPaymentHandler
          token={resolvedSearchParams.snap_token}
          clientKey={clientKey}
          isProduction={isProduction}
        />
      ) : null}
    </main>
  );
}