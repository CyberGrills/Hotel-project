'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Apple } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

type OAuthProvider = 'google' | 'apple';

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.98 46.98 31.86 46.98 24.55Z" />
      <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.45-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/';
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'auth_callback'
      ? 'Sign-in could not be completed. Please try again.'
      : null,
  );

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    supabase.auth.getClaims().then(({ data }) => {
      if (data?.claims) {
        router.replace(nextPath);
      } else {
        setChecking(false);
      }
    }).catch(() => setChecking(false));
  }, [nextPath, router]);

  async function handleOAuth(provider: OAuthProvider) {
    setError(null);
    setLoadingProvider(provider);

    try {
      const supabase = createBrowserSupabaseClient();
      const callback = new URL('/auth/callback', window.location.origin);
      callback.searchParams.set('next', nextPath);

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callback.toString() },
      });

      if (oauthError) {
        setError(oauthError.message);
        setLoadingProvider(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start sign-in.');
      setLoadingProvider(null);
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen grid place-items-center bg-slate-50 px-6">
        <p className="text-sm text-muted-foreground">Checking session…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 px-6 py-10">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">7even · āprən</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Sign in to your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Continue securely with Google or Apple.
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={loadingProvider !== null}
            className="flex w-full items-center justify-center gap-3 rounded-lg border bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleMark />
            {loadingProvider === 'google' ? 'Connecting to Google…' : 'Continue with Google'}
          </button>
          <button
            type="button"
            onClick={() => handleOAuth('apple')}
            disabled={loadingProvider !== null}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Apple aria-hidden="true" className="h-5 w-5" />
            {loadingProvider === 'apple' ? 'Connecting to Apple…' : 'Continue with Apple'}
          </button>
        </div>

        {error && (
          <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <p className="mt-6 border-t pt-5 text-center text-sm text-muted-foreground">
          New to 7even?{' '}
          <Link href="/signup" className="font-medium text-slate-900 hover:underline">
            Create an account
          </Link>
        </p>
        <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
          Hotel dashboard access still requires an owner or manager to grant your account access.
        </p>
      </div>
    </main>
  );
}
