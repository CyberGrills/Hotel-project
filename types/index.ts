export type UUID = string;

export type HotelCurrency = 'USD' | 'EUR' | 'GBP' | 'NGN' | 'CAD' | 'AUD';

export interface Hotel {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  currency: HotelCurrency;
  timezone: string;
  total_rooms: number;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  star_rating: number;
  created_at: string;
  updated_at: string;
}

export interface RoomType {
  id: UUID;
  hotel_id: UUID;
  name: string;
  code: string;
  description: string | null;
  base_capacity: number;
  max_capacity: number;
  total_inventory: number;
  base_rate_cents: number;
  created_at: string;
}

export interface RatePlan {
  id: UUID;
  room_type_id: UUID;
  hotel_id: UUID;
  name: string;
  code: string;
  description: string | null;
  rate_cents: number;
  refundable: boolean;
  breakfast_included: boolean;
  min_length_of_stay: number;
  created_at: string;
}

export interface Channel {
  id: UUID;
  hotel_id: UUID;
  name: string;
  type: string;
  commission_rate_basis_points: number;
  is_direct: boolean;
  created_at: string;
}

export interface Inventory {
  id: UUID;
  hotel_id: UUID;
  room_type_id: UUID;
  business_date: string;
  total_rooms: number;
  sold_rooms: number;
  held_rooms: number;
  available_rooms: number;
  rate_cents: number;
  created_at: string;
}

export type ReservationStatus = 'CONFIRMED' | 'CANCELLED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'NO_SHOW';

export interface Reservation {
  id: UUID;
  hotel_id: UUID;
  room_type_id: UUID;
  rate_plan_id: UUID | null;
  channel_id: UUID | null;
  guest_name: string | null;
  guest_email: string | null;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  rate_per_night_cents: number;
  total_amount_cents: number;
  commission_cents: number;
  status: ReservationStatus;
  booked_at: string;
  cancelled_at: string | null;
  created_at: string;
}

export interface DemandSignal {
  id: UUID;
  hotel_id: UUID;
  business_date: string;
  search_volume: number;
  competitor_min_rate_cents: number;
  competitor_max_rate_cents: number;
  competitor_avg_rate_cents: number;
  event_name: string | null;
  event_impact_score: number;
  seasonal_index: number;
  notes: string | null;
  created_at: string;
}

export interface Forecast {
  id: UUID;
  hotel_id: UUID;
  business_date: string;
  expected_occupancy_pct: number;
  expected_adr_cents: number;
  confidence_pct: number;
  primary_cause: string | null;
  recommended_response: string | null;
  created_at: string;
}

export type OpportunityType =
  | 'UNSOLD_INVENTORY'
  | 'ABANDONED_BOOKING'
  | 'WEAK_BOOKING_PACE'
  | 'RATE_OPTIMIZATION'
  | 'GROUP_INQUIRY'
  | 'UPGRADE_OPPORTUNITY'
  | 'CHANNEL_COST_OPTIMIZATION'
  | 'WEEKEND_DEMAND'
  | 'EXTENDED_STAY'
  | 'CORPORATE_OPPORTUNITY';

export type OpportunitySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type OpportunityStatus = 'OPEN' | 'ACTED_ON' | 'RESOLVED' | 'EXPIRED' | 'DISMISSED';

export interface EvidenceItem {
  label: string;
  detail: string;
}

export interface Opportunity {
  id: UUID;
  hotel_id: UUID;
  type: OpportunityType;
  severity: OpportunitySeverity;
  reason: string;
  room_type_id: UUID | null;
  business_date: string | null;
  rooms_affected: number;
  expected_value_cents: number;
  estimated_cost_cents: number;
  confidence_pct: number;
  recommended_action: string;
  status: OpportunityStatus;
  evidence: EvidenceItem[];
  assumptions: string[];
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ActionType =
  | 'CREATE_OFFER'
  | 'CHANGE_RATE'
  | 'TARGET_SEGMENT'
  | 'RUN_CAMPAIGN'
  | 'RECOVER_BOOKING'
  | 'CONTACT_LEAD'
  | 'FOLLOW_UP_GROUP'
  | 'OFFER_UPGRADE'
  | 'OFFER_PACKAGE'
  | 'SHIFT_CHANNEL'
  | 'PROTECT_RATE'
  | 'INCREASE_RATE'
  | 'RESTRICT_DISCOUNT'
  | 'REQUEST_HUMAN_APPROVAL'
  | 'DO_NOTHING';

export type RecommendationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED';

export interface Recommendation {
  id: UUID;
  opportunity_id: UUID;
  hotel_id: UUID;
  action_type: ActionType;
  reason: string;
  expected_incremental_revenue_cents: number;
  estimated_acquisition_cost_cents: number;
  expected_channel: string | null;
  expected_room_nights: number;
  confidence_pct: number;
  assumptions: string[];
  status: RecommendationStatus;
  created_at: string;
}

export type ActionStatus = 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'SIMULATED';

export interface ActionRecord {
  id: UUID;
  opportunity_id: UUID;
  hotel_id: UUID;
  recommendation_id: UUID | null;
  action_type: ActionType;
  parameters: Record<string, unknown>;
  status: ActionStatus;
  executed_at: string | null;
  created_at: string;
}

export type OutcomeStatus = 'PENDING' | 'SUCCESS' | 'PARTIAL' | 'NO_IMPACT' | 'FAILURE';

export interface ActionOutcome {
  id: UUID;
  action_id: UUID;
  hotel_id: UUID;
  rooms_sold: number;
  gross_revenue_cents: number;
  acquisition_cost_cents: number;
  channel_commission_cents: number;
  discount_cost_cents: number;
  cancellation_loss_cents: number;
  net_incremental_revenue_cents: number;
  outcome: OutcomeStatus;
  notes: string | null;
  measured_at: string;
  created_at: string;
}

export interface DashboardData {
  hotel: Hotel;
  todayOccupancy: number;
  expectedOccupancy: number;
  roomsAtRisk: number;
  totalRooms: number;
  soldRooms: number;
  availableRooms: number;
  adr: number;
  revenueToday: number;
  opportunities: OpportunitySummary[];
  occupancyTrend: OccupancyTrendPoint[];
  bookingPace: BookingPacePoint[];
  channelBreakdown: ChannelBreakdownItem[];
  priorityMessage: string;
  potentialRevenue: number;
}

export interface OpportunitySummary {
  id: UUID;
  type: OpportunityType;
  severity: OpportunitySeverity;
  reason: string;
  rooms_affected: number;
  expected_value_cents: number;
  confidence_pct: number;
  recommended_action: string;
  status: OpportunityStatus;
  business_date: string | null;
  expires_at: string | null;
}

export interface OccupancyTrendPoint {
  date: string;
  occupancy: number;
  expectedOccupancy: number;
}

export interface BookingPacePoint {
  date: string;
  cumulativeBookings: number;
  expectedPace: number;
}

export interface ChannelBreakdownItem {
  channel: string;
  reservations: number;
  revenue: number;
  commission: number;
  isDirect: boolean;
}

export interface OpportunityDetail extends Opportunity {
  hotel: Hotel;
  room_type: RoomType | null;
  recommendation: Recommendation | null;
  action: ActionRecord | null;
  outcome: ActionOutcome | null;
}
