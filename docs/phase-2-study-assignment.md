# Phase 2 — Study Assignment & Status Management

> Add `assigned_to` and `status` columns to studies.
> Admin assigns studies to radiologists and manages study lifecycle.
> **Depends on Phase 1 (RBAC) being complete.**

---

## Context

Studies already exist in the DB. Right now they have no assignment or status. This phase adds both — they are foundational columns that every subsequent phase reads from. The radiologist worklist (Phase 4) and study detail page (Phase 5) both require these columns to exist.

Build this immediately after Phase 1. Do not skip ahead.

---

## What Gets Built

| Task | Notes |
|---|---|
| Add `assigned_to` column to `studies` | FK → `profiles(id)` |
| Add `status` column to `studies` | `pending / in_review / completed` |
| Update RLS on `studies` | Radiologist sees only their assigned rows |
| `PATCH /api/studies/[id]` route | Assign radiologist + update status |
| `GET /api/users?role=radiologist` | Radiologist list for assignment dropdown |
| `AssignRadiologistDialog` component | Admin picks radiologist for a study |
| `StudyStatusControl` component | Admin manually changes study status |
| Show assignee + status on study list | Add columns to existing studies table |

---

## Database

### Migration — add columns to `studies`

> Show this migration to the user. Get explicit confirmation before running. Use Supabase MCP tool.

```sql
-- Add assigned_to (nullable — studies start unassigned)
alter table studies
  add column if not exists assigned_to uuid
    references profiles(id) on delete set null;

-- Add status with default and constraint
alter table studies
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'in_review', 'completed'));
```

### Update RLS on `studies`

Drop any existing permissive policies, then apply these:

```sql
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

Enforced server-side in `PATCH /api/studies/[id]`. Return `sendError('Invalid status transition', 400)` for invalid moves.

| From | To | Who can trigger |
|---|---|---|
| `pending` | `in_review` | `clinic_admin` only |
| `in_review` | `completed` | `clinic_admin` only |
| `completed` | `in_review` | `clinic_admin` only (re-open) |
| Anything → `pending` | ❌ Never | Once past pending, cannot go back |

---

## API Routes

### `PATCH /api/studies/[id]`
- File: `app/api/studies/[id]/route.ts`
- Auth: `requireRole([ROLES.CLINIC_ADMIN])`
- Body schema: `studyUpdateSchema`
- Handles assignment + status update in one route (fields are optional).
- Validate status transition before writing to DB.
- Returns: updated `Study`

### `GET /api/users`
- File: `app/api/users/route.ts` (update if already exists from Phase 1)
- Auth: `requireRole([ROLES.CLINIC_ADMIN])`
- Query param: `?role=radiologist` → filter by role and `is_active = true`
- Returns: `Pick<Profile, 'id' | 'full_name'>[]`
- Used only to populate assignment dropdowns — keep response minimal.

> Update `docs/api-contracts.md` after implementation.

---

## Zod Schema

File: `src/types/schemas/study-update.schema.ts`

```ts
export const studyUpdateSchema = z.object({
  assigned_to: z.string().uuid().nullable().optional(),
  status: z.enum(['pending', 'in_review', 'completed']).optional(),
  description: z.string().max(500).optional(),
});

export type StudyUpdateInput = z.infer<typeof studyUpdateSchema>;
```

---

## Components

### `AssignRadiologistDialog` — `components/dashboard/assign-radiologist-dialog.tsx`

- shadcn `Dialog`. Triggered by "Assign" button on study list row (admin only — wrap trigger in `RoleGuard`).
- Contains a shadcn `Select` populated from `useRadiologists()`.
- First option: "Unassigned" → sends `assigned_to: null`.
- Pre-selects current assignee when dialog opens.
- On confirm: calls `useUpdateStudy({ id, data: { assigned_to } })`.
- On success: invalidate study queries, close dialog, show success toast.

```ts
interface AssignRadiologistDialogProps {
  studyId: string;
  currentAssigneeId: string | null;
}
```

### `StudyStatusControl` — `components/dashboard/study-status-control.tsx`

- Admin only — wrap in `RoleGuard`.
- shadcn `Select` with options: Pending / In Review / Completed.
- Pre-selects current status.
- On change: calls `useUpdateStudy({ id, data: { status } })`.
- On `400` response from server: show error toast with server message.
- Disable select while mutation is pending (`isPending`).

```ts
interface StudyStatusControlProps {
  studyId: string;
  currentStatus: 'pending' | 'in_review' | 'completed';
}
```

### `StudyStatusBadge` — `components/shared/study-status-badge.tsx`

Reusable badge used across study list, detail page, and worklist.

```ts
// pending    → shadcn Badge variant="secondary" (gray)
// in_review  → yellow: className="bg-yellow-100 text-yellow-800"
// completed  → green: className="bg-green-100 text-green-800"

interface StudyStatusBadgeProps {
  status: 'pending' | 'in_review' | 'completed';
}
```

---

## Study List — Updates

Update the existing studies list page (`/dashboard/studies`) to show:
- **Assigned to** column: radiologist name or "Unassigned" in `text-muted-foreground`.
- **Status** column: `StudyStatusBadge`.
- **Assign** action button per row → opens `AssignRadiologistDialog` (admin only via `RoleGuard`).

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
    queryFn: () => apiGet<Pick<Profile, 'id' | 'full_name'>[]>('/users?role=radiologist'),
  });
}
```

---

## Definition of Done

- [ ] `assigned_to` and `status` columns exist on `studies` table in DB.
- [ ] All existing studies have `status = 'pending'` by default.
- [ ] RLS verified: radiologist querying `/api/studies` only sees rows where `assigned_to = their id`.
- [ ] `PATCH /api/studies/[id]` — assignment update works.
- [ ] `PATCH /api/studies/[id]` — status update works; invalid transitions return `400`.
- [ ] `GET /api/users?role=radiologist` returns only active radiologists.
- [ ] `AssignRadiologistDialog` — opens with current assignee pre-selected; "Unassigned" option clears assignment.
- [ ] `StudyStatusControl` — changes status; shows toast on invalid transition.
- [ ] Both components hidden from radiologist (RoleGuard verified).
- [ ] `StudyStatusBadge` renders correct color for all three statuses.
- [ ] Study list shows assigned radiologist name and status badge per row.
- [ ] `docs/api-contracts.md` and `docs/database.md` updated.
- [ ] `planning/features.md`: Study assignment → `done`.
