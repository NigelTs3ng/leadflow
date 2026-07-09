-- Migration: allow a Supply Gen company to have more than one country
-- Run once in Supabase: Project > SQL Editor > New query > paste this whole file > Run.
-- Converts the existing single-value `country` text column into a text[] array,
-- preserving each row's existing country as the first (and only) element.

alter table supply_companies
  alter column country type text[]
  using case when country is null or country = '' then '{}'::text[] else array[country] end;

alter table supply_companies alter column country set default '{}'::text[];
alter table supply_companies alter column country set not null;
