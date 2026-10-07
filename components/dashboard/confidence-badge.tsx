import { cn } from '@/lib/utils';

interface ConfidenceBadgeProps {
  confidence: number;
  className?: string;
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  const pct = Math.round(confidence);
  const color =
    pct >= 80 ? 'text-emerald-600 bg-emerald-50' :
    pct >= 65 ? 'text-amber-600 bg-amber-50' :
    'text-slate-500 bg-slate-50';

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium', color, className)}>
      <span className="flex h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {pct}% confidence
    </span>
  );
}
