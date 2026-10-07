import { NextRequest, NextResponse } from 'next/server';
import { resolveOpportunity } from '@/server/services';

export async function POST(
  request: NextRequest,
  { params }: { params: { opportunityId: string } },
) {
  try {
    const body = await request.json().catch(() => ({}));
    const resolution = body.resolution === 'DISMISSED' ? 'DISMISSED' : 'RESOLVED';
    await resolveOpportunity(params.opportunityId, resolution);
    return NextResponse.json({ data: { status: resolution }, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to resolve opportunity';
    return NextResponse.json(
      { data: null, error: { code: 'RESOLVE_ERROR', message } },
      { status: 500 },
    );
  }
}
