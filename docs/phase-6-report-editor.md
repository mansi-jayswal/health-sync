# Phase 6 — Radiology Report Editor

> Radiologist writes findings and impression on a study.
> Clinic admin views the report read-only.
> Reports are always editable — no draft/final status.
> **Depends on Phase 5 (Study Detail Page) being complete.**

---

## Context

Phase 5 left a placeholder card in the report column of the study detail page. This phase replaces it with a fully working `ReportPanel`. One report per study, keyed on `study_id`. Radiologist writes; admin reads.

---

## What Gets Built

| Task | Notes |
|---|---|
| `reports` DB table + RLS | One row per study |
| `GET /api/studies/[id]/report` | Fetch report or null |
| `POST /api/reports` | Create report (first save) |
| `PATCH /api/reports/[id]` | Update report content |
| `GET /api/reports` | Radiologist's own report list |
| `ReportPanel` component | Editor (radiologist) + read-only (admin) |
| Replace placeholder in study detail page | One-line swap |
| `/dashboard/reports` page | Radiologist's report list |

---

## Database

### `reports` table

```sql
create table reports (
  id          uuid primary key default gen_random_uuid(),
  study_id    uuid not null unique references studies(id) on delete cascade,
  author_id   uuid not null references profiles(id),
  findings    text not null default '',
  impression  text not null default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table reports enable row level security;
```

`unique(study_id)` — enforces one report per study at DB level.

### RLS policies

```sql
-- clinic_admin: read all reports
create policy "clinic_admin_select_reports" on reports
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'clinic_admin'
    )
  );

-- radiologist: full CRUD on own reports
create policy "radiologist_own_reports" on reports
  for all using (
    author_id = auth.uid()
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'radiologist'
    )
  );

-- radiologist: read reports on their assigned studies
create policy "radiologist_assigned_study_reports" on reports
  for select using (
    exists (
      select 1 from studies
      where studies.id = reports.study_id
        and studies.assigned_to = auth.uid()
    )
  );
```

> Update `docs/database.md` after migration.

---

## API Routes

### `GET /api/studies/[id]/report`
- File: `app/api/studies/[id]/report/route.ts`
- Auth: `requireAuth()`
- Returns: `Report | null` — null if no report yet. Both roles can call this.

### `POST /api/reports`
- File: `app/api/reports/route.ts`
- Auth: `requireRole([ROLES.RADIOLOGIST])`
- Body: `reportCreateSchema`
- Flow:
  1. Check no report exists for `study_id` → return `409` if it does.
  2. Check study is assigned to `auth.user.id` → return `403` if not.
  3. Insert with `author_id = auth.user.id`.
- Returns: `Report` (201)

### `PATCH /api/reports/[id]`
- File: `app/api/reports/[id]/route.ts`
- Auth: `requireRole([ROLES.RADIOLOGIST])`
- Body: `reportUpdateSchema`
- Flow:
  1. Verify `author_id = auth.user.id` → return `403` if not.
  2. Update `findings`, `impression`, `updated_at = now()`.
- Returns: updated `Report`

### `GET /api/reports`
- File: `app/api/reports/route.ts` (GET handler alongside POST)
- Auth: `requireRole([ROLES.RADIOLOGIST])`
- Returns: radiologist's own reports joined with study + patient data.
- Supports `?modality=` query param (server-side filter).
- Sort: `updated_at DESC`.

**Supabase query for GET /api/reports:**
```ts
const { data } = await supabase
  .from('reports')
  .select(`
    id, findings, impression, created_at, updated_at,
    study:studies (
      id, modality, study_date, status,
      patient:patients ( id, full_name )
    )
  `)
  .eq('author_id', auth.user.id)
  .order('updated_at', { ascending: false });
```

> Update `docs/api-contracts.md` after implementation.

---

## Zod Schemas

File: `src/types/schemas/report.schema.ts`

```ts
export const reportCreateSchema = z.object({
  study_id:   z.string().uuid(),
  findings:   z.string().max(5000).default(''),
  impression: z.string().max(2000).default(''),
});

export const reportUpdateSchema = z.object({
  findings:   z.string().max(5000).optional(),
  impression: z.string().max(2000).optional(),
});

export const reportSchema = z.object({
  id:         z.string().uuid(),
  study_id:   z.string().uuid(),
  author_id:  z.string().uuid(),
  findings:   z.string(),
  impression: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Report           = z.infer<typeof reportSchema>;
export type ReportCreateInput = z.infer<typeof reportCreateSchema>;
export type ReportUpdateInput = z.infer<typeof reportUpdateSchema>;
```

---

## Components

### `ReportPanel` — `components/dashboard/report-panel.tsx`

Single component, four render states based on role + whether report exists:

**Radiologist — no report yet:**
- Message: "No report written yet."
- "Start Report" button → calls `useCreateReport({ study_id, findings: '', impression: '' })` → on success, report row exists, editor appears.

**Radiologist — report exists (editor mode):**
- Two shadcn `Textarea` fields: **Findings** and **Impression**.
- Form managed by React Hook Form + `reportUpdateSchema`.
- "Save" button → calls `useUpdateReport`.
- Auto-save: 3-second debounce after last keystroke → silent `useUpdateReport` (no toast for auto-save).
- While debounce pending: show `"Unsaved changes"` in `text-muted-foreground`.
- After save: show `"Last saved: [relative time]"` derived from `report.updated_at`.

**Admin — report exists (read-only):**
- `findings` and `impression` rendered as plain text in labeled sections.
- Below content: `"Written by: [author full_name]"` and `"Last updated: [relative time]"`.
- No textarea, no save button.

**Admin — no report yet:**
- Message: `"No report has been written for this study yet."` — no action available.

```ts
interface ReportPanelProps {
  studyId: string;
}
// Uses useRole() internally to determine render state.
```

### Relative time utility

File: `src/lib/utils/date.ts`

If `date-fns` is already installed use `formatDistanceToNow`. Otherwise add this helper — do not install a new package just for this:

```ts
export function relativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1)  return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)   return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
```

---

## Study Detail Page — Integration

In `app/dashboard/studies/[id]/page.tsx`, replace the Phase 5 placeholder card:

```tsx
// Remove:
<Card>...</Card>   // the "No report yet" placeholder

// Replace with:
import { ReportPanel } from '@/components/dashboard/report-panel';
<ReportPanel studyId={study.id} />
```

That is the only change to the study detail page in this phase.

---

## Radiologist Reports List — `/dashboard/reports`

**`app/dashboard/reports/page.tsx`**

- Protected by middleware (Phase 1) — clinic_admin redirected to `/dashboard`.
- Data: `useReports(filters)`.
- Heading: `"My Reports"` + subheading: `"[N] reports"`.
- Filter bar: Modality select (All / X-Ray / CT / MRI / Ultrasound) + patient name search input.
- Modality filter: passed as `?modality=` to API (server-side).
- Patient name search: client-side filter on `report.study.patient.full_name` (case-insensitive).

**`ReportSummaryCard`** — `components/dashboard/report-summary-card.tsx`

Each card shows one report. Collapsed by default:

```
┌──────────────────────────────────────────────────────┐
│  Jane Doe                        [CT badge] [status] │
│  Study: Mar 10, 2024  ·  Updated: 2 days ago         │
│                                                      │
│  Impression: Mild pleural effusion noted... (2 lines)│
│                          [▼ Expand]  [Open Study →]  │
└──────────────────────────────────────────────────────┘
```

Expanded (toggle `useState`):
```
│  Findings                                            │
│  [Full findings text]                                │
│                                                      │
│  Impression                                          │
│  [Full impression text]                              │
│                          [▲ Collapse] [Open Study →] │
```

- Impression preview: `line-clamp-2` in collapsed state.
- If impression is empty: `"No impression written yet."` in muted text.
- "Open Study →": `<Link href={/dashboard/studies/${report.study.id}}>` — navigates to full study page with editor.
- Empty state (no reports): `"You haven't written any reports yet. Open a study to get started."`
- Empty state (filters, no match): `"No reports match your search."` + "Clear filters" button.

---

## Hooks — `src/hooks/use-reports.ts`

```ts
export const reportKeys = {
  byStudy: (studyId: string) => ['reports', 'study', studyId] as const,
  list: (filters: { modality?: string }) => ['reports', 'list', filters] as const,
};

export function useStudyReport(studyId: string)
// GET /api/studies/[id]/report → Report | null

export function useCreateReport()
// POST /api/reports
// onSuccess: invalidate reportKeys.byStudy(studyId)

export function useUpdateReport()
// PATCH /api/reports/[id]
// onSuccess: invalidate reportKeys.byStudy(studyId)

export function useReports(filters: { modality?: string } = {})
// GET /api/reports?modality= → ReportListItem[]
```

---

## Types

```ts
// src/types/report-list-item.type.ts
export interface ReportListItem {
  id: string;
  findings: string;
  impression: string;
  created_at: string;
  updated_at: string;
  study: {
    id: string;
    modality: 'XRAY' | 'CT' | 'MRI' | 'US';
    study_date: string;
    status: 'pending' | 'in_review' | 'completed';
    patient: { id: string; full_name: string };
  };
}
```

---

## Definition of Done

- [ ] `reports` table created with `unique(study_id)` constraint and all RLS policies applied.
- [ ] `GET /api/studies/[id]/report` returns `null` correctly when no report exists.
- [ ] `POST /api/reports` — creates report; `409` if duplicate; `403` if study not assigned to radiologist.
- [ ] `PATCH /api/reports/[id]` — updates; `403` if not the author.
- [ ] `GET /api/reports` — returns radiologist's own reports with joined study + patient; `403` for admin.
- [ ] `ReportPanel` — "Start Report" creates report and transitions to editor in same render.
- [ ] `ReportPanel` — auto-save fires 3 seconds after last keystroke; unsaved indicator visible.
- [ ] `ReportPanel` — "Last saved" time updates after each save.
- [ ] `ReportPanel` — admin sees read-only view with author name and last updated.
- [ ] Phase 5 placeholder replaced with `ReportPanel` on study detail page.
- [ ] `/dashboard/reports` page accessible to radiologist; admin redirected.
- [ ] `ReportSummaryCard` — collapsed shows impression preview (2-line clamp).
- [ ] `ReportSummaryCard` — expand toggle shows full findings + impression.
- [ ] "Open Study →" navigates to correct study detail page.
- [ ] Modality filter and patient name search work correctly.
- [ ] `docs/api-contracts.md` and `docs/database.md` updated.
- [ ] `planning/features.md`: Radiology report editor → `done`, Reports list → `done`.
