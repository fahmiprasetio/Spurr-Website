"use client";

import { useState } from "react";

type RentalDateFieldsProps = {
  todayMinDate: string;
};

export default function RentalDateFields({ todayMinDate }: RentalDateFieldsProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  return (
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
  );
}