"use client";

import { useMemo, useState } from "react";

type BookedRange = { start: string; end: string };

type RentalDateFieldsProps = {
  todayMinDate: string;
  dailyRate: number | null;
  initialStart?: string;
  initialEnd?: string;
  bookedRanges?: BookedRange[];
  carUnavailable?: boolean;
};

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

function formatRupiah(value: number): string {
  return rupiahFormatter.format(value);
}

function formatDisplayDate(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function countRentalDays(start: string, end: string): number {
  const startMs = new Date(`${start}T00:00:00.000Z`).getTime();
  const endMs = new Date(`${end}T00:00:00.000Z`).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) {
    return 0;
  }
  return Math.floor((endMs - startMs) / 86400000) + 1;
}

function findConflict(
  start: string,
  end: string,
  ranges: BookedRange[],
): BookedRange | null {
  if (!start || !end) {
    return null;
  }
  for (const range of ranges) {
    if (start <= range.end && end >= range.start) {
      return range;
    }
  }
  return null;
}

export default function RentalDateFields({
  todayMinDate,
  dailyRate,
  initialStart = "",
  initialEnd = "",
  bookedRanges = [],
  carUnavailable = false,
}: RentalDateFieldsProps) {
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);

  const handleStartChange = (value: string) => {
    setStartDate(value);
    if (endDate && value && endDate < value) {
      setEndDate(value);
    }
  };

  const days = useMemo(() => countRentalDays(startDate, endDate), [startDate, endDate]);
  const total = dailyRate && days > 0 ? dailyRate * days : 0;

  const conflict = useMemo(
    () => findConflict(startDate, endDate, bookedRanges),
    [startDate, endDate, bookedRanges],
  );

  const hasValidRange = Boolean(startDate && endDate && days > 0);
  const isAvailable = hasValidRange && !conflict && !carUnavailable;
  const canSubmit = isAvailable;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-gray-600">
          Start Date
          <input
            type="date"
            name="startDate"
            required
            value={startDate}
            min={todayMinDate}
            onChange={(event) => handleStartChange(event.target.value)}
            className="mt-2 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
          />
        </label>
        <label className="text-sm text-gray-600">
          End Date
          <input
            type="date"
            name="endDate"
            required
            value={endDate}
            min={startDate || todayMinDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="mt-2 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
          />
        </label>
      </div>

      {dailyRate ? (
        <div className="text-sm text-gray-600">
          <span className="font-medium text-black">
            Daily rate: {formatRupiah(dailyRate)}
          </span>
          {days > 0 ? (
            <span className="ml-2">
              · Total ({days} {days === 1 ? "day" : "days"}):{" "}
              <span className="font-semibold text-black">{formatRupiah(total)}</span>
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-sm border border-black/10 bg-gray-50 p-3 text-sm">
        <p className="text-xs uppercase tracking-[0.16em] text-gray-400">Availability</p>

        {carUnavailable ? (
          <p className="mt-2 border border-red-200 bg-red-50 px-3 py-2 text-red-700">
            This car is currently marked unavailable by the operator and cannot be booked.
          </p>
        ) : bookedRanges.length > 0 ? (
          <div className="mt-2">
            <p className="text-gray-600">This car is already booked on:</p>
            <ul className="mt-1 space-y-1">
              {bookedRanges.map((range, index) => (
                <li key={`${range.start}-${range.end}-${index}`} className="text-gray-700">
                  • {formatDisplayDate(range.start)} – {formatDisplayDate(range.end)}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-2 text-gray-600">
            No active bookings — available for any dates.
          </p>
        )}

        {!carUnavailable ? (
          hasValidRange ? (
            conflict ? (
              <p className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                ✕ Not available for {formatDisplayDate(startDate)} – {formatDisplayDate(endDate)}.
                This overlaps a booking on {formatDisplayDate(conflict.start)} –{" "}
                {formatDisplayDate(conflict.end)}. Please choose other dates.
              </p>
            ) : (
              <p className="mt-3 border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
                ✓ Available for {formatDisplayDate(startDate)} – {formatDisplayDate(endDate)}.
              </p>
            )
          ) : (
            <p className="mt-3 text-gray-500">
              Select a start and end date to check availability.
            </p>
          )
        ) : null}
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
        disabled={!canSubmit}
        className="mt-2 border border-black bg-black px-4 py-3 text-xs uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:border-black/20 disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300 disabled:hover:text-gray-500"
      >
        {carUnavailable
          ? "Unavailable"
          : conflict
            ? "Unavailable for selected dates"
            : "Create Rental Booking"}
      </button>
    </>
  );
}