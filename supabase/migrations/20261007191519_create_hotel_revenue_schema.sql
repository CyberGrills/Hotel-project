/*
# āprən Hotel Seller — Core Schema

## Purpose
Creates the foundational database tables for a hotel revenue intelligence platform.
The schema supports the commercial intelligence loop: hotel data → demand analysis →
opportunity identification → recommendation → action → outcome measurement.

## New Tables

1. **hotels** — Hotel properties with currency, timezone, and physical characteristics
2. **room_types** — Room categories per hotel (e.g. Standard King, Deluxe Suite)
3. **rate_plans** — Pricing plans per room type (e.g. Flexible, Non-Refundable, Corporate)
4. **channels** — Distribution channels (Direct, Booking.com, Expedia, etc.)
5. **inventory** — Daily inventory per hotel/room type: total rooms, sold, held, available
6. **reservations** — Individual bookings with channel, rate, status, dates
7. **demand_signals** — Daily demand indicators (search volume, competitor rates, events)
8. **forecasts** — Daily demand forecasts (expected occupancy, confidence, primary cause)
9. **opportunities** — Commercial opportunities generated from data analysis
10. **recommendations** — Recommended actions tied to opportunities
11. **actions** — Executed/simulated actions with parameters and status
12. **action_outcomes** — Measured outcomes of actions (revenue, cost, incremental revenue)

## Money Handling
All monetary values stored as integer minor units (cents) with a currency column.
$125.50 → amount: 12550, currency: 'USD'

## Security
- RLS enabled on all tables
- Single-tenant demo mode: all tables accessible to anon + authenticated (no auth screen yet)
- Architecture allows future addition of hotel_id-scoped ownership policies
*/

-- ============================================================
-- 1. HOTELS
-- ============================================================
CREATE TABLE IF NOT EXISTS hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  currency text NOT NULL DEFAULT 'USD',
  timezone text NOT NULL DEFAULT 'America/New_York',
  total_rooms integer NOT NULL DEFAULT 0,
  address text,
  city text,
  country text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  star_rating integer DEFAULT 4,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. ROOM TYPES
-- ============================================================
CREATE TABLE IF NOT EXISTS room_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  base_capacity integer NOT NULL DEFAULT 2,
  max_capacity integer NOT NULL DEFAULT 2,
  total_inventory integer NOT NULL DEFAULT 0,
  base_rate_cents integer NOT NULL DEFAULT 0,
  UNIQUE(hotel_id, code),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. RATE PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS rate_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id uuid NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  rate_cents integer NOT NULL DEFAULT 0,
  refundable boolean NOT NULL DEFAULT true,
  breakfast_included boolean NOT NULL DEFAULT false,
  min_length_of_stay integer NOT NULL DEFAULT 1,
  UNIQUE(hotel_id, code),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. CHANNELS
-- ============================================================
CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  commission_rate_basis_points integer NOT NULL DEFAULT 0,
  is_direct boolean NOT NULL DEFAULT false,
  UNIQUE(hotel_id, name),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. INVENTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id uuid NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  business_date date NOT NULL,
  total_rooms integer NOT NULL DEFAULT 0,
  sold_rooms integer NOT NULL DEFAULT 0,
  held_rooms integer NOT NULL DEFAULT 0,
  available_rooms integer NOT NULL DEFAULT 0,
  rate_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, room_type_id, business_date)
);

-- ============================================================
-- 6. RESERVATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id uuid NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  rate_plan_id uuid REFERENCES rate_plans(id) ON DELETE SET NULL,
  channel_id uuid REFERENCES channels(id) ON DELETE SET NULL,
  guest_name text,
  guest_email text,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  nights integer NOT NULL,
  rate_per_night_cents integer NOT NULL DEFAULT 0,
  total_amount_cents integer NOT NULL DEFAULT 0,
  commission_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'CONFIRMED',
  booked_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. DEMAND SIGNALS
-- ============================================================
CREATE TABLE IF NOT EXISTS demand_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  business_date date NOT NULL,
  search_volume integer DEFAULT 0,
  competitor_min_rate_cents integer DEFAULT 0,
  competitor_max_rate_cents integer DEFAULT 0,
  competitor_avg_rate_cents integer DEFAULT 0,
  event_name text,
  event_impact_score numeric(3,2) DEFAULT 0,
  seasonal_index numeric(3,2) DEFAULT 1.0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, business_date)
);

-- ============================================================
-- 8. FORECASTS
-- ============================================================
CREATE TABLE IF NOT EXISTS forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  business_date date NOT NULL,
  expected_occupancy_pct numeric(5,2) NOT NULL DEFAULT 0,
  expected_adr_cents integer NOT NULL DEFAULT 0,
  confidence_pct numeric(5,2) NOT NULL DEFAULT 0,
  primary_cause text,
  recommended_response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, business_date)
);

-- ============================================================
-- 9. OPPORTUNITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  type text NOT NULL,
  severity text NOT NULL DEFAULT 'MEDIUM',
  reason text NOT NULL,
  room_type_id uuid REFERENCES room_types(id) ON DELETE SET NULL,
  business_date date,
  rooms_affected integer DEFAULT 0,
  expected_value_cents integer NOT NULL DEFAULT 0,
  estimated_cost_cents integer NOT NULL DEFAULT 0,
  confidence_pct numeric(5,2) NOT NULL DEFAULT 0,
  recommended_action text NOT NULL,
  status text NOT NULL DEFAULT 'OPEN',
  evidence jsonb DEFAULT '[]'::jsonb,
  assumptions jsonb DEFAULT '[]'::jsonb,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. RECOMMENDATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS hotel_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  reason text NOT NULL,
  expected_incremental_revenue_cents integer NOT NULL DEFAULT 0,
  estimated_acquisition_cost_cents integer NOT NULL DEFAULT 0,
  expected_channel text,
  expected_room_nights integer DEFAULT 0,
  confidence_pct numeric(5,2) NOT NULL DEFAULT 0,
  assumptions jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. ACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  recommendation_id uuid REFERENCES hotel_recommendations(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'PENDING',
  executed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 12. ACTION OUTCOMES
-- ============================================================
CREATE TABLE IF NOT EXISTS action_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  rooms_sold integer NOT NULL DEFAULT 0,
  gross_revenue_cents integer NOT NULL DEFAULT 0,
  acquisition_cost_cents integer NOT NULL DEFAULT 0,
  channel_commission_cents integer NOT NULL DEFAULT 0,
  discount_cost_cents integer NOT NULL DEFAULT 0,
  cancellation_loss_cents integer NOT NULL DEFAULT 0,
  net_incremental_revenue_cents integer NOT NULL DEFAULT 0,
  outcome text NOT NULL DEFAULT 'PENDING',
  notes text,
  measured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_room_types_hotel ON room_types(hotel_id);
CREATE INDEX IF NOT EXISTS idx_rate_plans_hotel ON rate_plans(hotel_id);
CREATE INDEX IF NOT EXISTS idx_rate_plans_room_type ON rate_plans(room_type_id);
CREATE INDEX IF NOT EXISTS idx_channels_hotel ON channels(hotel_id);
CREATE INDEX IF NOT EXISTS idx_inventory_hotel_date ON inventory(hotel_id, business_date);
CREATE INDEX IF NOT EXISTS idx_inventory_room_type_date ON inventory(room_type_id, business_date);
CREATE INDEX IF NOT EXISTS idx_reservations_hotel ON reservations(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reservations_hotel_dates ON reservations(hotel_id, check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_demand_signals_hotel_date ON demand_signals(hotel_id, business_date);
CREATE INDEX IF NOT EXISTS idx_forecasts_hotel_date ON forecasts(hotel_id, business_date);
CREATE INDEX IF NOT EXISTS idx_opportunities_hotel ON opportunities(hotel_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_hotel_status ON opportunities(hotel_id, status);
CREATE INDEX IF NOT EXISTS idx_hotel_recommendations_opportunity ON hotel_recommendations(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_actions_opportunity ON actions(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_action_outcomes_action ON action_outcomes(action_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_outcomes ENABLE ROW LEVEL SECURITY;

-- Single-tenant demo: anon + authenticated can CRUD all tables.
-- Architecture allows future addition of hotel-scoped ownership policies.

-- Hotels
DROP POLICY IF EXISTS "anon_read_hotels" ON hotels;
CREATE POLICY "anon_read_hotels" ON hotels FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_hotels" ON hotels;
CREATE POLICY "anon_write_hotels" ON hotels FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_hotels" ON hotels;
CREATE POLICY "anon_update_hotels" ON hotels FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Room types
DROP POLICY IF EXISTS "anon_read_room_types" ON room_types;
CREATE POLICY "anon_read_room_types" ON room_types FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_room_types" ON room_types;
CREATE POLICY "anon_write_room_types" ON room_types FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_room_types" ON room_types;
CREATE POLICY "anon_update_room_types" ON room_types FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Rate plans
DROP POLICY IF EXISTS "anon_read_rate_plans" ON rate_plans;
CREATE POLICY "anon_read_rate_plans" ON rate_plans FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_rate_plans" ON rate_plans;
CREATE POLICY "anon_write_rate_plans" ON rate_plans FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_rate_plans" ON rate_plans;
CREATE POLICY "anon_update_rate_plans" ON rate_plans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Channels
DROP POLICY IF EXISTS "anon_read_channels" ON channels;
CREATE POLICY "anon_read_channels" ON channels FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_channels" ON channels;
CREATE POLICY "anon_write_channels" ON channels FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_channels" ON channels;
CREATE POLICY "anon_update_channels" ON channels FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Inventory
DROP POLICY IF EXISTS "anon_read_inventory" ON inventory;
CREATE POLICY "anon_read_inventory" ON inventory FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_inventory" ON inventory;
CREATE POLICY "anon_write_inventory" ON inventory FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_inventory" ON inventory;
CREATE POLICY "anon_update_inventory" ON inventory FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Reservations
DROP POLICY IF EXISTS "anon_read_reservations" ON reservations;
CREATE POLICY "anon_read_reservations" ON reservations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_reservations" ON reservations;
CREATE POLICY "anon_write_reservations" ON reservations FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_reservations" ON reservations;
CREATE POLICY "anon_update_reservations" ON reservations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Demand signals
DROP POLICY IF EXISTS "anon_read_demand_signals" ON demand_signals;
CREATE POLICY "anon_read_demand_signals" ON demand_signals FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_demand_signals" ON demand_signals;
CREATE POLICY "anon_write_demand_signals" ON demand_signals FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_demand_signals" ON demand_signals;
CREATE POLICY "anon_update_demand_signals" ON demand_signals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Forecasts
DROP POLICY IF EXISTS "anon_read_forecasts" ON forecasts;
CREATE POLICY "anon_read_forecasts" ON forecasts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_forecasts" ON forecasts;
CREATE POLICY "anon_write_forecasts" ON forecasts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_forecasts" ON forecasts;
CREATE POLICY "anon_update_forecasts" ON forecasts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Opportunities
DROP POLICY IF EXISTS "anon_read_opportunities" ON opportunities;
CREATE POLICY "anon_read_opportunities" ON opportunities FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_opportunities" ON opportunities;
CREATE POLICY "anon_write_opportunities" ON opportunities FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_opportunities" ON opportunities;
CREATE POLICY "anon_update_opportunities" ON opportunities FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Recommendations
DROP POLICY IF EXISTS "anon_read_recommendations" ON hotel_recommendations;
CREATE POLICY "anon_read_recommendations" ON hotel_recommendations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_recommendations" ON hotel_recommendations;
CREATE POLICY "anon_write_recommendations" ON hotel_recommendations FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_recommendations" ON hotel_recommendations;
CREATE POLICY "anon_update_recommendations" ON hotel_recommendations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Actions
DROP POLICY IF EXISTS "anon_read_actions" ON actions;
CREATE POLICY "anon_read_actions" ON actions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_actions" ON actions;
CREATE POLICY "anon_write_actions" ON actions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_actions" ON actions;
CREATE POLICY "anon_update_actions" ON actions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Action outcomes
DROP POLICY IF EXISTS "anon_read_action_outcomes" ON action_outcomes;
CREATE POLICY "anon_read_action_outcomes" ON action_outcomes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_action_outcomes" ON action_outcomes;
CREATE POLICY "anon_write_action_outcomes" ON action_outcomes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_action_outcomes" ON action_outcomes;
CREATE POLICY "anon_update_action_outcomes" ON action_outcomes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);