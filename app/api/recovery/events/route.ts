import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const EventSchema = z.object({
  eventId: z.string().uuid(),
  sessionId: z.string().uuid(),
  hotelId: z.string().uuid(),
  eventType: z.enum([
    'search',
    'room_view',
    'booking_start',
    'checkout_view',
    'abandon',
    'booking_confirmed',
  ]),
  stayStart: z.string().date().optional(),
  stayEnd: z.string().date().optional(),
  guests: z.number().int().min(1).max(20).optional(),
  roomTypeId: z.string().uuid().optional(),
  quotedTotalCents: z.number().int().min(0).max(1000000000).optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD']).optional(),
  abandonmentReason: z.enum([
    'price_shock',
    'date_availability',
    'policy_anxiety',
    'form_friction',
    'unknown',
  ]).optional(),
  contactEmail: z.string().email().max(254).optional(),
  contactConsent: z.boolean().default(false),
  occurredAt: z.string().datetime({ offset: true }).optional(),
}).strict().superRefine((event, ctx) => {
  if (event.stayStart && event.stayEnd && event.stayEnd <= event.stayStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['stayEnd'],
      message: 'Stay end must be after stay start',
    });
  }
  if (event.contactEmail && !event.contactConsent) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['contactEmail'],
      message: 'Contact details require explicit contact consent',
    });
  }
});

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ data: null, error: { code, message } }, { status });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON');
  }

  const parsed = EventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Recovery event payload is invalid',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    }, { status: 400 });
  }

  const event = parsed.data;
  const supabase = createServerSupabaseClient();

  const { data: membership, error: membershipError } = await supabase
    .from('hotel_members')
    .select('hotel_id')
    .eq('hotel_id', event.hotelId)
    .maybeSingle();

  if (membershipError) {
    return errorResponse(500, 'MEMBERSHIP_CHECK_FAILED', 'Could not verify hotel access');
  }
  if (!membership) {
    return errorResponse(403, 'HOTEL_ACCESS_REQUIRED', 'You do not have access to this hotel');
  }

  const { data, error } = await supabase
    .from('recovery_events')
    .upsert({
      hotel_id: event.hotelId,
      event_id: event.eventId,
      session_id: event.sessionId,
      event_type: event.eventType,
      stay_start: event.stayStart ?? null,
      stay_end: event.stayEnd ?? null,
      guests: event.guests ?? null,
      room_type_id: event.roomTypeId ?? null,
      quoted_total_cents: event.quotedTotalCents ?? null,
      currency: event.currency ?? null,
      abandonment_reason: event.abandonmentReason ?? null,
      contact_email: event.contactConsent ? (event.contactEmail ?? null) : null,
      contact_consent: event.contactConsent,
      occurred_at: event.occurredAt ?? new Date().toISOString(),
    }, { onConflict: 'hotel_id,event_id', ignoreDuplicates: true })
    .select('id,event_id,event_type,occurred_at')
    .maybeSingle();

  if (error) {
    return errorResponse(500, 'RECOVERY_EVENT_WRITE_FAILED', 'Could not record recovery event');
  }

  return NextResponse.json({
    data: data ?? { eventId: event.eventId, duplicate: true },
    error: null,
  }, { status: 202 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const hotelId = url.searchParams.get('hotelId');
  if (!hotelId || !z.string().uuid().safeParse(hotelId).success) {
    return errorResponse(400, 'HOTEL_ID_REQUIRED', 'A valid hotelId query parameter is required');
  }

  const supabase = createServerSupabaseClient();
  const { data: membership, error: membershipError } = await supabase
    .from('hotel_members')
    .select('hotel_id')
    .eq('hotel_id', hotelId)
    .maybeSingle();

  if (membershipError) {
    return errorResponse(500, 'MEMBERSHIP_CHECK_FAILED', 'Could not verify hotel access');
  }
  if (!membership) {
    return errorResponse(403, 'HOTEL_ACCESS_REQUIRED', 'You do not have access to this hotel');
  }

  const { data: events, error } = await supabase
    .from('recovery_events')
    .select('id,event_id,session_id,event_type,stay_start,stay_end,guests,room_type_id,quoted_total_cents,currency,abandonment_reason,contact_consent,occurred_at')
    .eq('hotel_id', hotelId)
    .order('occurred_at', { ascending: false })
    .limit(100);

  if (error) {
    return errorResponse(500, 'RECOVERY_EVENTS_READ_FAILED', 'Could not load recovery events');
  }

  const sessions = new Map<string, {
    sessionId: string;
    firstSeenAt: string;
    lastSeenAt: string;
    latestEvent: string;
    eventCount: number;
    stayStart: string | null;
    stayEnd: string | null;
    guests: number | null;
    quotedTotalCents: number | null;
    currency: string | null;
    abandonmentReason: string | null;
    contactConsent: boolean;
    isAbandoned: boolean;
    isConfirmed: boolean;
  }>();

  for (const event of events ?? []) {
    const existing = sessions.get(event.session_id);
    if (!existing) {
      sessions.set(event.session_id, {
        sessionId: event.session_id,
        firstSeenAt: event.occurred_at,
        lastSeenAt: event.occurred_at,
        latestEvent: event.event_type,
        eventCount: 1,
        stayStart: event.stay_start,
        stayEnd: event.stay_end,
        guests: event.guests,
        quotedTotalCents: event.quoted_total_cents === null ? null : Number(event.quoted_total_cents),
        currency: event.currency,
        abandonmentReason: event.abandonment_reason,
        contactConsent: event.contact_consent,
        isAbandoned: event.event_type === 'abandon',
        isConfirmed: event.event_type === 'booking_confirmed',
      });
      continue;
    }

    existing.eventCount += 1;
    if (event.occurred_at < existing.firstSeenAt) existing.firstSeenAt = event.occurred_at;
    if (event.occurred_at > existing.lastSeenAt) {
      existing.lastSeenAt = event.occurred_at;
      existing.latestEvent = event.event_type;
    }
    if (existing.stayStart === null && event.stay_start) existing.stayStart = event.stay_start;
    if (existing.stayEnd === null && event.stay_end) existing.stayEnd = event.stay_end;
    if (existing.guests === null && event.guests !== null) existing.guests = event.guests;
    if (existing.quotedTotalCents === null && event.quoted_total_cents !== null) {
      existing.quotedTotalCents = Number(event.quoted_total_cents);
    }
    if (existing.currency === null && event.currency) existing.currency = event.currency;
    if (existing.abandonmentReason === null && event.abandonment_reason) {
      existing.abandonmentReason = event.abandonment_reason;
    }
    // Consent is taken from the latest event only; an older opt-in must not override a later opt-out.
    existing.isAbandoned = existing.isAbandoned || event.event_type === 'abandon';
    existing.isConfirmed = existing.isConfirmed || event.event_type === 'booking_confirmed';
  }

  return NextResponse.json({
    data: Array.from(sessions.values()).sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt)),
    error: null,
  });
}
