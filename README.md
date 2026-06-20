# Spurr — Luxury Car Rental Gallery

A modern web app for browsing and renting luxury cars, featuring cinematic frame-sequence animations, immersive parallax effects, an interactive location map, user accounts, and an admin dashboard.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling & Animation:** Tailwind CSS 4, Framer Motion
- **Maps:** Leaflet, React Leaflet
- **Database & ORM:** PostgreSQL, Prisma
- **Auth:** Session-based authentication with httpOnly cookies
- **Payments:** Midtrans

## Features

- Luxury car collection with interactive frame-sequence animations
- Car detail pages with specs and image sequences
- User authentication (sign up / sign in)
- Rental booking with payment flow
- Wishlist / saved cars
- User profile and notifications
- Admin dashboard for managing rentals and inventory

## Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database

### Installation

1. Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd Spurr-Website
npm install
```

2. Create a `.env` file in the project root:

```bash
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host/database?sslmode=require"

# Midtrans payment gateway
MIDTRANS_SERVER_KEY="your-server-key"
MIDTRANS_IS_PRODUCTION="false"

# Public app URL used for payment redirects
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

3. Set up the database:

```bash
npm run db:push
npm run db:seed
```

4. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` — Start the development server
- `npm run build` — Build for production
- `npm run start` — Run the production build
- `npm run lint` — Run ESLint
- `npm run db:push` — Sync the Prisma schema to the database
- `npm run db:seed` — Seed sample data
- `npm run db:studio` — Open Prisma Studio
