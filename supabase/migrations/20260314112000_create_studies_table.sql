-- Studies for HealthScan.

create table if not exists public.studies (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  study_type_id uuid not null references public.study_types (id),
  description text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_studies_patient_id on public.studies (patient_id);
create index if not exists idx_studies_study_type_id on public.studies (study_type_id);
create index if not exists idx_studies_created_by on public.studies (created_by);
create index if not exists idx_studies_created_at on public.studies (created_at desc);

alter table public.studies enable row level security;

drop policy if exists "Studies are viewable by clinic admins and radiologists" on public.studies;
create policy "Studies are viewable by clinic admins and radiologists"
  on public.studies for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('clinic_admin'::public.app_role, 'radiologist'::public.app_role)
    )
  );

drop policy if exists "Clinic admins can create studies" on public.studies;
create policy "Clinic admins can create studies"
  on public.studies for insert
  to authenticated
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'clinic_admin'::public.app_role
    )
  );

drop policy if exists "Clinic admins can update studies" on public.studies;
create policy "Clinic admins can update studies"
  on public.studies for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'clinic_admin'::public.app_role
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'clinic_admin'::public.app_role
    )
  );

drop policy if exists "Clinic admins can delete studies" on public.studies;
create policy "Clinic admins can delete studies"
  on public.studies for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'clinic_admin'::public.app_role
    )
  );
