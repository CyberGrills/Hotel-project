-- Revenue recovery event ledger for the first-party hotel booking funnel.
-- Events are tenant-scoped and only visible to authenticated hotel members.
create table if not exists public.recovery_events (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  event_id uuid not null,
  session_id uuid not null,
  event_type text not null check (
    event_type in ('search', 'room_view', 'booking_start', 'checkout_view', 'abandon', 'booking_confirmed')
  ),
  stay_start date,
  stay_end date,
  guests integer check (guests is null or guests between 1 and 20),
  room_type_id uuid references public.room_types(id) on delete set null,
  quoted_total_cents bigint check (quoted_total_cents is null or quoted_total_cents >= 0),
  currency text check (currency is null or currency in ('USD','EUR','GBP','NGN','CAD','AUD')),
  abandonment_reason text check (
    abandonment_reason is null or abandonment_reason in ('price_shock','date_availability','policy_anxiety','form_friction','unknown')
  ),
  contact_email text,
  contact_consent boolean not null default false,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (hotel_id, event_id),
  check (stay_end is null or stay_start is null or stay_end > stay_start),
  check (contact_consent or contact_email is null),
  check (contact_email is null or length(contact_email) <= 254)
);

create index if not exists idx_recovery_events_hotel_occurred
  on public.recovery_events (hotel_id, occurred_at desc);
create index if not exists idx_recovery_events_hotel_session
  on public.recovery_events (hotel_id, session_id, occurred_at desc);
create index if not exists idx_recovery_events_hotel_type
  on public.recovery_events (hotel_id, event_type, occurred_at desc);

alter table public.recovery_events enable row level security;
revoke all on table public.recovery_events from anon, authenticated;
grant select, insert on table public.recovery_events to authenticated;

drop policy if exists "hotel members can read recovery events" on public.recovery_events;
create policy "hotel members can read recovery events"
  on public.recovery_events for select to authenticated
  using (
    exists (
      select 1 from public.hotel_members hm
      where hm.hotel_id = recovery_events.hotel_id
        and hm.user_id = (select auth.uid())
    )
  );

drop policy if exists "hotel members can insert recovery events" on public.recovery_events;
create policy "hotel members can insert recovery events"
  on public.recovery_events for insert to authenticated
  with check (
    exists (
      select 1 from public.hotel_members hm
      where hm.hotel_id = recovery_events.hotel_id
        and hm.user_id = (select auth.uid())
    )
  );
