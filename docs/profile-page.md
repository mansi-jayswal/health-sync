# Profile Page

> User's own profile page. Accessible to both roles at `/profile`.
> User can view and edit their own info. Cannot change their own role or email.

---

## Route

`/profile` — protected by middleware (both roles allowed).

---

## What It Shows

### Read-only fields (cannot be edited)
| Field | Notes |
|---|---|
| Email | From `auth.users` — Supabase manages this |
| Role | `clinic_admin` or `radiologist` — displayed as a badge, never editable by user |
| Member since | `profiles.created_at` formatted as `March 10, 2024` |

### Editable fields
| Field | Notes |
|---|---|
| Full name | `profiles.full_name` |
| Avatar / initials | No file upload in MVP — show auto-generated initials avatar based on name |

---

## Page Layout

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   ┌──────┐  Dr. Jane Smith                      │
│   │  JS  │  jane@clinic.com                     │
│   └──────┘  [radiologist badge]  · Since Mar 2024│
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Personal Information                           │
│                                                 │
│  Full Name   [_________________________]        │
│                                                 │
│              [Save Changes]                     │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Account                                        │
│  Email       jane@clinic.com  (cannot change)   │
│  Role        [radiologist badge]                │
│  Member since  March 10, 2024                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Avatar / Initials

No image upload in MVP. Generate initials from `full_name`:

```ts
// src/lib/utils/avatar.ts
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2); // max 2 chars
}
```

Display as a circle with a background color derived from the user's role:
- `clinic_admin` → `bg-blue-600 text-white`
- `radiologist` → `bg-violet-600 text-white`

Size: `w-16 h-16 rounded-full text-xl font-semibold` in the header section.

---

## Components

### `ProfileHeader` — `components/profile/profile-header.tsx`

Shows the initials avatar, name, email, role badge, and member since date. Read-only. Pulls from `useCurrentUser()`.

### `ProfileForm` — `components/profile/profile-form.tsx`

React Hook Form + `profileUpdateSchema`. Single field: `full_name`.

- Pre-populated with current `full_name`.
- "Save Changes" button — disabled if value hasn't changed from current.
- On success: toast `"Profile updated."` + invalidate `useCurrentUser` query.
- On error: inline error message.

---

## API

### `GET /api/profile`
- Already exists — returns own `Profile` row.

### `PATCH /api/profile`
- Already exists — updates `full_name` only.
- Ensure server-side validation: only `full_name` accepted. `role` and `email` silently ignored even if sent.

---

## Zod Schema

File: `src/types/schemas/profile-update.schema.ts`

```ts
export const profileUpdateSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(100),
});
```

---

## Hooks

Reuse existing (no new hooks needed):

```ts
useCurrentUser()    // get current profile
useUpdateProfile()  // PATCH /api/profile
```

If `useUpdateProfile` doesn't exist yet, add to `src/hooks/use-profile.ts`:

```ts
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileUpdateInput) =>
      apiPatch<Profile>('/profile', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.me });
    },
  });
}
```

---

## Sidebar Link

Ensure "Profile" is accessible from the sidebar or top nav for both roles. Recommended: user avatar/name in the **bottom of the sidebar** as a clickable link → `/profile`. This is a common pattern and avoids adding a nav item that clutters the main menu.

```tsx
// Bottom of sidebar — both roles
<Link href="/profile" className="flex items-center gap-3 p-3 hover:bg-accent rounded-md">
  <InitialsAvatar name={profile.full_name} role={profile.role} size="sm" />
  <div className="flex flex-col">
    <span className="text-sm font-medium">{profile.full_name}</span>
    <span className="text-xs text-muted-foreground">{profile.role === 'clinic_admin' ? 'Clinic Admin' : 'Radiologist'}</span>
  </div>
</Link>
```

---

## Definition of Done

- [ ] `/profile` page accessible to both roles; unauthenticated users redirected.
- [ ] `ProfileHeader` shows initials avatar, name, email, role badge, member since.
- [ ] Initials avatar correct for both roles (correct color per role).
- [ ] `ProfileForm` pre-populates `full_name` from current profile.
- [ ] Save button disabled when value is unchanged.
- [ ] Save updates `full_name` via `PATCH /api/profile`; success toast shown.
- [ ] `role` and `email` cannot be changed — not present as editable fields.
- [ ] Sidebar bottom shows clickable user info that links to `/profile`.
- [ ] `planning/features.md`: User profile → `done`.
