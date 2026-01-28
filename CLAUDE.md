# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CSR26 is a certified plastic removal platform. Customers accumulate environmental credits through purchases that transform into certified assets at the €10 threshold. The platform supports multiple customer journeys (CLAIM, PAY, GIFT_CARD, ALLOCATION, GENERAL) and includes dashboards for users, merchants, partners, and admins.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Redux Toolkit + MUI + Tailwind CSS
- **Backend:** Express 5 + TypeScript + Prisma ORM + PostgreSQL
- **Payments:** Stripe (customer payments + merchant billing)
- **Auth:** Passwordless magic links (JWT-based)

## Commands

### Frontend (`/home/frontend/`)
```bash
npm run dev      # Start Vite dev server (port 5173)
npm run build    # TypeScript compile + Vite production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

### Backend (`/home/backend/`)
```bash
npm run dev          # Start with tsx watch (auto-reload)
npm run build        # Compile TypeScript to dist/
npm run start        # Run compiled JS (production)
npm run db:migrate   # Run Prisma migrations
npm run db:push      # Push schema changes to database
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio GUI
npm run db:reset     # Force reset database + reseed
```

## Architecture

### Data Flow
```
React Component → Redux Thunk → Axios → Express Route → Controller → Service → Prisma → PostgreSQL
```

### Key Directories
- `frontend/src/pages/` - Page components by feature (Landing, Dashboard, MerchantDashboard, PartnerDashboard, Admin)
- `frontend/src/store/slices/` - Redux state slices (auth, wallet, transactions, etc.)
- `backend/src/controllers/` - Request handlers (11 controllers)
- `backend/src/services/` - Business logic (calculationService, billingService, cronService)
- `backend/prisma/schema.prisma` - Database schema (10 models)

### Landing Page Cases
The landing page handles 6 different customer journey types based on URL parameters:
1. **CLAIM** - Merchant prepaid (no payment needed)
2. **PAY** - Customer pays at checkout
3. **GIFT_CARD** - Physical card with secret code validation
4. **ALLOCATION** - E-commerce post-checkout (data from URL params)
5. **GENERAL** - Marketing/direct landing (no SKU)
6. **ADMIN** - Admin panel access via special SKU

## Critical Implementation Details

### Stripe Webhook
Must be registered BEFORE `express.json()` middleware - requires raw body for signature verification.

### Impact Calculation
```
Impact (kg) = Amount (€) ÷ €0.11/kg
```
The €0.11 price is stored in the `Setting` table and must be admin-configurable.

### €10 Threshold Rule
- Below €10: "Accumulation Phase" - minimal registration, no Corsair Connect account
- At/above €10: "Certified Asset" - full registration, triggers Corsair Connect export

### Maturation Timeline (5/45/50 Rule)
Transactions store `midTermMaturesAt` (40 weeks) and `finalMaturesAt` (80 weeks):
- 5% immediate
- 45% at 40 weeks
- 50% at 80 weeks

### Three-Level Attribution
Every transaction tracks: Master ID (CSR26) → Partner ID → Merchant ID

### Monthly Billing
Small merchant fees accumulate in `Merchant.currentBalance` and are charged once monthly when ≥€10 to reduce payment processing costs.

### Multipliers
Per-merchant configurable: 1x, 2x, 5x, 10x. Affects both impact shown to customer and merchant cost.

## Environment Variables

### Backend (.env)
- `DATABASE_URL` - PostgreSQL connection string
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` - Stripe integration
- `JWT_SECRET`, `JWT_EXPIRES_IN` - Authentication
- `SMTP_*`, `EMAIL_FROM` - Magic link emails
- `FRONTEND_URL` - For CORS and redirects
- `CORSAIR_API_URL`, `CORSAIR_API_KEY` - External integration

### Frontend (.env)
- `VITE_API_URL` - Backend API endpoint
- `VITE_STRIPE_PUBLIC_KEY` - Stripe publishable key

## Terminology

| Use | Avoid |
|-----|-------|
| Environmental Asset | Environmental Resource |
| Environmental Allocation | Donation |
| Corsair Connect | Amplivo |
