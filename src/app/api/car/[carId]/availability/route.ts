import { type RentalStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ACTIVE_RENTAL_STATUSES: RentalStatus[] = ["PENDING", "CONFIRMED", "ACTIVE"];

export const dynamic = "force-dynamic";

type AvailabilityRouteContext = {
  params: Promise<{ carId: string }>;
};

function parseDateParam(value: string | null): Date | null {
  if (!value || value.trim() === "") {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function toDateOnlyIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest, context: AvailabilityRouteContext) {
  const { carId } = await context.params;
  const normalizedCarId = carId?.trim() ?? "";

  if (!normalizedCarId) {
    return NextResponse.json({ error: "carId is required." }, { status: 400 });
  }

  const rawFrom = request.nextUrl.searchParams.get("from");
  const rawTo = request.nextUrl.searchParams.get("to");

  const fromDate = parseDateParam(rawFrom);
  const toDate = parseDateParam(rawTo);

  if (rawFrom && !fromDate) {
    return NextResponse.json(
      { error: "Invalid 'from' date. Use YYYY-MM-DD format." },
      { status: 400 }
    );
  }

  if (rawTo && !toDate) {
    return NextResponse.json(
      { error: "Invalid 'to' date. Use YYYY-MM-DD format." },
      { status: 400 }
    );
  }

  if (fromDate && toDate && toDate < fromDate) {
    return NextResponse.json(
      { error: "'to' date must be the same as or later than 'from' date." },
      { status: 400 }
    );
  }

  const car = await prisma.car.findUnique({
    where: { id: normalizedCarId },
    select: {
      id: true,
      name: true,
      status: true,
      brand: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!car) {
    return NextResponse.json({ error: "Car not found." }, { status: 404 });
  }

  const blockedRentals = await prisma.rental.findMany({
    where: {
      carId: normalizedCarId,
      status: { in: ACTIVE_RENTAL_STATUSES },
      ...(fromDate ? { endDate: { gte: fromDate } } : {}),
      ...(toDate ? { startDate: { lte: toDate } } : {}),
    },
    orderBy: [{ startDate: "asc" }, { endDate: "asc" }],
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true,
      totalDays: true,
    },
  });

  return NextResponse.json(
    {
      car: {
        id: car.id,
        name: car.name,
        brand: car.brand.name,
        status: car.status,
      },
      filters: {
        from: fromDate ? toDateOnlyIso(fromDate) : null,
        to: toDate ? toDateOnlyIso(toDate) : null,
      },
      activeStatuses: ACTIVE_RENTAL_STATUSES,
      blockedRanges: blockedRentals.map((rental) => ({
        rentalId: rental.id,
        status: rental.status,
        startDate: toDateOnlyIso(rental.startDate),
        endDate: toDateOnlyIso(rental.endDate),
        totalDays: rental.totalDays,
      })),
      totalBlockedRanges: blockedRentals.length,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
