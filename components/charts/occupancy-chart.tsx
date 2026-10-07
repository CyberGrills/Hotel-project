'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';

interface OccupancyTrendPoint {
  date: string;
  occupancy: number;
  expectedOccupancy: number;
}

export function OccupancyChart({ data }: { data: OccupancyTrendPoint[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={formatted} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} unit="%" />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
          formatter={(value: number, name: string) => [
            `${value.toFixed(1)}%`,
            name === 'occupancy' ? 'Actual' : 'Expected',
          ]}
        />
        <Area
          type="monotone"
          dataKey="occupancy"
          stroke="#0ea5e9"
          strokeWidth={2}
          fill="url(#occGrad)"
        />
        <Line
          type="monotone"
          dataKey="expectedOccupancy"
          stroke="#94a3b8"
          strokeWidth={1.5}
          strokeDasharray="5 5"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
