-- Migration: pay_offered becomes free text instead of a strict number
-- Run once in Supabase: Project > SQL Editor > New query > paste this whole file > Run.
-- Lets you enter things like "1,800" or "60-80/day" or "negotiable", not just a plain number.

alter table leads alter column pay_offered type text using pay_offered::text;
