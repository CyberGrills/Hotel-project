import { NextResponse } from 'next/server';
import { generateOpportunities, getOpenOpportunities, DEMO_HOTEL_ID } from '@/server/services';

export async function GET() {
  try {
    // Re-generate opportunities from current data
    await generateOpportunities(DEMO_HOTEL_ID);
    const opportunities = await getOpenOpportunities(DEMO_HOTEL_ID);
    return NextResponse.json({ data: opportunities, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch opportunities';
    return NextResponse.json(
      { data: null, error: { code: 'OPPORTUNITIES_ERROR', message } },
      { status: 500 },
    );
  }
}
