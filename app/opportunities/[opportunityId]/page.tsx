'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SeverityBadge } from '@/components/dashboard/severity-badge';
import { ConfidenceBadge } from '@/components/dashboard/confidence-badge';
import { RecommendationPanel } from '@/components/dashboard/recommendation-panel';
import { RevenueImpact } from '@/components/dashboard/revenue-impact';
import { LoadingState, ErrorState } from '@/components/dashboard/states';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Play, CheckCircle, XCircle, Clock, FileText, Lightbulb } from 'lucide-react';
import { formatCents } from '@/lib/money';
import type { OpportunityDetail } from '@/types';

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const opportunityId = params.opportunityId as string;

  const [data, setData] = useState<OpportunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [resolving, setResolving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load opportunity');
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/simulate`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      toast.success('Action simulated successfully', {
        description: `${json.data.outcome.rooms_sold} rooms sold, net revenue: ${formatCents(json.data.outcome.net_incremental_revenue_cents)}`,
      });
      fetchData();
    } catch (err) {
      toast.error('Simulation failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setSimulating(false);
    }
  };

  const handleResolve = async (resolution: 'RESOLVED' | 'DISMISSED') => {
    setResolving(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      toast.success(resolution === 'RESOLVED' ? 'Opportunity resolved' : 'Opportunity dismissed');
      router.push('/opportunities');
    } catch (err) {
      toast.error('Failed to resolve', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
      setResolving(false);
    }
  };

  if (loading) return <LoadingState label="Loading opportunity…" className="min-h-[60vh]" />;
  if (error) return <ErrorState message={error} onRetry={fetchData} className="min-h-[60vh]" />;
  if (!data) return <ErrorState message="Opportunity not found" className="min-h-[60vh]" />;

  const expires = data.expires_at ? new Date(data.expires_at) : null;
  const hoursLeft = expires ? Math.max(0, Math.round((expires.getTime() - Date.now()) / (1000 * 60 * 60))) : null;
  const hasOutcome = data.outcome && data.outcome.outcome !== 'PENDING';

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-[1200px]">
      <Button variant="ghost" size="sm" onClick={() => router.push('/opportunities')} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" />
        Back to opportunities
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <SeverityBadge severity={data.severity} />
          <ConfidenceBadge confidence={data.confidence_pct} />
          {hoursLeft !== null && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {hoursLeft > 24 ? `${Math.round(hoursLeft / 24)}d left` : `${hoursLeft}h left`}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(data.created_at).toLocaleString()}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{data.reason}</h1>
        {data.business_date && (
          <p className="text-sm text-muted-foreground">
            Target date: {new Date(data.business_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Evidence + Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Evidence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-slate-400" />
                Evidence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.evidence && data.evidence.length > 0 ? (
                data.evidence.map((ev, i) => (
                  <div key={i} className="flex items-start justify-between gap-4 border-b last:border-0 pb-2 last:pb-0">
                    <span className="text-sm text-muted-foreground">{ev.label}</span>
                    <span className="text-sm font-medium text-right">{ev.detail}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No evidence data available.</p>
              )}
            </CardContent>
          </Card>

          {/* Recommendation */}
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-400" />
              Recommendation
            </h2>
            <RecommendationPanel recommendation={data.recommendation} />
          </div>

          {/* Action Outcome */}
          {hasOutcome && data.outcome && (
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-emerald-700">
                  {data.outcome.outcome === 'SUCCESS' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  Action Outcome: {data.outcome.outcome}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RevenueImpact
                  grossCents={data.outcome.gross_revenue_cents}
                  netCents={data.outcome.net_incremental_revenue_cents}
                  costsCents={
                    data.outcome.acquisition_cost_cents +
                    data.outcome.channel_commission_cents +
                    data.outcome.discount_cost_cents +
                    data.outcome.cancellation_loss_cents
                  }
                />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-muted-foreground">Rooms sold</p>
                    <p className="font-semibold">{data.outcome.rooms_sold}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-muted-foreground">Channel commission</p>
                    <p className="font-semibold">{formatCents(data.outcome.channel_commission_cents)}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-muted-foreground">Discount cost</p>
                    <p className="font-semibold">{formatCents(data.outcome.discount_cost_cents)}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-muted-foreground">Cancellation loss</p>
                    <p className="font-semibold">{formatCents(data.outcome.cancellation_loss_cents)}</p>
                  </div>
                </div>
                {data.outcome.notes && (
                  <p className="text-sm text-muted-foreground border-t pt-3">{data.outcome.notes}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Action Panel */}
        <div className="space-y-4">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">Take Action</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected value</span>
                  <span className="font-semibold text-emerald-600">{formatCents(data.expected_value_cents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. acquisition cost</span>
                  <span className="font-semibold">{formatCents(data.estimated_cost_cents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rooms affected</span>
                  <span className="font-semibold">{data.rooms_affected}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Button
                  className="w-full"
                  onClick={handleSimulate}
                  disabled={simulating || data.status === 'ACTED_ON' || data.status === 'RESOLVED'}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {simulating ? 'Simulating…' : data.status === 'ACTED_ON' ? 'Action simulated' : 'Simulate Action'}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleResolve('RESOLVED')}
                    disabled={resolving || data.status === 'RESOLVED'}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Resolve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleResolve('DISMISSED')}
                    disabled={resolving || data.status === 'DISMISSED'}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Dismiss
                  </Button>
                </div>
              </div>

              {data.status === 'ACTED_ON' && (
                <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg p-2 text-center">
                  Action has been simulated. See outcome details on the left.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Assumptions */}
          {data.assumptions && data.assumptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Assumptions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {data.assumptions.map((a, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-slate-300 mt-0.5">•</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
