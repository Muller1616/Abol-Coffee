# Abol Coffee — Restaurant QR Digital Menu

Single-restaurant digital menu platform:

- **Public menu** (`/menu/{publicMenuToken}`) — QR guests browse the latest active categories and available items
- **Owner console** (`/{restaurantSlug}/…`) — manage restaurant profile, categories, menu items, images, status, and permanent QR downloads

The printed QR encodes a **permanent public URL** built as `{PUBLIC_MENU_URL origin}/menu/{publicMenuToken}`. Menu content changes never require reprinting.

## Stack

| Area | Tech |
| --- | --- |
| Client | React, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query, RHF + Zod |
| Server | Express, TypeScript, Prisma 7, PostgreSQL, JWT HttpOnly cookies + CSRF |
| Media | Sharp → Cloudinary (production). Local `/uploads` only as a development fallback |

## Prerequisites

- Node.js 20+
- Docker (for local Postgres)
- Cloudinary account (required for production image persistence)

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

Change the password after first login at `/admin/account`, or use **Forgot password** on `/admin/login` (email OTP, 3-minute expiry).

Configure SMTP in `server/.env` to deliver OTP emails; without SMTP, codes are logged to the API console in development.

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
- Owner email is immutable; password recovery uses hashed email OTPs (3 min expiry, one-time use, attempt limits, session invalidation on reset)
- JWT in HttpOnly cookie; Remember Me = 30 days, otherwise 24 hours
- Public menu stays fresh after owner edits (`Cache-Control: private, no-cache, must-revalidate` + client refetch on focus/interval + server-side invalidation)
- Item names are unique within a category
- Cover image is the public menu hero
- Images are stored on **Cloudinary** in production (DB stores durable HTTPS URLs only)

## Scripts

### Server

| Script | Description |
| --- | --- |
| `npm run dev` | Start API with watch |
| `npm run build` | Generate Prisma client + compile |
| `npm run start` | Run compiled API (blocked when `NODE_ENV=production`) |
| `npm run start:prod` | Apply migrations (`prisma migrate deploy`) then start |
| `npm run prisma:migrate:deploy` | Production migrations only |
| `npm run db:setup` | Dev migrate + seed |
| `npm run verify:all` | Full API smoke suite |

### Client

| Script | Description |
| --- | --- |
| `npm run dev` | Vite dev server (proxies `/api` and `/uploads`) |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |

## Production deployment

Treat local defaults as **unsafe** for real customers.

### Required environment (API)

| Variable | Notes |
| --- | --- |
| `NODE_ENV=production` | Enables secure cookies and production checks |
| `DATABASE_URL` | Managed Postgres connection string |
| `JWT_SECRET` | Strong random secret, 32+ chars (not a placeholder) |
| `CLIENT_URL` | Public SPA origin (CORS + cookies), **https://** (not localhost) |
| `PUBLIC_MENU_URL` | Permanent public menu origin for QR codes (`https://yourdomain.com`) — must be HTTPS in production |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Required for password-reset OTP email |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Required — all restaurant/menu images |
| `PORT` | Host-assigned port when applicable |

Optional:

| Variable | Notes |
| --- | --- |
| `UPLOADS_DIR` | Dev-only local disk fallback when Cloudinary is unset |
| `COOKIE_SAME_SITE=none` | Needed when SPA and API are on different sites |
| `COOKIE_DOMAIN` | e.g. `.yourdomain.com` for subdomain cookie sharing (required with SameSite=none) |
| `LOG_LEVEL` | `debug` \| `info` \| `warn` \| `error` |

### Required environment (client build)

| Variable | Notes |
| --- | --- |
| `VITE_API_URL` | Public API origin when SPA ≠ API host (no trailing slash). Leave empty only if a reverse proxy serves `/api` on the same origin as the SPA. Cloudinary media URLs are absolute and do not need this. |

### Suggested process

```bash
# API
cd server
npm ci
npm run build
npm run start:prod   # migrate deploy + listen

# Client (build-time env baked into the bundle)
cd client
VITE_API_URL=https://api.yourdomain.com npm ci && npm run build
# Deploy client/dist to your static host / CDN
```

Docker (API):

```bash
cd server
docker build -t abol-coffee-api .
docker run --env-file .env.production -p 4001:4001 abol-coffee-api
```

### Hosting checklist

1. Run `prisma migrate deploy` before or during release (`start:prod` does this).
2. Configure Cloudinary credentials — images must not rely on local disk in production.
3. Prefer same-site reverse proxy (SPA + `/api`) so cookies stay `SameSite=Lax`.
4. Change the seeded owner password immediately (`ChangeMe123!` is for local/dev only).
5. Set production `PUBLIC_MENU_URL` / `CLIENT_URL` to **HTTPS** domains **before** printing QR codes (download/print are blocked for localhost/HTTP).
6. Configure SPA fallback rewrites so `/menu/:token` and `/:slug/*` serve `index.html` (see `client/public/_redirects`, `client/vercel.json`, or `client/public/nginx-spa.conf.example`).
7. Health probe: `GET /api/health` (checks database connectivity).
8. Build the client with `VITE_API_URL` when SPA and API are on different origins.
