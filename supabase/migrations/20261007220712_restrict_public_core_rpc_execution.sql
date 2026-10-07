revoke execute on function public.create_schwa_wallet() from anon, authenticated;
revoke execute on function public.credit_schwa_wallet(uuid, numeric, text) from anon, authenticated;
revoke execute on function public.credit_verified_listening(uuid, text, text, text, text, numeric, numeric, numeric) from anon, authenticated;
revoke execute on function public.rls_auto_enable() from anon, authenticated;
