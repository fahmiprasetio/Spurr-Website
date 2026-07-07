import { Prisma, type RentalStatus } from "@prisma/client";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import {
  calculateDailyRate,
  calculateRentalDays,
  createTransactionReference,
  formatRupiah,
} from "@/lib/rental";
import { notifyRentalCreated } from "@/lib/notification-service";
import { prisma } from "@/lib/prisma";
import RentalDateFields from "@/components/RentalDateFields";

const ACTIVE_RENTAL_STATUSES: RentalStatus[] = ["PENDING", "CONFIRMED", "ACTIVE"];

const STATUS_MESSAGES: Record<string, string> = {
  "rental-created": "Rental booking created successfully.",
};

const ERROR_MESSAGES: Record<string, string> = {
  "invalid-input": "Invalid input. Please check your form and try again.",
  "invalid-date-range": "End date must be the same as or later than the start date.",
  "start-date-past": "Start date cannot be in the past.",
  "notes-too-long": "Notes are too long. Maximum 500 characters.",
  "car-not-found": "Selected car was not found.",
  "car-unavailable": "Selected car is not available for the chosen dates.",
  "rental-create-failed": "Unable to create rental at the moment. Please try again.",
};

type RentalsPageProps = {
  searchParams: Promise<{
    status?: string;
    error?: string;
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

  const cars = await prisma.car.findMany({
    where: { status: { not: "INACTIVE" } },
    include: { brand: true },
    orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
  });

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

  return (
    <main className="min-h-screen px-6 py-28">
      <section className="mx-auto w-full max-w-2xl rounded-sm border border-black/10 bg-white/90 p-6 shadow-sm md:p-8">
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
              Confirm the dates to book your selected car.
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
          <article className="border border-black/10 bg-white p-5">
            <h2 className="text-lg font-semibold text-black">Create New Rental</h2>
            <form action={createRentalAction} className="mt-5 flex flex-col gap-4">
              {lockedCar ? (
                <div className="text-sm text-gray-600">
                  <span>Car</span>
                  <div className="mt-2 border border-black/20 bg-gray-50 px-3 py-2">
                    <span className="font-medium text-black">
                      {lockedCar.brand.name} {lockedCar.name}
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

              <RentalDateFields todayMinDate={todayMinDate} />

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
      </section>
    </main>
  );
}