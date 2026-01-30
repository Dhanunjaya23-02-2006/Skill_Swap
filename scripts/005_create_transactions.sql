-- Create transactions table for credit transaction history
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  amount integer not null,
  type text not null check (type in ('Earned', 'Spent', 'Bonus', 'Refund')),
  description text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.transactions enable row level security;

-- RLS Policies for transactions
create policy "transactions_select_own"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "transactions_insert_system"
  on public.transactions for insert
  with check (auth.uid() = user_id);

-- Create index
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_created_at_idx on public.transactions(created_at desc);
