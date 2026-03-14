# Phase 5 — Study Detail Page

> Single page that combines study metadata, scan gallery, scan viewer, and report panel.
> The primary working page for both roles.
> **Depends on Phase 2 (assignment/status columns), Phase 3 (scan upload), and Phase 4 (viewer) being complete.**

---

## Context

All the building blocks now exist — scans (Phase 3), viewer (Phase 4), assignment + status (Phase 2). This phase assembles them into one coherent page at `/dashboard/studies/[id]`. Phase 6 drops the report editor into the report slot this page creates.

---

## What Gets Built

| Task | Notes |
|---|---|
| `/dashboard/studies/[id]` page | New route — replaces any existing stub |
| `StudyMetadataCard` component | Patient, modality, date, status, assignee |
| Scan gallery section | Reuses `ScanGallery` from Phase 3 |
| Scan viewer integration | Reuses `ScanViewer` from Phase 4 — replaces temporary scaffolding |
| Admin controls in metadata card | `AssignRadiologistDialog` + `StudyStatusControl` (built in Phase 2) |
| Report panel placeholder | Empty slot — Phase 6 fills this with the editor |
| Link from studies list | "Open" action per row navigates to detail page |

---

## No New API Routes

All data already exists:
- `GET /api/studies/[id]` — study + metadata (already exists from study management)
- `GET /api/patients/[id]` — patient name
- `GET /api/studies/[id]/scans` — scan list (Phase 3)
- `GET /api/users?role=radiologist` — for assign dialog (Phase 2)

No migrations needed.

---

## Page

**`app/dashboard/studies/[id]/page.tsx`**

- `'use client'`
- Protected by middleware (Phase 1) — both roles can access.
- Fetch: `useStudy(id)`, `usePatient(study.patient_id)`, `useStudyScans(id)`.
- Handle each fetch independently:
  - Loading: skeleton per section.
  - Error / not found: `"Study not found."` with "← Back to Studies" link.
  - Forbidden (radiologist hit unassigned study URL directly): show `"You do not have access to this study."`.

---

## Page Layout

```
┌────────────────────────────────────────────────────────────────┐
│  ← Back to Studies                                             │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  StudyMetadataCard                                       │  │
│  │  Patient · Modality · Date · [StatusBadge]               │  │
│  │  Assigned to: [name]   [Assign btn - admin]              │  │
│  │  [StudyStatusControl - admin only]                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────┐  ┌────────────────────────────┐  │
│  │  Scans                   │  │  Report                    │  │
│  │  ScanGallery             │  │  [Placeholder — Phase 6]   │  │
│  │  [Upload btn - admin]    │  │                            │  │
│  └──────────────────────────┘  └────────────────────────────┘  │
│                                                                │
│  [ScanViewer overlay — renders on top when image clicked]      │
└────────────────────────────────────────────────────────────────┘
```

- Two-column layout on desktop (`lg:grid-cols-2 gap-6`), stacked on mobile.
- `ScanViewer` is a fixed overlay — not inside either column.

---

## Components

### `StudyMetadataCard` — `components/dashboard/study-metadata-card.tsx`

Displays:

| Field | Notes |
|---|---|
| Patient full name | Plain text (link to patient page if it exists) |
| Modality | `ModalityBadge` — `XRAY` / `CT` / `MRI` / `US` |
| Study date | Formatted: `March 10, 2024` |
| Status | `StudyStatusBadge` (Phase 2) |
| Assigned radiologist | Full name, or "Unassigned" in `text-muted-foreground` |
| Description | If present, show below other fields |

Admin-only controls (wrapped in `RoleGuard`):
- "Assign Radiologist" button → opens `AssignRadiologistDialog` (Phase 2).
- `StudyStatusControl` (Phase 2) — shown below status badge.

```ts
interface StudyMetadataCardProps {
  study: Study;
  patient: Patient;
  assignedRadiologist: Pick<Profile, 'id' | 'full_name'> | null;
}
```

### `ModalityBadge` — `components/shared/modality-badge.tsx`

```ts
// XRAY → "X-Ray"   bg-blue-100 text-blue-800
// CT   → "CT"      bg-purple-100 text-purple-800
// MRI  → "MRI"     bg-indigo-100 text-indigo-800
// US   → "Ultrasound" bg-teal-100 text-teal-800

interface ModalityBadgeProps {
  modality: 'XRAY' | 'CT' | 'MRI' | 'US';
}
```

### Report placeholder

Simple shadcn `Card` in the right column. Phase 6 replaces this entirely:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Report</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">
      No report has been written for this study yet.
    </p>
  </CardContent>
</Card>
```

### Viewer integration

```tsx
const [viewerOpen, setViewerOpen] = useState(false);
const [viewerIndex, setViewerIndex] = useState(0);
const { data: scans = [] } = useStudyScans(studyId);

// Pass to ScanGallery:
onImageClick={(index) => {
  setViewerIndex(index);
  setViewerOpen(true);
}}

// Render viewer:
{viewerOpen && scans.length > 0 && (
  <ScanViewer
    studyId={studyId}
    images={scans}
    initialIndex={viewerIndex}
    onClose={() => setViewerOpen(false)}
  />
)}
```

---

## Hooks

No new hooks. Reuse or confirm these exist:

```ts
useStudy(id)           // hooks/use-studies.ts
usePatient(id)         // hooks/use-patients.ts
useStudyScans(id)      // hooks/use-scan-images.ts (Phase 3)
useUpdateStudy()       // hooks/use-studies.ts (Phase 2)
useRadiologists()      // hooks/use-users.ts (Phase 2)
```

Ensure `useStudy(id)` exists in `hooks/use-studies.ts`:
```ts
export function useStudy(id: string) {
  return useQuery({
    queryKey: studyKeys.detail(id),
    queryFn: () => apiGet<Study>(`/studies/${id}`),
    enabled: !!id,
  });
}
```

---

## Studies List — Navigation Update

Add "Open" action to each row on the studies list page:

```tsx
// In the DataTable actions column:
<Link href={`/dashboard/studies/${study.id}`}>
  <Button variant="outline" size="sm">Open</Button>
</Link>
```

Remove the temporary "View Scans" scaffolding added in Phase 4.

---

## Definition of Done

- [ ] `/dashboard/studies/[id]` renders for both roles.
- [ ] `StudyMetadataCard` shows patient, modality, date, status, assignee.
- [ ] `ModalityBadge` renders correct label and color for all 4 modalities.
- [ ] `StudyStatusBadge` renders correct color for all 3 statuses.
- [ ] Admin sees `AssignRadiologistDialog` button and `StudyStatusControl` — radiologist does not.
- [ ] `ScanGallery` renders thumbnails; clicking opens `ScanViewer` at correct index.
- [ ] `ScanViewer` overlay works — zoom, pan, navigate, close, fullscreen all functional.
- [ ] Upload Scans button visible to admin only.
- [ ] Report placeholder card renders clearly.
- [ ] Loading skeletons for each section shown independently while data fetches.
- [ ] Radiologist hitting an unassigned study URL sees access denied message.
- [ ] Studies list "Open" button navigates to correct detail page.
- [ ] Phase 4 temporary scaffolding removed from studies list.
- [ ] Page is responsive: two columns on `lg:`, stacked below.
- [ ] `planning/features.md`: Study details page → `done`.
