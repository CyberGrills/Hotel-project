import { NextResponse } from 'next/server';
import {
  getOpportunityById,
  getHotel,
  getRoomTypes,
  getRecommendationForOpportunity,
  getActionForOpportunity,
  getOutcomeForAction,
  generateRecommendationForOpportunity,
} from '@/server/services';
import type { OpportunityDetail } from '@/types';

export async function GET(
  _request: Request,
  { params }: { params: { opportunityId: string } },
) {
  try {
    const opportunity = await getOpportunityById(params.opportunityId);
    if (!opportunity) {
      return NextResponse.json(
        { data: null, error: { code: 'OPPORTUNITY_NOT_FOUND', message: 'Opportunity not found' } },
        { status: 404 },
      );
    }

    const hotel = await getHotel(opportunity.hotel_id);
    const roomTypes = await getRoomTypes(opportunity.hotel_id);
    const roomType = opportunity.room_type_id
      ? roomTypes.find((rt) => rt.id === opportunity.room_type_id) || null
      : null;

    // Get or generate recommendation
    let recommendation = await getRecommendationForOpportunity(params.opportunityId);
    if (!recommendation) {
      recommendation = await generateRecommendationForOpportunity(params.opportunityId);
    }

    const action = await getActionForOpportunity(params.opportunityId);
    let outcome = null;
    if (action) {
      outcome = await getOutcomeForAction(action.id);
    }

    const detail: OpportunityDetail = {
      ...opportunity,
      hotel: hotel!,
      room_type: roomType,
      recommendation,
      action,
      outcome,
    };

    return NextResponse.json({ data: detail, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch opportunity';
    return NextResponse.json(
      { data: null, error: { code: 'OPPORTUNITY_ERROR', message } },
      { status: 500 },
    );
  }
}
