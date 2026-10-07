create index if not exists idx_hotel_recommendations_hotel
  on public.hotel_recommendations (hotel_id);

create index if not exists idx_opportunities_room_type
  on public.opportunities (room_type_id);

create index if not exists idx_actions_hotel
  on public.actions (hotel_id);

create index if not exists idx_actions_recommendation
  on public.actions (recommendation_id);

create index if not exists idx_action_outcomes_hotel
  on public.action_outcomes (hotel_id);

revoke delete, truncate, references, trigger
  on table public.hotels, public.room_types, public.rate_plans, public.channels,
  public.inventory, public.reservations, public.demand_signals, public.forecasts,
  public.opportunities, public.hotel_recommendations, public.actions, public.action_outcomes
from anon, authenticated;
