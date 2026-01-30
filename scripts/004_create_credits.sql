-- Create credits table for user credit balances
create table if not exists public.credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  balance integer not null default 10,
  total_earned integer not null default 10,
  total_spent integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.credits enable row level security;

-- RLS Policies for credits
create policy "credits_select_own"
  on public.credits for select
  using (auth.uid() = user_id);

create policy "credits_insert_own"
  on public.credits for insert
  with check (auth.uid() = user_id);

create policy "credits_update_own"
  on public.credits for update
  using (auth.uid() = user_id);

-- Create index
create index if not exists credits_user_id_idx on public.credits(user_id);

-- Trigger to initialize credits for new users
create or replace function public.handle_new_user_credits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.credits (user_id, balance, total_earned)
  values (new.id, 10, 10)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created on public.profiles;

create trigger on_profile_created
  after insert on public.profiles
  for each row
  execute function public.handle_new_user_credits();
