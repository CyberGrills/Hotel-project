import { NextResponse } from 'next/server';
import {
  getHotel,
  getRoomTypes,
  getInventoryRange,
  getReservationsForHotel,
  getForecastsRange,
  getActiveReservations,
  getChannels,
  generateOpportunities,
  getOpenOpportunities,
  DEMO_HOTEL_ID,
} from '@/server/services';
import {
  calculateOccupancy,
  calculateADR,
  calculateInventoryRisk,
  calculateExpectedOccupancy,
  calculateBookingPace,
} from '@/lib/calculations';
import type { DashboardData } from '@/types';

function dateStr(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

export async function GET(
  _request: Request,
  { params }: { params: { hotelId: string } },
) {
  try {
    const hotelId = params.hotelId || DEMO_HOTEL_ID;
    const hotel = await getHotel(hotelId);
    if (!hotel) {
      return NextResponse.json(
        { data: null, error: { code: 'HOTEL_NOT_FOUND', message: 'Hotel not found' } },
        { status: 404 },
      );
    }

    const today = dateStr(0);
    const tomorrow = dateStr(1);

    const [roomTypes, todayInventory, tomorrowInventory, weekInventory, reservations, forecasts, channels] =
      await Promise.all([
        getRoomTypes(hotelId),
        getInventoryRange(hotelId, today, today),
        getInventoryRange(hotelId, tomorrow, tomorrow),
        getInventoryRange(hotelId, today, dateStr(13)),
        getReservationsForHotel(hotelId),
        getForecastsRange(hotelId, today, dateStr(13)),
        getChannels(hotelId),
      ]);

    const occupancy = calculateOccupancy(todayInventory);
    const tomorrowForecast = forecasts.find((f) => f.business_date === tomorrow) || null;
    const expectedOcc = calculateExpectedOccupancy(tomorrowForecast, 65);
    const risk = calculateInventoryRisk(tomorrowInventory, expectedOcc.expectedOccupancyPct, tomorrow);
    const adr = calculateADR(reservations, today);

    // Generate opportunities from current data
    await generateOpportunities(hotelId);
    const openOpps = await getOpenOpportunities(hotelId);

    // Occupancy trend (14 days)
    const occupancyTrend = weekInventory
      .filter((inv, idx, arr) => {
        const date = inv.business_date;
        return idx === arr.findIndex((i) => i.business_date === date);
      })
      .reduce((acc: { date: string; occupancy: number; expectedOccupancy: number }[], inv) => {
        const dateInv = weekInventory.filter((i) => i.business_date === inv.business_date);
        const occ = calculateOccupancy(dateInv);
        const forecast = forecasts.find((f) => f.business_date === inv.business_date);
        acc.push({
          date: inv.business_date,
          occupancy: Math.round(occ.occupancyPct * 10) / 10,
          expectedOccupancy: forecast?.expected_occupancy_pct ?? 65,
        });
        return acc;
      }, [])
      .sort((a, b) => a.date.localeCompare(b.date));

    // Booking pace (14 days)
    const bookingPace = forecasts.map((f) => {
      const pace = calculateBookingPace(
        reservations,
        f.business_date,
        hotel.total_rooms,
        f.expected_occupancy_pct,
      );
      return {
        date: f.business_date,
        cumulativeBookings: pace.cumulativeBookings,
        expectedPace: pace.expectedPace,
      };
    });

    // Channel breakdown
    const channelBreakdown = (channels as { id: string; name: string; is_direct: boolean; commission_rate_basis_points: number }[]).map((ch) => {
      const chReservations = reservations.filter(
        (r) => r.channel_id === ch.id && r.status !== 'CANCELLED',
      );
      const revenue = chReservations.reduce((s, r) => s + r.total_amount_cents, 0);
      const commission = chReservations.reduce((s, r) => s + r.commission_cents, 0);
      return {
        channel: ch.name,
        reservations: chReservations.length,
        revenue,
        commission,
        isDirect: ch.is_direct,
      };
    }).filter((c) => c.reservations > 0);

    // Priority message
    const highSeverityOpps = openOpps.filter((o) => o.severity === 'CRITICAL' || o.severity === 'HIGH');
    const abandonedBookings = openOpps.filter((o) => o.type === 'ABANDONED_BOOKING');
    let priorityMessage = 'All systems nominal. No critical actions needed.';
    if (highSeverityOpps.length > 0) {
      priorityMessage = `${risk.roomsAtRisk} rooms at risk tomorrow. ${abandonedBookings.length} abandoned bookings to recover.`;
    } else if (openOpps.length > 0) {
      priorityMessage = `${openOpps.length} opportunities available. Review and act on medium-priority items.`;
    }

    const potentialRevenue = openOpps.reduce(
      (sum, opportunity) =>
        sum +
        Math.max(
          0,
          opportunity.expected_value_cents -
            opportunity.estimated_cost_cents,
        ),
      0,
    );

    const dashboardData: DashboardData = {
      hotel,
      todayOccupancy: Math.round(occupancy.occupancyPct * 10) / 10,
      expectedOccupancy: expectedOcc.expectedOccupancyPct,
      roomsAtRisk: risk.roomsAtRisk,
      totalRooms: occupancy.totalRooms,
      soldRooms: occupancy.soldRooms,
      availableRooms: occupancy.availableRooms,
      adr: adr.adr,
      revenueToday: adr.totalRevenue,
      opportunities: openOpps.map((o) => ({
        id: o.id,
        type: o.type,
        severity: o.severity,
        reason: o.reason,
        rooms_affected: o.rooms_affected,
        expected_value_cents: o.expected_value_cents,
        confidence_pct: o.confidence_pct,
        recommended_action: o.recommended_action,
        status: o.status,
        business_date: o.business_date,
        expires_at: o.expires_at,
      })),
      occupancyTrend,
      bookingPace,
      channelBreakdown,
      priorityMessage,
      potentialRevenue,
    };

    return NextResponse.json({ data: dashboardData, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load dashboard';
    return NextResponse.json(
      { data: null, error: { code: 'DASHBOARD_ERROR', message } },
      { status: 500 },
    );
  }
}
