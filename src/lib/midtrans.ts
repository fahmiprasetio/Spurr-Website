import { createHash } from "node:crypto";
import type { PaymentStatus } from "@prisma/client";

const MIDTRANS_SANDBOX_API_BASE_URL = "https://app.sandbox.midtrans.com";
const MIDTRANS_PRODUCTION_API_BASE_URL = "https://app.midtrans.com";

const MIDTRANS_TERMINAL_FAILURE_STATUSES = new Set(["deny", "cancel", "expire", "failure"]);
const MIDTRANS_REFUND_STATUSES = new Set([
  "refund",
  "partial_refund",
  "chargeback",
  "partial_chargeback",
]);

type MidtransConfig = {
  serverKey: string;
  apiBaseUrl: string;
  appBaseUrl: string | null;
};

export type MidtransNotificationPayload = {
  order_id?: string;
  status_code?: string;
  gross_amount?: string | number;
  signature_key?: string;
  transaction_status?: string;
  transaction_id?: string;
  fraud_status?: string;
  payment_type?: string;
  currency?: string;
};

export type MidtransSnapTransactionArgs = {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerEmail: string;
  itemName: string;
};

export type MidtransSnapTransactionResult = {
  orderId: string;
  token: string;
  redirectUrl: string;
};

function parseBooleanFlag(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return value === "1" || value.toLowerCase() === "true";
}

function getMidtransConfig(): MidtransConfig | null {
  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();

  if (!serverKey) {
    return null;
  }

  const isProduction = parseBooleanFlag(process.env.MIDTRANS_IS_PRODUCTION);
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim() || null;

  return {
    serverKey,
    apiBaseUrl: isProduction ? MIDTRANS_PRODUCTION_API_BASE_URL : MIDTRANS_SANDBOX_API_BASE_URL,
    appBaseUrl,
  };
}

function normalizeStringValue(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return value.toString();
  }

  return "";
}

function buildMidtransSignature(params: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  serverKey: string;
}): string {
  const raw = `${params.orderId}${params.statusCode}${params.grossAmount}${params.serverKey}`;
  return createHash("sha512").update(raw).digest("hex");
}

function normalizeTransactionStatus(payload: MidtransNotificationPayload): string {
  return normalizeStringValue(payload.transaction_status).toLowerCase();
}

function normalizeFraudStatus(payload: MidtransNotificationPayload): string {
  return normalizeStringValue(payload.fraud_status).toLowerCase();
}

export function getMidtransOrderId(payload: MidtransNotificationPayload): string {
  return normalizeStringValue(payload.order_id);
}

export function getMidtransTransactionStatus(payload: MidtransNotificationPayload): string {
  return normalizeTransactionStatus(payload);
}

export function buildMidtransWebhookEventKey(payload: MidtransNotificationPayload): string {
  const parts = [
    getMidtransOrderId(payload) || "-",
    normalizeStringValue(payload.transaction_id) || "-",
    normalizeTransactionStatus(payload) || "-",
    normalizeFraudStatus(payload) || "-",
    normalizeStringValue(payload.status_code) || "-",
    normalizeStringValue(payload.gross_amount) || "-",
  ];

  return createHash("sha256").update(parts.join("|")).digest("hex");
}

export function resolvePaymentStatusTransition(
  currentStatus: PaymentStatus,
  nextStatus: PaymentStatus
): PaymentStatus {
  if (currentStatus === nextStatus) {
    return currentStatus;
  }

  if (currentStatus === "REFUNDED" || nextStatus === "REFUNDED") {
    return "REFUNDED";
  }

  if (currentStatus === "PAID" && (nextStatus === "PENDING" || nextStatus === "FAILED")) {
    return "PAID";
  }

  if (currentStatus === "FAILED" && nextStatus === "PENDING") {
    return "FAILED";
  }

  return nextStatus;
}

export function isMidtransConfigured(): boolean {
  return getMidtransConfig() !== null;
}

export function isMidtransTerminalFailure(payload: MidtransNotificationPayload): boolean {
  const transactionStatus = normalizeTransactionStatus(payload);
  return MIDTRANS_TERMINAL_FAILURE_STATUSES.has(transactionStatus);
}

export function verifyMidtransSignature(payload: MidtransNotificationPayload): boolean {
  const config = getMidtransConfig();

  if (!config) {
    return false;
  }

  const orderId = normalizeStringValue(payload.order_id);
  const statusCode = normalizeStringValue(payload.status_code);
  const grossAmount = normalizeStringValue(payload.gross_amount);
  const providedSignature = normalizeStringValue(payload.signature_key).toLowerCase();

  if (!orderId || !statusCode || !grossAmount || !providedSignature) {
    return false;
  }

  const expectedSignature = buildMidtransSignature({
    orderId,
    statusCode,
    grossAmount,
    serverKey: config.serverKey,
  });

  return expectedSignature === providedSignature;
}

export function mapMidtransTransactionToPaymentStatus(
  payload: MidtransNotificationPayload
): PaymentStatus {
  const transactionStatus = normalizeTransactionStatus(payload);
  const fraudStatus = normalizeFraudStatus(payload);

  if (transactionStatus === "settlement") {
    return "PAID";
  }

  if (transactionStatus === "capture") {
    if (fraudStatus && fraudStatus !== "accept") {
      return "PENDING";
    }

    return "PAID";
  }

  if (transactionStatus === "pending") {
    return "PENDING";
  }

  if (MIDTRANS_REFUND_STATUSES.has(transactionStatus)) {
    return "REFUNDED";
  }

  if (MIDTRANS_TERMINAL_FAILURE_STATUSES.has(transactionStatus)) {
    return "FAILED";
  }

  return "PENDING";
}

export async function createMidtransSnapTransaction(
  args: MidtransSnapTransactionArgs
): Promise<MidtransSnapTransactionResult> {
  const config = getMidtransConfig();

  if (!config) {
    throw new Error("Midtrans is not configured. Missing MIDTRANS_SERVER_KEY.");
  }

  const requestBody: Record<string, unknown> = {
    transaction_details: {
      order_id: args.orderId,
      gross_amount: args.grossAmount,
    },
    item_details: [
      {
        id: args.orderId,
        name: args.itemName,
        quantity: 1,
        price: args.grossAmount,
      },
    ],
    customer_details: {
      first_name: args.customerName,
      email: args.customerEmail,
    },
  };

  if (config.appBaseUrl) {
    requestBody.callbacks = {
      finish: `${config.appBaseUrl}/rentals?status=payment-pending`,
      error: `${config.appBaseUrl}/rentals?error=payment-failed`,
      pending: `${config.appBaseUrl}/rentals?status=payment-pending`,
    };
  }

  const authToken = Buffer.from(`${config.serverKey}:`).toString("base64");

  const requestHeaders: Record<string, string> = {
    Authorization: `Basic ${authToken}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (config.appBaseUrl) {
    requestHeaders["X-Append-Notification"] = `${config.appBaseUrl}/api/payments/midtrans/webhook`;
  }

  const response = await fetch(`${config.apiBaseUrl}/snap/v1/transactions`, {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(requestBody),
    cache: "no-store",
  });

  const rawResponse = await response.text();

  if (!response.ok) {
    throw new Error(`Midtrans transaction creation failed (${response.status}): ${rawResponse}`);
  }

  let parsedResponse: unknown;

  try {
    parsedResponse = JSON.parse(rawResponse);
  } catch {
    throw new Error("Midtrans returned a non-JSON response.");
  }

  const token = normalizeStringValue((parsedResponse as { token?: unknown }).token);
  const redirectUrl = normalizeStringValue(
    (parsedResponse as { redirect_url?: unknown }).redirect_url
  );

  if (!token || !redirectUrl) {
    throw new Error("Midtrans response did not contain token or redirect_url.");
  }

  return {
    orderId: args.orderId,
    token,
    redirectUrl,
  };
}