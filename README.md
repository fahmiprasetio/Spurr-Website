<div align="center">

# Spurr

**A premium luxury car rental platform with a cinematic, gallery-grade browsing experience.**

Spurr pairs editorial-quality visuals — frame-by-frame car animations, parallax storytelling, and an interactive showroom map — with a complete rental workflow, from discovery and booking to secure payment and fulfillment.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)

</div>

---

## Overview

Spurr is a full-stack web application built around two audiences: customers browsing and renting high-end vehicles, and administrators managing inventory and fulfilling reservations. The front end is engineered for a high-fidelity, motion-rich experience, while the back end provides authentication, a relational data model, a rental lifecycle, and an integrated payment flow.

## Key Features

### For Customers
- **Cinematic showroom** — luxury cars presented with frame-sequence animations and parallax effects for a showroom-quality feel.
- **Detailed car profiles** — specifications, performance figures, imagery, and availability for each vehicle.
- **End-to-end rentals** — select dates, review pricing, and confirm a booking with an integrated payment flow.
- **Wishlist & saved cars** — bookmark vehicles and revisit them later.
- **Account & notifications** — personal profile, rental history, and status updates.
- **Interactive map** — explore showroom and pickup locations via an embedded map.

### For Administrators
- **Inventory management** — maintain the vehicle catalog and brand data.
- **Rental operations** — review reservations and move them through their lifecycle, with an auditable status history.
- **User management** — oversee customer accounts and roles.

## Tech Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router) | Server-rendered React, routing, and API routes |
| UI | **React 19**, **TypeScript** | Component architecture with end-to-end type safety |
| Styling | **Tailwind CSS 4** | Utility-first, design-system-driven styling |
| Motion | **Framer Motion** | Frame-sequence animations and parallax interactions |
| Mapping | **Leaflet** + **React Leaflet** | Interactive showroom and location maps |
| Data | **PostgreSQL** + **Prisma ORM** | Type-safe relational data access and migrations |
| Auth | **Session-based authentication** | Secure sessions backed by httpOnly cookies |
| Payments | **Midtrans** | Payment gateway for the rental checkout flow |

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

- **Node.js 18+**
- A **PostgreSQL** database

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
