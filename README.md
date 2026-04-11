# Spurr - Luxury Car Collection Gallery

A modern web application showcasing luxury car collections with interactive frame sequence animations, user authentication, and immersive parallax effects.

## Upcoming Features

- **Car Rental System** - Book and manage car rentals (in development)
- **Payment Integration** - Secure payment processing (planned)
- **Wishlist Management** - Save favorite cars (planned)
- **Admin Dashboard** - Manage inventory and analytics (planned)
- **Email Notifications** - Booking confirmations and updates (planned)

## Tech Stack

- **Frontend:** Next.js 16.1.6, React, TypeScript, Tailwind CSS 4, Framer Motion
- **Backend:** Next.js API Routes, Node.js
- **Database:** PostgreSQL (Neon), Prisma ORM
- **Authentication:** Session-based with httpOnly cookies

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)

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
```

4. Sync database schema:

```bash
npm run db:push
```

5. Start development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Sync database schema
- `npm run db:studio` - Open Prisma Studio
