'use client';

import { useEffect, useState, useCallback } from 'react';
import { MetricCard } from '@/components/dashboard/metric-card';
import { OpportunityCard } from '@/components/dashboard/opportunity-card';
import { ChartCard } from '@/components/dashboard/chart-card';
import { OccupancyChart } from '@/components/charts/occupancy-chart';
import { BookingPaceChart } from '@/components/charts/booking-pace-chart';
import { ChannelChart } from '@/components/charts/channel-chart';
import { LoadingState, ErrorState, EmptyState } from '@/components/dashboard/states';
import { formatCents, formatCentsCompact } from '@/lib/money';
import { Target, Sparkles, AlertTriangle } from 'lucide-react';
import type { DashboardData, Hotel } from '@/types';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const hotelsRes = await fetch('/api/hotels', { cache: 'no-store' });
      if (!hotelsRes.ok) throw new Error(`HTTP ${hotelsRes.status}`);
      const hotelsJson = await hotelsRes.json();
      if (hotelsJson.error) throw new Error(hotelsJson.error.message);
      const accessibleHotels = (hotelsJson.data || []) as Hotel[];
      setHotels(accessibleHotels);
      if (accessibleHotels.length === 0) {
        setData(null);
        return;
      }
      const savedHotelId = window.localStorage.getItem('apren.activeHotelId');
      const activeHotel = accessibleHotels.find((hotel) => hotel.id === savedHotelId) || accessibleHotels[0];
      window.localStorage.setItem('apren.activeHotelId', activeHotel.id);
      const res = await fetch(`/api/hotels/${activeHotel.id}/dashboard`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState label="Analyzing hotel data…" className="min-h-[60vh]" />;
  if (error) return <ErrorState message={error} onRetry={fetchData} className="min-h-[60vh]" />;
  if (hotels.length === 0) return <EmptyState title="Hotel access is not configured" description="Your account is authenticated, but it is not a member of any hotel property yet. Ask a hotel owner or manager to grant your account access." className="min-h-[60vh]" />;
  if (!data) return <EmptyState title="No data available" className="min-h-[60vh]" />;

  const highSeverity = data.opportunities.filter((o) => o.severity === 'CRITICAL' || o.severity === 'HIGH');
  const medSeverity = data.opportunities.filter((o) => o.severity === 'MEDIUM');
  const lowSeverity = data.opportunities.filter((o) => o.severity === 'LOW');

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-slate-400" />
          <p className="text-sm text-muted-foreground">Good morning, {data.hotel.name}</p>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">What should the hotel do next?</h1>
        <p className="text-sm text-muted-foreground mt-1">{data.priorityMessage}</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Today's Occupancy"
          value={`${data.todayOccupancy}%`}
          sublabel={`Expected: ${data.expectedOccupancy.toFixed(0)}%`}
          icon="occupancy"
          trend={data.todayOccupancy >= data.expectedOccupancy ? 'up' : 'down'}
          severity={data.todayOccupancy < 50 ? 'warning' : 'normal'}
        />
        <MetricCard
          label="Rooms at Risk"
          value={`${data.roomsAtRisk}`}
          sublabel={`${data.availableRooms} rooms still available tomorrow`}
          icon="risk"
          severity={data.roomsAtRisk >= 20 ? 'critical' : data.roomsAtRisk >= 10 ? 'warning' : 'normal'}
        />
        <MetricCard
          label="Average Daily Rate"
          value={formatCents(data.adr, data.hotel.currency)}
          sublabel="Across all active reservations"
          icon="adr"
        />
        <MetricCard
          label="Potential Revenue"
          value={formatCentsCompact(data.potentialRevenue)}
          sublabel={`From ${data.opportunities.length} open opportunities`}
          icon="revenue"
          trend="up"
        />
      </div>

      {/* Priority Action Banner */}
      {highSeverity.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-amber-900">Priority Action Required</p>
              <p className="text-sm text-amber-700 mt-0.5">
                {highSeverity.length} high-priority opportunities need attention.{' '}
                Potential revenue at stake: {formatCents(
                  highSeverity.reduce((s, o) => s + o.expected_value_cents, 0),
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Occupancy vs Expected"
          description="Actual occupancy compared to forecast over the next 14 days"
        >
          <OccupancyChart data={data.occupancyTrend} />
        </ChartCard>
        <ChartCard
          title="Booking Pace"
          description="Current bookings vs expected pace by date"
        >
          <BookingPaceChart data={data.bookingPace} />
        </ChartCard>
      </div>

      {/* Opportunities + Channel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-slate-400" />
              Selling Opportunities
            </h2>
          </div>

          {data.opportunities.length === 0 ? (
            <EmptyState
              title="No opportunities right now"
              description="Opportunities are generated automatically from your hotel data. Check back later or adjust inventory."
              icon={<Target className="h-10 w-10" />}
            />
          ) : (
            <div className="space-y-3">
              {highSeverity.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">High Priority</p>
                  {highSeverity.map((opp) => (
                    <OpportunityCard key={opp.id} opportunity={opp} />
                  ))}
                </div>
              )}
              {medSeverity.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Medium Priority</p>
                  {medSeverity.map((opp) => (
                    <OpportunityCard key={opp.id} opportunity={opp} />
                  ))}
                </div>
              )}
              {lowSeverity.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-sky-600 uppercase tracking-wide">Low Priority</p>
                  {lowSeverity.map((opp) => (
                    <OpportunityCard key={opp.id} opportunity={opp} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <ChartCard
            title="Revenue by Channel"
            description="Booking revenue distribution"
          >
            {data.channelBreakdown.length > 0 ? (
              <ChannelChart data={data.channelBreakdown} />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No channel data yet</p>
            )}
          </ChartCard>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="font-semibold text-sm mb-3">Quick Summary</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total rooms</span>
                <span className="font-medium">{data.totalRooms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sold today</span>
                <span className="font-medium">{data.soldRooms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available today</span>
                <span className="font-medium">{data.availableRooms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revenue today</span>
                <span className="font-medium">{formatCents(data.revenueToday)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Open opportunities</span>
                <span className="font-medium">{data.opportunities.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
