# Phase 3 — Scan Upload

> Clinic admin uploads multiple JPG/PNG scan images per study.
> Images stored in Supabase Storage (private). Metadata in `scan_images` table.
> **Depends on Phase 1 (RBAC) and Phase 2 (Study Assignment columns) being complete.**

---

## Context

Studies exist with `assigned_to` and `status` columns (Phase 2). This phase adds the ability to attach scan images to an existing study. Multiple images per study are supported (gallery model). Format is JPG/PNG only — no DICOM.

---

## What Gets Built

| Task | Notes |
|---|---|
| `scan_images` table + RLS | Stores image metadata |
| Supabase Storage bucket `scan-images` | Private bucket — no public access |
| `POST /api/studies/[id]/scans` | Upload image → Storage + DB row |
| `GET /api/studies/[id]/scans` | List scan metadata for a study |
| `DELETE /api/studies/[id]/scans/[imageId]` | Admin removes image |
| `GET /api/studies/[id]/scans/[imageId]/signed-url` | Short-lived display URL |
| `ScanUploadDialog` component | Admin multi-file upload UI |
| `ScanGallery` component | Thumbnail grid — both roles |

---

## Database

### `scan_images` table

```sql
create table scan_images (
  id           uuid primary key default gen_random_uuid(),
  study_id     uuid not null references studies(id) on delete cascade,
  storage_path text not null,
  file_name    text not null,
  file_size    int,
  mime_type    text not null default 'image/jpeg'
                 check (mime_type in ('image/jpeg', 'image/png')),
  uploaded_by  uuid references profiles(id),
  created_at   timestamptz default now()
);

alter table scan_images enable row level security;
```

### RLS policies

```sql
-- clinic_admin: full CRUD
create policy "clinic_admin_all_scans" on scan_images
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'clinic_admin'
    )
  );

-- radiologist: SELECT only on scans for their assigned studies
create policy "radiologist_select_assigned_scans" on scan_images
  for select using (
    exists (
      select 1 from studies
      where studies.id = scan_images.study_id
        and studies.assigned_to = auth.uid()
    )
  );
```

> Update `docs/database.md` after migration.

---

## Supabase Storage

- Bucket: `scan-images` — **private**, no public access.
- Path pattern: `{study_id}/{image_id}.{ext}`
- Signed URL TTL: 3600 seconds (1 hour) — generated server-side only.
- **Never return raw `storage_path` to the client.** Always use a signed URL.

Ask user before creating bucket:
```
Create private Supabase Storage bucket named: scan-images
(via Supabase dashboard → Storage → New bucket → uncheck Public)
```

---

## API Routes

All under `app/api/studies/[id]/scans/`.

### `GET /api/studies/[id]/scans`
- Auth: `requireAuth()`
- Returns: `ScanImage[]` (metadata only, no URLs)
- RLS filters automatically — radiologist only sees scans for their assigned studies.

### `POST /api/studies/[id]/scans`
- Auth: `requireRole([ROLES.CLINIC_ADMIN])`
- Body: `multipart/form-data`, field name `file`
- Accepted types: `image/jpeg`, `image/png` only — reject others with `400`.
- Max size: **10 MB** — validate server-side, reject with `400` if exceeded.
- Flow:
  1. Validate file type and size.
  2. Generate `imageId = crypto.randomUUID()`.
  3. Build `storagePath = {studyId}/{imageId}.{ext}`.
  4. Upload to Supabase Storage via **service-role client** (server-side only).
  5. Insert row into `scan_images` with `storage_path` (never returned to client directly).
  6. Return inserted `ScanImage` row (no URL — client fetches signed URL separately).
- Returns: `ScanImage` (201)

### `DELETE /api/studies/[id]/scans/[imageId]`
- Auth: `requireRole([ROLES.CLINIC_ADMIN])`
- Flow:
  1. Fetch `scan_images` row to get `storage_path`.
  2. Delete file from Supabase Storage.
  3. Delete DB row.
- Returns: `{ message: 'Deleted' }`

### `GET /api/studies/[id]/scans/[imageId]/signed-url`
- Auth: `requireAuth()`
- Flow: fetch `storage_path` from DB → `supabase.storage.from('scan-images').createSignedUrl(path, 3600)`
- Returns: `{ url: string, expiresAt: string }`
- Do not cache signed URLs server-side.

> Update `docs/api-contracts.md` after implementation.

---

## Zod Schema

File: `src/types/schemas/scan-image.schema.ts`

```ts
export const scanImageSchema = z.object({
  id: z.string().uuid(),
  study_id: z.string().uuid(),
  file_name: z.string(),
  file_size: z.number().nullable(),
  mime_type: z.enum(['image/jpeg', 'image/png']),
  uploaded_by: z.string().uuid().nullable(),
  created_at: z.string(),
  // storage_path intentionally excluded — never sent to client
});

export type ScanImage = z.infer<typeof scanImageSchema>;
```

---

## Components

### `ScanUploadDialog` — `components/dashboard/scan-upload-dialog.tsx`

- shadcn `Dialog`. Triggered by "Upload Scans" button — admin only, wrap trigger in `RoleGuard`.
- File input: `accept="image/jpeg,image/png"`, `multiple`.
- Client-side validation before submit: reject files over 10 MB with inline error per file.
- On submit: call `useUploadScan` for each file **sequentially** (not parallel — avoids Storage race).
- Show per-file status: pending → uploading → success ✓ / error ✗.
- On all done: invalidate `scanKeys.list(studyId)`, close dialog.

### `ScanGallery` — `components/dashboard/scan-gallery.tsx`

- Thumbnail grid of all images for a study.
- Each thumbnail fetches its own signed URL via `useStudyScanSignedUrl(studyId, imageId)`.
- Show skeleton while URL loads.
- **Admin**: delete icon (🗑) on thumbnail hover → confirmation → `useDeleteScan` mutation.
- **Radiologist**: view-only, no delete icon.
- **Empty state** (admin): "No scans uploaded yet." + Upload button below gallery.
- **Empty state** (radiologist): "No scans have been uploaded for this study yet."
- Accepts `onImageClick(index: number)` prop — Phase 4 uses this to open the viewer.

Props:
```ts
interface ScanGalleryProps {
  studyId: string;
  onImageClick?: (index: number) => void;
}
```

---

## Hooks — `src/hooks/use-scan-images.ts`

```ts
export const scanKeys = {
  list:      (studyId: string) => ['scans', studyId] as const,
  signedUrl: (studyId: string, imageId: string) =>
               ['scans', studyId, imageId, 'signed-url'] as const,
};

export function useStudyScans(studyId: string)
// GET /api/studies/[id]/scans → ScanImage[]

export function useUploadScan(studyId: string)
// POST /api/studies/[id]/scans (multipart/form-data)
// onSuccess: invalidate scanKeys.list(studyId)

export function useDeleteScan(studyId: string)
// DELETE /api/studies/[id]/scans/[imageId]
// onSuccess: invalidate scanKeys.list(studyId)

export function useStudyScanSignedUrl(studyId: string, imageId: string)
// GET /api/studies/[id]/scans/[imageId]/signed-url → { url, expiresAt }
// staleTime: 50 * 60 * 1000 (50 min — URL valid for 60 min)
```

`useUploadScan` uses `apiPost` with `FormData`. Do not manually set `Content-Type` header — let axios detect it.

---

## Definition of Done

- [ ] `scan_images` table created, RLS enabled, both policies applied.
- [ ] `scan-images` Storage bucket created as private.
- [ ] Upload route: validates file type + size; uploads to Storage; inserts DB row.
- [ ] Non-image files rejected with `400`.
- [ ] Files over 10 MB rejected with `400`.
- [ ] GET scans route: radiologist cannot see scans for unassigned studies (RLS verified via direct API call).
- [ ] DELETE route: removes file from Storage and DB row; admin only.
- [ ] Signed URL route: returns working URL; raw `storage_path` never in response.
- [ ] `ScanUploadDialog`: multi-file select, per-file progress, error handling.
- [ ] `ScanGallery`: thumbnails load via signed URLs, skeletons shown while loading.
- [ ] Admin delete works with confirmation; radiologist has no delete control.
- [ ] `onImageClick` prop wired up (even if viewer doesn't exist yet — Phase 4 uses it).
- [ ] `docs/api-contracts.md` and `docs/database.md` updated.
- [ ] `planning/features.md`: Scan upload → `done`.
