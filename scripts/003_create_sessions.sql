-- Create sessions table for skill exchange bookings
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60,
  status text not null check (status in ('Pending', 'Confirmed', 'Completed', 'Cancelled')) default 'Pending',
  meeting_link text,
  notes text,
  rating integer check (rating >= 1 and rating <= 5),
  review text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.sessions enable row level security;

-- RLS Policies for sessions
create policy "sessions_select_own"
  on public.sessions for select
  using (auth.uid() = teacher_id or auth.uid() = learner_id);

create policy "sessions_insert_learner"
  on public.sessions for insert
  with check (auth.uid() = learner_id);

create policy "sessions_update_own"
  on public.sessions for update
  using (auth.uid() = teacher_id or auth.uid() = learner_id);

create policy "sessions_delete_own"
  on public.sessions for delete
  using (auth.uid() = teacher_id or auth.uid() = learner_id);

-- Create indexes
create index if not exists sessions_teacher_id_idx on public.sessions(teacher_id);
create index if not exists sessions_learner_id_idx on public.sessions(learner_id);
create index if not exists sessions_status_idx on public.sessions(status);
create index if not exists sessions_scheduled_at_idx on public.sessions(scheduled_at);
