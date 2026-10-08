import { NextResponse } from 'next/server';
import { generateOpportunities, getOpenOpportunities } from '@/server/services';
import { getPrimaryAccessibleHotel } from '@/server/hotels';

export async function GET() {
  try {
    const hotel = await getPrimaryAccessibleHotel();
    if (!hotel) {
      return NextResponse.json(
        { data: [], error: { code: 'HOTEL_ACCESS_REQUIRED', message: 'No hotel membership is assigned to this account' } },
        { status: 403 },
      );
    }

    await generateOpportunities(hotel.id);
    const opportunities = await getOpenOpportunities(hotel.id);
    return NextResponse.json({ data: opportunities, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch opportunities';
    return NextResponse.json(
      { data: null, error: { code: 'OPPORTUNITIES_ERROR', message } },
      { status: 500 },
    );
  }
}
