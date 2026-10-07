'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Target, TrendingUp, Settings, Hotel } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/opportunities', label: 'Opportunities', icon: Target },
  { href: '/reservations', label: 'Reservations', icon: TrendingUp },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-card">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
          <Hotel className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-sm tracking-tight">āprən</p>
          <p className="text-xs text-muted-foreground">Hotel Seller</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-slate-900 text-white'
                  : 'text-muted-foreground hover:bg-slate-50 hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-700">Meridian House</p>
          <p className="text-xs text-muted-foreground mt-0.5">New York, NY</p>
        </div>
      </div>
    </aside>
  );
}
