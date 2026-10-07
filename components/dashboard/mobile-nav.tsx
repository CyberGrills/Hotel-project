'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Target, Hotel } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/opportunities', label: 'Opportunities', icon: Target },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card">
      <div className="flex items-center justify-around px-2 py-2">
        <Link href="/" className={cn('flex flex-col items-center gap-1 rounded-lg px-4 py-1.5 text-xs', pathname === '/' ? 'text-slate-900 font-medium' : 'text-muted-foreground')}>
          <LayoutDashboard className="h-5 w-5" />
          Dashboard
        </Link>
        <Link href="/opportunities" className={cn('flex flex-col items-center gap-1 rounded-lg px-4 py-1.5 text-xs', pathname.startsWith('/opportunities') ? 'text-slate-900 font-medium' : 'text-muted-foreground')}>
          <Target className="h-5 w-5" />
          Opportunities
        </Link>
        <Link href="/settings" className={cn('flex flex-col items-center gap-1 rounded-lg px-4 py-1.5 text-xs', pathname === '/settings' ? 'text-slate-900 font-medium' : 'text-muted-foreground')}>
          <Hotel className="h-5 w-5" />
          Hotel
        </Link>
      </div>
    </nav>
  );
}
