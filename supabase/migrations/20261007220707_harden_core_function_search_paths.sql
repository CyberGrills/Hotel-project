alter function public.create_schwa_wallet()
  set search_path = public, pg_temp;

alter function public.credit_schwa_wallet(uuid, numeric, text)
  set search_path = public, pg_temp;

alter function public.credit_verified_listening(uuid, text, text, text, text, numeric, numeric, numeric)
  set search_path = public, pg_temp;

alter function public.get_trust_summary(uuid)
  set search_path = public, pg_temp;
