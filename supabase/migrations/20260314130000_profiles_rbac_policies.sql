-- Phase 1 RBAC profiles policies.

alter table public.profiles enable row level security;

drop policy if exists "clinic_admin_read_all" on public.profiles;
create policy "clinic_admin_read_all" on public.profiles
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'clinic_admin'::public.app_role
    )
  );

drop policy if exists "user_read_own" on public.profiles;
create policy "user_read_own" on public.profiles
  for select
  using (auth.uid() = id);
