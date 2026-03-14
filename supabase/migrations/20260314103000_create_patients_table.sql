-- Patients for HealthScan.

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age integer not null check (age >= 0),
  gender text not null check (gender in ('male', 'female', 'other')),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_patients_created_by on public.patients (created_by);
create index if not exists idx_patients_created_at on public.patients (created_at desc);

alter table public.patients enable row level security;

drop policy if exists "Patients are viewable by clinic admins and radiologists" on public.patients;
create policy "Patients are viewable by clinic admins and radiologists"
  on public.patients for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('clinic_admin', 'radiologist')
    )
  );

drop policy if exists "Clinic admins can create patients" on public.patients;
create policy "Clinic admins can create patients"
  on public.patients for insert
  to authenticated
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'clinic_admin'
    )
  );
