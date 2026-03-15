# HealthScan

A lightweight, cloud-based imaging management app for small clinics. Upload scans, organize studies, and collaborate with radiologists in one role-aware dashboard.

**Live app:** [https://health-sync-a3qdhmgsq-mansi-jayswals-projects.vercel.app/](https://health-sync-a3qdhmgsq-mansi-jayswals-projects.vercel.app/)

---

## Features

- **Clinic admins:** Manage patients, create studies, upload scan images, assign studies to radiologists, view reports
- **Radiologists:** View assigned studies, view scan images (zoom, pan, fullscreen), create and edit diagnostic reports
- **Role-based access:** Separate dashboards and permissions for clinic admins vs radiologists
- **Invite flow:** Clinic admins can invite radiologists (and other clinic admins) via email; invited users set their password and join the same organization
- **Secure storage:** Scan images in Supabase Storage with signed URLs; Row Level Security (RLS) on all tables

---

## Tech stack

| Layer        | Technology                    |
| ------------ | ----------------------------- |
| Framework    | Next.js 16 (App Router)       |
| Language     | TypeScript (strict)           |
| Database     | Supabase (Postgres + Auth)    |
| UI           | shadcn/ui, Tailwind CSS       |
| Server state | TanStack Query v5             |
| Forms        | React Hook Form + Zod         |
| Deployment   | Vercel                        |

---

## Getting started

### Prerequisites

- Node.js 18+
- npm or pnpm
- A [Supabase](https://supabase.com) project

### 1. Clone and install

```bash
git clone <repo-url>
cd health-sync
npm install
```

### 2. Environment variables

Copy the example env and fill in your Supabase values:

```bash
cp .env.example .env.local
```

Required in `.env.local`:

| Variable | Description |
| -------- | ----------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (Project Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public key for client-side auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only; used for invite and storage) |

For invite emails and redirects, also set:

| Variable | Description |
| -------- | ----------- |
| `NEXT_PUBLIC_APP_URL` | Full app URL (e.g. `https://your-app.vercel.app` or `http://localhost:3000`) |

Get Supabase keys from: **Supabase Dashboard → Project Settings → API**.

### 3. Database

Run Supabase migrations so tables and RLS policies exist:

```bash
npx supabase db push
```

Or apply the SQL in `supabase/migrations/` manually in the Supabase SQL editor.

Configure in Supabase:

- **Authentication → URL Configuration → Redirect URLs:** add `http://localhost:3000/auth/callback` (and your production URL).
- **Authentication → Email Templates:** optionally customize the “Invite user” template.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up to create a clinic admin account (default role).

---

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript check |

---

## Project structure

```
src/
  app/              # Next.js App Router (auth, dashboard, api)
  components/      # UI, shared, dashboard components
  hooks/           # TanStack Query and app hooks
  lib/             # API client, Supabase, auth, utils
  constants/       # Routes, query keys, roles
  types/           # DB types, API types, Zod schemas
docs/               # database.md, api-contracts.md
planning/           # Product and feature docs
supabase/
  migrations/      # SQL migrations (schema + RLS)
```

---

## Roles

- **clinic_admin:** Manage patients, studies, study types; upload scans; invite users; view reports.
- **radiologist:** View assigned studies; view scan images; create and edit reports.

Route access is enforced in middleware and API routes; data access is enforced by Supabase RLS.

---

## Documentation

- [docs/database.md](docs/database.md) — Schema, tables, RLS
- [docs/api-contracts.md](docs/api-contracts.md) — API routes and payloads
- [AGENTS.md](AGENTS.md) — Conventions and rules for contributors and AI assistants

---

## License

Private. All rights reserved.
