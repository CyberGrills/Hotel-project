import type { Inventory, Reservation, Forecast, DemandSignal } from '@/types';

export interface OccupancyResult {
  occupancyPct: number;
  soldRooms: number;
  totalRooms: number;
  availableRooms: number;
}

export function calculateOccupancy(inventory: Inventory[]): OccupancyResult {
  const totalRooms = inventory.reduce((sum, i) => sum + i.total_rooms, 0);
  const soldRooms = inventory.reduce((sum, i) => sum + i.sold_rooms, 0);
  const availableRooms = inventory.reduce((sum, i) => sum + i.available_rooms, 0);
  const occupancyPct = totalRooms > 0 ? (soldRooms / totalRooms) * 100 : 0;
  return { occupancyPct, soldRooms, totalRooms, availableRooms };
}

export interface ADRResult {
  adr: number;
  totalRevenue: number;
  roomNights: number;
}

export function calculateADR(reservations: Reservation[], date: string): ADRResult {
  const activeOnDate = reservations.filter(
    (r) =>
      r.status !== 'CANCELLED' &&
      r.check_in_date <= date &&
      r.check_out_date > date,
  );
  const roomNights = activeOnDate.length;
  const totalRevenue = activeOnDate.reduce((sum, r) => sum + r.rate_per_night_cents, 0);
  const adr = roomNights > 0 ? Math.round(totalRevenue / roomNights) : 0;
  return { adr, totalRevenue, roomNights };
}

export interface RoomRevenueResult {
  roomRevenue: number;
  perAvailableRoom: number;
}

export function calculateRoomRevenue(
  reservations: Reservation[],
  inventory: Inventory[],
  date: string,
): RoomRevenueResult {
  const { totalRevenue } = calculateADR(reservations, date);
  const totalRooms = inventory.reduce((sum, i) => sum + i.total_rooms, 0);
  const perAvailableRoom = totalRooms > 0 ? Math.round(totalRevenue / totalRooms) : 0;
  return { roomRevenue: totalRevenue, perAvailableRoom };
}

export interface BookingPaceResult {
  cumulativeBookings: number;
  expectedPace: number;
  paceVariancePct: number;
  status: 'UNDER_DEMANDED' | 'NORMAL' | 'OVER_DEMANDED';
}

export function calculateBookingPace(
  reservations: Reservation[],
  targetDate: string,
  totalRooms: number,
  expectedOccupancyPct: number,
): BookingPaceResult {
  const activeOnDate = reservations.filter(
    (r) =>
      r.status !== 'CANCELLED' &&
      r.check_in_date <= targetDate &&
      r.check_out_date > targetDate,
  );
  const cumulativeBookings = activeOnDate.length;
  const expectedPace = Math.round((totalRooms * expectedOccupancyPct) / 100);
  const paceVariancePct =
    expectedPace > 0 ? ((cumulativeBookings - expectedPace) / expectedPace) * 100 : 0;

  let status: BookingPaceResult['status'] = 'NORMAL';
  if (paceVariancePct < -10) status = 'UNDER_DEMANDED';
  else if (paceVariancePct > 10) status = 'OVER_DEMANDED';

  return { cumulativeBookings, expectedPace, paceVariancePct, status };
}

export interface ExpectedOccupancyResult {
  expectedOccupancyPct: number;
  confidencePct: number;
  primaryCause: string;
}

export function calculateExpectedOccupancy(
  forecast: Forecast | null,
  historicalOccupancyPct: number,
): ExpectedOccupancyResult {
  if (forecast) {
    return {
      expectedOccupancyPct: forecast.expected_occupancy_pct,
      confidencePct: forecast.confidence_pct,
      primaryCause: forecast.primary_cause ?? 'Forecast model',
    };
  }
  return {
    expectedOccupancyPct: historicalOccupancyPct,
    confidencePct: 60,
    primaryCause: 'Historical average (no forecast available)',
  };
}

export interface InventoryRiskResult {
  roomsAtRisk: number;
  riskPct: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  reason: string;
}

export function calculateInventoryRisk(
  inventory: Inventory[],
  expectedOccupancyPct: number,
  date: string,
): InventoryRiskResult {
  const totalRooms = inventory.reduce((sum, i) => sum + i.total_rooms, 0);
  const soldRooms = inventory.reduce((sum, i) => sum + i.sold_rooms, 0);
  const expectedSold = Math.round((totalRooms * expectedOccupancyPct) / 100);
  const roomsAtRisk = Math.max(0, totalRooms - soldRooms - 2);

  const expectedUnsold = Math.max(0, totalRooms - expectedSold);
  const actualUnsold = totalRooms - soldRooms;
  const riskGap = Math.max(0, actualUnsold - expectedUnsold);

  const riskPct = totalRooms > 0 ? (riskGap / totalRooms) * 100 : 0;

  let severity: InventoryRiskResult['severity'] = 'NONE';
  if (riskGap >= 20) severity = 'CRITICAL';
  else if (riskGap >= 12) severity = 'HIGH';
  else if (riskGap >= 6) severity = 'MEDIUM';
  else if (riskGap >= 2) severity = 'LOW';

  const reason =
    riskGap > 0
      ? `${riskGap} rooms likely to remain unsold on ${date}. Current bookings are ${Math.round(
          100 - (soldRooms / totalRooms) * 100,
        )}% unsold vs expected ${Math.round(100 - expectedOccupancyPct)}%.`
      : `Inventory is pacing normally for ${date}.`;

  return { roomsAtRisk, riskPct, severity, reason };
}

export interface OpportunityValueResult {
  expectedValueCents: number;
  estimatedCostCents: number;
  roomsAffected: number;
  ratePerRoomCents: number;
}

export function calculateOpportunityValue(
  roomsAtRisk: number,
  avgRateCents: number,
  confidencePct: number,
  acquisitionCostPctOfRevenue: number = 12,
): OpportunityValueResult {
  const confidenceFactor = confidencePct / 100;
  const roomsLikelySold = Math.round(roomsAtRisk * confidenceFactor * 0.7);
  const expectedValueCents = roomsLikelySold * avgRateCents;
  const estimatedCostCents = Math.round(expectedValueCents * (acquisitionCostPctOfRevenue / 100));
  return {
    expectedValueCents,
    estimatedCostCents,
    roomsAffected: roomsAtRisk,
    ratePerRoomCents: avgRateCents,
  };
}

export interface AcquisitionCostResult {
  acquisitionCostCents: number;
  commissionCents: number;
  totalCostCents: number;
}

export function calculateAcquisitionCost(
  revenueCents: number,
  channelCommissionBps: number,
  marketingCostCents: number = 0,
): AcquisitionCostResult {
  const commissionCents = Math.round((revenueCents * channelCommissionBps) / 10000);
  const acquisitionCostCents = marketingCostCents;
  return {
    acquisitionCostCents,
    commissionCents,
    totalCostCents: acquisitionCostCents + commissionCents,
  };
}

export interface NetRevenueResult {
  netRevenue: number;
  grossRevenue: number;
  totalCosts: number;
}

export function calculateNetRevenue(
  grossRevenueCents: number,
  acquisitionCostCents: number,
  commissionCents: number,
  discountCostCents: number = 0,
  cancellationLossCents: number = 0,
): NetRevenueResult {
  const totalCosts =
    acquisitionCostCents + commissionCents + discountCostCents + cancellationLossCents;
  const netRevenue = grossRevenueCents - totalCosts;
  return { netRevenue, grossRevenue: grossRevenueCents, totalCosts };
}

export interface DemandStatusResult {
  status: 'UNDER_DEMANDED' | 'NORMAL' | 'OVER_DEMANDED';
  expectedOccupancy: number;
  confidence: number;
  primaryCause: string;
  recommendedResponse: string;
}

export function calculateDemandStatus(
  forecast: Forecast | null,
  inventory: Inventory[],
  demandSignal: DemandSignal | null,
): DemandStatusResult {
  const { occupancyPct } = calculateOccupancy(inventory);
  const expectedOccupancy = forecast?.expected_occupancy_pct ?? occupancyPct;
  const confidence = forecast?.confidence_pct ?? 60;
  const primaryCause = forecast?.primary_cause ?? 'Historical pattern';
  const recommendedResponse = forecast?.recommended_response ?? 'Monitor and adjust as needed';

  const variance = expectedOccupancy - occupancyPct;
  let status: DemandStatusResult['status'] = 'NORMAL';
  if (variance > 15) status = 'UNDER_DEMANDED';
  else if (variance < -10) status = 'OVER_DEMANDED';

  return { status, expectedOccupancy, confidence, primaryCause, recommendedResponse };
}

export interface ActionOutcomeResult {
  roomsSold: number;
  grossRevenueCents: number;
  acquisitionCostCents: number;
  channelCommissionCents: number;
  discountCostCents: number;
  cancellationLossCents: number;
  netIncrementalRevenueCents: number;
  outcome: 'SUCCESS' | 'PARTIAL' | 'NO_IMPACT' | 'FAILURE';
  notes: string;
}

export function calculateActionOutcome(
  roomsTargeted: number,
  expectedConversionRate: number,
  ratePerNightCents: number,
  avgNights: number,
  channelCommissionBps: number,
  acquisitionCostPerRoomCents: number,
  discountPct: number = 0,
  cancellationRatePct: number = 5,
): ActionOutcomeResult {
  const roomsSold = Math.round(roomsTargeted * expectedConversionRate);
  const grossRevenueCents = roomsSold * ratePerNightCents * avgNights;
  const discountCostCents = Math.round(grossRevenueCents * (discountPct / 100));
  const channelCommissionCents = Math.round(
    ((grossRevenueCents - discountCostCents) * channelCommissionBps) / 10000,
  );
  const acquisitionCostCents = roomsSold * acquisitionCostPerRoomCents;
  const cancellationLossCents = Math.round(
    (grossRevenueCents - discountCostCents) * (cancellationRatePct / 100),
  );

  const netIncrementalRevenueCents =
    grossRevenueCents -
    acquisitionCostCents -
    channelCommissionCents -
    discountCostCents -
    cancellationLossCents;

  let outcome: ActionOutcomeResult['outcome'] = 'NO_IMPACT';
  if (roomsSold >= roomsTargeted * 0.7 && netIncrementalRevenueCents > 0) {
    outcome = 'SUCCESS';
  } else if (roomsSold > 0 && netIncrementalRevenueCents > 0) {
    outcome = 'PARTIAL';
  } else if (roomsSold === 0) {
    outcome = 'NO_IMPACT';
  } else {
    outcome = 'FAILURE';
  }

  const notes = `${roomsSold} of ${roomsTargeted} targeted rooms sold. Gross revenue generated with ${discountPct}% discount through ${
    channelCommissionBps > 0 ? 'OTA channel' : 'direct channel'
  }.`;

  return {
    roomsSold,
    grossRevenueCents,
    acquisitionCostCents,
    channelCommissionCents,
    discountCostCents,
    cancellationLossCents,
    netIncrementalRevenueCents,
    outcome,
    notes,
  };
}
