# Revenue Recovery Agent: first-party event contract

This first increment adds a tenant-scoped event ledger and authenticated API. It intentionally does not send guest messages or claim recovered revenue.

## Event endpoint

`POST /api/recovery/events` records one event for a hotel the signed-in user belongs to. `GET /api/recovery/events?hotelId=<uuid>` returns up to 100 recent session summaries for that hotel.

Required fields: `eventId` (UUID unique per event), `sessionId` (UUID stable for one booking session), `hotelId`, and `eventType`.

Supported events: `search`, `room_view`, `booking_start`, `checkout_view`, `abandon`, `booking_confirmed`.

Optional attributes: stay dates, guest count, room type ID, quoted total in minor currency units, currency, abandonment reason, event timestamp.

Contact data is deliberately restricted: an email may be recorded only when `contactConsent: true` is explicitly supplied. Do not pass payment-card data, authentication secrets, or unnecessary guest profile fields.

## Current limitations

- This authenticated endpoint is for admin QA and controlled first-party integration tests. It is not a public hotel-website collector yet; public ingestion needs a per-property write-only token, origin controls, rate limiting, and abuse monitoring.
- Event collection does not itself send WhatsApp/email. The next increment should turn consented abandoned sessions into manager-approved drafts, then connect a provider only after hotel authorization.
- Do not count an abandon event as recovered revenue. Count only a confirmed reservation attributable to an approved recovery action and deduct channel costs, discount, and cancellation loss.
- Session summaries are operational signals, not proof that a guest can legally or technically be contacted.

## QA sequence

1. Sign in as a hotel member.
2. POST a `search`, `room_view`, `booking_start`, `checkout_view`, and `abandon` event with one stable session ID and unique event IDs.
3. GET the event summaries for that hotel and verify one abandoned session appears.
4. Repeat an event ID and verify the endpoint responds idempotently.
5. Repeat using a hotel the user does not belong to; expect HTTP 403.
6. Send `contactEmail` without `contactConsent: true`; expect HTTP 400.
7. Record `booking_confirmed` after recovery and verify the session is marked confirmed.
