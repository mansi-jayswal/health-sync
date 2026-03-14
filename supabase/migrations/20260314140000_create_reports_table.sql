-- Phase 6 Report Editor: reports table + RLS policies.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null unique references public.studies(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  findings text not null default '',
  impression text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.reports enable row level security;

drop policy if exists "clinic_admin_select_reports" on public.reports;
create policy "clinic_admin_select_reports" on public.reports
  for select
  using (public.is_clinic_admin(auth.uid()));

drop policy if exists "radiologist_own_reports" on public.reports;
create policy "radiologist_own_reports" on public.reports
  for all
  using (
    author_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'radiologist'::public.app_role
    )
  )
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'radiologist'::public.app_role
    )
  );

drop policy if exists "radiologist_assigned_study_reports" on public.reports;
create policy "radiologist_assigned_study_reports" on public.reports
  for select
  using (
    exists (
      select 1 from public.studies
      where public.studies.id = public.reports.study_id
        and public.studies.assigned_to = auth.uid()
    )
  );
