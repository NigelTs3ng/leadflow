-- Migration: Supply Gen section — overseas supply companies + their follow-ups
-- Run once in Supabase: Project > SQL Editor > New query > paste this whole file > Run.

create table if not exists supply_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,             -- e.g. China, India, Bangladesh, Myanmar, Sri Lanka ...
  contact_person text,
  contact_number text,
  contact_email text,
  notes text,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table supply_companies disable row level security;

create table if not exists supply_follow_ups (
  id uuid primary key default gen_random_uuid(),
  supply_company_id uuid not null references supply_companies(id) on delete cascade,
  action_type text default 'call',   -- call | email | whatsapp | meeting | site_visit | other
  planned_action text,               -- what needs to be done
  action_taken text,                 -- what was actually done
  status text not null default 'pending', -- pending | done | cancelled
  due_at timestamptz,
  completed_at timestamptz,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table supply_follow_ups disable row level security;

create index if not exists idx_supply_followups_company_id on supply_follow_ups(supply_company_id);

-- Allow custom fields against the new entity types too
alter table custom_field_definitions drop constraint if exists custom_field_definitions_entity_type_check;
alter table custom_field_definitions add constraint custom_field_definitions_entity_type_check
  check (entity_type in ('company', 'company_sector', 'lead', 'follow_up', 'supply_company', 'supply_follow_up'));

create or replace function backfill_custom_field(target_table text, key_name text)
returns void
language plpgsql
security definer
as $$
begin
  if target_table not in ('companies', 'company_sectors', 'leads', 'follow_ups', 'supply_companies', 'supply_follow_ups') then
    raise exception 'Invalid target_table: %', target_table;
  end if;

  execute format(
    'update %I set custom_fields = custom_fields || jsonb_build_object(%L, null)
     where not (custom_fields ? %L)',
    target_table, key_name, key_name
  );
end;
$$;
