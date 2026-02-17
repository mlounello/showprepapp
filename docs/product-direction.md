# ShowPrep Product Direction

## Big picture

A mobile-first web app for show planning that is case-centric, scan-driven, and designed for student crews.

Core questions the app must answer fast:

- What cases are in this show?
- Who owns each case?
- Is it packed, staged, loaded, delivered, returned?
- Where is it right now?
- What is the truck load order?

## MVP (Launch v1)

### 1) Case Library

Case fields:

- Case ID (required, unique)
- Department (Audio/Lighting/Video/Power/Rigging/Misc)
- Case type
- Optional dimensions (L/W/H) and weight
- Default contents (freeform text)
- Reference photo(s)
- Notes

Case views:

- Case list with search and filters
- Case detail page with status history and contents

### 2) Show Builder

Show fields:

- Show/Event name
- Date(s)
- Venue (on campus)
- Trucks used (from saved fleet profiles)
- Notes

Show actions:

- Add/remove cases (filter by dept/type)
- Assign each case to truck
- Assign each case to owner (person or role)
- Add show-level notes and case-specific override notes

### 3) Crew Assignments (no login)

Crew list:

- Add crew members (name only)
- Add roles (dock captain, audio lead, etc.) or templates

Assignments:

- Assign roles to people
- Assign cases to person or role
- "My Cases" view

### 4) Status + Location Tracking (QR scan-first)

Statuses:

- In Shop
- Packing
- Packed
- Staged (Dock)
- Loaded (Truck + Zone)
- Arrived / Unloaded
- Returning
- Back in Shop
- Issue

Scan mode:

- Camera scanner
- Scan case QR for quick status update
- Optional truck + zone at load time

Issue logging:

- Type (Missing, Damaged, Other)
- Notes + optional photo
- Issues list per show

### 5) Truck Profiles + Load Plan

Truck profile fields:

- Truck name
- Interior dimensions (optional)
- Notes

Load plan per show:

- Assign cases to trucks
- Generate editable load order list
- Zone field per case
- Export/share load and pack sheets

### 6) Sharing / Output

- Read-only show link (preferred)
- Or PDF exports:
  - Show Pack Sheet
  - Truck Load Sheet

## MVP+ (optional near launch)

### A) Case Label Layout from Photo

- Upload label-area photo per case
- Define text zones
- Render show label content into zones
- Optional copy-to-clipboard per field

### B) Offline-light caching

- Cache a show and its cases on phone for dead zones

## Phase 2

- Show templates + case bundles
- Better structured overrides and return reconciliation
- 2D truck visualization with drag/drop zones
- Multi-location workflow with stop priorities

## Phase 3

- Structured inventory with quantities
- Item-level scanning for selected high-value items
- Maintenance + inspection logs
- Login, permissions, audit trail, notifications

## Phase 4

- Calendar integration
- Purchasing wishlists
- Reporting (time saved, missing frequency, readiness)
- Multi-department support

## v1 Practical guardrail

Given 50-100 cases and stable truck profiles, v1 should optimize for:

- Mobile speed
- Fast search/filter
- Scan reliability
- Owner + status + location clarity
- Simple outputs (share link/PDF)
