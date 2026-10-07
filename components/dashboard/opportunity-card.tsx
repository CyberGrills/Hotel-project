import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatCentsCompact } from '@/lib/money';
import { SeverityBadge } from './severity-badge';
import { ConfidenceBadge } from './confidence-badge';
import { ChevronRight, Clock, BedDouble, Mail, TrendingUp, ArrowRightCircle } from 'lucide-react';
import type { OpportunitySummary, OpportunityType } from '@/types';

interface OpportunityCardProps {
  opportunity: OpportunitySummary;
  href?: string;
  currency?: string;
}

const typeIcon: Record<OpportunityType, React.ElementType> = {
  UNSOLD_INVENTORY: BedDouble,
  WEAK_BOOKING_PACE: TrendingUp,
  WEEKEND_DEMAND: TrendingUp,
  ABANDONED_BOOKING: Mail,
  GROUP_INQUIRY: ArrowRightCircle,
  CORPORATE_OPPORTUNITY: ArrowRightCircle,
  UPGRADE_OPPORTUNITY: TrendingUp,
  RATE_OPTIMIZATION: TrendingUp,
  CHANNEL_COST_OPTIMIZATION: TrendingUp,
  EXTENDED_STAY: Clock,
};

const typeLabel: Record<OpportunityType, string> = {
  UNSOLD_INVENTORY: 'Unsold Inventory',
  WEAK_BOOKING_PACE: 'Weak Booking Pace',
  WEEKEND_DEMAND: 'Weekend Demand',
  ABANDONED_BOOKING: 'Abandoned Booking',
  GROUP_INQUIRY: 'Group Inquiry',
  CORPORATE_OPPORTUNITY: 'Corporate Opportunity',
  UPGRADE_OPPORTUNITY: 'Upgrade Opportunity',
  RATE_OPTIMIZATION: 'Rate Optimization',
  CHANNEL_COST_OPTIMIZATION: 'Channel Cost',
  EXTENDED_STAY: 'Extended Stay',
};

export function OpportunityCard({ opportunity, href, currency = 'USD' }: OpportunityCardProps) {
  const Icon = typeIcon[opportunity.type] || BedDouble;
  const link = href || `/opportunities/${opportunity.id}`;
  const expires = opportunity.expires_at ? new Date(opportunity.expires_at) : null;
  const hoursLeft = expires ? Math.max(0, Math.round((expires.getTime() - Date.now()) / (1000 * 60 * 60))) : null;

  return (
    <Link href={link} className="block">
      <div className="group rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="mt-0.5 rounded-lg bg-slate-50 p-2 text-slate-600 shrink-0">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">{typeLabel[opportunity.type]}</span>
                <SeverityBadge severity={opportunity.severity} />
              </div>
              <p className="text-sm font-medium text-foreground line-clamp-2">{opportunity.reason}</p>
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                {opportunity.rooms_affected > 0 && (
                  <span className="text-xs text-muted-foreground">{opportunity.rooms_affected} rooms</span>
                )}
                <span className="text-xs font-semibold text-emerald-600">
                  {formatCentsCompact(opportunity.expected_value_cents, currency as never)}
                </span>
                <ConfidenceBadge confidence={opportunity.confidence_pct} />
                {hoursLeft !== null && hoursLeft <= 24 && (
                  <span className="text-xs text-amber-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {hoursLeft}h left
                  </span>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
