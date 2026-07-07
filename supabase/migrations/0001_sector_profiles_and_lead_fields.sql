-- Migration: multi-sector companies + MOM workforce-by-source breakdown + lead field changes
-- Run once in Supabase: Project > SQL Editor > New query > paste this whole file > Run.
-- Safe to run against the live DB — it migrates existing rows rather than dropping data blind.

-- ============ 1. New company_sectors table ============
-- A company can now have multiple sector profiles (e.g. Construction + Services), each with its
-- own workforce breakdown, notes, and custom fields. The old single-sector fields on `companies`
-- move here.
create table if not exists company_sectors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  sector text not null default 'construction', -- construction | manufacturing | services | marine | process
  local_workforce_count integer not null default 0,    -- local employees (SC + PR earning >= LQS)
  s_pass_count integer not null default 0,              -- current active S Pass holders
  prc_wp_count integer not null default 0,              -- Work Permit holders from PRC (China)
  nts_ol_wp_count integer not null default 0,           -- Work Permit holders on the NTS Occupation List
  malaysian_nas_wp_count integer not null default 0,    -- Work Permit holders: Malaysian / North Asian Source
  higher_skilled_count integer not null default 0,      -- of the WP holders above, how many are R1 / higher-skilled
  mye_waiver boolean not null default false,             -- construction/process/marine: MYE waiver in effect?
  notes text,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_company_sectors_company_id on company_sectors(company_id);
alter table company_sectors disable row level security;

-- ============ 2. Backfill: turn each company's existing sector fields into its first sector row ============
-- NOTE: your old `work_permit_count` had no source-country breakdown, so it's carried over into
-- nts_ol_wp_count as a starting point (the most common bucket) — go back and split it correctly
-- across PRC / NTS OL / Malaysian-NAS per company once this migration is done.
insert into company_sectors (
  company_id, sector, local_workforce_count, s_pass_count,
  nts_ol_wp_count, higher_skilled_count, mye_waiver, notes, created_at, updated_at
)
select id, sector, local_workforce_count, s_pass_count,
       work_permit_count, higher_skilled_count, mye_waiver, notes, created_at, updated_at
from companies;

-- ============ 3. Companies table becomes company-wide only (name, notes, custom fields) ============
alter table companies
  drop column if exists sector,
  drop column if exists local_workforce_count,
  drop column if exists work_permit_count,
  drop column if exists s_pass_count,
  drop column if exists higher_skilled_count,
  drop column if exists mye_waiver;

-- ============ 4. custom_field_definitions: allow entity_type = 'company_sector' ============
alter table custom_field_definitions drop constraint if exists custom_field_definitions_entity_type_check;
alter table custom_field_definitions add constraint custom_field_definitions_entity_type_check
  check (entity_type in ('company','lead','follow_up','company_sector'));

-- ============ 5. backfill_custom_field(): allow target_table = 'company_sectors' ============
create or replace function backfill_custom_field(target_table text, key_name text)
returns void
language plpgsql
security definer
as $$
begin
  if target_table not in ('companies', 'leads', 'follow_ups', 'company_sectors') then
    raise exception 'Invalid target_table: %', target_table;
  end if;

  execute format(
    'update %I set custom_fields = custom_fields || jsonb_build_object(%L, null)
     where not (custom_fields ? %L)',
    target_table, key_name, key_name
  );
end;
$$;

-- ============ 6. Leads: contact_name -> job_title, source -> job_description, drop email/phone ============
alter table leads rename column contact_name to job_title;
alter table leads rename column source to job_description;
alter table leads drop column if exists contact_email;
alter table leads drop column if exists contact_phone;

-- ============ 7. Leads: pass_type options change (Work Permit -> Work Permit (NTS) / Work Permit (PRC)) ============
-- Existing generic "Work Permit" rows are remapped to "Work Permit (NTS)" as a starting default —
-- go back and correct to "Work Permit (PRC)" per-lead where that's actually the right source.
update leads set pass_type = 'Work Permit (NTS)' where pass_type = 'Work Permit';
alter table leads alter column pass_type set default 'Work Permit (NTS)';

-- ============ 8. Leads: status simplified to filled / unfilled ============
update leads set status = 'filled' where status = 'won';
update leads set status = 'unfilled' where status in ('new', 'contacted', 'negotiating', 'lost');
alter table leads alter column status set default 'unfilled';
