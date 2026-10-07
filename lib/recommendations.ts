import type {
  Opportunity,
  ActionType,
} from '@/types';

import {
  calculateNetRevenue,
} from './calculations';

export interface RecommendationInput {
  opportunity: Opportunity;
  avgRateCents: number;
  totalRooms: number;
  channelCommissionBps: number;
  expectedOccupancyPct: number;
}

export interface GeneratedRecommendation {
  action_type: ActionType;
  reason: string;
  expected_incremental_revenue_cents: number;
  estimated_acquisition_cost_cents: number;
  expected_channel: string;
  expected_room_nights: number;
  confidence_pct: number;
  assumptions: string[];
}

export function generateRecommendation(
  input: RecommendationInput,
): GeneratedRecommendation {
  const {
    opportunity,
    avgRateCents,
    channelCommissionBps,
  } = input;

  switch (opportunity.type) {
    case 'UNSOLD_INVENTORY':
    case 'WEAK_BOOKING_PACE':
    case 'WEEKEND_DEMAND': {
      const roomsTargeted = Math.max(
        1,
        Math.round(
          opportunity.rooms_affected * 0.7,
        ),
      );

      const expectedRoomNights =
        roomsTargeted * 2;

      const grossRevenue =
        roomsTargeted *
        avgRateCents *
        2;

      const acquisitionCost =
        Math.round(grossRevenue * 0.08);

      const commission = 0;

      const discountCost =
        Math.round(grossRevenue * 0.10);

      const cancellationLoss =
        Math.round(
          (grossRevenue - discountCost) *
            0.05,
        );

      const net = calculateNetRevenue(
        grossRevenue,
        acquisitionCost,
        commission,
        discountCost,
        cancellationLoss,
      );

      return {
        action_type: 'CREATE_OFFER',
        reason:
          `Launch a targeted direct booking offer for ` +
          `${roomsTargeted} of ${opportunity.rooms_affected} ` +
          `at-risk rooms. Direct distribution avoids OTA commission ` +
          `while creating a measurable demand response.`,
        expected_incremental_revenue_cents:
          net.netRevenue,
        estimated_acquisition_cost_cents:
          acquisitionCost,
        expected_channel:
          'Direct Website',
        expected_room_nights:
          expectedRoomNights,
        confidence_pct:
          opportunity.confidence_pct,
        assumptions: [
          `70% of at-risk rooms are targetable`,
          'Average 2-night stay',
          '10% promotional discount',
          '8% acquisition cost allocation',
          '5% expected cancellation rate',
        ],
      };
    }

    case 'ABANDONED_BOOKING': {
      const grossRevenue =
        opportunity.expected_value_cents;

      const acquisitionCost = 200;

      const discountCost =
        Math.round(grossRevenue * 0.05);

      const cancellationLoss =
        Math.round(
          (grossRevenue - discountCost) *
            0.05,
        );

      const net = calculateNetRevenue(
        grossRevenue,
        acquisitionCost,
        0,
        discountCost,
        cancellationLoss,
      );

      return {
        action_type: 'RECOVER_BOOKING',
        reason:
          'Send a personalized recovery message to the cancelled guest with a controlled incentive. The recovery remains direct and avoids OTA commission.',
        expected_incremental_revenue_cents:
          net.netRevenue,
        estimated_acquisition_cost_cents:
          acquisitionCost,
        expected_channel:
          'Direct Website',
        expected_room_nights:
          Math.max(
            1,
            opportunity.rooms_affected,
          ),
        confidence_pct:
          Math.min(
            opportunity.confidence_pct,
            75,
          ),
        assumptions: [
          'Guest can still be contacted',
          'Recovery message sent within 24 hours',
          '5% incentive',
          '5% cancellation allowance',
        ],
      };
    }

    case 'RATE_OPTIMIZATION': {
      const grossRevenue =
        opportunity.expected_value_cents;

      return {
        action_type: 'INCREASE_RATE',
        reason:
          'Increase rate on dates where demand and competitive pricing support a higher price without materially reducing booking velocity.',
        expected_incremental_revenue_cents:
          grossRevenue,
        estimated_acquisition_cost_cents: 0,
        expected_channel:
          'All channels',
        expected_room_nights:
          opportunity.rooms_affected,
        confidence_pct:
          opportunity.confidence_pct,
        assumptions: [
          'Demand is sufficiently price-insensitive',
          'Competitive rates support the increase',
          'Rate change applies to new bookings',
        ],
      };
    }

    case 'CHANNEL_COST_OPTIMIZATION': {
      const commissionSavings =
        opportunity.expected_value_cents;

      const incentiveCost =
        opportunity.estimated_cost_cents;

      const netSavings =
        Math.max(
          0,
          commissionSavings -
            incentiveCost,
        );

      return {
        action_type: 'SHIFT_CHANNEL',
        reason:
          `Shift eligible OTA demand toward direct booking where the expected commission saving exceeds the direct-booking incentive cost.`,
        expected_incremental_revenue_cents:
          netSavings,
        estimated_acquisition_cost_cents:
          incentiveCost,
        expected_channel:
          'Direct Website',
        expected_room_nights:
          opportunity.rooms_affected,
        confidence_pct:
          opportunity.confidence_pct,
        assumptions: [
          'Direct incentive costs less than OTA commission',
          '30% of eligible OTA demand can shift direct',
          'Rate parity is maintained',
        ],
      };
    }

    case 'GROUP_INQUIRY':
    case 'CORPORATE_OPPORTUNITY': {
      const grossRevenue =
        opportunity.expected_value_cents;

      const acquisitionCost = 500;

      const discountCost =
        Math.round(
          grossRevenue * 0.15,
        );

      const net = calculateNetRevenue(
        grossRevenue,
        acquisitionCost,
        0,
        discountCost,
        0,
      );

      return {
        action_type: 'FOLLOW_UP_GROUP',
        reason:
          'Follow up with a tailored group or corporate proposal. The opportunity should be commercially qualified before discounting.',
        expected_incremental_revenue_cents:
          net.netRevenue,
        estimated_acquisition_cost_cents:
          acquisitionCost,
        expected_channel:
          'Direct Sales',
        expected_room_nights:
          opportunity.rooms_affected,
        confidence_pct:
          Math.min(
            opportunity.confidence_pct,
            70,
          ),
        assumptions: [
          '15% maximum planning discount',
          'Direct sales channel',
          'Multi-room booking potential',
          'Human approval for material discounts',
        ],
      };
    }

    case 'UPGRADE_OPPORTUNITY': {
      return {
        action_type: 'OFFER_UPGRADE',
        reason:
          'Offer eligible arriving guests a controlled room upgrade where higher-category inventory remains available.',
        expected_incremental_revenue_cents:
          opportunity.expected_value_cents,
        estimated_acquisition_cost_cents: 0,
        expected_channel:
          'Direct Pre-arrival',
        expected_room_nights:
          opportunity.rooms_affected,
        confidence_pct:
          opportunity.confidence_pct,
        assumptions: [
          'Higher room category has availability',
          'Upgrade offer is sent before arrival',
          'Upgrade price remains attractive to the guest',
        ],
      };
    }

    case 'EXTENDED_STAY': {
      const grossRevenue =
        opportunity.expected_value_cents;

      const acquisitionCost = 100;

      const discountCost =
        Math.round(
          grossRevenue * 0.08,
        );

      const net = calculateNetRevenue(
        grossRevenue,
        acquisitionCost,
        0,
        discountCost,
        0,
      );

      return {
        action_type: 'OFFER_PACKAGE',
        reason:
          'Offer an extended-stay package to increase room nights from an already-acquired guest.',
        expected_incremental_revenue_cents:
          net.netRevenue,
        estimated_acquisition_cost_cents:
          acquisitionCost,
        expected_channel:
          'Direct Website',
        expected_room_nights:
          opportunity.rooms_affected,
        confidence_pct:
          opportunity.confidence_pct,
        assumptions: [
          '8% discount on incremental nights',
          'Existing guest requires no new acquisition',
          'Guest has extension potential',
        ],
      };
    }

    default:
      return {
        action_type: 'DO_NOTHING',
        reason:
          'No commercially justified action is currently recommended.',
        expected_incremental_revenue_cents: 0,
        estimated_acquisition_cost_cents: 0,
        expected_channel: 'N/A',
        expected_room_nights: 0,
        confidence_pct: 50,
        assumptions: [],
      };
  }
}
