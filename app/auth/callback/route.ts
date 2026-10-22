import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function safeNextPath(value: string | null, origin: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return new URL('/', origin);
  }

  try {
    const target = new URL(value, origin);
    return target.origin === origin ? target : new URL('/', origin);
  } catch {
    return new URL('/', origin);
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeNextPath(url.searchParams.get('next'), url.origin);

  if (code) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(next);
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_callback', url.origin));
}
