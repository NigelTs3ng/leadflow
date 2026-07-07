-- LeadFlow schema
-- Run this whole file once in Supabase: Project > SQL Editor > New query > paste > Run

create extension if not exists "pgcrypto";

-- ============ COMPANIES ============
-- Company-wide info only. Workforce numbers live per-sector on company_sectors below, since a
-- company can operate (and hold separate quotas/levies) across more than one sector.
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  notes text,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ COMPANY SECTORS ============
-- One row per sector a company operates in (e.g. a company can have both a Construction and a
-- Services profile). Each sector profile has its own workforce breakdown, notes, and custom fields,
-- and gets its own MOM quota/levy calculation.
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

-- ============ LEADS ============
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  job_title text,
  job_description text,       -- role/scope of the job the lead is hiring for
  workers_needed integer,
  worker_type text,          -- e.g. General Labourer, Scaffolder, Electrician, Supervisor
  pass_type text default 'Work Permit (NTS)', -- Work Permit (NTS) | Work Permit (PRC) | S Pass | Employment Pass
  pay_offered numeric,
  pay_period text default 'monthly', -- monthly | daily | hourly
  status text not null default 'unfilled', -- unfilled | filled
  last_contacted_at timestamptz,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ FOLLOW UPS ============
create table if not exists follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
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

-- ============ CUSTOM FIELD DEFINITIONS ============
-- Lets you add fields to companies / leads / follow_ups from the Settings UI
-- without ever needing a schema migration. Values live in the custom_fields jsonb column above.
create table if not exists custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('company','company_sector','lead','follow_up')),
  field_key text not null,      -- machine key, e.g. union_membership
  label text not null,          -- display label, e.g. "Union Membership"
  field_type text not null default 'text', -- text | textarea | number | date | select | checkbox
  options jsonb,                -- for field_type = select: ["Option A","Option B"]
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(entity_type, field_key)
);

-- ============ MOM CONFIG (single row, editable rate tables) ============
create table if not exists mom_settings (
  id int primary key default 1,
  config jsonb not null,
  updated_at timestamptz not null default now(),
  constraint mom_settings_singleton check (id = 1)
);

insert into mom_settings (id, config)
values (1, '{
  "sectors": {
    "construction": {
      "label": "Construction",
      "quota_model": "ratio",
      "foreign_to_local_ratio": 7,
      "s_pass_quota_percent": 15,
      "levy": {
        "basic_skilled": 950,
        "higher_skilled": 300,
        "mye_waiver_basic_skilled": 732,
        "mye_waiver_higher_skilled": 231
      }
    },
    "manufacturing": {
      "label": "Manufacturing",
      "quota_model": "percent",
      "quota_percent": 60,
      "s_pass_quota_percent": 15,
      "levy": { "basic_skilled": 501, "higher_skilled": 193 }
    },
    "services": {
      "label": "Services",
      "quota_model": "percent",
      "quota_percent": 35,
      "s_pass_quota_percent": 10,
      "levy": { "basic_skilled": 616, "higher_skilled": 231 }
    },
    "marine": {
      "label": "Marine Shipyard",
      "quota_model": "ratio",
      "foreign_to_local_ratio": 7,
      "s_pass_quota_percent": 15,
      "levy": { "basic_skilled": 385, "higher_skilled": 231 }
    },
    "process": {
      "label": "Process",
      "quota_model": "ratio",
      "foreign_to_local_ratio": 7,
      "s_pass_quota_percent": 15,
      "levy": { "basic_skilled": 578, "higher_skilled": 231 }
    }
  },
  "local_qualifying_salary": 1600,
  "s_pass_min_salary": 3150,
  "notes": "Figures seeded from public MOM guidance as of mid-2026 and may already be out of date \u2014 always cross-check against mom.gov.sg and Work Permit Online before relying on this for compliance decisions. Edit any number on the Settings > MOM Rates page.",
  "last_verified": "2026-07-04"
}'::jsonb)
on conflict (id) do nothing;

-- ============ BACKFILL FUNCTION ============
-- Called automatically whenever you add a new custom field from Settings.
-- It writes { key: null } into every existing row's custom_fields jsonb for the
-- given table, so old records immediately show (and can be edited with) the new field.
create or replace function backfill_custom_field(target_table text, key_name text)
returns void
language plpgsql
security definer
as $$
begin
  if target_table not in ('companies', 'company_sectors', 'leads', 'follow_ups') then
    raise exception 'Invalid target_table: %', target_table;
  end if;

  execute format(
    'update %I set custom_fields = custom_fields || jsonb_build_object(%L, null)
     where not (custom_fields ? %L)',
    target_table, key_name, key_name
  );
end;
$$;

-- Helpful indexes
create index if not exists idx_company_sectors_company_id on company_sectors(company_id);
create index if not exists idx_leads_company_id on leads(company_id);
create index if not exists idx_followups_lead_id on follow_ups(lead_id);
create index if not exists idx_cfd_entity on custom_field_definitions(entity_type);

-- NOTE ON SECURITY: this schema ships with Row Level Security OFF, because the app
-- is designed for a single trusted user with no login (per your current requirement).
-- Anyone with your Supabase anon key + URL could read/write this data.
-- Before you invite other users, enable RLS + Supabase Auth (see README.md "Scaling to multiple users").
alter table companies disable row level security;
alter table company_sectors disable row level security;
alter table leads disable row level security;
alter table follow_ups disable row level security;
alter table custom_field_definitions disable row level security;
alter table mom_settings disable row level security;
