alter table public.audit_logs enable row level security;
alter table public.campaign_participants enable row level security;
alter table public.campaigns enable row level security;
alter table public.fraud_scores enable row level security;
alter table public.merchants enable row level security;
alter table public.provider_links enable row level security;
alter table public.redemptions enable row level security;
alter table public.reward_config enable row level security;

revoke all on table
  public.audit_logs,
  public.campaign_participants,
  public.campaigns,
  public.fraud_scores,
  public.merchants,
  public.provider_links,
  public.redemptions,
  public.reward_config
from anon, authenticated;

drop policy if exists "deny public api access" on public.audit_logs;
create policy "deny public api access"
  on public.audit_logs
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists "deny public api access" on public.campaign_participants;
create policy "deny public api access"
  on public.campaign_participants
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists "deny public api access" on public.campaigns;
create policy "deny public api access"
  on public.campaigns
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists "deny public api access" on public.fraud_scores;
create policy "deny public api access"
  on public.fraud_scores
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists "deny public api access" on public.merchants;
create policy "deny public api access"
  on public.merchants
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists "deny public api access" on public.provider_links;
create policy "deny public api access"
  on public.provider_links
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists "deny public api access" on public.redemptions;
create policy "deny public api access"
  on public.redemptions
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists "deny public api access" on public.reward_config;
create policy "deny public api access"
  on public.reward_config
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);
