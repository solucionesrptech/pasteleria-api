# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pastelería Bella Backend API — NestJS 10 backend for a Chilean pastry bakery ecommerce platform. Serves a separate Next.js frontend via REST API.

## Common Commands

```bash
npm run dev              # Start dev server (watch mode)
npm run build            # Build for production (includes prisma generate)
npm run start:prod       # Run compiled production build
npm run db:generate      # Generate Prisma client after schema changes
npm run db:migrate       # Run Prisma migrations (dev mode)
npm run db:seed          # Seed database with admin user + sample products
```

**Environment variables required:** `DATABASE_URL` (PostgreSQL connection string), `PORT` (default 3001), `FRONTEND_URL` (for CORS), `JWT_SECRET`.

## Architecture

### NestJS Module Structure

Standard NestJS modular architecture with Controller → Service → Prisma pattern:

```
src/
├── auth/           # JWT auth with Passport, guards, decorators
├── products/       # Product CRUD
├── orders/         # Order creation with transactional inventory
├── inventory/      # Stock adjustments and movement history
├── prisma/         # Global PrismaService singleton
├── app.module.ts   # Root module imports all feature modules
└── main.ts         # Bootstrap with CORS and /api prefix
```

### Database (Prisma + PostgreSQL)

- Schema: `prisma/schema.prisma` — 7 models: User, Product, Order, OrderItem, Payment, InventoryMovement, DeliveryAssignment
- PrismaService: `src/prisma/prisma.service.ts` — global singleton, auto-connects on module init
- Seed: `prisma/seed.ts` (run with tsx) — creates admin user and sample products
- All prices are **integer CLP** (pesos chilenos, IVA included, no decimals)

### Auth System

- JWT-based with `@nestjs/passport` and `passport-jwt`
- Guards: `JwtAuthGuard` (auth), `RolesGuard` (RBAC)
- 5 roles: `SUPER_ADMIN`, `JEFE_VENTAS`, `PRODUCCION`, `RECEPCION`, `DELIVERY`
- Passwords hashed with bcryptjs

### API Configuration

- Global prefix: `/api` (all routes are `/api/*`)
- CORS: enabled for `FRONTEND_URL` with credentials
- Default port: 3001

## Key Conventions

- **Stack is locked:** NestJS 10, PostgreSQL, Prisma, TypeScript. Do not introduce other frameworks or ORMs.
- **Controller → Service → Prisma:** Controllers handle HTTP, services contain business logic, only services access Prisma.
- **Prisma transactions:** Use `prisma.$transaction()` for critical operations (order creation deducts inventory atomically).
- **Chile market V1:** CLP integers only, business hours 09:00–17:00, Santiago Centro delivery zone.
- **Order flow:** CREADO → PAGADO → EN_PREPARACION → LISTO → EN_RUTA → ENTREGADO/RETIRADO (or CANCELADO). Inventory auto-deducts when order is created.
- **Small increments:** Vertical slices, no large refactors. Each commit should leave the system runnable.

## Order State Transitions (Enforce in Service)

- `PAGADO` → `EN_PREPARACION` (RECEPCION only)
- `EN_PREPARACION` → `LISTO` (RECEPCION only)
- `LISTO` → `EN_RUTA` (DELIVERY type only, RECEPCION)
- `LISTO` → `RETIRADO` (PICKUP type only, RECEPCION)
- `EN_RUTA` → `ENTREGADO` (RECEPCION or DELIVERY)
- Any → `CANCELADO` (SUPER_ADMIN only)
