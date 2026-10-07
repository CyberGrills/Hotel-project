import { NextResponse } from 'next/server';
import { simulateAction } from '@/server/services';

export async function POST(
  _request: Request,
  { params }: { params: { opportunityId: string } },
) {
  try {
    const { action, outcome } = await simulateAction(params.opportunityId);
    return NextResponse.json({ data: { action, outcome }, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Simulation failed';
    return NextResponse.json(
      { data: null, error: { code: 'SIMULATION_ERROR', message } },
      { status: 500 },
    );
  }
}
