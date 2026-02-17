# ShowPrep App

Mobile-first show planning for student production crews. The app is case-centric and scan-driven.

## What this initial scaffold includes

- Next.js App Router + TypeScript foundation
- MVP route structure:
  - `/cases` Case Library with search + department filtering
  - `/shows` Show list and `/shows/[id]` detail/assignments/issues
  - `/crew` Crew list + owner-based case view
  - `/scan` status update flow (manual scan fallback)
  - `/load-plan` truck + zone ordered load sheet view
- Domain types for cases, shows, assignments, trucks, statuses, and issues
- Initial Prisma schema for long-term persistence

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

1. Add Prisma client and SQLite seed to replace sample arrays.
2. Add API routes for case/show CRUD and scan status updates.
3. Integrate a camera scanner (`BarcodeDetector` + fallback library for iOS gaps).
4. Implement PDF/export endpoints for pack/load sheets.
5. Add read-only share token routes for shows.

## Local setup

```bash
npm install
npm run dev
```

Set `.env`:

```bash
DATABASE_URL="file:./dev.db"
```

Then:

```bash
npx prisma migrate dev -n init
npx prisma generate
```
