import { createServerSupabaseClient } from '@/lib/supabase/server';
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
import { formatCentsCompact } from '@/lib/money';

export async function getHotel(hotelId: string): Promise<Hotel | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('hotels')
    .select('*')
    .eq('id', hotelId)
    .maybeSingle();
  if (error) throw error;
  return data as Hotel | null;
}

export async function getRoomTypes(hotelId: string): Promise<RoomType[]> {
  const supabase = createServerSupabaseClient();
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
  const supabase = createServerSupabaseClient();
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
  const supabase = createServerSupabaseClient();
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
  const supabase = createServerSupabaseClient();
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
  const supabase = createServerSupabaseClient();
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
  const supabase = createServerSupabaseClient();
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
  const supabase = createServerSupabaseClient();
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
  const supabase = createServerSupabaseClient();
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
  const supabase = createServerSupabaseClient();
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
  hotelId: string,
): Promise<Opportunity[]> {
  const supabase = createServerSupabaseClient();
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
  hotelId: string,
): Promise<Opportunity[]> {
  const supabase = createServerSupabaseClient();
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
  const supabase = createServerSupabaseClient();
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
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('hotel_recommendations')
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
  const supabase = createServerSupabaseClient();
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
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('action_outcomes')
    .select('*')
    .eq('action_id', actionId)
    .maybeSingle();
  if (error) throw error;
  return data as ActionOutcome | null;
}

export async function getChannels(hotelId: string) {
  const supabase = createServerSupabaseClient();
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
  hotelId: string,
): Promise<Opportunity[]> {
  const supabase = createServerSupabaseClient();
  const hotel = await getHotel(hotelId);

  if (!hotel) {
    throw new Error('Hotel not found');
  }

  const roomTypes = await getRoomTypes(hotelId);

  const allInventory = await getInventoryRange(
    hotelId,
    dateStr(0),
    dateStr(29),
  );

  const reservations =
    await getReservationsForHotel(hotelId);

  const forecasts =
    await getForecastsRange(
      hotelId,
      dateStr(0),
      dateStr(13),
    );

  const cancelledReservations =
    await getCancelledReservations(hotelId);

  const existingOpps =
    await getOpenOpportunities(hotelId);

  const generated: Omit<
    Opportunity,
    'id' | 'created_at' | 'updated_at'
  >[] = [];

  /*
   * ==========================================================
   * 1. INVENTORY / BOOKING-PACE OPPORTUNITIES
   * ==========================================================
   */

  for (
    let dayOffset = 1;
    dayOffset <= 7;
    dayOffset++
  ) {
    const date = dateStr(dayOffset);

    const dayInventory =
      allInventory.filter(
        (item) =>
          item.business_date === date,
      );

    if (dayInventory.length === 0) {
      continue;
    }

    const forecast =
      forecasts.find(
        (item) =>
          item.business_date === date,
      ) || null;

    const expectedOccupancyPct =
      forecast?.expected_occupancy_pct ?? 65;

    const risk =
      calculateInventoryRisk(
        dayInventory,
        expectedOccupancyPct,
        date,
      );

    if (
      risk.roomsAtRisk < 2 ||
      risk.severity === 'NONE'
    ) {
      continue;
    }

    const totalRooms =
      dayInventory.reduce(
        (sum, item) =>
          sum + item.total_rooms,
        0,
      );

    const soldRooms =
      dayInventory.reduce(
        (sum, item) =>
          sum + item.sold_rooms,
        0,
      );

    const avgRate =
      dayInventory.length > 0
        ? Math.round(
            dayInventory.reduce(
              (sum, item) =>
                sum + item.rate_cents,
              0,
            ) / dayInventory.length,
          )
        : 0;

    const oppValue =
      calculateOpportunityValue(
        risk.roomsAtRisk,
        avgRate,
        forecast?.confidence_pct ?? 70,
        70,
        12,
      );

    const type: OpportunityType =
      risk.severity === 'HIGH' ||
      risk.severity === 'CRITICAL'
        ? 'WEAK_BOOKING_PACE'
        : 'UNSOLD_INVENTORY';

    const currentOccupancyPct =
      totalRooms > 0
        ? Math.round(
            (soldRooms / totalRooms) *
              100,
          )
        : 0;

    const evidence: EvidenceItem[] = [
      {
        label: 'Current occupancy',
        detail:
          `${currentOccupancyPct}% sold`,
      },
      {
        label: 'Expected occupancy',
        detail:
          `${expectedOccupancyPct.toFixed(1)}% forecast`,
      },
      {
        label: 'Rooms at risk',
        detail:
          `${risk.roomsAtRisk} rooms below expected booking position`,
      },
      {
        label: 'Expected recoverable rooms',
        detail:
          `${oppValue.roomsLikelySold} rooms after confidence and conversion adjustment`,
      },
      {
        label: 'Expected gross value',
        detail:
          formatCentsCompact(
            oppValue.expectedValueCents,
            hotel.currency,
          ),
      },
      {
        label: 'Estimated acquisition cost',
        detail:
          formatCentsCompact(
            oppValue.estimatedCostCents,
            hotel.currency,
          ),
      },
      {
        label: 'Expected net value',
        detail:
          formatCentsCompact(
            oppValue.expectedNetValueCents,
            hotel.currency,
          ),
      },
      {
        label: 'Forecast confidence',
        detail:
          `${forecast?.confidence_pct ?? 70}%`,
      },
      {
        label: 'Day of week',
        detail:
          new Date(
            `${date}T12:00:00`,
          ).toLocaleDateString(
            'en-US',
            { weekday: 'long' },
          ),
      },
    ];

    if (forecast?.primary_cause) {
      evidence.push({
        label: 'Primary cause',
        detail:
          forecast.primary_cause,
      });
    }

    generated.push({
      hotel_id: hotelId,
      type,
      severity:
        risk.severity as OpportunitySeverity,
      reason:
        `${risk.reason} ` +
        `Estimated commercial upside is ` +
        `${formatCentsCompact(
          oppValue.expectedNetValueCents,
          hotel.currency,
        )} after the modeled acquisition allowance.`,
      room_type_id: null,
      business_date: date,
      rooms_affected:
        risk.roomsAtRisk,
      expected_value_cents:
        oppValue.expectedValueCents,
      estimated_cost_cents:
        oppValue.estimatedCostCents,
      confidence_pct:
        forecast?.confidence_pct ?? 70,
      recommended_action:
        type === 'WEAK_BOOKING_PACE'
          ? 'Launch a targeted direct-booking offer and measure incremental bookings against the expected pace gap.'
          : 'Monitor booking pace and prepare a targeted offer if demand does not accelerate.',
      status: 'OPEN',
      evidence,
      assumptions: [
        '70% of at-risk rooms are targetable',
        'Confidence-adjusted conversion determines expected recoverable rooms',
        '12% acquisition-cost allowance',
        'Direct channel is preferred to minimize commission',
      ],
      expires_at:
        new Date(
          Date.now() +
            18 * 60 * 60 * 1000,
        ).toISOString(),
    });
  }

  /*
   * ==========================================================
   * 2. ABANDONED BOOKING RECOVERY
   * ==========================================================
   */

  for (
    const res of
    cancelledReservations.slice(0, 7)
  ) {
    if (
      !res.cancelled_at ||
      new Date(res.cancelled_at) <=
        new Date(
          Date.now() -
            2 *
              24 *
              60 *
              60 *
              1000,
        )
    ) {
      continue;
    }

    const daysUntilCheckIn =
      Math.ceil(
        (
          new Date(
            res.check_in_date,
          ).getTime() -
          Date.now()
        ) /
          (1000 * 60 * 60 * 24),
      );

    if (daysUntilCheckIn < 0) {
      continue;
    }

    const recoveryConfidence = 65;

    const expectedRecoveryValue =
      Math.round(
        res.total_amount_cents *
          (recoveryConfidence / 100),
      );

    generated.push({
      hotel_id: hotelId,
      type: 'ABANDONED_BOOKING',
      severity:
        res.total_amount_cents > 50000
          ? 'HIGH'
          : 'MEDIUM',
      reason:
        `${res.guest_name || 'A guest'} cancelled a ` +
        `${res.nights}-night booking worth ` +
        `${formatCentsCompact(
          res.total_amount_cents,
          hotel.currency,
        )}. ` +
        `The booking remains recoverable because ` +
        `check-in has not passed.`,
      room_type_id:
        res.room_type_id,
      business_date:
        res.check_in_date,
      rooms_affected: 1,
      expected_value_cents:
        expectedRecoveryValue,
      estimated_cost_cents: 200,
      confidence_pct:
        recoveryConfidence,
      recommended_action:
        'Send personalized direct recovery outreach with a controlled incentive.',
      status: 'OPEN',
      evidence: [
        {
          label: 'Guest',
          detail:
            res.guest_name ||
            'Unknown',
        },
        {
          label: 'Original booking value',
          detail:
            formatCentsCompact(
              res.total_amount_cents,
              hotel.currency,
            ),
        },
        {
          label: 'Expected recovery value',
          detail:
            formatCentsCompact(
              expectedRecoveryValue,
              hotel.currency,
            ),
        },
        {
          label: 'Nights',
          detail:
            `${res.nights} nights`,
        },
        {
          label: 'Cancelled',
          detail:
            new Date(
              res.cancelled_at,
            ).toLocaleString(),
        },
        {
          label: 'Check-in',
          detail:
            res.check_in_date,
        },
      ] as EvidenceItem[],
      assumptions: [
        'Guest can still be contacted',
        'Recovery outreach occurs quickly',
        '5% recovery incentive',
        'Direct channel avoids OTA commission',
      ],
      expires_at:
        new Date(
          Date.now() +
            24 * 60 * 60 * 1000,
        ).toISOString(),
    });
  }

  /*
   * ==========================================================
   * 3. CHANNEL COST OPTIMIZATION
   * ==========================================================
   */

  const otaReservations =
    reservations.filter(
      (reservation) =>
        reservation.status !== 'CANCELLED' &&
        reservation.commission_cents > 0,
    );

  if (otaReservations.length > 5) {
    const totalCommission =
      otaReservations.reduce(
        (sum, reservation) =>
          sum +
          reservation.commission_cents,
        0,
      );

    const recoverableCommission =
      Math.round(
        totalCommission * 0.30,
      );

    const directIncentiveCost =
      Math.round(
        recoverableCommission * 0.30,
      );

    const netCommissionSaving =
      Math.max(
        0,
        recoverableCommission -
          directIncentiveCost,
      );

    generated.push({
      hotel_id: hotelId,
      type:
        'CHANNEL_COST_OPTIMIZATION',
      severity: 'MEDIUM',
      reason:
        `${otaReservations.length} OTA bookings generated ` +
        `${formatCentsCompact(
          totalCommission,
          hotel.currency,
        )} in commission. ` +
        `An estimated 30% is potentially avoidable ` +
        `through direct-booking conversion.`,
      room_type_id: null,
      business_date: null,
      rooms_affected:
        otaReservations.length,
      expected_value_cents:
        recoverableCommission,
      estimated_cost_cents:
        directIncentiveCost,
      confidence_pct: 72,
      recommended_action:
        'Shift eligible demand toward direct booking when expected commission savings exceed the incentive cost.',
      status: 'OPEN',
      evidence: [
        {
          label: 'OTA bookings',
          detail:
            `${otaReservations.length} bookings`,
        },
        {
          label: 'Total commission',
          detail:
            formatCentsCompact(
              totalCommission,
              hotel.currency,
            ),
        },
        {
          label: 'Potential commission saving',
          detail:
            formatCentsCompact(
              recoverableCommission,
              hotel.currency,
            ),
        },
        {
          label: 'Direct incentive cost',
          detail:
            formatCentsCompact(
              directIncentiveCost,
              hotel.currency,
            ),
        },
        {
          label: 'Expected net saving',
          detail:
            formatCentsCompact(
              netCommissionSaving,
              hotel.currency,
            ),
        },
      ] as EvidenceItem[],
      assumptions: [
        '30% of eligible OTA demand can shift direct',
        'Direct incentive costs 30% of saved commission',
        'Rate parity is maintained',
      ],
      expires_at:
        new Date(
          Date.now() +
            7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
    });
  }

  /*
   * ==========================================================
   * 4. UPGRADE OPPORTUNITY
   * ==========================================================
   */

  const upcomingArrivals =
    reservations
      .filter(
        (reservation) =>
          reservation.status === 'CONFIRMED' &&
          reservation.check_in_date >=
            dateStr(0) &&
          reservation.check_in_date <=
            dateStr(7),
      )
      .slice(0, 15);

  if (
    upcomingArrivals.length >= 3 &&
    roomTypes.length >= 2
  ) {
    const standardRoomIds =
      new Set(
        roomTypes
          .slice(0, 2)
          .map(
            (roomType) =>
              roomType.id,
          ),
      );

    const standardRoomBookings =
      upcomingArrivals.filter(
        (reservation) =>
          standardRoomIds.has(
            reservation.room_type_id,
          ),
      );

    const premiumRoomTypes =
      roomTypes.slice(2);

    const premiumRoomIds =
      new Set(
        premiumRoomTypes.map(
          (roomType) =>
            roomType.id,
        ),
      );

    const premiumAvailability =
      allInventory.some(
        (inventory) =>
          premiumRoomIds.has(
            inventory.room_type_id,
          ) &&
          inventory.available_rooms > 0 &&
          inventory.business_date >=
            dateStr(0) &&
          inventory.business_date <=
            dateStr(7),
      );

    const standardRate =
      Math.round(
        roomTypes
          .slice(0, 2)
          .reduce(
            (sum, roomType) =>
              sum +
              roomType.base_rate_cents,
            0,
          ) /
          Math.min(
            2,
            roomTypes.length,
          ),
      );

    const premiumRate =
      premiumRoomTypes.length > 0
        ? Math.min(
            ...premiumRoomTypes.map(
              (roomType) =>
                roomType.base_rate_cents,
            ),
          )
        : standardRate;

    const rateDifference =
      Math.max(
        0,
        premiumRate -
          standardRate,
      );

    const upgradeOffer =
      Math.round(
        rateDifference * 0.40,
      );

    const expectedUpgradeAcceptance =
      0.55;

    const expectedUpgradeValue =
      Math.round(
        standardRoomBookings.length *
          upgradeOffer *
          expectedUpgradeAcceptance,
      );

    if (
      standardRoomBookings.length >= 3 &&
      premiumAvailability &&
      upgradeOffer > 0 &&
      expectedUpgradeValue > 0
    ) {
      generated.push({
        hotel_id: hotelId,
        type:
          'UPGRADE_OPPORTUNITY',
        severity: 'LOW',
        reason:
          `${standardRoomBookings.length} arriving guests ` +
          `in standard rooms may be eligible for upgrades. ` +
          `Expected incremental value is ` +
          `${formatCentsCompact(
            expectedUpgradeValue,
            hotel.currency,
          )}.`,
        room_type_id: null,
        business_date: null,
        rooms_affected:
          standardRoomBookings.length,
        expected_value_cents:
          expectedUpgradeValue,
        estimated_cost_cents: 0,
        confidence_pct: 55,
        recommended_action:
          'Send a pre-arrival upgrade offer before check-in.',
        status: 'OPEN',
        evidence: [
          {
            label: 'Eligible arrivals',
            detail:
              `${standardRoomBookings.length} guests`,
          },
          {
            label: 'Standard room rate',
            detail:
              formatCentsCompact(
                standardRate,
                hotel.currency,
              ),
          },
          {
            label: 'Premium room rate',
            detail:
              formatCentsCompact(
                premiumRate,
                hotel.currency,
              ),
          },
          {
            label: 'Suggested upgrade offer',
            detail:
              formatCentsCompact(
                upgradeOffer,
                hotel.currency,
              ) +
              ' per room',
          },
          {
            label: 'Premium availability',
            detail:
              'Available within the next 7 days',
          },
        ] as EvidenceItem[],
        assumptions: [
          'Premium room category has availability',
          '40% of the room-rate difference is offered as the upgrade price',
          '55% modeled upgrade acceptance',
          'Pre-arrival outreach occurs before check-in',
        ],
        expires_at:
          new Date(
            Date.now() +
              3 * 24 * 60 * 60 * 1000,
          ).toISOString(),
      });
    }
  }

  /*
   * ==========================================================
   * 5. IDEMPOTENT INSERTION
   * ==========================================================
   *
   * Stable commercial dimensions are used instead of comparing
   * the entire reason string. This prevents repeated dashboard
   * loads from creating new records merely because wording changes.
   */

  const fingerprint = (
    opportunity: Pick<
      Opportunity,
      | 'type'
      | 'business_date'
      | 'room_type_id'
    >,
  ) =>
    [
      opportunity.type,
      opportunity.business_date ?? 'NONE',
      opportunity.room_type_id ?? 'NONE',
    ].join('|');

  const existingFingerprints =
    new Set(
      existingOpps.map(
        (opportunity) =>
          fingerprint(opportunity),
      ),
    );

  const inserted: Opportunity[] = [];

  for (const opp of generated) {
    const key = fingerprint(opp);

    const duplicate =
      existingFingerprints.has(key);

    if (duplicate) {
      const existing =
        existingOpps.find(
          (opportunity) =>
            fingerprint(
              opportunity,
            ) === key,
        );

      if (existing) {
        inserted.push(existing);
      }

      continue;
    }

    const { data, error } =
      await supabase
        .from('opportunities')
        .insert({
          ...opp,
          evidence:
            opp.evidence as unknown,
          assumptions:
            opp.assumptions as unknown,
        })
        .select('*')
        .single();

    if (error) {
      console.error(
        'Failed to insert opportunity:',
        error.message,
      );
      continue;
    }

    existingFingerprints.add(key);

    inserted.push(
      data as Opportunity,
    );
  }

  return inserted;
}

// RECOMMENDATION GENERATION
// ============================================================

export async function generateRecommendationForOpportunity(
  opportunityId: string,
): Promise<Recommendation | null> {
  const supabase = createServerSupabaseClient();
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
    .from('hotel_recommendations')
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
): Promise<{
  action: ActionRecord;
  outcome: ActionOutcome;
}> {
  const supabase = createServerSupabaseClient();
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
      executed_at: null,
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

  // Update recommendation status

  return { action, outcome };
}

// ============================================================
// RESOLVE OPPORTUNITY
// ============================================================

export async function resolveOpportunity(
  opportunityId: string,
  resolution: 'RESOLVED' | 'DISMISSED',
): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from('opportunities')
    .update({
      status: resolution,
      updated_at: new Date().toISOString(),
    })
    .eq('id', opportunityId);
  if (error) throw error;
}
