-- Create skills table for skill listings
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  skill_level text not null check (skill_level in ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  credits_per_hour integer not null default 1,
  duration_minutes integer not null default 60,
  is_active boolean default true,
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.skills enable row level security;

-- RLS Policies for skills
create policy "skills_select_active"
  on public.skills for select
  using (is_active = true or auth.uid() = user_id);

create policy "skills_insert_own"
  on public.skills for insert
  with check (auth.uid() = user_id);

create policy "skills_update_own"
  on public.skills for update
  using (auth.uid() = user_id);

create policy "skills_delete_own"
  on public.skills for delete
  using (auth.uid() = user_id);

-- Create index for faster queries
create index if not exists skills_user_id_idx on public.skills(user_id);
create index if not exists skills_category_idx on public.skills(category);
create index if not exists skills_tags_idx on public.skills using gin(tags);
