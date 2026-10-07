import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, BedDouble, Users } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  sublabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: 'occupancy' | 'revenue' | 'risk' | 'adr' | 'rooms' | 'guests';
  severity?: 'normal' | 'warning' | 'critical';
}

const iconMap = {
  occupancy: Users,
  revenue: DollarSign,
  risk: AlertTriangle,
  adr: TrendingUp,
  rooms: BedDouble,
  guests: Users,
};

export function MetricCard({ label, value, sublabel, trend, icon, severity = 'normal' }: MetricCardProps) {
  const Icon = icon ? iconMap[icon] : null;
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground';
  const severityBorder =
    severity === 'critical' ? 'border-l-4 border-l-red-500' :
    severity === 'warning' ? 'border-l-4 border-l-amber-500' : '';

  return (
    <div className={cn(
      'rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md',
      severityBorder,
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {sublabel && (
            <p className={cn('text-xs', trendColor)}>{sublabel}</p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            'rounded-lg p-2.5',
            severity === 'critical' ? 'bg-red-50 text-red-600' :
            severity === 'warning' ? 'bg-amber-50 text-amber-600' :
            'bg-slate-50 text-slate-600',
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
