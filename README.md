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
- API routes:
  - `GET/POST /api/cases`
  - `PATCH /api/cases/[id]`
  - `GET/POST /api/shows`
  - `GET/PATCH /api/shows/[id]`
  - `POST /api/scan`
- Seed script for initial local data (`npm run prisma:seed`)

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
```

Then:

```bash
npx prisma generate
npx prisma db push
npm run prisma:seed
```

## Vercel + Supabase env

Set `DATABASE_URL` in Vercel Project Settings -> Environment Variables.

- Value: your Supabase Postgres connection string.
- Apply to: `Production`, `Preview`, and `Development`.

After setting the variable:

```bash
npx vercel --prod
```
