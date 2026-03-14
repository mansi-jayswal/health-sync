# Build Order — Full App Reference

> Master sequence for building the complete HealthScan platform.
> Feed phases to Codex **strictly in this order**. Each phase lists what it depends on.
> Do not start a phase until all its dependencies are marked done in `planning/features.md`.

---

## Complete Phase Sequence

| Order | File | What it builds | Depends on |
|---|---|---|---|
| 1 | `phase-1-rbac.md` | Role swap, middleware, RoleGuard, sidebar nav | Nothing — build first |
| 2 | `phase-2-scan-upload.md` | `scan_images` table, Storage bucket, multi-file upload, gallery | Phase 1 |
| 3 | `phase-2b-admin-assignment.md` | `assigned_to` + `status` columns on studies, assign dialog, status control | Phase 1 |
| 4 | `phase-3-scan-viewer.md` | Zoom/pan/fullscreen image viewer overlay | Phase 2 |
| 5 | `phase-3b-radiologist-worklist.md` | Radiologist worklist with filters, dashboard stats card | Phase 1, Phase 2b |
| 6 | `phase-4-study-details.md` | Study detail page — metadata + gallery + viewer + report placeholder | Phase 2, Phase 3, Phase 2b |
| 7 | `phase-5-report-editor.md` | Report editor (radiologist), read-only (admin), report DB + API | Phase 4 |
| 8 | `phase-5b-radiologist-reports-list.md` | Reports list with findings/impression summary, filters, expand | Phase 5 |

---

## Who Does What — Role Coverage Map

### clinic_admin

| Capability | Phase |
|---|---|
| Sign in, role enforced | 1 |
| Role-aware sidebar (Patients, Upload, Studies) | 1 |
| Upload scan images to a study | 2 |
| View scan gallery | 2 |
| Assign study to a radiologist | 2b |
| Manually change study status | 2b |
| View study detail (metadata + scans) | 4 |
| View radiology report (read-only) | 5 |

### radiologist

| Capability | Phase |
|---|---|
| Sign in, role enforced | 1 |
| Role-aware sidebar (Studies, Reports) | 1 |
| See only assigned studies in worklist | 3b |
| Filter worklist by status + modality | 3b |
| Dashboard home — pending/in_review/completed counts | 3b |
| Open study and view scan images | 4 |
| View scans in zoom/pan viewer | 3 → 4 |
| Write and edit diagnostic report | 5 |
| View all own reports with findings summary | 5b |
| Filter reports by modality, search by patient | 5b |

---

## Key Architectural Decisions (do not revisit without user approval)

- **JPG/PNG only** — no DICOM. No Cornerstone.js. Standard `<img>` tag with signed URLs.
- **One report per study** — enforced by `unique(study_id)` constraint on `reports` table.
- **Reports always editable** — no draft/final status in MVP. Radiologist can edit anytime.
- **Admin assigns radiologist** — radiologist does not self-assign from a shared pool.
- **RLS is the data security layer** — middleware is first-line defence only. Every API route also calls `requireAuth()` or `requireRole()`.
- **No patient portal** — patients cannot log in. Out of scope for MVP.
- **Single clinic** — no multi-tenancy. All data is shared within one clinic's account.

---

## Features.md Status After All Phases Complete

| Feature | Status |
|---|---|
| User authentication | done |
| Dashboard shell | done |
| User profile | done |
| RBAC roles (clinic_admin / radiologist) | done (Phase 1) |
| Patient management | done |
| Study management | done |
| Study type management | done |
| Scan upload | done (Phase 2) |
| Scan viewer | done (Phase 3) |
| Study assignment + status | done (Phase 2b) |
| Role-based dashboard navigation | done (Phase 1) |
| Radiologist worklist | done (Phase 3b) |
| Radiologist dashboard stats | done (Phase 3b) |
| Study details page | done (Phase 4) |
| Radiology report editor | done (Phase 5) |
| Reports & observations list | done (Phase 5b) |
