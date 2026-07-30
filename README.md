# Abol Coffee — Restaurant QR Digital Menu

Single-restaurant digital menu platform:

- **Public menu** (`/menu`) — QR guests browse the latest active categories and available items
- **Owner console** (`/admin`) — manage restaurant profile, categories, menu items, images, status, and permanent QR downloads

The printed QR encodes a **permanent public URL** (`PUBLIC_MENU_URL`). Menu content changes never require reprinting.

## Stack

| Area | Tech |
| --- | --- |
| Client | React, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query, RHF + Zod |
| Server | Express, TypeScript, Prisma 7, PostgreSQL, JWT HttpOnly cookies + CSRF |
| Media | Multer + Sharp (JPG/PNG/WebP, max 5 MB) |

## Prerequisites

- Node.js 20+
- Docker (for local Postgres)

> Local API defaults to **port 4001** so it does not collide with other apps commonly using 4000. The Vite proxy targets `http://localhost:4001`.

## Quick start

```bash
# 1) Database
docker compose up -d

# 2) API
cd server
cp .env.example .env   # then set a real JWT_SECRET (32+ chars)
npm install
npm run db:setup
npm run dev            # http://localhost:4001

# 3) Client (new terminal)
cd client
cp .env.example .env   # leave VITE_API_URL empty for local cookie auth via Vite proxy
npm install
npm run dev            # http://localhost:5173
```

### Default owner (seed)

- Email: `Habeshadreamer12@gmail.com` (from `OWNER_EMAIL` in `server/.env`)
- Password: `ChangeMe123!` (from `OWNER_PASSWORD`)

Change the password after first login at `/admin/account`.

## Key URLs

| URL | Purpose |
| --- | --- |
| http://localhost:5173/ | Landing |
| http://localhost:5173/menu | Public QR menu |
| http://localhost:5173/admin/login | Owner login |
| http://localhost:4001/api/health | API health check |

Local env should keep:

```env
PUBLIC_MENU_URL=http://localhost:5173/menu
CLIENT_URL=http://localhost:5173
```

In production, set `PUBLIC_MENU_URL` to the permanent public menu origin/path before printing QR codes.

## Verification

From `server/`:

```bash
npm run verify:all
```

Runs auth, restaurant, categories, menu items, uploads, public menu, dashboard, and QR checks against a temporary in-process API.

## Project layout

```text
Abol-Coffee/
├── client/          # Vite React app
├── server/          # Express + Prisma API
└── docker-compose.yml
```

Landing hero video: Mixkit stock clip “Coffee being poured into a cup” (free license), stored at `client/public/media/`.

## Product rules (v1)

- Currency is fixed to **ETB**
- Public menu shows only **active categories** and **available items**
- Restaurant status: `ACTIVE` | `MAINTENANCE` (maintenance returns 503 to guests)
- Owner email is immutable; password change is in-app only (no forgot-password)
- JWT in HttpOnly cookie; Remember Me = 30 days, otherwise 24 hours
- Public menu is always fresh (`Cache-Control: no-store` / client refetch)
- Item names are unique within a category
- Cover image is the public menu hero

## Scripts

### Server

| Script | Description |
| --- | --- |
| `npm run dev` | Start API with watch |
| `npm run build` | Generate Prisma client + compile |
| `npm run db:setup` | Migrate + seed |
| `npm run verify:all` | Full API smoke suite |

### Client

| Script | Description |
| --- | --- |
| `npm run dev` | Vite dev server (proxies `/api` and `/uploads`) |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
