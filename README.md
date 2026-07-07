# LeadFlow

A lean, single-user lead management system for manpower recruitment, with a built-in
MOM (Ministry of Manpower, Singapore) foreign worker quota & levy calculator.

Stack: **Next.js (App Router, TypeScript, Tailwind)** + **Supabase (Postgres)**, deployed on **Vercel**.

## What it does

- Each **company** can have one or more **sector profiles** (e.g. Construction + Services), each
  with its own workforce breakdown, notes, and custom fields, and its own MOM quota/levy calculation.
- Log leads per **company**, tracking job title, job description, workers needed, worker type,
  pass type, pay offered, and a simple filled/unfilled status.
- Log **follow-ups** per lead: planned action, action actually taken, status, and due date/time —
  every entry is timestamped automatically.
- Every sector profile on a company page shows a live **MOM quota panel**: total workforce, local
  employees, S Pass holders, PRC Work Permit holders, Work Permit holders on the NTS Occupation
  List (NTS OL), Malaysian/NAS Work Permit holders, remaining foreign worker slots, remaining
  S Pass slots, and an estimated monthly levy.
- **Settings → MOM Rates**: edit the underlying quota %, S Pass %, and levy rate tables yourself
  whenever MOM updates them, no code changes needed.
- **Settings → Custom fields**: add a new field to Company / Company sector / Lead / Follow-up
  forms at any time. New fields are automatically backfilled onto every existing record so you
  can edit them in right away — no separate migration step.
- No login, single user, by design — easy to open on your phone via the Vercel URL.

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → New project. Pick any name/region (Singapore
   region recommended for latency) and set a database password (save it somewhere).
2. Once it's provisioned, open **SQL Editor** (left sidebar) → **New query**.
3. Paste in the entire contents of `supabase/schema.sql` from this project and click **Run**.
   This creates all tables, the MOM rate defaults, and a helper function used by the custom
   fields feature. (If you already ran an older version of this schema, run the files in
   `supabase/migrations/` in order instead — they migrate your existing data in place.)
4. Go to **Project Settings → API**. Copy:
   - **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> Security note: this schema disables Row Level Security on purpose, because there's no login
> yet and only you are meant to use it. Anyone who has your anon key + URL could read/write this
> data — don't publish the repo publicly with real keys in it, and see "Scaling to multiple
> users" below before you share the app with anyone else.

## 2. Run it locally (optional, good for testing)

```bash
npm install
cp .env.local.example .env.local
# then edit .env.local and paste in your Supabase URL + anon key
npm run dev
```

Visit http://localhost:3000 — add a company, add a lead, log a follow-up.

## 3. Deploy live on Vercel

1. Push this project to a GitHub repo (private repo recommended, since there's no login on the
   app itself):
   ```bash
   git init
   git add -A
   git commit -m "Initial LeadFlow app"
   gh repo create leadflow --private --source=. --push
   # (or create the repo on github.com and `git remote add origin ...` + `git push`)
   ```
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import the GitHub repo.
3. In the import screen, expand **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. You'll get a `https://leadflow-xxxx.vercel.app` URL you can open from your
   phone or MacBook — bookmark it.

Any time you want to change something later, edit the code, `git push`, and Vercel redeploys
automatically.

## How the MOM calculator works

A company can have several **sector profiles** (e.g. Construction and Services), each calculated
independently. For each sector profile you record:
- **Local employees** — headcount earning at least the Local Qualifying Salary
- **S Pass holders**
- **Work Permit holders, split by source**: PRC, NTS Occupation List (NTS OL), and Malaysian/NAS
  — these sum to the sector's total Work Permit headcount
- How many of those WP holders are **higher-skilled (R1)**
- Whether an **MYE waiver** applies (relevant to construction/marine/process)

The app then works out, per MOM's published methodology:
- **Percent-model sectors** (Services, Manufacturing): `Max foreign workers = Local × quota% / (1 − quota%)`
- **Ratio-model sectors** (Construction, Marine, Process, as configured): `Max foreign workers = Local × ratio`
- **S Pass sub-quota**: `S Pass % × (Total workforce + 1)`, rounded down, and it counts *within*
  the overall foreign worker quota, not on top of it
- **Estimated monthly levy**: skill-tier rate × headcount, using whatever rates you've set in
  Settings → MOM Rates

**Important caveat, especially for construction/marine/process:** MOM controls those sectors
through **Man-Year Entitlement (MYE)**, which is allocated per project/tender by BCA/MOM rather
than being a pure function of your local headcount. The ratio-based number this app shows is a
*planning estimate* to help you sanity-check quota before you commit to a lead — always confirm
your actual, real-time quota balance on **Work Permit Online (WPOL)** before making hiring
decisions. The app surfaces this as a warning on every sector profile.

MOM figures (quota %, LQS, levy rates) do change over time and different sources disagree on the
exact current numbers as of mid-2026 — the seeded values in `supabase/schema.sql` are a
reasonable starting point, not a guarantee of accuracy. Update them in Settings → MOM Rates
whenever you confirm the current numbers on mom.gov.sg.

## Adding custom fields

Go to **Settings → Custom fields**, choose whether it applies to Company / Company sector / Lead /
Follow-up, give it a label and a type (text, long text, number, date, dropdown, or checkbox), and save.
It immediately appears on the relevant forms, and every existing record gets the new field
added (empty) so you can fill it in the next time you edit that record.

Under the hood, custom field values are stored in a `custom_fields` JSONB column on each table —
this is what lets fields be added without ever needing a database migration.

## Scaling to multiple users later

This is intentionally a single-user, no-login app for now. When you're ready to open it up to
your team:
1. Enable **Supabase Auth** (email/password or magic link) and re-enable Row Level Security on
   each table, scoping rows by a `created_by` / `workspace_id` column.
2. Wrap the app in a login check (Next.js middleware + Supabase Auth helpers).
3. Everything else — the schema, the quota calculator, the custom fields system — carries over
   unchanged.

## Project structure

```
src/
  app/
    page.tsx                    Dashboard: company list + aggregated quota badges
    companies/[id]/page.tsx     Company detail: per-sector quota panels + leads list
    companies/[id]/edit/        Edit company
    companies/[id]/sectors/new/               Add a sector profile to a company
    companies/[id]/sectors/[sectorId]/edit/   Edit/delete a sector profile
    companies/new/              Add company
    companies/actions.ts        Server actions: company + company-sector CRUD
    leads/[id]/page.tsx         Lead detail + follow-up log + add follow-up
    leads/[id]/edit/            Edit lead
    leads/new/                  Add lead
    leads/actions.ts            Server actions: leads + follow-ups CRUD
    settings/                   Settings hub
    settings/fields/            Custom field manager
    settings/rates/             MOM rate table editor (raw JSON)
    settings/actions.ts         Server actions: custom fields + MOM config
  lib/
    supabase.ts                 Supabase client
    customFields.ts             Custom field definitions + backfill logic
    mom/quota.ts                MOM quota & levy calculation engine
  components/
    CustomFieldsInput.tsx       Renders dynamic form fields
    CustomFieldsDisplay.tsx     Renders dynamic field values read-only
supabase/
  schema.sql                    Full DB schema — run once in Supabase SQL editor
```
# leadflow
