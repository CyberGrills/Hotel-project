import { cn } from '@/lib/utils';
import { formatCents } from '@/lib/money';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RevenueImpactProps {
  grossCents: number;
  netCents: number;
  costsCents: number;
  currency?: string;
  label?: string;
  className?: string;
}

export function RevenueImpact({
  grossCents,
  netCents,
  costsCents,
  currency = 'USD',
  label = 'Net incremental revenue',
  className,
}: RevenueImpactProps) {
  const isPositive = netCents > 0;
  const isZero = netCents === 0;
  const Icon = isPositive ? TrendingUp : isZero ? Minus : TrendingDown;
  const color = isPositive ? 'text-emerald-600' : isZero ? 'text-muted-foreground' : 'text-red-500';

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Icon className={cn('h-5 w-5', color)} />
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={cn('text-2xl font-bold', color)}>{formatCents(netCents, currency as never)}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="rounded-lg bg-slate-50 p-2.5">
          <p className="text-muted-foreground">Gross revenue</p>
          <p className="font-semibold text-slate-700">{formatCents(grossCents, currency as never)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2.5">
          <p className="text-muted-foreground">Total costs</p>
          <p className="font-semibold text-slate-700">{formatCents(costsCents, currency as never)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2.5">
          <p className="text-muted-foreground">Margin</p>
          <p className={cn('font-semibold', color)}>
            {grossCents > 0 ? `${Math.round((netCents / grossCents) * 100)}%` : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
