'use client';

import { useEffect, useState, useCallback } from 'react';
import { OpportunityCard } from '@/components/dashboard/opportunity-card';
import { LoadingState, ErrorState, EmptyState } from '@/components/dashboard/states';
import { Target } from 'lucide-react';
import type { OpportunitySummary } from '@/types';

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<OpportunitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/opportunities');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      setOpportunities(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState label="Generating opportunities…" className="min-h-[60vh]" />;
  if (error) return <ErrorState message={error} onRetry={fetchData} className="min-h-[60vh]" />;

  const high = opportunities.filter((o) => o.severity === 'CRITICAL' || o.severity === 'HIGH');
  const med = opportunities.filter((o) => o.severity === 'MEDIUM');
  const low = opportunities.filter((o) => o.severity === 'LOW');

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-[1200px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Selling Opportunities</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {opportunities.length} opportunities generated from your hotel data
        </p>
      </div>

      {opportunities.length === 0 ? (
        <EmptyState
          title="No open opportunities"
          description="The system analyzes inventory, demand, and reservations to find opportunities. Everything looks healthy right now."
          icon={<Target className="h-10 w-10" />}
        />
      ) : (
        <div className="space-y-6">
          {high.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">High Priority ({high.length})</p>
              {high.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </section>
          )}
          {med.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Medium Priority ({med.length})</p>
              {med.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </section>
          )}
          {low.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-semibold text-sky-600 uppercase tracking-wide">Low Priority ({low.length})</p>
              {low.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
