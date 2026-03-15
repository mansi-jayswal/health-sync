# Phase 0 — User Invite & Radiologist Onboarding

> Clinic admin invites users (radiologist or clinic_admin) via email.
> Invited user clicks email link → lands on set-password page → logs in with correct role.
> **Build this before Phase 1 RBAC is fully complete — but RBAC must be done first.**
> **Full dependency: Phase 1 (RBAC) must be complete before this phase.**

---

## Context

Currently, the only way to create a user is via the public sign-up form, which always assigns the default role. This breaks the radiologist workflow — radiologists must never self-register because their role must be pre-assigned by a clinic admin.

This phase builds:
1. A `/dashboard/radiologists` page (admin only) — lists all radiologists, has an "Invite" button.
2. An invite flow using Supabase `admin.inviteUserByEmail()` — creates the user with the correct role pre-assigned in `profiles`.
3. A `/auth/set-password` page — where the invited user lands after clicking the email link to set their password and complete onboarding.

After this phase, the complete flow is:
```
Admin fills invite form → Supabase sends email → Radiologist clicks link
→ /auth/set-password → sets password → redirected to /dashboard → sees radiologist UI
```

---

## What Gets Built

| Task | Notes |
|---|---|
| `/dashboard/radiologists` page | Admin only — lists radiologists, invite button |
| `InviteUserDialog` component | Form: name + email + role selector |
| `POST /api/users/invite` route | Calls Supabase admin invite + inserts profile row |
| `GET /api/users` route | Returns users list filtered by role |
| `/auth/set-password` page | Where invited user lands to set their password |
| Supabase email redirect config | Redirect URLs must include `/auth/callback` (invite flow goes callback → set-password) |

---

## How Supabase Invite Works

Supabase `admin.inviteUserByEmail()` (service-role key, server-side only):
1. Creates user in `auth.users` with a one-time invite token.
2. Sends an email with a magic link containing that token.
3. When user clicks the link, Supabase exchanges the token for a session.
4. Invite email link sends user to `/auth/callback?redirectTo=/auth/set-password` (with PKCE `code`). Callback exchanges code for a session and redirects to `/auth/set-password`.
5. User calls `supabase.auth.updateUser({ password })` to set their password.
6. Done — user is fully onboarded with correct role already in `profiles`.

> The profile row (`full_name`, `role`) is inserted **at invite time** by the API route, not at click time. When the user clicks the link and lands in the app, their profile already exists with the correct role.

---

## Supabase Config

Before building, ensure **Supabase Redirect URLs** include the auth callback (invite links are built to go through the callback, which then redirects to set-password):

```
Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
Add: https://your-app-url.vercel.app/auth/callback
(Also add: http://localhost:3000/auth/callback for local dev)
```

The invite API sets `redirectTo` to the callback URL with `redirectTo=/auth/set-password`, so after the user clicks the email link they land on the callback, exchange the code for a session, then are redirected to the set-password page.

Also update the **invite email template** (optional but recommended):

```
Supabase Dashboard → Authentication → Email Templates → Invite User
Subject: "You've been invited to HealthScan"
Body: include {{ .ConfirmationURL }} as the invite link
```

### Invite / verification link expiry (time-based)

By default, the email invite link expires after a short period (e.g. 1 hour). To make the link valid for longer **based on time** (so the radiologist has more time to open it once):

1. **Dashboard (if available):**  
   Supabase Dashboard → **Project Settings** → **Auth** (or **Authentication** → **Providers** → **Email**). Look for **Email OTP Expiration** or similar, and set the value to the desired lifetime in **seconds** (e.g. `86400` = 24 hours). Supabase may cap this (e.g. max 86400).

2. **Management API:**  
   The auth config key is `mailer_otp_exp` (integer, seconds). You can PATCH it via the [Management API](https://supabase.com/docs/reference/api/auth-config), e.g.:

   ```bash
   curl -X PATCH "https://api.supabase.com/v1/projects/<PROJECT_REF>/config/auth" \
     -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"mailer_otp_exp": 86400}'
   ```

**Important:** The link is **single-use**. Once the user (or an email client prefetch) successfully exchanges the token for a session, that link cannot be used again. So “clicking the link twice” will show “expired” the second time because the first use already consumed the token. Increasing `mailer_otp_exp` only extends how long the link is valid **before** that first use (time-based), not how many times it can be used. If the user’s email client prefetches links (e.g. Safe Links), the token can be consumed before they click; in that case they need a new invite (resend) or to use the 6-digit OTP from the email if your template includes it.

> Show these config steps to the user and ask them to complete before running the invite route.

---

## Database

No new tables. The existing `profiles` table is used.

The invite route inserts the profile row immediately on invite (before the user clicks the link):

```sql
-- Profile is inserted server-side at invite time
insert into profiles (id, full_name, role)
values ($userId, $fullName, $role);
```

If the invite is resent or the user never clicks, the profile row exists but `is_active` remains `true`. This is acceptable for MVP — no cleanup needed.

---

## API Routes

### `POST /api/users/invite`

File: `app/api/users/invite/route.ts`

- Auth: `requireRole([ROLES.CLINIC_ADMIN])`
- Body schema: `userInviteSchema`
- Uses **service-role Supabase client** (not the regular server client) — only in this route.
- Flow:
  1. Validate body with `userInviteSchema`.
  2. Call `supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo, data: { full_name, role } })`.
  3. If Supabase returns error (e.g. user already exists) → return `sendError(error.message, 400)`.
  4. Insert row into `profiles`: `{ id: invitedUser.id, full_name, role }`.
  5. Return `sendSuccess({ message: 'Invite sent.' }, 201)`.

```ts
// redirectTo goes through callback so the server can exchange the code and set cookies, then redirect to set-password:
const callbackWithRedirect = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?redirectTo=${encodeURIComponent('/auth/set-password')}`;
// inviteUserByEmail(..., { redirectTo: callbackWithRedirect, data: { full_name, role } })
```

**Service-role client** — create a separate helper, never use it outside server-side invite/admin routes:

```ts
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // never expose to client
  );
}
```

> `SUPABASE_SERVICE_ROLE_KEY` must be in `.env.local` (server-side only, no `NEXT_PUBLIC_` prefix).

### `GET /api/users`

File: `app/api/users/route.ts`

- Auth: `requireRole([ROLES.CLINIC_ADMIN])`
- Query param: `?role=radiologist` or `?role=clinic_admin` — filter by role. If no param, return all.
- Returns: `Profile[]` ordered by `created_at DESC`.
- Used by the radiologists list page and the assign-radiologist dropdown (Phase 2).

> Update `docs/api-contracts.md` after implementation.

---

## Zod Schemas

File: `src/types/schemas/user-invite.schema.ts`

```ts
export const userInviteSchema = z.object({
  email:     z.string().email('Valid email required'),
  full_name: z.string().min(1, 'Name is required').max(100),
  role:      z.enum(['clinic_admin', 'radiologist']),
});

export type UserInviteInput = z.infer<typeof userInviteSchema>;
```

---

## Pages & Components

### `/dashboard/radiologists` page

File: `app/dashboard/radiologists/page.tsx`

- `'use client'`
- Protected by middleware — `clinic_admin` only. Radiologist hitting this URL → redirect to `/dashboard`.
- Add to `clinic_admin` sidebar: **Radiologists** → `/dashboard/radiologists` (between Patients and Studies).
- Fetch: `useUsers({ role: 'radiologist' })`.

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Radiologists                    [+ Invite] button  │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  Name          Email           Joined        │    │
│  │  Dr. Smith     dr@clinic.com   Mar 10, 2024  │    │
│  │  ...                                         │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Empty state: "No radiologists yet. Invite one."    │
└─────────────────────────────────────────────────────┘
```

**Table columns:** Full name | Email | Role badge | Joined date (`created_at` formatted).

**Loading:** skeleton rows while data fetches.

**Empty state:** `"No radiologists have been added yet."` with an inline "Invite your first radiologist" button that opens the dialog.

---

### `InviteUserDialog` — `components/dashboard/invite-user-dialog.tsx`

- shadcn `Dialog`. Opened by "Invite" button (top-right of radiologists page).
- Form uses React Hook Form + `userInviteSchema` + shadcn `Form`.

**Fields:**
| Field | Type | Notes |
|---|---|---|
| Full name | `Input` | Required |
| Email | `Input` type email | Required |
| Role | shadcn `Select` | Options: Radiologist / Clinic Admin |

- Role selector defaults to `radiologist` (since admin is on the radiologists page).
- Submit button: "Send Invite" → calls `useInviteUser` mutation.
- While pending: button shows "Sending..." and is disabled.
- On success: close dialog, show toast `"Invite sent to [email]"`, invalidate users list query.
- On error (e.g. already invited): show error toast with server message.

---

### `/auth/set-password` page

File: `app/auth/set-password/page.tsx`

- **Public route** — no auth required (the user has a session from the invite link but no password yet).
- This page is where Supabase redirects after the invited user clicks the email link.

**How the session arrives:**

When the invited user clicks the link, Supabase redirects to the app's `/auth/callback` URL with a PKCE `code` (and the `redirectTo` query param). The callback route exchanges the code for a session (setting cookies) and redirects to `/auth/set-password`. If the user instead lands directly on set-password with `code` or `token_hash` in the URL, the set-password page redirects them to the callback so the exchange happens server-side, then they are sent back to set-password with a session.

**Simplest reliable approach — handle in the set-password page directly:**

```tsx
// app/auth/set-password/page.tsx
'use client';

useEffect(() => {
  // Supabase client SDK auto-detects hash tokens and fires onAuthStateChange
  // No manual handling needed if using @supabase/ssr with detectSessionInUrl: true
}, []);
```

Ensure `createBrowserClient` in `lib/supabase/browser.ts` has `detectSessionInUrl: true` (default in `@supabase/ssr`).

**Page layout:**

```
┌──────────────────────────────────────┐
│              HealthScan              │
│                                      │
│   Welcome! Set your password         │
│   to complete your account setup.   │
│                                      │
│   New password  [____________]       │
│   Confirm       [____________]       │
│                                      │
│           [Set Password]             │
└──────────────────────────────────────┘
```

**Form fields:**
- `password` — min 8 characters.
- `confirmPassword` — must match `password` (validated with Zod `.refine()`).

**On submit:**
1. Call `supabase.auth.updateUser({ password })` (browser client).
2. On success → redirect to `/dashboard`.
3. On error → show inline error message.

**Edge case — user lands here without a valid invite session:**
- Check session on mount. If no session exists → show `"This invite link is invalid or has expired."` with a link back to `/auth/sign-in`.

**Zod schema for this form (client-side only, not reused on server):**

```ts
// src/types/schemas/set-password.schema.ts
export const setPasswordSchema = z.object({
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] }
);
```

---

## Sidebar Update

Add **Radiologists** to `clinic_admin` sidebar (update from Phase 1):

```ts
// clinic_admin nav items (updated):
{ label: 'Dashboard',     href: '/dashboard' },
{ label: 'Patients',      href: '/dashboard/patients' },
{ label: 'Radiologists',  href: '/dashboard/radiologists' },  // ← new
{ label: 'Studies',       href: '/dashboard/studies' },
```

---

## Hooks

File: `src/hooks/use-users.ts`

```ts
export const userKeys = {
  all:      ['users'] as const,
  filtered: (role?: string) => ['users', role] as const,
};

interface UserFilters {
  role?: 'clinic_admin' | 'radiologist';
}

export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: userKeys.filtered(filters.role),
    queryFn: () => {
      const params = filters.role ? `?role=${filters.role}` : '';
      return apiGet<Profile[]>(`/users${params}`);
    },
  });
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UserInviteInput) =>
      apiPost<{ message: string }>('/users/invite', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
```

---

## Middleware Update

Add `/dashboard/radiologists` to the admin-only protection rules:

```ts
// Add to middleware clinic_admin-only paths:
// /dashboard/radiologists/* → clinic_admin only
```

Also ensure `/auth/set-password` is **excluded** from auth protection — it must be publicly accessible:

```ts
// Public paths (no session required):
// /auth/sign-in
// /auth/sign-up
// /auth/callback
// /auth/set-password   ← add this
```

---

## Full Invite Flow — End to End

```
1. Clinic admin opens /dashboard/radiologists
2. Clicks "+ Invite" → InviteUserDialog opens
3. Fills: name = "Dr. Smith", email = "dr@clinic.com", role = "radiologist"
4. Clicks "Send Invite"
5. POST /api/users/invite runs:
   - supabaseAdmin.auth.admin.inviteUserByEmail() → user created in auth.users
   - profiles row inserted: { id, full_name: "Dr. Smith", role: "radiologist" }
   - Supabase sends invite email to dr@clinic.com
6. Dialog closes, toast: "Invite sent to dr@clinic.com"
7. Dr. Smith receives email, clicks invite link
8. Browser opens: /auth/set-password (with session tokens in URL hash)
9. Supabase SDK detects tokens, hydrates session
10. Dr. Smith sets password → clicks "Set Password"
11. supabase.auth.updateUser({ password }) called
12. On success → redirect to /dashboard
13. Dr. Smith lands on /dashboard with role = radiologist
14. Sees radiologist sidebar: Dashboard, Studies, Reports
15. Can see assigned studies, open scans, write reports
```

---

## Environment Variables

Ensure these are in `.env.local` before running this phase:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server-side only, no NEXT_PUBLIC prefix
NEXT_PUBLIC_APP_URL=http://localhost:3000           # used to build redirectTo URL
```

> `SUPABASE_SERVICE_ROLE_KEY` must never be used in client-side code or exposed via `NEXT_PUBLIC_`. Verify this before deploying.

---

## Definition of Done

- [ ] `POST /api/users/invite` — creates auth user and inserts `profiles` row.
- [ ] Invite with duplicate email returns clear error (not a 500).
- [ ] `GET /api/users?role=radiologist` returns correct list.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` used only in `src/lib/supabase/admin.ts` — not exposed anywhere else.
- [ ] `/dashboard/radiologists` page accessible to `clinic_admin`; radiologist redirected to `/dashboard`.
- [ ] Radiologists list shows existing radiologists with name, email, joined date.
- [ ] Empty state shown when no radiologists exist.
- [ ] `InviteUserDialog` — form validates name, email, role before submit.
- [ ] On successful invite: dialog closes, toast shown, list refreshes with new entry.
- [ ] On error (duplicate email): error toast shown with readable message.
- [ ] Supabase Redirect URLs include `/auth/callback` (invite flow uses callback then redirects to set-password).
- [ ] `/auth/set-password` is publicly accessible (not blocked by middleware).
- [ ] Invited user clicks email link → lands on `/auth/set-password` with session active.
- [ ] Invalid/expired invite link → shows error message with sign-in link.
- [ ] Set password form validates min 8 chars and password match.
- [ ] On successful password set → redirected to `/dashboard`.
- [ ] Radiologist lands on `/dashboard` and sees radiologist sidebar (Studies, Reports).
- [ ] Radiologist cannot access `/dashboard/radiologists` or `/dashboard/patients`.
- [ ] `Radiologists` nav item added to `clinic_admin` sidebar.
- [ ] `docs/api-contracts.md` updated with invite + users routes.
- [ ] `planning/features.md`: User invite flow → `done`.
