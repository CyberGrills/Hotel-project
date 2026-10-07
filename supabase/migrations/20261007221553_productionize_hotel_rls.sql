create table if not exists public.hotel_members (
 id uuid primary key default gen_random_uuid(),
 hotel_id uuid not null references public.hotels(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null default 'analyst' check (role in ('owner','manager','analyst')),
 created_at timestamptz not null default now(),
 unique (hotel_id,user_id)
);

create index if not exists idx_hotel_members_user_hotel on public.hotel_members(user_id,hotel_id);
create index if not exists idx_hotel_members_hotel_user on public.hotel_members(hotel_id,user_id);

alter table public.hotel_members enable row level security;

revoke all on table public.hotel_members from anon, authenticated;
grant select on table public.hotel_members to authenticated;

create policy "members can read their own memberships"
  on public.hotel_members for select to authenticated
  using (user_id = (select auth.uid()));

alter table public.hotels enable row level security;
alter table public.room_types enable row level security;
alter table public.rate_plans enable row level security;
alter table public.channels enable row level security;
alter table public.inventory enable row level security;
alter table public.reservations enable row level security;
alter table public.demand_signals enable row level security;
alter table public.forecasts enable row level security;
alter table public.opportunities enable row level security;
alter table public.hotel_recommendations enable row level security;
alter table public.actions enable row level security;
alter table public.action_outcomes enable row level security;

revoke all on table public.hotels, public.room_types, public.rate_plans, public.channels,
  public.inventory, public.reservations, public.demand_signals, public.forecasts,
  public.opportunities, public.hotel_recommendations, public.actions, public.action_outcomes
from anon, authenticated;

grant select, update on table public.hotels to authenticated;
grant select, insert, update on table public.room_types, public.rate_plans, public.channels,
  public.inventory, public.reservations, public.demand_signals, public.forecasts,
  public.opportunities, public.hotel_recommendations, public.actions, public.action_outcomes
to authenticated;

