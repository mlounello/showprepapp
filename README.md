# ShowPrep App

Mobile-first show planning for student production crews. The app is case-centric and scan-driven.

## What this includes now

- Next.js App Router + TypeScript foundation
- MVP route structure:
  - `/cases` Case Library with search + department filtering
  - `/shows` Show list and `/shows/[id]` detail/assignments/issues
  - `/crew` Crew list + owner-based case view
  - `/scan` status update flow (manual scan fallback)
  - `/load-plan` truck + zone ordered load sheet view
- Prisma + Postgres (Supabase-ready) data layer
- PWA install support (manifest + service worker cache)
- API routes:
  - `GET/POST /api/cases`
  - `PATCH /api/cases/[id]`
  - `GET /api/cases/export` (CSV download)
  - `GET /api/cases/template` (blank CSV template)
  - `POST /api/cases/import` (CSV bulk upsert)
  - `GET/POST /api/shows`
  - `GET/PATCH /api/shows/[id]`
  - `POST /api/scan`
- Seed script for initial local data (`npm run prisma:seed`)

## Offline + PWA notes

- Install prompt appears in the top nav when supported by browser.
- Service worker caches app shell/pages for offline launch.
- Scan queue now tracks last sync time, next retry time, and retry errors with auto-retry backoff.

## Product scope guardrails (v1)

Prioritize:

- Speed on mobile
- Fast search/filter
- Scan reliability
- Owner + status + location clarity
- Simple outputs (share link/PDF)

Defer:

- Item-level inventory rigor
- Complex permissions
- Integrations

## Next implementation steps

1. Integrate camera scanning (`BarcodeDetector` + iOS fallback).
2. Add case detail page with full status history timeline.
3. Implement PDF/export endpoints for pack/load sheets.
4. Add read-only share token routes for shows.
5. Add assignment editing in show detail (owner/truck/zone drag-reorder).

## Local setup

```bash
npm install
npm run dev
```

Set `.env`:

```bash
DATABASE_URL="postgresql://postgres:<PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:<PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require"
SUPABASE_URL="https://<PROJECT_REF>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<SUPABASE_SERVICE_ROLE_KEY>"
SUPABASE_STORAGE_BUCKET="issue-photos"
```

Then:

```bash
npx prisma generate
npx prisma db push
npm run prisma:seed
```

Supabase Storage setup for issue photos:

- Create bucket `issue-photos` (or set `SUPABASE_STORAGE_BUCKET` to your bucket name).
- Mark bucket as public for direct image rendering in shared/read-only views.

## Vercel + Supabase env

Set `DATABASE_URL` in Vercel Project Settings -> Environment Variables.
Set `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` as well.

- Value: your Supabase Postgres connection string.
- Apply to: `Production`, `Preview`, and `Development`.

After setting the variable:

```bash
npx vercel --prod
```
