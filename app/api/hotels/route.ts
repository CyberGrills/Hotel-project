import { NextResponse } from 'next/server';
import { getHotel } from '@/server/services';
import type { Hotel } from '@/types';

export async function GET() {
  try {
    const hotel = await getHotel();
    if (!hotel) {
      return NextResponse.json(
        { data: null, error: { code: 'HOTEL_NOT_FOUND', message: 'Hotel not found' } },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: hotel as Hotel, error: null });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch hotel' } },
      { status: 500 },
    );
  }
}
