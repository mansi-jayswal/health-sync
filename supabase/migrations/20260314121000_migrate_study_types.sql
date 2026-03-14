-- Migrate static study_type text to study_types + study_type_id.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'studies'
      and column_name = 'study_type'
  ) then
    -- Create study types from existing values
    insert into public.study_types (name, created_by)
    select distinct study_type, created_by
    from public.studies
    where study_type is not null
    on conflict (name) do nothing;

    alter table public.studies
      add column if not exists study_type_id uuid;

    update public.studies s
    set study_type_id = st.id
    from public.study_types st
    where st.name = s.study_type
      and s.study_type_id is null;

    alter table public.studies
      alter column study_type_id set not null;

    alter table public.studies
      add constraint studies_study_type_id_fkey
      foreign key (study_type_id) references public.study_types(id);

    alter table public.studies
      drop column study_type;
  end if;
end
$$;
