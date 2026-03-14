# Product

## Product Name

HealthScan

---

## Problem

Small clinics and imaging centers often struggle with managing medical scans and radiology reports.

Many facilities still rely on:

* CDs or pen drives to share scans
* multiple disconnected systems
* manual communication between technicians and radiologists

This causes delays, lost images, and inefficient workflows.

Modern PACS systems solve this problem but are often **expensive and complex enterprise solutions** designed for large hospitals.

Small clinics need a **simple cloud-based imaging system** to store, view, and manage scans and reports.

Cloud-based PACS systems allow medical images to be uploaded, stored, and accessed through a web interface, improving collaboration and reducing manual work. ([simplirad.net][1])

---

## Target Users

Primary users:

**Clinic Admin**

* manages patients
* uploads scan images
* organizes imaging studies

**Radiologist**

* reviews imaging studies
* analyzes scan images
* creates diagnostic reports

Target organizations:

* small imaging centers
* diagnostic labs
* small clinics performing scans

---

## Value Proposition

HealthScan provides a **lightweight PACS-style workflow** focused on simplicity.

Core benefits:

* Upload and store patient scan images
* Organize scans into studies
* View scans directly in a web browser
* Allow radiologists to create diagnostic reports
* Replace manual scan sharing with a centralized system

The goal is **a minimal, easy-to-use imaging management system** rather than a full hospital PACS platform.

---

## Roles

### clinic_admin

Responsibilities:

* create and manage patients
* upload scan images
* manage studies
* view studies and reports

Restrictions:

* cannot create or edit diagnostic reports

---

### radiologist

Responsibilities:

* view patient studies
* view scan images
* create diagnostic reports
* edit reports

---

## Core User Flows

### Flow 1 — Clinic Admin uploads scan

1. Login to dashboard
2. Create or select a patient
3. Upload scan image
4. Create study for the patient
5. Scan becomes available for review

---

### Flow 2 — Radiologist reviews study

1. Login to dashboard
2. Open study list
3. Select a study
4. View scan images
5. Write diagnostic report
6. Save report

---

### Flow 3 — Study lifecycle

Patient → Study → Scan Image → Radiologist Report

---

## MVP Features

The minimal product includes:

1. Authentication
2. Role-based access control
3. Patient management
4. Scan upload
5. Study management
6. Scan viewer
7. Radiology report creation

---

## Out of Scope (v1)

The following features are intentionally excluded:

* DICOM networking
* AI anomaly detection
* HL7 / FHIR integrations
* hospital EHR integrations
* 3D imaging viewers
* voice dictation
* analytics dashboards
* multi-tenant architecture

These are typical PACS features but are **beyond the scope of the MVP**.

---

## Success Metrics

| Metric                         | Target       |
| ------------------------------ | ------------ |
| Setup to first working system  | < 30 minutes |
| Upload scan workflow           | < 1 minute   |
| Radiologist report creation    | < 2 minutes  |
| Minimal working PACS prototype | Yes          |

---

## Notes

* Images will initially be stored as **standard image formats (JPG/PNG)** instead of full DICOM datasets.
* The system architecture will allow future support for DICOM viewers if needed.
* The focus of this project is **clean architecture and workflow clarity**, not full medical compliance.

[1]: https://simplirad.net/?utm_source=chatgpt.com "AI-based RIS PACS System, Radiology Workflow Software"
