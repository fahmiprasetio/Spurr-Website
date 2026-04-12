import type { PaymentMethod } from "@prisma/client";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MIN_DAILY_RATE = 2_500_000;
const MAX_DAILY_RATE = 15_000_000;

export const PAYMENT_METHOD_OPTIONS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "E_WALLET", label: "E-Wallet" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "VIRTUAL_ACCOUNT", label: "Virtual Account" },
];

function parseHorsePower(powerText: string): number {
  const numeric = Number.parseInt(powerText.replace(/[^\d]/g, ""), 10);
  if (Number.isNaN(numeric) || numeric <= 0) {
    return 600;
  }
  return numeric;
}

export function calculateDailyRate(powerText: string): number {
  const hp = parseHorsePower(powerText);
  const base = hp * 12_000;
  return Math.min(MAX_DAILY_RATE, Math.max(MIN_DAILY_RATE, base));
}

function toUtcDateOnly(input: Date): number {
  return Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate());
}

export function calculateRentalDays(startDate: Date, endDate: Date): number {
  const start = toUtcDateOnly(startDate);
  const end = toUtcDateOnly(endDate);
  const diff = Math.floor((end - start) / MS_PER_DAY) + 1;
  return Math.max(1, diff);
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function createTransactionReference(): string {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `PAY-${Date.now()}-${rand}`;
}
