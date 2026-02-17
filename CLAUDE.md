# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pastelería Bella — a full-stack ecommerce platform for a Chilean pastry bakery. Monolithic Next.js 14 app with PostgreSQL, Prisma ORM, Tailwind CSS, and TypeScript (strict mode).

## Common Commands

```bash
npm run dev              # Start dev server (Next.js)
npm run build            # Production build
npm run lint             # ESLint via next lint
npm run db:generate      # Generate Prisma client after schema changes
npm run db:migrate       # Run Prisma migrations (dev mode)
npm run db:seed          # Seed database (admin user + sample products)
npm run db:studio        # Open Prisma Studio GUI
```

**Environment variables required:** `DATABASE_URL` (PostgreSQL), `SESSION_SECRET`.

## Architecture

### Routing & Layout

- **App Router** (Next.js 14+) — all routes under `app/`
- Planned route groups: `app/(cliente)/` for public routes, `app/(admin)/` for admin panel
- API routes live under `app/api/`
- Root layout in `app/layout.tsx`

### Database (Prisma + PostgreSQL)

- Schema at `prisma/schema.prisma` — 7 models: User, Product, Order, OrderItem, Payment, InventoryMovement, DeliveryAssignment
- Prisma singleton client at `lib/prisma.ts` (prevents multiple instances in dev)
- Seed script at `prisma/seed.ts` (run with `tsx`)
- All pricing is integer CLP (no decimals, IVA included)

### UI Components

- Reusable components in `components/ui/` (Button, Card, Badge, Input, Table)
- Variant-based props pattern (e.g., `variant="primary"`, `size="md"`)
- Tailwind utility classes only — no CSS modules or inline styles

### Auth & Security (planned/in-progress)

- Custom auth with bcrypt + httpOnly cookies (no Supabase Auth)
- 5 roles: SUPER_ADMIN, JEFE_VENTAS, PRODUCCION, RECEPCION, DELIVERY
- Zod validation on all POST/PATCH API endpoints
- RBAC enforced in middleware and utility functions
- Prisma transactions for critical operations (payments, inventory)

## Key Conventions

- **Stack is locked:** Next.js 14+, PostgreSQL, Prisma, Tailwind, TypeScript. Do not introduce other frameworks or ORMs.
- **Server-side DB access only:** Prisma queries run in server components or API routes, never on the client.
- **Chile market V1:** CLP integers, business hours 09:00–17:00, Santiago Centro delivery zone only.
- **Order flow:** 8 statuses (CREADO → PAGADO → EN_PREPARACION → LISTO → EN_RUTA → ENTREGADO/RETIRADO, or CANCELADO). Inventory auto-deducts on PAGADO.
- **Design system:** Teal-600 primary, stone-600 secondary, white background. Max 3–4 colors per screen, mobile-first, `max-w-7xl` container.
- **Path alias:** `@/*` maps to project root.
- **Small increments:** Vertical slices, no large refactors. Each commit delivers a working feature set.
