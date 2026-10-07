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
import { formatCentsCompact } from '@/lib/money';

interface ChannelBreakdownItem {
  channel: string;
  reservations: number;
  revenue: number;
  commission: number;
  isDirect: boolean;
}

export function ChannelChart({ data, currency = 'USD' }: { data: ChannelBreakdownItem[]; currency?: string }) {
  const chartData = data.map((d) => ({
    ...d,
    label: d.channel.length > 12 ? d.channel.slice(0, 10) + '…' : d.channel,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatCentsCompact(v, currency as never)} />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
          formatter={(value: number) => [formatCentsCompact(value, currency as never), 'Revenue']}
        />
        <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.isDirect ? '#0ea5e9' : '#f59e0b'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
