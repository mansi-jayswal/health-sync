# Phase 1 — RBAC & Role-Based Navigation

> Replace default `admin/user` roles with `clinic_admin/radiologist`.
> Enforce route protection via middleware, server helpers, and role-aware UI.
> **Build this first — every other phase depends on correct roles being in place.**

---

## Context

The app currently has Supabase Auth working and a dashboard shell, but uses default roles (`admin`/`user`). This phase swaps those out completely and wires up all role enforcement layers. No new pages are added — this is purely infrastructure.

---

## Scope

| Task | Notes |
|---|---|
| Update `profiles.role` column constraint to `clinic_admin` / `radiologist` | Migration required |
| Update `src/constants/roles.ts` | Replace old role values |
| Implement `requireRole()` in `src/lib/auth.ts` | New helper |
| Update Next.js middleware for route protection | `/dashboard/patients`, `/dashboard/upload` → admin only |
| Implement `RoleGuard` component | Wraps role-restricted UI |
| Update `useRole()` hook | Return new role type |
| Update sidebar nav to be role-aware | Different items per role |
| Update all existing API routes to call `requireAuth()` | Audit every existing route |

---

## Database Change

**Migration — update `profiles.role` check constraint:**

```sql
-- Drop old constraint (name may vary — check actual DB first)
alter table profiles drop constraint profiles_role_check;

-- Add new constraint
alter table profiles add constraint profiles_role_check
  check (role in ('clinic_admin', 'radiologist'));

-- Update any existing rows (dev/seed data)
-- Ask user before running this:
update profiles set role = 'clinic_admin' where role = 'admin';
update profiles set role = 'radiologist' where role = 'user';
```

> Show the user this migration and get explicit confirmation before running. Use Supabase MCP tool to apply.

**RLS policies to add/update on `profiles`:**

```sql
-- clinic_admin reads all profiles (needed for user management + assign dropdowns)
create policy "clinic_admin_read_all" on profiles
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'clinic_admin'
    )
  );

-- Any user reads own profile
create policy "user_read_own" on profiles
  for select using (auth.uid() = id);
```

> Update `docs/database.md` after migration.

---

## Constants

**`src/constants/roles.ts`** — replace entirely:

```ts
export const ROLES = {
  CLINIC_ADMIN: 'clinic_admin',
  RADIOLOGIST: 'radiologist',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
```

---

## Server Helper — `src/lib/auth.ts`

Add `requireRole()` alongside existing `requireAuth()`:

```ts
import { ROLES, type Role } from '@/constants/roles';
import { sendError } from '@/lib/utils/api';

// Already exists — ensure it returns { user, profile }
export async function requireAuth() { ... }

// New
export async function requireRole(allowedRoles: Role[]) {
  const auth = await requireAuth();
  if (!auth) return null; // caller returns sendError 401

  if (!allowedRoles.includes(auth.profile.role as Role)) {
    return null; // caller returns sendError 403
  }
  return auth;
}
```

**Usage pattern in every route handler:**

```ts
// Any authenticated user
const auth = await requireAuth();
if (!auth) return sendError('Unauthorized', 401);

// Clinic admin only
const auth = await requireRole([ROLES.CLINIC_ADMIN]);
if (!auth) return sendError('Forbidden', 403);
```

---

## Middleware — `src/middleware.ts`

Update (or create) middleware to enforce route-level protection:

```ts
// Route protection rules:
// /dashboard/patients/* → clinic_admin only
// /dashboard/upload/*   → clinic_admin only
// /dashboard/studies/*  → clinic_admin, radiologist
// /dashboard/reports/*  → radiologist only
// /dashboard            → clinic_admin, radiologist
// /auth/*               → public
```

Middleware reads the Supabase session cookie, extracts `profile.role`, and redirects unauthorized users to `/dashboard` (not sign-out — just back to their allowed area).

> Middleware is first-line defence only. Always also call `requireAuth()`/`requireRole()` inside route handlers.

---

## RoleGuard Component

**`src/components/shared/role-guard.tsx`**

```tsx
// Renders children only if current user's role is in allowedRoles.
// Renders null otherwise — no error, no redirect.
// Use for hiding UI elements (buttons, menu items, sections).
// Do NOT use as a replacement for route-level protection.

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const role = useRole();
  if (!role || !allowedRoles.includes(role)) return null;
  return <>{children}</>;
}
```

---

## Sidebar Nav — Role-Aware

Update the existing sidebar to render different items per role.

**`clinic_admin` sidebar items:**
- Dashboard → `/dashboard`
- Patients → `/dashboard/patients`
- Upload Scan → `/dashboard/upload`
- Studies → `/dashboard/studies`

**`radiologist` sidebar items:**
- Dashboard → `/dashboard`
- Studies → `/dashboard/studies`
- Reports → `/dashboard/reports`

Use `useRole()` inside the sidebar component to select the correct item list. Do not render admin nav items for radiologists — remove them entirely, not just disable.

---

## Existing API Routes — Audit

Go through every existing route handler under `app/api/` and ensure each one calls `requireAuth()` at minimum. Routes that are admin-only must call `requireRole([ROLES.CLINIC_ADMIN])`.

Known routes to audit (update as routes are discovered in codebase):
- Patient CRUD routes → `requireRole([ROLES.CLINIC_ADMIN])` for POST/PATCH/DELETE
- Study CRUD routes → `requireAuth()` for GET; `requireRole([ROLES.CLINIC_ADMIN])` for POST/PATCH/DELETE

---

## Hooks

**`src/hooks/use-current-user.ts`** — update return type:

```ts
import type { Role } from '@/constants/roles';

export function useCurrentUser(): { user: User; profile: Profile } | null
export function useRole(): Role | null
```

---

## Definition of Done

- [ ] `profiles.role` constraint updated to `clinic_admin` / `radiologist` in DB.
- [ ] All existing seed/dev users have valid new roles.
- [ ] `ROLES` constants updated — no hardcoded role strings anywhere in codebase.
- [ ] `requireRole()` implemented and tested in at least one route handler.
- [ ] Middleware blocks radiologist from `/dashboard/patients` and `/dashboard/upload`.
- [ ] Middleware blocks clinic_admin from `/dashboard/reports`.
- [ ] `RoleGuard` component implemented and used in sidebar.
- [ ] Sidebar shows correct items per role — verified visually for both roles.
- [ ] All existing API routes audited and `requireAuth()` / `requireRole()` added.
- [ ] `docs/database.md` updated with new role constraint and RLS policies.
- [ ] `planning/features.md` status updated: RBAC → `done`, Role-based nav → `done`.
