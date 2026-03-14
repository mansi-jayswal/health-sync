-- Study assignment + status, and active profiles.

alter table public.studies
  add column if not exists assigned_to uuid references public.profiles(id) on delete set null;

alter table public.studies
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'in_review', 'completed'));

alter table public.profiles
  add column if not exists is_active boolean not null default true;

-- Replace existing studies policies with assignment-aware policies.
drop policy if exists "Studies are viewable by clinic admins and radiologists" on public.studies;
drop policy if exists "Clinic admins can create studies" on public.studies;
drop policy if exists "Clinic admins can update studies" on public.studies;
drop policy if exists "Clinic admins can delete studies" on public.studies;

drop policy if exists "clinic_admin_all_studies" on public.studies;
drop policy if exists "radiologist_assigned_studies" on public.studies;

create policy "clinic_admin_all_studies" on public.studies
  for all
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

create policy "radiologist_assigned_studies" on public.studies
  for select
  using (
    assigned_to = auth.uid()
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'radiologist'::public.app_role
    )
  );
