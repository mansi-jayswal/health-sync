-- Phase 3 Scan Upload: scan_images table + RLS policies.

create table if not exists public.scan_images (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  file_size int,
  mime_type text not null default 'image/jpeg'
    check (mime_type in ('image/jpeg', 'image/png')),
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create index if not exists scan_images_study_id_idx on public.scan_images(study_id);

alter table public.scan_images enable row level security;

drop policy if exists "clinic_admin_all_scans" on public.scan_images;
create policy "clinic_admin_all_scans" on public.scan_images
  for all
  using (public.is_clinic_admin(auth.uid()))
  with check (public.is_clinic_admin(auth.uid()));

drop policy if exists "radiologist_select_assigned_scans" on public.scan_images;
create policy "radiologist_select_assigned_scans" on public.scan_images
  for select
  using (
    exists (
      select 1
      from public.studies
      where public.studies.id = public.scan_images.study_id
        and public.studies.assigned_to = auth.uid()
    )
  );
