# API Contracts

> This document is the source of truth for all API routes.
> Update it every time a route is added, changed, or removed.

---

## Conventions

- All routes are prefixed with `/api/`
- All requests and responses use JSON
- Authentication: Supabase session cookie (same-origin; axios client sends credentials)
- **Success format:** `{ success: true, data: T, message?: string, metadata?: { pagination?: {...} } }` — see `src/types/api.ts`
- **Error format:** `{ success: false, error: { code?: string, message: string }, message?: string, details?: unknown }`
- Client uses `apiGet`, `apiPost`, `apiPatch`, `apiDelete` from `src/lib/api/client.ts`; responses are unwrapped to `data` or throw `ApiRequestError`

---

## Items

### `GET /api/items`

Returns all items (ordered by `created_at` desc). RLS applies server-side.

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string | null",
      "created_at": "ISO8601",
      "updated_at": "ISO8601",
      "created_by": "uuid"
    }
  ]
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 401 | Not authenticated |
| 500 | Server error |

---

### `POST /api/items`

Create a new item.

**Request body**
```json
{
  "title": "string (required, min 1)",
  "description": "string (optional)"
}
```

**Response `201`**
```json
{
  "success": true,
  "data": { "id": "uuid", "title": "...", "description": "...", "created_at": "...", "updated_at": "...", "created_by": "uuid" },
  "message": "Item created."
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 400 | Validation failed (details may include Zod flatten) |
| 401 | Not authenticated |
| 500 | Server error |

---

### `GET /api/items/:id`

Get a single item by ID.

**Response `200`**
```json
{
  "success": true,
  "data": { "id": "uuid", "title": "...", "description": "...", "created_at": "...", "updated_at": "...", "created_by": "uuid" }
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 401 | Not authenticated |
| 404 | Item not found |
| 500 | Server error |

---

### `PATCH /api/items/:id`

Update an item. Caller must be owner or clinic admin.

**Request body**
```json
{
  "title": "string (optional)",
  "description": "string (optional)"
}
```

**Response `200`**
```json
{
  "success": true,
  "data": { "...updated item..." },
  "message": "Item updated."
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 400 | Validation failed / Invalid status transition |
| 401 | Not authenticated |
| 403 | Forbidden (not owner or clinic admin) |
| 404 | Item not found |
| 500 | Server error |

---

### `DELETE /api/items/:id`

Delete an item. Caller must be owner or clinic admin.

**Response `200`**
```json
{
  "success": true,
  "data": null,
  "message": "Item deleted."
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 401 | Not authenticated |
| 403 | Forbidden |
| 404 | Item not found |
| 500 | Server error |

---

### `POST /api/items/seed`

Seed demo items for the current user. No body. If user already has items, returns 200 with message that no seed was needed.

**Response `200`** (already has items)
```json
{
  "success": true,
  "data": { "message": "You already have items. No seed needed." },
  "message": "You already have items. No seed needed."
}
```

**Response `201`** (items created)
```json
{
  "success": true,
  "data": { "message": "Demo items added." },
  "message": "Demo items added."
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 401 | Not authenticated |
| 500 | Server error |

---

## Profile

### `GET /api/profile/current`

Returns the current user and profile (id, full_name, avatar_url, role). Used by `useCurrentUser()` and `useRole()`.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "string | null" },
    "profile": { "id": "uuid", "full_name": "string | null", "avatar_url": "string | null", "role": "string" } | null
  }
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 401 | Not authenticated |
| 500 | Server error |

---

## Patients

### `GET /api/patients`

Returns all patients ordered by `created_at` desc.

Auth:
- Requires authenticated user.
- RLS allows `clinic_admin` and `radiologist` to view.

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "age": 32,
      "gender": "male | female | other",
      "created_by": "uuid",
      "created_at": "ISO8601"
    }
  ]
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 401 | Not authenticated |
| 500 | Server error |

---

### `POST /api/patients`

Creates a patient record.

Auth:
- Requires `clinic_admin` role.

**Request body**
```json
{
  "name": "string (required)",
  "age": "number (integer, >= 0)",
  "gender": "male | female | other"
}
```

**Response `201`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "age": 32,
    "gender": "male | female | other",
    "created_by": "uuid",
    "created_at": "ISO8601"
  },
  "message": "Patient created."
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 400 | Validation failed |
| 403 | Forbidden |
| 500 | Server error |

---

### `GET /api/patients/:id`

Returns a single patient by id.

Auth:
- Requires authenticated user.
- RLS allows `clinic_admin` and `radiologist` to view.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "age": 32,
    "gender": "male | female | other",
    "created_by": "uuid",
    "created_at": "ISO8601"
  }
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 401 | Not authenticated |
| 404 | Patient not found |
| 500 | Server error |

---

### `PATCH /api/patients/:id`

Updates a patient record.

Auth:
- Requires `clinic_admin` role.

**Request body**
```json
{
  "name": "string (optional)",
  "age": "number (integer, >= 0, optional)",
  "gender": "male | female | other (optional)"
}
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "age": 32,
    "gender": "male | female | other",
    "created_by": "uuid",
    "created_at": "ISO8601"
  },
  "message": "Patient updated."
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 400 | Validation failed |
| 403 | Forbidden |
| 404 | Patient not found |
| 500 | Server error |

---

### `DELETE /api/patients/:id`

Deletes a patient record.

Auth:
- Requires `clinic_admin` role.

**Response `200`**
```json
{
  "success": true,
  "data": null,
  "message": "Patient deleted."
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 403 | Forbidden |
| 404 | Patient not found |
| 500 | Server error |

---

## Studies

### `GET /api/studies`

Returns all studies ordered by `created_at` desc.

Optional query param:
- `patientId` to filter studies for a patient
- `status` to filter by status (`pending`, `in_review`, `completed`)
- `modality` to filter by modality (`XRAY`, `CT`, `MRI`, `US`)

Auth:
- Requires authenticated user.
- RLS allows `clinic_admin` and `radiologist` to view.

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "patient_id": "uuid",
      "study_type_id": "uuid",
      "description": "string | null",
      "created_by": "uuid",
      "created_at": "ISO8601",
      "patient_name": "string | null",
      "study_type_name": "string | null",
      "report_count": "number",
      "assigned_to": "uuid | null",
      "assigned_to_name": "string | null",
      "status": "pending | in_review | completed"
    }
  ]
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 401 | Not authenticated |
| 500 | Server error |

---

### `POST /api/studies`

Creates a study.

Auth:
- Requires `clinic_admin` role.

**Request body**
```json
{
  "patient_id": "uuid",
  "study_type_id": "uuid",
  "description": "string (optional)"
}
```

**Response `201`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "patient_id": "uuid",
    "study_type_id": "uuid",
    "description": "string | null",
    "created_by": "uuid",
    "created_at": "ISO8601",
    "assigned_to": "uuid | null",
    "status": "pending | in_review | completed"
  },
  "message": "Study created."
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 400 | Validation failed |
| 403 | Forbidden |
| 500 | Server error |

---

### `GET /api/studies/:id`

Returns a single study by id.

Auth:
- Requires authenticated user.
- RLS allows `clinic_admin` and `radiologist` to view.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "patient_id": "uuid",
    "study_type_id": "uuid",
    "description": "string | null",
    "created_by": "uuid",
    "created_at": "ISO8601",
    "study_type_name": "string | null",
    "assigned_to": "uuid | null",
    "assigned_to_name": "string | null",
    "status": "pending | in_review | completed"
  }
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 401 | Not authenticated |
| 404 | Study not found |
| 500 | Server error |

---

### `PATCH /api/studies/:id`

Updates a study.

Auth:
- Requires `clinic_admin` role.

**Request body**
```json
{
  "patient_id": "uuid (optional)",
  "study_type_id": "uuid (optional)",
  "description": "string (optional)",
  "assigned_to": "uuid | null (optional)",
  "status": "pending | in_review | completed (optional)"
}
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "patient_id": "uuid",
    "study_type_id": "uuid",
    "description": "string | null",
    "created_by": "uuid",
    "created_at": "ISO8601",
    "assigned_to": "uuid | null",
    "status": "pending | in_review | completed"
  },
  "message": "Study updated."
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 400 | Validation failed |
| 403 | Forbidden |
| 404 | Study not found |
| 500 | Server error |

---

### `DELETE /api/studies/:id`

Deletes a study.

Auth:
- Requires `clinic_admin` role.

**Response `200`**
```json
{
  "success": true,
  "data": null,
  "message": "Study deleted."
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 403 | Forbidden |
| 404 | Study not found |
| 500 | Server error |

---

## Scan Images

All scan routes are nested under a study. Storage is private; clients must use signed URLs.

### `GET /api/studies/:id/scans`

Returns scan metadata for a study (no storage path or URL).

Auth:
- Requires authenticated user.
- RLS restricts radiologists to scans for assigned studies.

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "study_id": "uuid",
      "file_name": "string",
      "file_size": 123456,
      "mime_type": "image/jpeg | image/png",
      "uploaded_by": "uuid | null",
      "created_at": "ISO8601"
    }
  ]
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 401 | Not authenticated |
| 500 | Server error |

---

### `POST /api/studies/:id/scans`

Uploads a single scan image. Uses `multipart/form-data` with field name `file`.

Auth:
- Requires `clinic_admin` role.

**Request**
```
Content-Type: multipart/form-data
file: JPG or PNG (max 10 MB)
```

**Response `201`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "study_id": "uuid",
    "file_name": "string",
    "file_size": 123456,
    "mime_type": "image/jpeg | image/png",
    "uploaded_by": "uuid | null",
    "created_at": "ISO8601"
  },
  "message": "Scan uploaded."
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 400 | Validation failed (file type/size) |
| 403 | Forbidden |
| 404 | Study not found |
| 500 | Server error |

---

### `DELETE /api/studies/:id/scans/:imageId`

Deletes a scan image from storage and metadata table.

Auth:
- Requires `clinic_admin` role.

**Response `200`**
```json
{
  "success": true,
  "data": null,
  "message": "Deleted."
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 403 | Forbidden |
| 404 | Scan not found |
| 500 | Server error |

---

### `GET /api/studies/:id/scans/:imageId/signed-url`

Returns a short-lived signed URL for a scan image.

Auth:
- Requires authenticated user.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "url": "https://...",
    "expiresAt": "ISO8601"
  }
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 401 | Not authenticated |
| 404 | Scan not found |
| 500 | Server error |

---

## Reports

### `GET /api/studies/:id/report`

Returns the report for a study, or `null` if none exists yet.

Auth:
- Requires authenticated user.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "study_id": "uuid",
    "author_id": "uuid",
    "findings": "string",
    "impression": "string",
    "created_at": "ISO8601",
    "updated_at": "ISO8601",
    "author_name": "string | null",
    "author_email": "string | null"
  }
}
```

**Response `200`** (no report)
```json
{
  "success": true,
  "data": null
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 401 | Not authenticated |
| 500 | Server error |

---

## Dashboard

### `GET /api/dashboard/stats`

Returns radiologist study counts by status.

Auth:
- Requires `radiologist` role.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "pending": 0,
    "in_review": 0,
    "completed": 0,
    "total": 0
  }
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 403 | Forbidden |
| 500 | Server error |

---

### `POST /api/reports`

Creates a report for a study. One report per study.

Auth:
- Requires `radiologist` role.

**Request body**
```json
{
  "study_id": "uuid",
  "findings": "string (optional)",
  "impression": "string (optional)"
}
```

**Response `201`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "study_id": "uuid",
    "author_id": "uuid",
    "findings": "string",
    "impression": "string",
    "created_at": "ISO8601",
    "updated_at": "ISO8601"
  },
  "message": "Report created."
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 400 | Validation failed |
| 403 | Forbidden (not assigned) |
| 404 | Study not found |
| 409 | Report already exists |
| 500 | Server error |

---

### `PATCH /api/reports/:id`

Updates report findings/impression.

Auth:
- Requires `radiologist` role.

**Request body**
```json
{
  "findings": "string (optional)",
  "impression": "string (optional)"
}
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "study_id": "uuid",
    "author_id": "uuid",
    "findings": "string",
    "impression": "string",
    "created_at": "ISO8601",
    "updated_at": "ISO8601"
  },
  "message": "Report updated."
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 400 | Validation failed |
| 403 | Forbidden |
| 404 | Report not found |
| 500 | Server error |

---

### `GET /api/reports`

Returns the current radiologist's reports, joined with study + patient metadata.

Auth:
- Requires `radiologist` role.

Query params:
- `modality` (optional): `XRAY | CT | MRI | US`

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "findings": "string",
      "impression": "string",
      "created_at": "ISO8601",
      "updated_at": "ISO8601",
      "study": {
        "id": "uuid",
        "modality": "XRAY | CT | MRI | US",
        "study_date": "ISO8601",
        "status": "pending | in_review | completed",
        "patient": { "id": "uuid", "full_name": "string" }
      }
    }
  ]
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 403 | Forbidden |
| 500 | Server error |

---

## Study Types

### `GET /api/study-types`

Returns all study types ordered by name.

Auth:
- Requires authenticated user.
- RLS allows `clinic_admin` and `radiologist` to view.

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "created_by": "uuid",
      "created_at": "ISO8601"
    }
  ]
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 401 | Not authenticated |
| 500 | Server error |

---

### `POST /api/study-types`

Creates a study type.

Auth:
- Requires `clinic_admin` role.

**Request body**
```json
{
  "name": "string (required)"
}
```

**Response `201`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "created_by": "uuid",
    "created_at": "ISO8601"
  },
  "message": "Study type created."
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 400 | Validation failed |
| 403 | Forbidden |
| 500 | Server error |

---

### `PATCH /api/study-types/:id`

Updates a study type.

Auth:
- Requires `clinic_admin` role.

**Request body**
```json
{
  "name": "string (optional)"
}
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "created_by": "uuid",
    "created_at": "ISO8601"
  },
  "message": "Study type updated."
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 400 | Validation failed |
| 403 | Forbidden |
| 404 | Study type not found |
| 500 | Server error |

---

### `DELETE /api/study-types/:id`

Deletes a study type.

Auth:
- Requires `clinic_admin` role.

**Response `200`**
```json
{
  "success": true,
  "data": null,
  "message": "Study type deleted."
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 403 | Forbidden |
| 404 | Study type not found |
| 409 | Study type is in use |
| 500 | Server error |

---

## Users

### `GET /api/users`

Returns users. Optional `role` query filters by role (clinic_admin or radiologist).

Auth:
- Requires `clinic_admin` role.

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "full_name": "string | null",
      "email": "string | null",
      "role": "clinic_admin | radiologist",
      "created_at": "ISO8601"
    }
  ]
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 403 | Forbidden |
| 500 | Server error |

---

### `POST /api/users/invite`

Invites a user by email with a pre-assigned role.

Auth:
- Requires `clinic_admin` role.

**Request body**
```json
{
  "email": "string",
  "full_name": "string",
  "role": "clinic_admin | radiologist"
}
```

**Response `201`**
```json
{
  "success": true,
  "data": { "message": "Invite sent." }
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 400 | Validation failed / Invite error |
| 403 | Forbidden |
| 500 | Server error |

---

## Adding New Routes

When a new API route is implemented, add its contract here. Include:
- HTTP method + path
- Authentication requirement
- Request body (if any)
- Response shape (success and error)
- All possible error status codes
