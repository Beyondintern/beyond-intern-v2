-- ════════════════════════════════════════════════════════════════════════════
-- Beyond Intern — Placements (Jobs & Internships) schema
-- Idempotent: safe to run multiple times in the Supabase SQL Editor.
-- Creates/extends tables, storage bucket, seeds the two launch listings,
-- and locks Row Level Security down to service-role only (the app reads and
-- writes through server actions using the service key, never the anon key).
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Core tables ─────────────────────────────────────────────────────────

create table if not exists public.internships (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  role text not null,
  location text,
  employment_type text,
  pay_rate text,
  experience text,
  shift text,
  description text,
  responsibilities jsonb default '[]'::jsonb,
  requirements jsonb default '[]'::jsonb,
  benefits jsonb default '[]'::jsonb,
  service_fee text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.internship_assignments (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  internship_id uuid not null references public.internships(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique (user_email, internship_id)
);

create index if not exists internship_assignments_email_idx
  on public.internship_assignments (user_email);

-- ── 2. Schema upgrades (safe, additive) ────────────────────────────────────

-- Job vs Internship classification
alter table public.internships
  add column if not exists listing_type text not null default 'Job Placement';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'internships_listing_type_check'
  ) then
    alter table public.internships
      add constraint internships_listing_type_check
      check (listing_type in ('Job Placement', 'Internship'));
  end if;
end $$;

-- Placement pipeline + receipt + CV + notes on the assignment row
alter table public.internship_assignments
  add column if not exists status text not null default 'assigned';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'internship_assignments_status_check'
  ) then
    alter table public.internship_assignments
      add constraint internship_assignments_status_check
      check (status in ('assigned', 'cv_submitted', 'under_review', 'employer_stage'));
  end if;
end $$;

alter table public.internship_assignments
  add column if not exists receipt_number text unique;
alter table public.internship_assignments
  add column if not exists amount_paid text;
alter table public.internship_assignments
  add column if not exists cv_url text;
alter table public.internship_assignments
  add column if not exists cv_file_name text;
alter table public.internship_assignments
  add column if not exists cv_submitted_at timestamptz;
alter table public.internship_assignments
  add column if not exists candidate_notes text;
alter table public.internship_assignments
  add column if not exists admin_notes text;
alter table public.internship_assignments
  add column if not exists receipt_sent_at timestamptz;
alter table public.internship_assignments
  add column if not exists updated_at timestamptz not null default now();

-- Keep updated_at fresh on every change
create or replace function public.touch_internship_assignment_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_internship_assignments_updated_at on public.internship_assignments;
create trigger trg_internship_assignments_updated_at
  before update on public.internship_assignments
  for each row execute function public.touch_internship_assignment_updated_at();

-- ── 3. Private CV storage bucket ───────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('placement-cvs', 'placement-cvs', false)
on conflict (id) do nothing;

-- No public/anonymous access: all CV reads and writes flow through the
-- service-role server action, which is the only actor allowed past RLS.

-- ── 4. Row Level Security ──────────────────────────────────────────────────

alter table public.internships enable row level security;
alter table public.internship_assignments enable row level security;

-- Lock anon + authenticated clients out entirely; server actions use the
-- service-role key which bypasses RLS.
revoke all on public.internships from anon;
revoke all on public.internship_assignments from anon;
revoke all on public.internships from authenticated;
revoke all on public.internship_assignments from authenticated;

-- ── 5. Seed the two launch listings (runs once, only when table is empty) ──

insert into public.internships (
  company, role, listing_type, location, employment_type, pay_rate,
  experience, shift, description, responsibilities, requirements, benefits,
  service_fee, is_active
)
select *
from (
  values
  (
    'Amazon UK Services Ltd.',
    'Warehouse Operative / Fulfilment Associate',
    'Job Placement',
    'United Kingdom',
    'Part-Time / Full-Time',
    '£15.10 - £16.10 per hour',
    'No previous experience required for some vacancies',
    'Day / Night shifts, subject to availability',
    'Amazon is looking for reliable and motivated individuals to support its UK warehouse and fulfilment operations. Employees help ensure that customer orders are received, processed, packed, sorted and dispatched safely and efficiently.',
    '["Receive, scan and sort incoming products","Pick, pack and prepare customer orders for dispatch","Load, unload and move packages safely","Maintain workplace cleanliness and follow health and safety procedures","Meet quality and productivity standards","Work collaboratively with colleagues to meet daily operational targets"]'::jsonb,
    '["Must meet the applicable UK right-to-work requirements","Ability to follow instructions and safety procedures","Comfortable standing, walking and handling packages during shifts","Good teamwork and time-management skills"]'::jsonb,
    '["Competitive hourly pay","Training provided for eligible entry-level positions","Potential access to employee benefits, pension and career-development programmes","Opportunities to explore different operational roles"]'::jsonb,
    'From £300 (application support service)',
    true
  ),
  (
    'Tesco Stores Ltd.',
    'Store Colleague / Customer Assistant',
    'Job Placement',
    'United Kingdom',
    'Part-Time / Full-Time, subject to vacancy',
    'From £13.28 per hour (£14.55 within the M25)',
    'Entry-level opportunities available',
    'Morning / Afternoon / Evening / Twilight, subject to availability',
    'Tesco is looking for friendly, reliable and customer-focused individuals to support its UK stores. The role involves helping customers, replenishing shelves, handling products and supporting daily store operations.',
    '["Provide friendly and helpful customer service","Replenish shelves and maintain product displays","Assist customers with product enquiries","Operate checkout facilities when required and trained","Pick and prepare online customer orders","Maintain cleanliness and follow health and safety procedures"]'::jsonb,
    '["Must meet UK right-to-work requirements","Good communication and teamwork skills","A positive and customer-focused attitude","Willingness to work flexible shifts, including weekends where required"]'::jsonb,
    '["Competitive hourly pay","Staff discount through the Tesco Clubcard scheme, subject to eligibility","Holiday entitlement and pension benefits, subject to applicable terms","Training and opportunities for career development"]'::jsonb,
    'From £250 (application support service)',
    true
  )
) as seed
where not exists (select 1 from public.internships);
