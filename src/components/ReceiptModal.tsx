"use client";

import { useEffect, useState } from "react";

type ReceiptModalProps = {
  transactionRef: string;
  paidAt: string | null;
  customerName: string;
  customerEmail: string;
  carLabel: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  paymentMethodLabel: string;
  totalAmount: number;
};

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

function formatRupiah(value: number): string {
  return rupiahFormatter.format(value);
}

function formatDate(value: string, withTime = false): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" } : {}),
  }).format(date);
}

export default function ReceiptModal(props: ReceiptModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center border border-black bg-white px-4 py-2 text-xs uppercase tracking-[0.16em] text-black transition hover:bg-black hover:text-white"
      >
        View Receipt
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white p-8 shadow-2xl border border-black/10"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close receipt"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-black/15 text-sm text-gray-500 transition hover:bg-black hover:text-white"
            >
              X
            </button>

            <div className="flex items-center justify-between border-b border-dashed border-black/25 pb-4">
              <span className="text-2xl font-semibold tracking-[0.3em] text-black">SPURR</span>
              <span className="border border-emerald-500 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-600">
                Paid
              </span>
            </div>

            <p className="mt-5 text-center text-xs uppercase tracking-[0.28em] text-gray-400">
              Payment Receipt
            </p>

            <div className="mt-6 space-y-2 text-sm text-gray-700">
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Receipt No</span>
                <span className="text-right font-medium text-black">{props.transactionRef}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Paid At</span>
                <span className="text-right">
                  {props.paidAt ? formatDate(props.paidAt, true) : "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Customer</span>
                <span className="text-right">{props.customerName}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Email</span>
                <span className="text-right">{props.customerEmail}</span>
              </div>
            </div>

            <div className="my-5 border-t border-dashed border-black/25" />

            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Car</span>
                <span className="text-right font-medium text-black">{props.carLabel}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Rental Period</span>
                <span className="text-right">
                  {formatDate(props.startDate)} - {formatDate(props.endDate)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Duration</span>
                <span className="text-right">{props.totalDays} days</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Payment Method</span>
                <span className="text-right">{props.paymentMethodLabel}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-dashed border-black/25 pt-4">
              <span className="text-sm uppercase tracking-[0.16em] text-gray-500">Total Paid</span>
              <span className="text-2xl font-semibold text-black">
                {formatRupiah(props.totalAmount)}
              </span>
            </div>

            <p className="mt-6 text-center text-[10px] uppercase tracking-[0.22em] text-gray-400">
              Thank you for choosing SPURR
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}