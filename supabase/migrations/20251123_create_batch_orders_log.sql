create table if not exists public.batch_orders_log (
    id uuid default gen_random_uuid() primary key,
    batch_id uuid references public.batches(id) on delete set null,
    batch_name text not null,
    batch_number text, -- Storing truncated ID or specific number if available
    user_id uuid references auth.users(id) on delete set null,
    user_name text,
    batch_items_snapshot jsonb, -- Snapshot of batch items at time of order
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.batch_orders_log enable row level security;

-- Policies
create policy "Enable read access for authenticated users"
on public.batch_orders_log for select
to authenticated
using (true);

create policy "Enable insert access for authenticated users"
on public.batch_orders_log for insert
to authenticated
with check (true);

-- Grant permissions
grant select, insert on public.batch_orders_log to authenticated;
grant select, insert on public.batch_orders_log to service_role;
