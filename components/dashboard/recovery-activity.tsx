'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clipboard, Mail, RefreshCw } from 'lucide-react';
import { formatCents } from '@/lib/money';
import type { HotelCurrency } from '@/types';

type RecoverySession = {
  sessionId: string;
  firstSeenAt: string;
  lastSeenAt: string;
  latestEvent: string;
  eventCount: number;
  stayStart: string | null;
  stayEnd: string | null;
  guests: number | null;
  quotedTotalCents: number | null;
  currency: HotelCurrency | null;
  abandonmentReason: string | null;
  contactConsent: boolean;
  isAbandoned: boolean;
  isConfirmed: boolean;
};

type Props = { hotelId: string; currency: HotelCurrency };

function createDraft(session: RecoverySession) {
  const dates = session.stayStart && session.stayEnd
    ? ` for ${session.stayStart} to ${session.stayEnd}`
    : '';
  const total = session.quotedTotalCents !== null
    ? ` The last quoted total was ${formatCents(session.quotedTotalCents, session.currency || 'USD')}.`
    : '';

  const opener = 'Hello, thanks for considering our hotel.';
  const body = session.abandonmentReason === 'price_shock'
    ? ' If the total was higher than expected, our team can check a lower room category or flexible dates before discussing any discount.'
    : session.abandonmentReason === 'date_availability'
      ? ' If your dates were not convenient, our team can check nearby dates and available room options.'
      : session.abandonmentReason === 'policy_anxiety'
        ? ' If you had questions about the booking or cancellation terms, our team can clarify the policy before you decide.'
        : session.abandonmentReason === 'form_friction'
          ? ' If the booking form gave you trouble, our team can help you complete the reservation securely.'
          : ' If you still need help with your stay, our team can check the available options and answer any questions.';
  return `${opener}${dates}.${total}${body} Reply if you would like assistance. There is no obligation to book.`;
}

export function RecoveryActivity({ hotelId, currency }: Props) {
  const [sessions, setSessions] = useState<RecoverySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftSessionId, setDraftSessionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/recovery/events?hotelId=${encodeURIComponent(hotelId)}`, { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok || json.error) {
        throw new Error(json.error?.message || 'Could not load recovery activity');
      }
      setSessions(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load recovery activity');
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => { void load(); }, [load]);

  const draftSession = sessions.find((session) => session.sessionId === draftSessionId) || null;
  const draft = draftSession ? createDraft(draftSession) : '';

  async function copyDraft() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
    } catch {
      setCopied(false);
      setError('Clipboard access was blocked. Select and copy the draft manually.');
    }
  }

  const abandoned = sessions.filter((session) => session.isAbandoned && !session.isConfirmed);
  const confirmed = sessions.filter((session) => session.isConfirmed);

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold">Revenue Recovery Activity</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            First-party booking funnel sessions. Drafts require recorded consent and must be reviewed before sending.
          </p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} aria-label="Refresh recovery activity" className="rounded-lg border p-2 text-muted-foreground hover:bg-muted disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">Abandoned</p>
          <p className="mt-1 text-xl font-semibold">{abandoned.length}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">Consent recorded</p>
          <p className="mt-1 text-xl font-semibold">{abandoned.filter((s) => s.contactConsent).length}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">Confirmed sessions</p>
          <p className="mt-1 text-xl font-semibold">{confirmed.length}</p>
        </div>
      </div>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading ? (
        <p className="py-4 text-sm text-muted-foreground">Loading recovery events…</p>
      ) : sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-5 text-center">
          <AlertCircle className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">No booking-funnel events yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Connect a consent-aware event source or send test events to the recovery API to begin collecting sessions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.slice(0, 8).map((session) => (
            <div key={session.sessionId} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {session.isConfirmed ? 'Booking confirmed' : session.isAbandoned ? 'Abandoned booking session' : session.latestEvent.replaceAll('_', ' ')}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {session.stayStart && session.stayEnd ? `${session.stayStart} → ${session.stayEnd} · ` : ''}
                    {session.guests ? `${session.guests} guest(s) · ` : ''}
                    {session.quotedTotalCents !== null ? formatCents(session.quotedTotalCents, session.currency || currency) : 'No quote recorded'}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(session.lastSeenAt).toLocaleString()}</span>
              </div>
              {session.isAbandoned && !session.isConfirmed && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {session.contactConsent ? 'Contact consent recorded' : 'No contact consent — do not contact'}
                    {session.abandonmentReason ? ` · ${session.abandonmentReason.replaceAll('_', ' ')}` : ''}
                  </p>
                  <button
                    type="button"
                    disabled={!session.contactConsent}
                    onClick={() => { setDraftSessionId(session.sessionId); setCopied(false); }}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Draft recovery message
                  </button>
                </div>
              )}
              {session.isConfirmed && <p className="mt-2 flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Confirmation event recorded; revenue attribution still requires booking-system reconciliation.</p>}
            </div>
          ))}
        </div>
      )}

      {draftSession && draft && (
        <div className="rounded-lg border border-slate-300 bg-slate-50 p-4 text-slate-900">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Recovery draft · manager review required</p>
            <button type="button" onClick={() => { setDraftSessionId(null); setCopied(false); }} className="text-xs text-slate-600 underline">Close</button>
          </div>
          <p className="mt-2 text-sm leading-6">{draft}</p>
          <div className="mt-3 flex items-center gap-3">
            <button type="button" onClick={() => void copyDraft()} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800">
              <Clipboard className="h-3.5 w-3.5" /> {copied ? 'Copied' : 'Copy draft'}
            </button>
            <span className="text-xs text-slate-600">Not sent automatically. Verify consent and availability before use.</span>
          </div>
        </div>
      )}
    </section>
  );
}
