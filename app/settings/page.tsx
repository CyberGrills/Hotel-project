'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-[800px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hotel Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Property configuration and integration status</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Property</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">Meridian House</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="font-medium">New York, United States</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Total rooms</span><span className="font-medium">120</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Star rating</span><span className="font-medium">4 stars</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Currency</span><span className="font-medium">USD</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Timezone</span><span className="font-medium">America/New_York</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Automation Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">ASSIST mode</p>
              <p className="text-sm text-muted-foreground">The system recommends. Hotel approves every action.</p>
            </div>
            <Badge>Active</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">PMS / Channel Manager</span>
            <Badge variant="secondary">Not connected</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Booking Engine</span>
            <Badge variant="secondary">Not connected</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">CRM / Email</span>
            <Badge variant="secondary">Not connected</Badge>
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Integrations will be added in future phases. Initial hotel data is seeded for the current property and remains protected by hotel membership access controls.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session</CardTitle>
        </CardHeader>
        <CardContent>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Sign out
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
