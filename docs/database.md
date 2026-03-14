# Database

## Stack

- **Postgres** hosted on Supabase
- **Migrations** managed via versioned SQL files in `supabase/migrations/`
- **Row Level Security (RLS)** enabled on every table
- **TypeScript types** in `src/types/database.ts` (manual; can be regenerated from Supabase CLI if desired)

---

## Migration Conventions

### File Naming

```
supabase/migrations/
  20250308000001_init_schema.sql
  20260314090000_refactor_profile_roles.sql
  20260314103000_create_patients_table.sql
  20260314112000_create_studies_table.sql
  20260314120000_create_study_types_table.sql
  20260314121000_migrate_study_types.sql
  20260314124000_study_assignment_status.sql
  20260314130000_profiles_rbac_policies.sql
  20260314133000_create_scan_images_table.sql
  20260314140000_create_reports_table.sql
```

Format: `YYYYMMDDHHMMSS_<description>.sql`

### Table Conventions

| Column       | Type         | Notes                    |
| ------------ | ------------ | ------------------------ |
| `id`         | `uuid`       | Default `gen_random_uuid()` where applicable |
| `created_by` | `uuid`       | FK to `auth.users(id)` for user-owned content |
| `created_at` | `timestamptz` | Default `now()`        |
| `updated_at` | `timestamptz` | Managed by trigger     |

- All tables live in the `public` schema.
- Role values use a PostgreSQL enum type: `public.app_role`.

---

## Current Schema

### `profiles`

Stores app-level user data including role for RBAC. Row is created on sign-up via `handle_new_user` trigger.

| Column      | Type         | Notes                          |
| ----------- | ------------ | ------------------------------ |
| id          | uuid         | PK, FK to auth.users(id)       |
| email       | text         |                                |
| full_name   | text         |                                |
| avatar_url  | text         |                                |
| role        | app_role     | clinic_admin / radiologist; default 'clinic_admin' |
| is_active   | boolean      | default true                   |
| created_at  | timestamptz  |                                |
| updated_at  | timestamptz  |                                |

Avatar storage:
- Avatars are stored in the `avatars` bucket (public read). `profiles.avatar_url` stores the public URL.

### `items`

Demo entity for dashboard content. Users can CRUD own items; admins can CRUD any.

| Column      | Type         | Notes                    |
| ----------- | ------------ | ------------------------ |
| id          | uuid         | PK                       |
| title       | text         | not null                 |
| description | text         |                          |
| created_by  | uuid         | FK auth.users            |
| created_at  | timestamptz  |                          |
| updated_at  | timestamptz  |                          |

### `patients`

Stores patient records used as the base entity for studies and scan uploads.

| Column      | Type         | Notes                                |
| ----------- | ------------ | ------------------------------------ |
| id          | uuid         | PK, default `gen_random_uuid()`      |
| name        | text         | not null                             |
| age         | integer      | not null, check `age >= 0`           |
| gender      | text         | `male` / `female` / `other`          |
| created_by  | uuid         | FK auth.users                        |
| created_at  | timestamptz  | default `now()`                      |

### `studies`

Stores imaging studies linked to patients.

| Column      | Type         | Notes                                     |
| ----------- | ------------ | ----------------------------------------- |
| id          | uuid         | PK, default `gen_random_uuid()`           |
| patient_id  | uuid         | FK to `patients.id`                       |
| study_type_id | uuid       | FK to `study_types.id`                    |
| description | text         | optional                                 |
| created_by  | uuid         | FK auth.users                             |
| assigned_to | uuid         | FK to `profiles.id`, nullable             |
| status      | text         | `pending` / `in_review` / `completed`     |
| created_at  | timestamptz  | default `now()`                           |

### `study_types`

Stores study type options used when creating studies.

| Column      | Type         | Notes                         |
| ----------- | ------------ | ----------------------------- |
| id          | uuid         | PK, default `gen_random_uuid()` |
| name        | text         | unique                        |
| created_by  | uuid         | FK auth.users                 |
| created_at  | timestamptz  | default `now()`               |

### `scan_images`

Stores scan image metadata for studies. File blobs live in Supabase Storage.

| Column      | Type         | Notes                                  |
| ----------- | ------------ | -------------------------------------- |
| id          | uuid         | PK, default `gen_random_uuid()`        |
| study_id    | uuid         | FK to `studies.id`, cascade delete     |
| storage_path| text         | Storage object path (server-only)      |
| file_name   | text         | original file name                     |
| file_size   | int          | file size in bytes                     |
| mime_type   | text         | `image/jpeg` / `image/png`             |
| uploaded_by | uuid         | FK to `profiles.id`                    |
| created_at  | timestamptz  | default `now()`                        |

### `reports`

Radiology reports authored by radiologists. One report per study.

| Column      | Type         | Notes                                   |
| ----------- | ------------ | --------------------------------------- |
| id          | uuid         | PK, default `gen_random_uuid()`         |
| study_id    | uuid         | FK to `studies.id`, unique              |
| author_id   | uuid         | FK to `profiles.id`                     |
| findings    | text         | default empty string                    |
| impression  | text         | default empty string                    |
| created_at  | timestamptz  | default `now()`                         |
| updated_at  | timestamptz  | default `now()`                         |

---

## Row Level Security

- **profiles:** clinic_admin can select all; users can select/insert/update own row.
- **items:** Authenticated users can select all; insert with `created_by = auth.uid()`; update/delete own or (for clinic admins) any. See migration file for full policies.
- **patients:** `clinic_admin` and `radiologist` can select; only `clinic_admin` can insert with `created_by = auth.uid()`.
- **studies:** `clinic_admin` can CRUD all; `radiologist` can select only assigned studies.
- **scan_images:** `clinic_admin` can CRUD all; `radiologist` can select only scans for assigned studies.
- **reports:** `clinic_admin` can select all; `radiologist` can CRUD own reports and select reports for assigned studies.

---

## Storage

- Bucket: `scan-images` (private)
- Object path: `{study_id}/{image_id}.{ext}`
- Signed URLs generated server-side (1 hour TTL).
- **study_types:** `clinic_admin` and `radiologist` can select; only `clinic_admin` can insert/update/delete.
- Bucket: `avatars` (public) for user profile images. Authenticated users can upload/update/delete their own objects; all users can read.

---

## Useful Queries

```sql
-- All tables with RLS status
select tablename, rowsecurity
from pg_tables
where schemaname = 'public';

-- All policies
select tablename, policyname, cmd, qual
from pg_policies
where schemaname = 'public';
```
