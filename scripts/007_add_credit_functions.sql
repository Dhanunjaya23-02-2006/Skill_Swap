-- Function to add credits to a user
create or replace function public.add_credits(p_user_id uuid, p_amount integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.credits
  set 
    balance = balance + p_amount,
    total_earned = total_earned + p_amount,
    updated_at = now()
  where user_id = p_user_id;
end;
$$;

-- Function to deduct credits from a user
create or replace function public.deduct_credits(p_user_id uuid, p_amount integer)
returns void
language plpgsql
security definer
as $$
begin
  -- Check if user has enough credits
  if (select balance from public.credits where user_id = p_user_id) < p_amount then
    raise exception 'Insufficient credits';
  end if;

  update public.credits
  set 
    balance = balance - p_amount,
    total_spent = total_spent + p_amount,
    updated_at = now()
  where user_id = p_user_id;
end;
$$;
