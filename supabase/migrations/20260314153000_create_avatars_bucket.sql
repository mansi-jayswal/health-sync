-- Create avatars bucket (public) if not present
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow public read of avatar files
drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars"
on storage.objects
for select
using (bucket_id = 'avatars');

-- Authenticated users can upload their own avatars
drop policy if exists "Users can upload avatars" on storage.objects;
create policy "Users can upload avatars"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'avatars' and auth.uid() = owner);

-- Authenticated users can update their own avatars
drop policy if exists "Users can update avatars" on storage.objects;
create policy "Users can update avatars"
on storage.objects
for update
to authenticated
using (bucket_id = 'avatars' and auth.uid() = owner);

-- Authenticated users can delete their own avatars
drop policy if exists "Users can delete avatars" on storage.objects;
create policy "Users can delete avatars"
on storage.objects
for delete
to authenticated
using (bucket_id = 'avatars' and auth.uid() = owner);
