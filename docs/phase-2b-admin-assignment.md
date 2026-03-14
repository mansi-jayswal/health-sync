# Phase 2b — Admin: Study Assignment & Status Management

> Clinic admin assigns studies to radiologists and manually manages study status.
> These tasks were referenced in earlier phases but never fully specced.
> **Build after Phase 1 (RBAC). Can be built in parallel with Phase 2 (Scan Upload).**

---

## Context

Studies already exist in DB (`done`). The `studies` table needs two additions:
- `assigned_to` column — which radiologist the study is assigned to.
- `status` column — lifecycle of the study (`pending → in_review → completed`).

Both columns drive the radiologist worklist (Phase 3b) and the study detail page (Phase 4). They must exist before those phases are built.

---

## Scope

| Task | Notes |
|---|---|
| Add `assigned_to` and `status` columns to `studies` table | Migration — ask user before running |
| Update RLS policies on `studies` | Radiologist sees only assigned rows |
| `PATCH /api/studies/[id]` — assign radiologist | Admin only |
| `PATCH /api/studies/[id]` — update status | Admin only (manual override) |
| `AssignRadiologistDialog` component | Admin assigns from list of active radiologists |
| `StudyStatusControl` component | Admin manually changes status via select |
| `GET /api/users?role=radiologist` | Returns active radiologists for assignment dropdown |

---

## Database Changes

### Migration — add columns to `studies`

```sql
-- Add assigned_to column
alter table studies
  add column if not exists assigned_to uuid references profiles(id) on delete set null;

-- Add status column
alter table studies
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'in_review', 'completed'));
```

> Show this migration to the user and get confirmation before running. Use Supabase MCP tool.

### Update RLS on `studies`

```sql
-- Drop any existing permissive policies first, then re-create:

-- clinic_admin: full CRUD on all studies
create policy "clinic_admin_all_studies" on studies
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'clinic_admin'
    )
  );

-- radiologist: SELECT only on studies assigned to them
create policy "radiologist_assigned_studies" on studies
  for select using (
    assigned_to = auth.uid()
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'radiologist'
    )
  );
```

> Update `docs/database.md` after migration.

---

## Status Transition Rules

Enforced server-side in `PATCH /api/studies/[id]`. Reject invalid transitions with `sendError('Invalid status transition', 400)`.

| From | To | Allowed by |
|---|---|---|
| `pending` | `in_review` | `clinic_admin` (manual) |
| `in_review` | `completed` | `clinic_admin` (manual) or auto when radiologist finalizes report (Phase 5) |
| `completed` | `in_review` | `clinic_admin` only (re-open) |
| Any → `pending` | ❌ | Never — once a study moves past pending it cannot go back to pending |

---

## API Routes

### `PATCH /api/studies/[id]`

- Auth: `requireRole([ROLES.CLINIC_ADMIN])`
- Body schema: `studyUpdateSchema`
- Handles both assignment and status update in one route — body fields are optional.
- Status transition validation enforced before DB write.
- Returns: updated `Study`

### `GET /api/users?role=radiologist`

- Auth: `requireRole([ROLES.CLINIC_ADMIN])`
- Returns: `Profile[]` filtered to `role = 'radiologist'` and `is_active = true`.
- Used to populate the assignment dropdown. Keep it simple — name + id only.
- Note: if `GET /api/users` already exists from Phase 1, add `?role=` query param support to it rather than creating a new route.

> Update `docs/api-contracts.md` after implementation.

---

## Zod Schemas

File: `src/types/schemas/study.schema.ts` — add or update:

```ts
export const studyUpdateSchema = z.object({
  assigned_to: z.string().uuid().nullable().optional(),
  status: z.enum(['pending', 'in_review', 'completed']).optional(),
  description: z.string().max(500).optional(),
});
```

---

## Components

### `AssignRadiologistDialog` — `components/dashboard/assign-radiologist-dialog.tsx`

- Triggered by "Assign Radiologist" button on study list row or study detail page (admin only — wrap in `RoleGuard`).
- shadcn `Dialog` containing a `Select` populated by `useRadiologists()`.
- Select options: radiologist full name. Include "Unassigned" as first option (sets `assigned_to: null`).
- On confirm: calls `useUpdateStudy` mutation with `{ assigned_to: selectedId }`.
- On success: invalidate study queries, close dialog, show success toast.
- Show current assignee as pre-selected value when dialog opens.

Props:
```ts
interface AssignRadiologistDialogProps {
  studyId: string;
  currentAssigneeId: string | null;
}
```

### `StudyStatusControl` — `components/dashboard/study-status-control.tsx`

- Admin-only component (RoleGuard wraps it).
- Renders a shadcn `Select` with options: `Pending`, `In Review`, `Completed`.
- Current status is pre-selected.
- On change: calls `useUpdateStudy` mutation with `{ status: newStatus }`.
- If server returns `400` (invalid transition), show toast with the error message.
- Disable the select while mutation is pending.

Props:
```ts
interface StudyStatusControlProps {
  studyId: string;
  currentStatus: 'pending' | 'in_review' | 'completed';
}
```

Both components are used:
- On the **study list** (Phase 4 adds these to the study detail page — place them in `StudyMetadataCard`).
- Admin sees them; radiologist does not (RoleGuard).

---

## Hooks

Add to `src/hooks/use-studies.ts`:

```ts
export function useUpdateStudy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StudyUpdateInput }) =>
      apiPatch<Study>(`/studies/${id}`, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: studyKeys.all });
      qc.invalidateQueries({ queryKey: studyKeys.detail(id) });
    },
  });
}
```

Add to `src/hooks/use-users.ts`:

```ts
export function useRadiologists() {
  return useQuery({
    queryKey: ['users', 'radiologists'],
    queryFn: () => apiGet<Profile[]>('/users?role=radiologist'),
  });
}
```

---

## Where These Components Appear

### Study list page (`/dashboard/studies`)
- Add an "Assign" action button per row → opens `AssignRadiologistDialog`.
- Add status badge per row using `StudyStatusBadge` (Phase 4).

### Study detail page (`/dashboard/studies/[id]`) — Phase 4
- `StudyMetadataCard` shows assigned radiologist name + `AssignRadiologistDialog` trigger (admin only).
- `StudyStatusControl` sits below the status badge in the metadata card (admin only).

> Phase 4 spec references these components. Build them here so Phase 4 can import them directly.

---

## Definition of Done

- [ ] `assigned_to` and `status` columns added to `studies` table.
- [ ] RLS updated — radiologist can only SELECT studies where `assigned_to = auth.uid()`.
- [ ] `PATCH /api/studies/[id]` handles assignment and status update.
- [ ] Status transition rules enforced server-side — invalid transitions return `400`.
- [ ] `GET /api/users?role=radiologist` returns active radiologists only.
- [ ] `AssignRadiologistDialog` — pre-selects current assignee, "Unassigned" option available.
- [ ] `StudyStatusControl` — disables invalid transitions (server enforces, client shows error).
- [ ] Both components visible to `clinic_admin` only (RoleGuard verified).
- [ ] Study list shows assignee and status badge per row.
- [ ] `docs/api-contracts.md` and `docs/database.md` updated.
