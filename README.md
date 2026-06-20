<div align="center">

# Spurr

**A premium luxury car rental platform with a cinematic, gallery-grade browsing experience.**

Spurr pairs editorial-quality visuals — frame-by-frame car animations, parallax storytelling, and an interactive showroom map — with a complete rental workflow, from discovery and booking to payment and fulfillment.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)

</div>

---

## Overview

Spurr is a full-stack web application built around two audiences: customers browsing and renting high-end vehicles, and administrators managing inventory and fulfilling reservations. The front end delivers a high-fidelity, motion-rich experience, while the back end handles authentication, the data model, the rental lifecycle, and payments.

## Features

### For Customers
- Cinematic showroom with frame-sequence animations and parallax effects
- Detailed car profiles with specifications and imagery
- End-to-end rental booking and payment flow
- Wishlist / saved cars
- Account, rental history, and notifications
- Interactive showroom and location map

### For Administrators
- Vehicle and brand inventory management
- Rental operations with an auditable status history
- User and role management

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Leaflet & React Leaflet
- PostgreSQL
- Prisma ORM
- Midtrans

## Project Structure

```text
src/
├─ app/            # App Router routes (pages, layouts, API endpoints)
│  ├─ admin/       # Administration dashboard
│  ├─ api/         # Server-side API routes
│  ├─ car/         # Car detail pages
│  ├─ collection/  # Car gallery / showroom
│  ├─ rentals/     # Booking and rental management
│  └─ ...          # Auth, profile, wishlist, notifications
├─ components/     # Reusable UI components
├─ data/           # Static and seed-facing data
├─ lib/            # Domain logic (auth, rentals, payments, data access)
└─ types/          # Shared TypeScript types
prisma/
├─ schema.prisma   # Database schema and relations
└─ seed.ts         # Seed script
```

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
   # Database
   DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
   DIRECT_URL="postgresql://user:password@host/database?sslmode=require"

   # Payments (Midtrans)
   MIDTRANS_SERVER_KEY="your-server-key"
   MIDTRANS_IS_PRODUCTION="false"

   # Public application URL used for payment redirects
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

3. Apply the schema and seed initial data:

   ```bash
   npm run db:push
   npm run db:seed
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create an optimized production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint across the project |
| `npm run db:push` | Sync the Prisma schema to the database |
| `npm run db:seed` | Seed the database with sample data |
| `npm run db:studio` | Open Prisma Studio to inspect data |
