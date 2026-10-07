create schema if not exists private;

create or replace function private.is_hotel_member(p_hotel_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.hotel_members hm
      where hm.hotel_id = p_hotel_id
        and hm.user_id = (select auth.uid())
    );
$$;

create or replace function private.is_hotel_manager(p_hotel_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.hotel_members hm
      where hm.hotel_id = p_hotel_id
        and hm.user_id = (select auth.uid())
        and hm.role in ('owner','manager')
    );
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke all on function private.is_hotel_member(uuid) from public, anon;
revoke all on function private.is_hotel_manager(uuid) from public, anon;
grant execute on function private.is_hotel_member(uuid) to authenticated;

grant execute on function private.is_hotel_manager(uuid) to authenticated;

drop policy if exists "hotel_engine_insert" on public.hotels;
drop policy if exists "hotel_engine_select" on public.hotels;
drop policy if exists "hotel_engine_update" on public.hotels;
drop policy if exists "room_types_insert" on public.room_types;
drop policy if exists "room_types_select" on public.room_types;
drop policy if exists "room_types_update" on public.room_types;
drop policy if exists "rate_plans_insert" on public.rate_plans;
drop policy if exists "rate_plans_select" on public.rate_plans;
drop policy if exists "rate_plans_update" on public.rate_plans;
drop policy if exists "channels_insert" on public.channels;
drop policy if exists "channels_select" on public.channels;
drop policy if exists "channels_update" on public.channels;
drop policy if exists "inventory_insert" on public.inventory;
drop policy if exists "inventory_select" on public.inventory;
drop policy if exists "inventory_update" on public.inventory;
drop policy if exists "reservations_insert" on public.reservations;
drop policy if exists "reservations_select" on public.reservations;
drop policy if exists "reservations_update" on public.reservations;
drop policy if exists "demand_signals_insert" on public.demand_signals;
drop policy if exists "demand_signals_select" on public.demand_signals;
drop policy if exists "demand_signals_update" on public.demand_signals;
drop policy if exists "forecasts_insert" on public.forecasts;
drop policy if exists "forecasts_select" on public.forecasts;
drop policy if exists "forecasts_update" on public.forecasts;
drop policy if exists "opportunities_insert" on public.opportunities;
drop policy if exists "opportunities_select" on public.opportunities;
drop policy if exists "opportunities_update" on public.opportunities;
drop policy if exists "hotel_recommendations_insert" on public.hotel_recommendations;
drop policy if exists "hotel_recommendations_select" on public.hotel_recommendations;
drop policy if exists "hotel_recommendations_update" on public.hotel_recommendations;
drop policy if exists "actions_insert" on public.actions;
drop policy if exists "actions_select" on public.actions;
drop policy if exists "actions_update" on public.actions;
drop policy if exists "action_outcomes_insert" on public.action_outcomes;
drop policy if exists "action_outcomes_select" on public.action_outcomes;
drop policy if exists "action_outcomes_update" on public.action_outcomes;

create policy "hotel members can read hotels"
  on public.hotels for select to authenticated
  using (private.is_hotel_member(id));

create policy "hotel managers can update hotels"
  on public.hotels for update to authenticated
  using (private.is_hotel_manager(id))
  with check (private.is_hotel_manager(id));

create policy "hotel members can read room types"
  on public.room_types for select to authenticated
  using (private.is_hotel_member(hotel_id));

create policy "hotel managers can write room types"
  on public.room_types for insert to authenticated
  with check (private.is_hotel_manager(hotel_id));

create policy "hotel managers can update room types"
  on public.room_types for update to authenticated
  using (private.is_hotel_manager(hotel_id))
  with check (private.is_hotel_manager(hotel_id));

create policy "hotel members can read rate plans"
  on public.rate_plans for select to authenticated
  using (private.is_hotel_member(hotel_id));

create policy "hotel managers can write rate plans"
  on public.rate_plans for insert to authenticated
  with check (private.is_hotel_manager(hotel_id));

create policy "hotel managers can update rate plans"
  on public.rate_plans for update to authenticated
  using (private.is_hotel_manager(hotel_id))
  with check (private.is_hotel_manager(hotel_id));

create policy "hotel members can read channels"
  on public.channels for select to authenticated
  using (private.is_hotel_member(hotel_id));

create policy "hotel managers can write channels"
  on public.channels for insert to authenticated
  with check (private.is_hotel_manager(hotel_id));

create policy "hotel managers can update channels"
  on public.channels for update to authenticated
  using (private.is_hotel_manager(hotel_id))
  with check (private.is_hotel_manager(hotel_id));

create policy "hotel members can read inventory"
  on public.inventory for select to authenticated
  using (private.is_hotel_member(hotel_id));

create policy "hotel managers can write inventory"
  on public.inventory for insert to authenticated
  with check (private.is_hotel_manager(hotel_id));

create policy "hotel managers can update inventory"
  on public.inventory for update to authenticated
  using (private.is_hotel_manager(hotel_id))
  with check (private.is_hotel_manager(hotel_id));

create policy "hotel members can read reservations"
  on public.reservations for select to authenticated
  using (private.is_hotel_member(hotel_id));

create policy "hotel managers can write reservations"
  on public.reservations for insert to authenticated
  with check (private.is_hotel_manager(hotel_id));

create policy "hotel managers can update reservations"
  on public.reservations for update to authenticated
  using (private.is_hotel_manager(hotel_id))
  with check (private.is_hotel_manager(hotel_id));

create policy "hotel members can read demand signals"
  on public.demand_signals for select to authenticated
  using (private.is_hotel_member(hotel_id));

create policy "hotel managers can write demand signals"
  on public.demand_signals for insert to authenticated
  with check (private.is_hotel_manager(hotel_id));

create policy "hotel managers can update demand signals"
  on public.demand_signals for update to authenticated
  using (private.is_hotel_manager(hotel_id))
  with check (private.is_hotel_manager(hotel_id));

create policy "hotel members can read forecasts"
  on public.forecasts for select to authenticated
  using (private.is_hotel_member(hotel_id));

create policy "hotel managers can write forecasts"
  on public.forecasts for insert to authenticated
  with check (private.is_hotel_manager(hotel_id));

create policy "hotel managers can update forecasts"
  on public.forecasts for update to authenticated
  using (private.is_hotel_manager(hotel_id))
  with check (private.is_hotel_manager(hotel_id));

create policy "hotel members can read opportunities"
  on public.opportunities for select to authenticated
  using (private.is_hotel_member(hotel_id));

create policy "hotel managers can create opportunities"
  on public.opportunities for insert to authenticated
  with check (private.is_hotel_manager(hotel_id));

create policy "hotel managers can update opportunities"
  on public.opportunities for update to authenticated
  using (private.is_hotel_manager(hotel_id))
  with check (private.is_hotel_manager(hotel_id));

create policy "hotel members can read hotel recommendations"
  on public.hotel_recommendations for select to authenticated
  using (private.is_hotel_member(hotel_id));

create policy "hotel managers can create hotel recommendations"
  on public.hotel_recommendations for insert to authenticated
  with check (private.is_hotel_manager(hotel_id));

create policy "hotel managers can update hotel recommendations"
  on public.hotel_recommendations for update to authenticated
  using (private.is_hotel_manager(hotel_id))
  with check (private.is_hotel_manager(hotel_id));

create policy "hotel members can read actions"
  on public.actions for select to authenticated
  using (private.is_hotel_member(hotel_id));

create policy "hotel managers can create actions"
  on public.actions for insert to authenticated
  with check (private.is_hotel_manager(hotel_id));

create policy "hotel managers can update actions"
  on public.actions for update to authenticated
  using (private.is_hotel_manager(hotel_id))
  with check (private.is_hotel_manager(hotel_id));

create policy "hotel members can read action outcomes"
  on public.action_outcomes for select to authenticated
  using (private.is_hotel_member(hotel_id));

create policy "hotel managers can create action outcomes"
  on public.action_outcomes for insert to authenticated
  with check (private.is_hotel_manager(hotel_id));

create policy "hotel managers can update action outcomes"
  on public.action_outcomes for update to authenticated
  using (private.is_hotel_manager(hotel_id))
  with check (private.is_hotel_manager(hotel_id));
