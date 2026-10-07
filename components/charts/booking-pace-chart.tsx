'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface BookingPacePoint {
  date: string;
  cumulativeBookings: number;
  expectedPace: number;
}

export function BookingPaceChart({ data }: { data: BookingPacePoint[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    gap: d.cumulativeBookings - d.expectedPace,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={formatted} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
          formatter={(value: number, name: string) => [
            `${value} rooms`,
            name === 'cumulativeBookings' ? 'Booked' : name === 'expectedPace' ? 'Expected' : 'Gap',
          ]}
        />
        <Bar dataKey="cumulativeBookings" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="cumulativeBookings" />
        <Bar dataKey="expectedPace" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="expectedPace" />
      </BarChart>
    </ResponsiveContainer>
  );
}
