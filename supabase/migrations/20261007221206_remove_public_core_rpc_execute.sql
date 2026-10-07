revoke execute on function public.create_schwa_wallet() from public, anon, authenticated;
revoke execute on function public.credit_schwa_wallet(uuid, numeric, text) from public, anon, authenticated;
revoke execute on function public.credit_verified_listening(uuid, text, text, text, text, numeric, numeric, numeric) from public, anon, authenticated;
revoke execute on function public.get_trust_summary(uuid) from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
