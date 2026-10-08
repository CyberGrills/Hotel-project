import { NextResponse } from 'next/server';
import { getAccessibleHotels } from '@/server/hotels';

export async function GET() {
  try {
    return NextResponse.json({ data: await getAccessibleHotels(), error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch accessible hotels';
    return NextResponse.json(
      { data: null, error: { code: 'HOTELS_ERROR', message } },
      { status: 500 },
    );
  }
}
