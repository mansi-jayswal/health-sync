# Phase 7 — Radiologist Worklist & Dashboard Home

> Radiologist-specific study worklist with filters.
> Dashboard home with pending study count stats card.
> **Depends on Phase 6 (Report Editor) being complete** — report status shown in worklist.

---

## Context

The existing `/dashboard/studies` page shows all studies and is designed for clinic admin. Radiologists need a task-focused view showing only their assigned studies with relevant filters. The `/dashboard` home currently has no role-specific content — this phase adds a stats card for radiologists.

---

## What Gets Built

| Task | Notes |
|---|---|
| `RadiologistWorklist` component | Filtered assigned-studies view |
| Role-split on `/dashboard/studies` | Admin sees existing list; radiologist sees new component |
| Status filter + modality filter | Applied via API query params |
| Report status column in worklist | "Written" / "Not started" per study |
| `GET /api/studies` — filter params | Add `?status=` and `?modality=` support |
| `GET /api/dashboard/stats` | Pending/in_review/completed counts for radiologist |
| `DashboardStatsCard` component | Radiologist-only stats on `/dashboard` home |

---

## API Changes

### `GET /api/studies` — extend with filters

Update existing route to accept query params:

```
GET /api/studies?status=pending&modality=CT
```

Server-side: apply `.eq('status', status)` and `.eq('modality', modality)` if params present. RLS already restricts radiologist to their assigned studies — no extra filter needed for that.

Also include report count in response so the worklist can show "Written / Not started":

```ts
const { data } = await supabase
  .from('studies')
  .select('*, reports(count)')
  // apply filters
```

Return `report_count: number` on each row.

### `GET /api/dashboard/stats`

New route: `app/api/dashboard/stats/route.ts`

- Auth: `requireRole([ROLES.RADIOLOGIST])`
- Returns counts of current radiologist's studies grouped by status.

```ts
// Query: count studies where assigned_to = auth.uid(), group by status
// Return:
{
  pending:   number;
  in_review: number;
  completed: number;
  total:     number;
}
```

- Calling as `clinic_admin` returns `403`.

> Update `docs/api-contracts.md` after implementation.

---

## Route Split — `/dashboard/studies`

Same URL, different component per role. Update `app/dashboard/studies/page.tsx`:

```tsx
'use client';
import { useRole } from '@/hooks/use-current-user';
import { ROLES } from '@/constants/roles';
import { AdminStudyList } from '@/components/dashboard/admin-study-list';
import { RadiologistWorklist } from '@/components/dashboard/radiologist-worklist';

export default function StudiesPage() {
  const role = useRole();
  if (!role) return null; // loading — show skeleton

  return role === ROLES.CLINIC_ADMIN
    ? <AdminStudyList />
    : <RadiologistWorklist />;
}
```

Extract the existing studies list into `AdminStudyList` if it isn't already a named component.

---

## Components

### `RadiologistWorklist` — `components/dashboard/radiologist-worklist.tsx`

**Filter bar:**

```
[Status: All ▾]    [Modality: All ▾]
```

- Status select: All / Pending / In Review / Completed
- Modality select: All / X-Ray / CT / MRI / Ultrasound
- Filters in local `useState`. On change → update `useStudies(filters)` query params.
- "Clear filters" button: resets both to "All". Show only when at least one filter is active.

**Studies table** (shadcn `DataTable`):

| Column | Content |
|---|---|
| Patient | `study.patient.full_name` (join needed — see hook note) |
| Modality | `ModalityBadge` (Phase 5) |
| Study Date | Formatted `Mar 10, 2024` |
| Status | `StudyStatusBadge` (Phase 2) |
| Report | `✓ Written` (`text-green-600`) or `— Not started` (`text-muted-foreground`) |
| Action | "Open Study" button → `/dashboard/studies/[id]` |

**Report column logic:** use `report_count` field injected by `GET /api/studies` (see API section above). `report_count > 0` → Written; `0` → Not started.

**Patient name in table:** `GET /api/studies` must join patient name. Update the route to include:
```ts
.select('*, patient:patients(full_name), reports(count)')
```
Add `patient: { full_name: string }` to the `Study` type.

**Empty states:**
- No assigned studies: `"No studies have been assigned to you yet."`
- Filters active, no results: `"No studies match your filters."` + "Clear filters" button.

**Loading:** 5 skeleton rows while data fetches.

---

### `DashboardStatsCard` — `components/dashboard/dashboard-stats-card.tsx`

Radiologist only. Rendered on `/dashboard` home.

Three stat tiles in a row (`grid grid-cols-3 gap-4`, stacked on mobile):

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Pending     │  │  In Review   │  │  Completed   │
│    [N]       │  │    [N]       │  │    [N]       │
│  studies     │  │  studies     │  │  studies     │
└──────────────┘  └──────────────┘  └──────────────┘
```

- Each tile: shadcn `Card`.
- Pending count: `text-2xl font-bold text-yellow-600`.
- In Review count: `text-2xl font-bold text-blue-600`.
- Completed count: `text-2xl font-bold text-green-600`.
- Each tile is clickable — navigates to `/dashboard/studies` (the radiologist worklist).
- Loading: `Skeleton` for each number.
- Data: `useDashboardStats()`.

---

## Dashboard Home — Update

**`app/dashboard/page.tsx`** — add role-specific content:

```tsx
'use client';
const role = useRole();

return (
  <div className="p-6 space-y-6">
    <h1 className="text-2xl font-semibold">Dashboard</h1>
    {role === ROLES.RADIOLOGIST && <DashboardStatsCard />}
  </div>
);
```

Admin dashboard home is out of scope — leave as-is or with a simple welcome message.

---

## Hooks

### Update `src/hooks/use-studies.ts`

```ts
interface StudyFilters {
  status?:   'pending' | 'in_review' | 'completed';
  modality?: 'XRAY' | 'CT' | 'MRI' | 'US';
}

// Update studyKeys to include filters:
export const studyKeys = {
  all:      ['studies'] as const,
  filtered: (filters: StudyFilters) => ['studies', 'filtered', filters] as const,
  detail:   (id: string) => ['studies', 'detail', id] as const,
};

// Update useStudies to accept filters:
export function useStudies(filters: StudyFilters = {}) {
  return useQuery({
    queryKey: studyKeys.filtered(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.status)   params.set('status', filters.status);
      if (filters.modality) params.set('modality', filters.modality);
      const qs = params.toString();
      return apiGet<Study[]>(`/studies${qs ? `?${qs}` : ''}`);
    },
  });
}
```

### New file: `src/hooks/use-dashboard.ts`

```ts
export const dashboardKeys = {
  stats: ['dashboard', 'stats'] as const,
};

export interface DashboardStats {
  pending:   number;
  in_review: number;
  completed: number;
  total:     number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: () => apiGet<DashboardStats>('/dashboard/stats'),
  });
}
```

---

## Type Updates

Update `Study` type in `src/types/` to include joined fields returned by the updated `GET /api/studies`:

```ts
export interface Study {
  // ...existing fields
  report_count: number;                         // from reports(count) join
  patient?: { full_name: string } | null;       // from patients join
}
```

---

## Definition of Done

- [ ] `/dashboard/studies` renders `AdminStudyList` for clinic_admin and `RadiologistWorklist` for radiologist.
- [ ] Radiologist only sees their assigned studies — verified by calling `/api/studies` directly as radiologist.
- [ ] Status filter: selecting "Pending" shows only pending studies; other statuses correct.
- [ ] Modality filter: selecting "CT" shows only CT studies.
- [ ] Combined filters work (e.g. Pending + CT).
- [ ] "Clear filters" button resets both selects; only visible when a filter is active.
- [ ] "Written / Not started" report column correct for each row.
- [ ] Patient name visible in worklist table.
- [ ] "Open Study" navigates to correct study detail page.
- [ ] Empty state (no assignments) message shown.
- [ ] Empty state (filters, no results) shown with "Clear filters".
- [ ] Loading skeletons shown while data fetches.
- [ ] `DashboardStatsCard` shows correct pending/in_review/completed counts.
- [ ] Counts update when studies are assigned or status changes.
- [ ] Clinic admin does not see `DashboardStatsCard`.
- [ ] `GET /api/dashboard/stats` returns `403` for clinic_admin.
- [ ] `docs/api-contracts.md` updated with stats route + filter params on studies route.
- [ ] `planning/features.md`: Radiologist worklist → `done`, Dashboard stats → `done`.
