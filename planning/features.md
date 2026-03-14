# Features

> All planned features for the HealthScan product.

---

## Feature Status Legend

| Status      | Meaning                   |
| ----------- | ------------------------- |
| planned     | Not started               |
| specced     | Ready for implementation  |
| in progress | Currently being built     |
| done        | Completed                 |
| paused      | Started but deprioritized |

---

# Feature List

| Feature                                 | Status  | Priority | Notes                             |
| --------------------------------------- | ------- | -------- | --------------------------------- |
| User authentication                     | done    | P0       | Supabase Auth                     |
| Dashboard shell                         | done    | P0       | Sidebar + layout                  |
| User profile                            | done    | P1       | Basic profile page                |
| RBAC roles (clinic_admin / radiologist) | done    | P0       | Replace default roles             |
| Patient management                      | done    | P0       | Create, list, view patients       |
| Study management                        | done    | P0       | Organize scans by patient         |
| Study type management                   | done    | P1       | CRUD study types for studies      |
| Study assignment + status               | done    | P1       | Admin assigns radiologists        |
| Scan upload                             | done    | P0       | Upload images to Supabase Storage |
| Scan viewer                             | done    | P0       | View scans in browser             |
| Radiology report editor                 | done    | P0       | Radiologist writes reports        |
| Reports list (radiologist)              | done    | P1       | Filter and view own reports       |
| Study details page                      | done    | P1       | Show scans + report               |
| Role-based dashboard navigation         | done    | P1       | Different menus for roles         |
| User invite flow                        | done    | P1       | Admin invites users               |
| Radiologist worklist                    | done    | P1       | Assigned studies with filters     |
| Radiologist dashboard stats             | done    | P1       | Pending/in_review/completed cards |

---

# Feature Overview

## Patient Management

Clinic admins can:

* create patient records
* view patient list
* open patient profile

Patient data:

* name
* age
* gender
* created date

---

## Study Management

A **study** represents a scan session for a patient.

Each study:

* belongs to one patient
* contains one or more scan images
* may contain a radiology report

---

## Scan Upload

Clinic admins can upload scan images.

Images will be stored in:

Supabase Storage

Supported formats (MVP):

* JPG
* PNG

---

## Scan Viewer

Users can open a study and view scans in the browser.

Viewer capabilities:

* zoom
* pan
* full screen

Advanced radiology tools are out of scope for MVP.

---

## Radiology Reports

Radiologists can:

* write diagnostic reports
* edit reports
* save report linked to study

Clinic admins can:

* view reports
* cannot edit reports

---

## Role-Based Access

Two roles exist:

clinic_admin

* manage patients
* upload scans
* manage studies

radiologist

* view studies
* create reports

---

# Adding a Feature

1. Add feature to this list
2. Create folder:

```
features/<feature-name>/
```

3. Add:

* spec.md
* design.md
* tasks.md

4. Update status
