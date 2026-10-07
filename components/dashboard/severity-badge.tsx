import { cn } from '@/lib/utils';
import type { OpportunitySeverity } from '@/types';

interface SeverityBadgeProps {
  severity: OpportunitySeverity;
  className?: string;
}

const styles: Record<OpportunitySeverity, string> = {
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
  LOW: 'bg-sky-100 text-sky-700 border-sky-200',
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        styles[severity],
        className,
      )}
    >
      {severity}
    </span>
  );
}
