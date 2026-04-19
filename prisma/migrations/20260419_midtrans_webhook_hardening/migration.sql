-- Track Midtrans webhook events for idempotency, retries, and audit.
CREATE TYPE "WebhookProcessingStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED');

CREATE TABLE "PaymentWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "paymentId" TEXT,
    "transactionStatus" TEXT,
    "mappedStatus" "PaymentStatus",
    "processingStatus" "WebhookProcessingStatus" NOT NULL DEFAULT 'RECEIVED',
    "receivedCount" INTEGER NOT NULL DEFAULT 1,
    "lastReceivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentWebhookEvent_eventKey_key" ON "PaymentWebhookEvent"("eventKey");
CREATE INDEX "PaymentWebhookEvent_provider_orderId_idx" ON "PaymentWebhookEvent"("provider", "orderId");
CREATE INDEX "PaymentWebhookEvent_paymentId_idx" ON "PaymentWebhookEvent"("paymentId");
CREATE INDEX "PaymentWebhookEvent_processingStatus_idx" ON "PaymentWebhookEvent"("processingStatus");

ALTER TABLE "PaymentWebhookEvent"
    ADD CONSTRAINT "PaymentWebhookEvent_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
