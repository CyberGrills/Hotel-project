import { NextResponse } from 'next/server';
import { generateOpportunities, getOpenOpportunities, DEMO_HOTEL_ID } from '@/server/services';

export async function GET(request: Request) {
  try {
    // Re-generate opportunities from current data
    const { searchParams } =
      new URL(request.url);

    const hotelId =
      searchParams.get("hotelId") ||
      DEMO_HOTEL_ID;

    await generateOpportunities(
      hotelId,
    );

    const opportunities =
      await getOpenOpportunities(
        hotelId,
      );
    return NextResponse.json({ data: opportunities, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch opportunities';
    return NextResponse.json(
      { data: null, error: { code: 'OPPORTUNITIES_ERROR', message } },
      { status: 500 },
    );
  }
}
