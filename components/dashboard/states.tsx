import { cn } from '@/lib/utils';
import { Inbox, Loader2, AlertTriangle } from 'lucide-react';

export function EmptyState({
  title = 'Nothing here yet',
  description,
  icon,
  className,
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center', className)}>
      <div className="mb-3 text-muted-foreground">
        {icon || <Inbox className="h-10 w-10" />}
      </div>
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>}
    </div>
  );
}

export function LoadingState({
  label = 'Loading…',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-center gap-3 p-12', className)}>
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

export function ErrorState({
  message = 'Something went wrong',
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-12 text-center', className)}>
      <AlertTriangle className="mb-3 h-10 w-10 text-red-400" />
      <p className="font-medium text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
