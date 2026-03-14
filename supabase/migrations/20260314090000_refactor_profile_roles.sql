-- Refactor roles to clinic_admin / radiologist and keep profiles/signup trigger aligned.

do $$
begin
  create type public.app_role as enum ('clinic_admin', 'radiologist');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role public.app_role not null default 'clinic_admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists avatar_url text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
declare
  role_check_constraint_name text;
begin
  select c.conname
  into role_check_constraint_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'profiles'
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%role%';

  if role_check_constraint_name is not null then
    execute format(
      'alter table public.profiles drop constraint %I',
      role_check_constraint_name
    );
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
      and udt_name = 'text'
  ) then
    alter table public.profiles alter column role drop default;
    alter table public.profiles
      alter column role type public.app_role
      using (
        case
          when role in ('admin', 'user', 'technician', 'clinic_admin', 'clinice_admin') then 'clinic_admin'::public.app_role
          when role = 'radiologist' then 'radiologist'::public.app_role
          else 'clinic_admin'::public.app_role
        end
      );
  elsif not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
  ) then
    alter table public.profiles
      add column role public.app_role not null default 'clinic_admin';
  end if;
end
$$;

alter table public.profiles
  alter column role set default 'clinic_admin',
  alter column role set not null;

update public.profiles
set role = 'clinic_admin'::public.app_role
where role is null;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'items'
  ) then
    drop policy if exists "Admins can update any item" on public.items;
    drop policy if exists "Admins can delete any item" on public.items;
    drop policy if exists "Clinic admins can update any item" on public.items;
    drop policy if exists "Clinic admins can delete any item" on public.items;

    create policy "Clinic admins can update any item"
      on public.items for update
      to authenticated
      using (
        exists (
          select 1 from public.profiles
          where profiles.id = auth.uid() and profiles.role = 'clinic_admin'::public.app_role
        )
      )
      with check (
        exists (
          select 1 from public.profiles
          where profiles.id = auth.uid() and profiles.role = 'clinic_admin'::public.app_role
        )
      );

    create policy "Clinic admins can delete any item"
      on public.items for delete
      to authenticated
      using (
        exists (
          select 1 from public.profiles
          where profiles.id = auth.uid() and profiles.role = 'clinic_admin'::public.app_role
        )
      );
  end if;
end
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    'clinic_admin'::public.app_role
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
