do $$
declare
  r record;
  keep text[];
begin
  for r in
    select tablename, policyname
    from pg_policies
    where schemaname='public'
      and tablename in (
        'hotels','room_types','rate_plans','channels','inventory',
        'reservations','demand_signals','forecasts','opportunities',
        'hotel_recommendations','actions','action_outcomes'
      )
  loop
    keep := case r.tablename
      when 'hotels' then array['hotel members can read','hotel managers can update']
      when 'room_types' then array['hotel members can read','hotel managers can insert','hotel managers can update']
      when 'rate_plans' then array['hotel members can read','hotel managers can insert','hotel managers can update']
      when 'channels' then array['hotel members can read','hotel managers can insert','hotel managers can update']
      when 'inventory' then array['hotel members can read','hotel managers can insert','hotel managers can update']
      when 'reservations' then array['hotel members can read','hotel managers can insert','hotel managers can update']
      when 'demand_signals' then array['hotel members can read','hotel managers can insert','hotel managers can update']
      when 'forecasts' then array['hotel members can read','hotel managers can insert','hotel managers can update']
      when 'opportunities' then array['hotel members can read','hotel managers can insert','hotel managers can update']
      when 'hotel_recommendations' then array['hotel members can read','hotel managers can insert','hotel managers can update']
      when 'actions' then array['hotel members can read','hotel managers can insert','hotel managers can update']
      when 'action_outcomes' then array['hotel members can read','hotel managers can insert','hotel managers can update']
      else array[]::text[]
    end;

    if not (r.policyname = any(keep)) then
      execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
    end if;
  end loop;
end $$;
