import { supabase } from '@/lib/supabase';
import type {
  Hotel,
  RoomType,
  Inventory,
  Reservation,
  Forecast,
  DemandSignal,
  Opportunity,
  Recommendation,
  ActionRecord,
  ActionOutcome,
  EvidenceItem,
  OpportunityType,
  OpportunitySeverity,
  OpportunityStatus,
} from '@/types';
import {
  calculateOccupancy,
  calculateInventoryRisk,
  calculateExpectedOccupancy,
  calculateBookingPace,
  calculateOpportunityValue,
} from '@/lib/calculations';
import { generateRecommendation } from '@/lib/recommendations';

export const DEMO_HOTEL_ID = 'a0000000-0000-0000-0000-000000000001';

export async function getHotel(hotelId: string = DEMO_HOTEL_ID): Promise<Hotel | null> {
  const { data, error } = await supabase
    .from('hotels')
    .select('*')
    .eq('id', hotelId)
    .maybeSingle();
  if (error) throw error;
  return data as Hotel | null;
}

export async function getRoomTypes(hotelId: string = DEMO_HOTEL_ID): Promise<RoomType[]> {
  const { data, error } = await supabase
    .from('room_types')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('base_rate_cents', { ascending: true });
  if (error) throw error;
  return (data || []) as RoomType[];
}

export async function getInventoryForDate(
  hotelId: string,
  date: string,
): Promise<Inventory[]> {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('business_date', date);
  if (error) throw error;
  return (data || []) as Inventory[];
}

export async function getInventoryRange(
  hotelId: string,
  startDate: string,
  endDate: string,
): Promise<Inventory[]> {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('hotel_id', hotelId)
    .gte('business_date', startDate)
    .lte('business_date', endDate)
    .order('business_date', { ascending: true });
  if (error) throw error;
  return (data || []) as Inventory[];
}

export async function getReservationsForHotel(hotelId: string): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('booked_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Reservation[];
}

export async function getActiveReservations(
  hotelId: string,
  date: string,
): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('hotel_id', hotelId)
    .neq('status', 'CANCELLED')
    .lte('check_in_date', date)
    .gt('check_out_date', date);
  if (error) throw error;
  return (data || []) as Reservation[];
}

export async function getCancelledReservations(
  hotelId: string,
): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('status', 'CANCELLED')
    .order('cancelled_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data || []) as Reservation[];
}

export async function getForecast(
  hotelId: string,
  date: string,
): Promise<Forecast | null> {
  const { data, error } = await supabase
    .from('forecasts')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('business_date', date)
    .maybeSingle();
  if (error) throw error;
  return data as Forecast | null;
}

export async function getForecastsRange(
  hotelId: string,
  startDate: string,
  endDate: string,
): Promise<Forecast[]> {
  const { data, error } = await supabase
    .from('forecasts')
    .select('*')
    .eq('hotel_id', hotelId)
    .gte('business_date', startDate)
    .lte('business_date', endDate)
    .order('business_date', { ascending: true });
  if (error) throw error;
  return (data || []) as Forecast[];
}

export async function getDemandSignal(
  hotelId: string,
  date: string,
): Promise<DemandSignal | null> {
  const { data, error } = await supabase
    .from('demand_signals')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('business_date', date)
    .maybeSingle();
  if (error) throw error;
  return data as DemandSignal | null;
}

export async function getOpenOpportunities(
  hotelId: string = DEMO_HOTEL_ID,
): Promise<Opportunity[]> {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('status', 'OPEN')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Opportunity[];
}

export async function getAllOpportunities(
  hotelId: string = DEMO_HOTEL_ID,
): Promise<Opportunity[]> {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Opportunity[];
}

export async function getOpportunityById(
  opportunityId: string,
): Promise<Opportunity | null> {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', opportunityId)
    .maybeSingle();
  if (error) throw error;
  return data as Opportunity | null;
}

export async function getRecommendationForOpportunity(
  opportunityId: string,
): Promise<Recommendation | null> {
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .eq('opportunity_id', opportunityId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Recommendation | null;
}

export async function getActionForOpportunity(
  opportunityId: string,
): Promise<ActionRecord | null> {
  const { data, error } = await supabase
    .from('actions')
    .select('*')
    .eq('opportunity_id', opportunityId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as ActionRecord | null;
}

export async function getOutcomeForAction(
  actionId: string,
): Promise<ActionOutcome | null> {
  const { data, error } = await supabase
    .from('action_outcomes')
    .select('*')
    .eq('action_id', actionId)
    .maybeSingle();
  if (error) throw error;
  return data as ActionOutcome | null;
}

export async function getChannels(hotelId: string = DEMO_HOTEL_ID) {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('hotel_id', hotelId);
  if (error) throw error;
  return data || [];
}

// ============================================================
// OPPORTUNITY GENERATION
// ============================================================

function dateStr(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

export async function generateOpportunities(
  hotelId: string = DEMO_HOTEL_ID,
): Promise<Opportunity[]> {
  const hotel = await getHotel(hotelId);
  if (!hotel) throw new Error('Hotel not found');

  const roomTypes = await getRoomTypes(hotelId);
  const allInventory = await getInventoryRange(hotelId, dateStr(0), dateStr(29));
  const reservations = await getReservationsForHotel(hotelId);
  const forecasts = await getForecastsRange(hotelId, dateStr(0), dateStr(13));
  const cancelledReservations = await getCancelledReservations(hotelId);
  const channels = await getChannels(hotelId);

  const existingOpps = await getOpenOpportunities(hotelId);
  const generated: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>[] = [];

  // 1. Unsold inventory / weak booking pace opportunities
  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const date = dateStr(dayOffset);
    const dayInventory = allInventory.filter((i) => i.business_date === date);
    if (dayInventory.length === 0) continue;

    const forecast = forecasts.find((f) => f.business_date === date) || null;
    const expectedOccupancyPct = forecast?.expected_occupancy_pct ?? 65;
    const risk = calculateInventoryRisk(dayInventory, expectedOccupancyPct, date);

    if (risk.roomsAtRisk >= 5 && risk.severity !== 'NONE') {
      const avgRate =
        dayInventory.reduce((s, i) => s + i.rate_cents, 0) / dayInventory.length;
      const oppValue = calculateOpportunityValue(
        risk.roomsAtRisk,
        Math.round(avgRate),
        forecast?.confidence_pct ?? 70,
      );

      const isWeakPace = risk.severity === 'HIGH' || risk.severity === 'CRITICAL';
      const type: OpportunityType = isWeakPace ? 'WEAK_BOOKING_PACE' : 'UNSOLD_INVENTORY';
      const evidence: EvidenceItem[] = [
        {
          label: 'Current occupancy',
          detail: `${Math.round((dayInventory.reduce((s, i) => s + i.sold_rooms, 0) / dayInventory.reduce((s, i) => s + i.total_rooms, 0)) * 100)}% sold`,
        },
        {
          label: 'Expected occupancy',
          detail: `${expectedOccupancyPct.toFixed(1)}% based on forecast`,
        },
        {
          label: 'Rooms at risk',
          detail: `${risk.roomsAtRisk} rooms likely to remain unsold`,
        },
        {
          label: 'Forecast confidence',
          detail: `${forecast?.confidence_pct ?? 70}% confidence in forecast`,
        },
        {
          label: 'Day of week',
          detail: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
        },
      ];

      if (forecast?.primary_cause) {
        evidence.push({ label: 'Primary cause', detail: forecast.primary_cause });
      }

      generated.push({
        hotel_id: hotelId,
        type,
        severity: risk.severity as OpportunitySeverity,
        reason: risk.reason,
        room_type_id: null,
        business_date: date,
        rooms_affected: risk.roomsAtRisk,
        expected_value_cents: oppValue.expectedValueCents,
        estimated_cost_cents: oppValue.estimatedCostCents,
        confidence_pct: forecast?.confidence_pct ?? 70,
        recommended_action: isWeakPace
          ? 'Launch targeted direct booking offer with 10% discount for last-minute leisure demand'
          : 'Monitor pace and prepare promotional offer if bookings do not accelerate',
        status: 'OPEN' as OpportunityStatus,
        evidence: evidence as unknown as EvidenceItem[],
        assumptions: [
          `${Math.round((forecast?.confidence_pct ?? 70) / 100 * 0.7 * 100)}% of at-risk rooms are recoverable`,
          'Average 2-night stay for leisure demand',
          'Direct channel preferred to avoid OTA commission',
        ],
        expires_at: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
      });
    }
  }

  // 2. Abandoned booking recovery opportunities
  for (const res of cancelledReservations.slice(0, 7)) {
    if (res.cancelled_at && new Date(res.cancelled_at) > new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)) {
      const daysUntilCheckIn = Math.ceil(
        (new Date(res.check_in_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      if (daysUntilCheckIn < 0) continue;

      generated.push({
        hotel_id: hotelId,
        type: 'ABANDONED_BOOKING',
        severity: res.total_amount_cents > 50000 ? 'HIGH' : 'MEDIUM',
        reason: `${res.guest_name || 'A guest'} cancelled a ${res.nights}-night booking worth ${(res.total_amount_cents / 100).toFixed(0)} for ${res.check_in_date}. This is a recoverable booking via direct outreach.`,
        room_type_id: res.room_type_id,
        business_date: res.check_in_date,
        rooms_affected: 1,
        expected_value_cents: res.total_amount_cents,
        estimated_cost_cents: 200,
        confidence_pct: 65,
        recommended_action: 'Send personalized recovery email with small incentive (5% discount or free breakfast)',
        status: 'OPEN',
        evidence: [
          { label: 'Guest', detail: res.guest_name || 'Unknown' },
          { label: 'Original value', detail: `$${(res.total_amount_cents / 100).toFixed(2)}` },
          { label: 'Nights', detail: `${res.nights} nights` },
          { label: 'Cancelled', detail: new Date(res.cancelled_at || '').toLocaleString() },
          { label: 'Check-in', detail: res.check_in_date },
        ] as EvidenceItem[],
        assumptions: [
          'Guest abandoned during or after checkout',
          'Email address is valid and monitored',
          '5% discount or complimentary breakfast as incentive',
        ],
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }

  // 3. Channel cost optimization
  const otaReservations = reservations.filter(
    (r) => r.status !== 'CANCELLED' && r.commission_cents > 0,
  );
  if (otaReservations.length > 5) {
    const totalCommission = otaReservations.reduce((s, r) => s + r.commission_cents, 0);
    const avgCommission = Math.round(totalCommission / otaReservations.length);
    generated.push({
      hotel_id: hotelId,
      type: 'CHANNEL_COST_OPTIMIZATION',
      severity: 'MEDIUM',
      reason: `${otaReservations.length} OTA bookings in the next 30 days are generating $${(totalCommission / 100).toFixed(2)} in commission costs. Shifting 30% to direct could save $${(totalCommission * 0.3 / 100).toFixed(2)}.`,
      room_type_id: null,
      business_date: null,
      rooms_affected: otaReservations.length,
      expected_value_cents: Math.round(totalCommission * 0.3),
      estimated_cost_cents: Math.round(totalCommission * 0.3 * 0.3),
      confidence_pct: 72,
      recommended_action: 'Promote direct booking with a value-add incentive (free breakfast or late checkout) that costs less than OTA commission',
      status: 'OPEN',
      evidence: [
        { label: 'OTA bookings', detail: `${otaReservations.length} bookings via OTA channels` },
        { label: 'Total commission', detail: `$${(totalCommission / 100).toFixed(2)}` },
        { label: 'Average commission per booking', detail: `$${(avgCommission / 100).toFixed(2)}` },
        { label: 'Recoverable', detail: '30% shiftable to direct channel' },
      ] as EvidenceItem[],
      assumptions: [
        'Direct booking incentive costs 30% of OTA commission',
        '30% of OTA bookers can be converted to direct',
        'Rate parity maintained across channels',
      ],
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // 4. Upgrade opportunity for upcoming arrivals
  const upcomingArrivals = reservations
    .filter(
      (r) =>
        r.status === 'CONFIRMED' &&
        r.check_in_date >= dateStr(0) &&
        r.check_in_date <= dateStr(7),
    )
    .slice(0, 15);

  if (upcomingArrivals.length >= 3) {
    const standardRoomBookings = upcomingArrivals.filter(
      (r) => r.room_type_id === roomTypes[0]?.id || r.room_type_id === roomTypes[1]?.id,
    );
    if (standardRoomBookings.length >= 3) {
      const upgradeValue = standardRoomBookings.length * 5000; // $50 upgrade per room
      generated.push({
        hotel_id: hotelId,
        type: 'UPGRADE_OPPORTUNITY',
        severity: 'LOW',
        reason: `${standardRoomBookings.length} arriving guests in standard rooms are eligible for room upgrades. Deluxe suites and penthouse have availability.`,
        room_type_id: null,
        business_date: null,
        rooms_affected: standardRoomBookings.length,
        expected_value_cents: upgradeValue,
        estimated_cost_cents: 0,
        confidence_pct: 55,
        recommended_action: 'Send pre-arrival upgrade offer email 24 hours before check-in',
        status: 'OPEN',
        evidence: [
          { label: 'Eligible arrivals', detail: `${standardRoomBookings.length} guests in standard rooms` },
          { label: 'Upgrade rate', detail: '$50 per room (40% of rate difference)' },
          { label: 'Suite availability', detail: 'Deluxe suites and penthouse have open inventory' },
        ] as EvidenceItem[],
        assumptions: [
          '40% of rate difference offered as upgrade price',
          'Pre-arrival email sent 24 hours before check-in',
          'Higher room types have available inventory',
        ],
        expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }

  // Insert only new opportunities (avoid duplicates by checking existing)
  const inserted: Opportunity[] = [];
  for (const opp of generated) {
    // Check if a similar opportunity already exists
    const duplicate = existingOpps.find(
      (e) =>
        e.type === opp.type &&
        e.business_date === opp.business_date &&
        e.reason === opp.reason,
    );
    if (duplicate) {
      inserted.push(duplicate);
      continue;
    }

    const { data, error } = await supabase
      .from('opportunities')
      .insert({
        ...opp,
        evidence: opp.evidence as unknown,
        assumptions: opp.assumptions as unknown,
      })
      .select('*')
      .single();
    if (error) {
      console.error('Failed to insert opportunity:', error.message);
      continue;
    }
    inserted.push(data as Opportunity);
  }

  return inserted;
}

// ============================================================
// RECOMMENDATION GENERATION
// ============================================================

export async function generateRecommendationForOpportunity(
  opportunityId: string,
): Promise<Recommendation | null> {
  const opportunity = await getOpportunityById(opportunityId);
  if (!opportunity) return null;

  const hotel = await getHotel(opportunity.hotel_id);
  if (!hotel) return null;

  const roomTypes = await getRoomTypes(opportunity.hotel_id);
  const date = opportunity.business_date || dateStr(1);
  const inventory = await getInventoryForDate(opportunity.hotel_id, date);
  const avgRate =
    inventory.length > 0
      ? Math.round(inventory.reduce((s, i) => s + i.rate_cents, 0) / inventory.length)
      : roomTypes[0]?.base_rate_cents || 20000;

  const channels = await getChannels(opportunity.hotel_id);
  const directChannel = channels.find((c: { is_direct: boolean }) => c.is_direct);
  const otaChannel = channels.find((c: { is_direct: boolean }) => !c.is_direct);
  const channelBps = directChannel ? 0 : otaChannel?.commission_rate_basis_points || 1500;

  const forecast = await getForecast(opportunity.hotel_id, date);
  const expectedOcc = forecast?.expected_occupancy_pct ?? 65;

  const rec = generateRecommendation({
    opportunity,
    avgRateCents: avgRate,
    totalRooms: hotel.total_rooms,
    channelCommissionBps: channelBps,
    expectedOccupancyPct: expectedOcc,
  });

  const { data, error } = await supabase
    .from('recommendations')
    .insert({
      opportunity_id: opportunityId,
      hotel_id: opportunity.hotel_id,
      action_type: rec.action_type,
      reason: rec.reason,
      expected_incremental_revenue_cents: rec.expected_incremental_revenue_cents,
      estimated_acquisition_cost_cents: rec.estimated_acquisition_cost_cents,
      expected_channel: rec.expected_channel,
      expected_room_nights: rec.expected_room_nights,
      confidence_pct: rec.confidence_pct,
      assumptions: rec.assumptions as unknown,
      status: 'PENDING',
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as Recommendation;
}

// ============================================================
// ACTION SIMULATION
// ============================================================

export async function simulateAction(
  opportunityId: string,
): Promise<{ action: ActionRecord; outcome: ActionOutcome }> {
  const opportunity = await getOpportunityById(opportunityId);
  if (!opportunity) throw new Error('Opportunity not found');

  // Get or generate recommendation
  let recommendation = await getRecommendationForOpportunity(opportunityId);
  if (!recommendation) {
    recommendation = await generateRecommendationForOpportunity(opportunityId);
  }

  const hotel = await getHotel(opportunity.hotel_id);
  if (!hotel) throw new Error('Hotel not found');

  const channels = await getChannels(opportunity.hotel_id);
  const directChannel = channels.find((c: { is_direct: boolean }) => c.is_direct);
  const otaChannel = channels.find((c: { is_direct: boolean }) => !c.is_direct);

  // Determine channel for simulation
  const useDirect = recommendation?.expected_channel?.includes('Direct') ?? true;
  const channelBps = useDirect
    ? 0
    : otaChannel?.commission_rate_basis_points || 1500;

  // Simulate action
  const roomsTargeted = Math.round(opportunity.rooms_affected * 0.7);
  const date = opportunity.business_date || dateStr(1);
  const inventory = await getInventoryForDate(opportunity.hotel_id, date);
  const avgRate =
    inventory.length > 0
      ? Math.round(inventory.reduce((s, i) => s + i.rate_cents, 0) / inventory.length)
      : 20000;

  // Create action record
  const { data: actionData, error: actionError } = await supabase
    .from('actions')
    .insert({
      opportunity_id: opportunityId,
      hotel_id: opportunity.hotel_id,
      recommendation_id: recommendation?.id || null,
      action_type: recommendation?.action_type || 'CREATE_OFFER',
      parameters: {
        rooms_targeted: roomsTargeted,
        rate_per_night: avgRate,
        channel: useDirect ? 'Direct' : 'OTA',
        discount_pct: 10,
      },
      status: 'SIMULATED',
      executed_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (actionError) throw actionError;
  const action = actionData as ActionRecord;

  // Calculate outcome
  const conversionRate = 0.45 + (opportunity.confidence_pct / 100) * 0.2;
  const { calculateActionOutcome } = await import('@/lib/calculations');
  const outcomeResult = calculateActionOutcome(
    roomsTargeted,
    Math.min(conversionRate, 0.65),
    avgRate,
    2, // avg 2 nights
    channelBps,
    Math.round(avgRate * 0.08), // acquisition cost per room
    10, // 10% discount
    5, // 5% cancellation rate
  );

  const { data: outcomeData, error: outcomeError } = await supabase
    .from('action_outcomes')
    .insert({
      action_id: action.id,
      hotel_id: opportunity.hotel_id,
      rooms_sold: outcomeResult.roomsSold,
      gross_revenue_cents: outcomeResult.grossRevenueCents,
      acquisition_cost_cents: outcomeResult.acquisitionCostCents,
      channel_commission_cents: outcomeResult.channelCommissionCents,
      discount_cost_cents: outcomeResult.discountCostCents,
      cancellation_loss_cents: outcomeResult.cancellationLossCents,
      net_incremental_revenue_cents: outcomeResult.netIncrementalRevenueCents,
      outcome: outcomeResult.outcome,
      notes: outcomeResult.notes,
      measured_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (outcomeError) throw outcomeError;
  const outcome = outcomeData as ActionOutcome;

  // Update opportunity status
  await supabase
    .from('opportunities')
    .update({ status: 'ACTED_ON', updated_at: new Date().toISOString() })
    .eq('id', opportunityId);

  // Update recommendation status
  if (recommendation) {
    await supabase
      .from('recommendations')
      .update({ status: 'EXECUTED' })
      .eq('id', recommendation.id);
  }

  return { action, outcome };
}

// ============================================================
// RESOLVE OPPORTUNITY
// ============================================================

export async function resolveOpportunity(
  opportunityId: string,
  resolution: 'RESOLVED' | 'DISMISSED',
): Promise<void> {
  const { error } = await supabase
    .from('opportunities')
    .update({
      status: resolution,
      updated_at: new Date().toISOString(),
    })
    .eq('id', opportunityId);
  if (error) throw error;
}
