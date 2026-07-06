"use client";

import { useMemo, useState } from "react";

type RentalDateFieldsProps = {
  todayMinDate: string;
  dailyRate: number | null;
};

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function countRentalDays(start: string, end: string): number {
  if (!start || !end) {
    return 0;
  }
  const startTime = new Date(`${start}T00:00:00.000Z`).getTime();
  const endTime = new Date(`${end}T00:00:00.000Z`).getTime();
  if (Number.isNaN(startTime) || Number.isNaN(endTime) || endTime < startTime) {
    return 0;
  }
  return Math.floor((endTime - startTime) / 86400000) + 1;
}

export default function RentalDateFields({ todayMinDate, dailyRate }: RentalDateFieldsProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const days = useMemo(() => countRentalDays(startDate, endDate), [startDate, endDate]);
  const total = dailyRate !== null && days > 0 ? dailyRate * days : null;

  return (
    <div className="flex flex-col gap-4">
      {dailyRate !== null ? (
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
          <span className="text-gray-500">
            Daily rate:{" "}
            <span className="font-medium text-black">{formatRupiah(dailyRate)}</span>
          </span>
          <span className="text-gray-500">
            Total{days > 0 ? ` (${days} day${days > 1 ? "s" : ""})` : ""}:{" "}
            <span className="font-semibold text-black">
              {total !== null ? formatRupiah(total) : "—"}
            </span>
          </span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-sm text-gray-600">
          Start Date
          <input
            type="date"
            name="startDate"
            required
            min={todayMinDate}
            value={startDate}
            onChange={(event) => {
              const nextStart = event.target.value;
              setStartDate(nextStart);
              if (endDate && nextStart && endDate < nextStart) {
                setEndDate(nextStart);
              }
            }}
            className="mt-2 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
          />
        </label>
        <label className="text-sm text-gray-600">
          End Date
          <input
            type="date"
            name="endDate"
            required
            min={startDate || todayMinDate}
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="mt-2 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
          />
        </label>
      </div>
    </div>
  );
}