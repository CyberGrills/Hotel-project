import type {
  Opportunity,
  Recommendation,
  ActionType,
  EvidenceItem,
} from '@/types';
import {
  calculateOpportunityValue,
  calculateInventoryRisk,
  calculateBookingPace,
} from './calculations';
import { netRevenue } from './money';

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

export function generateRecommendation(input: RecommendationInput): GeneratedRecommendation {
  const { opportunity, avgRateCents, channelCommissionBps } = input;

  switch (opportunity.type) {
    case 'UNSOLD_INVENTORY':
    case 'WEAK_BOOKING_PACE':
    case 'WEEKEND_DEMAND': {
      const roomsTargeted = Math.round(opportunity.rooms_affected * 0.7);
      const expectedRoomNights = roomsTargeted * 2;
      const grossRevenue = roomsTargeted * avgRateCents * 2;
      const acquisitionCost = Math.round(grossRevenue * 0.08);
      const commission = Math.round((grossRevenue * channelCommissionBps) / 10000);
      const discountCost = Math.round(grossRevenue * 0.1);
      const net = netRevenue(grossRevenue, acquisitionCost, commission, discountCost, 0);
      return {
        action_type: 'CREATE_OFFER',
        reason: `Launch a targeted direct booking offer for ${roomsTargeted} of ${opportunity.rooms_affected} at-risk rooms. Direct channel avoids OTA commission and captures last-minute leisure demand.`,
        expected_incremental_revenue_cents: net,
        estimated_acquisition_cost_cents: acquisitionCost,
        expected_channel: 'Direct Website',
        expected_room_nights: expectedRoomNights,
        confidence_pct: opportunity.confidence_pct,
        assumptions: [
          `70% of at-risk rooms are targetable (${roomsTargeted} of ${opportunity.rooms_affected})`,
          'Average 2-night stay for weekend leisure demand',
          '10% discount applied to stimulate demand',
          '8% of gross revenue allocated to acquisition (email + social)',
          '5% expected cancellation rate',
        ],
      };
    }

    case 'ABANDONED_BOOKING': {
      const roomsTargeted = 1;
      const grossRevenue = opportunity.expected_value_cents;
      const acquisitionCost = 200;
      const commission = 0;
      const discountCost = Math.round(grossRevenue * 0.05);
      const net = netRevenue(grossRevenue, acquisitionCost, commission, discountCost, 0);
      return {
        action_type: 'RECOVER_BOOKING',
        reason: `Send a personalized recovery email to the abandoned guest with a small incentive (5% discount or free breakfast). Direct channel with zero commission makes recovery highly profitable.`,
        expected_incremental_revenue_cents: net,
        estimated_acquisition_cost_cents: acquisitionCost,
        expected_channel: 'Direct Website',
        expected_room_nights: 2,
        confidence_pct: Math.min(opportunity.confidence_pct, 75),
        assumptions: [
          'Guest abandoned during checkout, not early in funnel',
          '5% discount or complimentary breakfast as incentive',
          'Email is sent within 24 hours of abandonment',
          'No OTA commission since recovery is direct',
        ],
      };
    }

    case 'RATE_OPTIMIZATION': {
      const grossRevenue = opportunity.expected_value_cents;
      const acquisitionCost = 0;
      const commission = 0;
      const net = netRevenue(grossRevenue, acquisitionCost, commission, 0, 0);
      return {
        action_type: 'INCREASE_RATE',
        reason: `Increase rate by 8-12% for dates with strong demand signals. Competitor rates support a higher price point without impacting booking velocity.`,
        expected_incremental_revenue_cents: net,
        estimated_acquisition_cost_cents: 0,
        expected_channel: 'All channels',
        expected_room_nights: opportunity.rooms_affected,
        confidence_pct: opportunity.confidence_pct,
        assumptions: [
          'Competitor average rate supports higher pricing',
          'Demand signals indicate price insensitivity',
          'Rate change applies to new bookings only',
        ],
      };
    }

    case 'CHANNEL_COST_OPTIMIZATION': {
      const grossRevenue = opportunity.expected_value_cents;
      const acquisitionCost = 0;
      const commissionSavings = opportunity.estimated_cost_cents;
      const net = grossRevenue + commissionSavings;
      return {
        action_type: 'SHIFT_CHANNEL',
        reason: `Shift bookings from high-commission OTA to direct channel. Save ${commissionSavings} in commission costs by offering a direct booking incentive that costs less than the OTA commission.`,
        expected_incremental_revenue_cents: net,
        estimated_acquisition_cost_cents: Math.round(commissionSavings * 0.3),
        expected_channel: 'Direct Website',
        expected_room_nights: opportunity.rooms_affected,
        confidence_pct: opportunity.confidence_pct,
        assumptions: [
          'Direct booking incentive (e.g., free breakfast) costs less than OTA commission',
          '30% of OTA bookers can be converted to direct with incentive',
          'No negative impact on OTA ranking from rate parity',
        ],
      };
    }

    case 'GROUP_INQUIRY':
    case 'CORPORATE_OPPORTUNITY': {
      const grossRevenue = opportunity.expected_value_cents;
      const acquisitionCost = 500;
      const commission = 0;
      const discountCost = Math.round(grossRevenue * 0.15);
      const net = netRevenue(grossRevenue, acquisitionCost, commission, discountCost, 0);
      return {
        action_type: 'FOLLOW_UP_GROUP',
        reason: `Follow up on the group/corporate inquiry with a tailored proposal. Group bookings provide multi-night revenue and repeat business potential.`,
        expected_incremental_revenue_cents: net,
        estimated_acquisition_cost_cents: acquisitionCost,
        expected_channel: 'Direct Sales',
        expected_room_nights: opportunity.rooms_affected,
        confidence_pct: Math.min(opportunity.confidence_pct, 70),
        assumptions: [
          '15% group discount applied to rack rate',
          'Direct sales channel — no OTA commission',
          'Group booking covers multiple room nights',
          'Human approval recommended for large groups',
        ],
      };
    }

    case 'UPGRADE_OPPORTUNITY': {
      const grossRevenue = opportunity.expected_value_cents;
      const acquisitionCost = 0;
      const commission = 0;
      const net = netRevenue(grossRevenue, acquisitionCost, commission, 0, 0);
      return {
        action_type: 'OFFER_UPGRADE',
        reason: `Offer room upgrades to arriving guests at a discounted rate. Upgrades generate pure incremental revenue with zero acquisition cost.`,
        expected_incremental_revenue_cents: net,
        estimated_acquisition_cost_cents: 0,
        expected_channel: 'Direct (pre-arrival email)',
        expected_room_nights: opportunity.rooms_affected,
        confidence_pct: opportunity.confidence_pct,
        assumptions: [
          'Upgrade offered at 40% of rate difference',
          'Pre-arrival email 24 hours before check-in',
          'Higher room types have available inventory',
        ],
      };
    }

    case 'EXTENDED_STAY': {
      const grossRevenue = opportunity.expected_value_cents;
      const acquisitionCost = 100;
      const commission = 0;
      const discountCost = Math.round(grossRevenue * 0.08);
      const net = netRevenue(grossRevenue, acquisitionCost, commission, discountCost, 0);
      return {
        action_type: 'OFFER_PACKAGE',
        reason: `Offer an extended-stay package with discounted rate for additional nights. Longer stays increase total revenue per guest.`,
        expected_incremental_revenue_cents: net,
        estimated_acquisition_cost_cents: acquisitionCost,
        expected_channel: 'Direct Website',
        expected_room_nights: opportunity.rooms_affected,
        confidence_pct: opportunity.confidence_pct,
        assumptions: [
          '8% discount on extended nights',
          'Guest already booked — no acquisition cost',
          'Direct channel only',
        ],
      };
    }

    default:
      return {
        action_type: 'DO_NOTHING',
        reason: 'No specific action recommended at this time.',
        expected_incremental_revenue_cents: 0,
        estimated_acquisition_cost_cents: 0,
        expected_channel: 'N/A',
        expected_room_nights: 0,
        confidence_pct: 50,
        assumptions: [],
      };
  }
}
