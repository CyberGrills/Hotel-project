'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    supabase.auth.getClaims().then(({ data }) => {
      if (data?.claims) {
        router.replace('/');
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session) {
        router.replace('/');
        router.refresh();
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    } finally {
      setLoading(false);
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
    <main className="min-h-screen grid place-items-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">āprən Hotels</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Create your Revenue Intelligence account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create an account to access āprən Hotel Revenue Intelligence.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-password" className="text-sm font-medium">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Account created. Check your email to confirm your address, then sign in.
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 space-y-3 border-t pt-5 text-center text-sm">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-slate-900 hover:underline">
              Sign in
            </Link>
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            Creating an account does not automatically grant access to a hotel property.
            Hotel membership is still required.
          </p>
        </div>
      </div>
    </main>
  );
}
