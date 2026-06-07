# Spurr - Luxury Car Collection Gallery

A modern web application showcasing luxury car collections with interactive frame sequence animations, user authentication, and immersive parallax effects.

## Tech Stack

- **Frontend:** Next.js 16.1.6, React, TypeScript, Tailwind CSS 4, Framer Motion
- **Backend:** Next.js API Routes, Node.js
- **Database:** PostgreSQL (Supabase), Prisma ORM
- **Authentication:** Session-based with httpOnly cookies

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd Spurr_Website
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
# Create .env.local and add your database connection string
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Midtrans payment gateway (required for real payment flow)
MIDTRANS_SERVER_KEY="SB-Mid-server-xxxxxxxx"
MIDTRANS_IS_PRODUCTION="false"

# Public app URL for Midtrans redirect callbacks
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4.1 Configure Midtrans HTTP notification callback URL to:

```text
https://your-domain.com/api/payments/midtrans/webhook
```

4.2 For local development with Midtrans Dashboard callback testing, use tunnel URL:

```text
https://<your-tunnel-domain>/api/payments/midtrans/webhook
```

5. Sync database schema:

```bash
npm run db:push
```

6. Start development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Sync database schema
- `npm run db:studio` - Open Prisma Studio
- `npm run uat:midtrans -- <scenario:orderId>` - Validate Midtrans sandbox status sync
- `npm run uat:midtrans -- list-recent` - Show recent orderId candidates for UAT
- `npm run uat:midtrans:webhook` - Run automated webhook UAT scenarios (success, pending, expire, cancel, deny)

## Midtrans Webhook Hardening

Webhook processing is hardened with:

- Idempotency lock per `order_id` using PostgreSQL advisory lock
- Duplicate callback detection via deterministic `eventKey`
- Retry-safe behavior (failed event can be retried and processed again)
- Persistent webhook event audit in `PaymentWebhookEvent`

## Midtrans Sandbox UAT Flow

Run UAT after performing real sandbox transactions in Midtrans and collecting each `orderId` (`transactionRef`).

### Required scenarios

- `success` -> expected payment `PAID`, rental `CONFIRMED|ACTIVE|COMPLETED`
- `pending` -> expected payment `PENDING`, rental `PENDING`
- `expire` -> expected payment `FAILED`, rental `CANCELLED`
- `cancel` -> expected payment `FAILED`, rental `CANCELLED`
- `deny` -> expected payment `FAILED`, rental `CANCELLED`

### Run scenario checks

Optional: list recent payment refs first.

```bash
npm run uat:midtrans -- list-recent
```

```bash
npm run uat:midtrans -- \
	success:PAY-ORDER-SUCCESS \
	pending:PAY-ORDER-PENDING \
	expire:PAY-ORDER-EXPIRE \
	cancel:PAY-ORDER-CANCEL \
	deny:PAY-ORDER-DENY
```

The checker validates:

- payment status mapping
- rental status transitions
- car status sync based on active rentals
- latest webhook audit event state

### Optional duplicate callback test (idempotency)

Start your app locally, then replay latest stored webhook payload twice:

```bash
npm run uat:midtrans -- \
	success:PAY-ORDER-SUCCESS \
	simulate-duplicate \
	base-url=http://localhost:3000
```

Expected result:

- second replay returns `duplicate: true`
- `receivedCount` in webhook event increases
- payment/rental/car status remain unchanged

### Automated webhook scenario runner

To validate all scenario transitions in one run (including idempotent duplicate callback), use:

```bash
npm run uat:midtrans:webhook
```

Notes:

- This runner creates temporary fixture rentals/payments, calls internal webhook route with valid Midtrans-style signatures, validates synchronization, then cleans up fixtures automatically.
- Add `keep-data` argument if you want to retain fixtures for inspection.
