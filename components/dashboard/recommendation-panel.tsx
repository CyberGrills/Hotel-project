import { cn } from '@/lib/utils';
import { Lightbulb, Check, X, AlertCircle } from 'lucide-react';
import type { Recommendation } from '@/types';
import { formatCents } from '@/lib/money';

interface RecommendationPanelProps {
  recommendation: Recommendation | null;
  currency?: string;
  className?: string;
}

export function RecommendationPanel({ recommendation, currency = 'USD', className }: RecommendationPanelProps) {
  if (!recommendation) {
    return (
      <div className={cn('rounded-xl border bg-slate-50 p-6 text-center', className)}>
        <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No recommendation generated yet.</p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border bg-card p-5 shadow-sm', className)}>
      <div className="flex items-start gap-3 mb-4">
        <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600 shrink-0">
          <Lightbulb className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-base">Recommended Action</h3>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {recommendation.action_type.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{recommendation.reason}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-xs text-muted-foreground mb-1">Expected net revenue</p>
          <p className="text-lg font-bold text-emerald-600">
            {formatCents(recommendation.expected_incremental_revenue_cents, currency as never)}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-muted-foreground mb-1">Acquisition cost</p>
          <p className="text-lg font-bold text-slate-700">
            {formatCents(recommendation.estimated_acquisition_cost_cents, currency as never)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Channel</p>
          <p className="font-medium">{recommendation.expected_channel || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Room nights</p>
          <p className="font-medium">{recommendation.expected_room_nights}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Confidence</p>
          <p className="font-medium">{Math.round(recommendation.confidence_pct)}%</p>
        </div>
      </div>

      {recommendation.assumptions && recommendation.assumptions.length > 0 && (
        <div className="border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Assumptions used</p>
          <ul className="space-y-1.5">
            {recommendation.assumptions.map((assumption, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                {assumption}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
