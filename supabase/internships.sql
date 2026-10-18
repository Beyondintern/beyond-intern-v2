-- Internships feature: listings + student assignments
-- Run in the Supabase SQL editor. Mirrors the existing user_courses pattern.

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

-- ── Row Level Security ────────────────────────────────────────────────────
-- The app reads/writes through the service-role key (server actions only),
-- so these policies lock direct anon/client access down.

alter table public.internships enable row level security;
alter table public.internship_assignments enable row level security;

-- Public site can read active listings (the landing section reads via
-- server action with the service key, so anon reads are not strictly
-- needed; keep them locked for safety).
revoke all on public.internships from anon;
revoke all on public.internship_assignments from anon;
revoke all on public.internships from authenticated;
revoke all on public.internship_assignments from authenticated;
