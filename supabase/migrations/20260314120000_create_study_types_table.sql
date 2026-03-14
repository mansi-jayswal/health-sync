-- Study types for imaging studies.

create table if not exists public.study_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.study_types enable row level security;

drop policy if exists "Study types are viewable by clinic admins and radiologists" on public.study_types;
create policy "Study types are viewable by clinic admins and radiologists"
  on public.study_types for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('clinic_admin'::public.app_role, 'radiologist'::public.app_role)
    )
  );

drop policy if exists "Clinic admins can create study types" on public.study_types;
create policy "Clinic admins can create study types"
  on public.study_types for insert
  to authenticated
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'clinic_admin'::public.app_role
    )
  );

drop policy if exists "Clinic admins can update study types" on public.study_types;
create policy "Clinic admins can update study types"
  on public.study_types for update
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

drop policy if exists "Clinic admins can delete study types" on public.study_types;
create policy "Clinic admins can delete study types"
  on public.study_types for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'clinic_admin'::public.app_role
    )
  );
