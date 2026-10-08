'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { LoadingState, ErrorState, EmptyState } from '@/components/dashboard/states';
import { formatCents } from '@/lib/money';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import type { Reservation, RoomType, Channel } from '@/types';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
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

      const hotels = hotelsJson.data || [];
      if (!hotels.length) {
        setReservations([]);
        setRoomTypes([]);
        setChannels([]);
        return;
      }

      const savedHotelId = window.localStorage.getItem('apren.activeHotelId');
      const activeHotel = hotels.find((hotel: { id: string }) => hotel.id === savedHotelId) || hotels[0];
      window.localStorage.setItem('apren.activeHotelId', activeHotel.id);

      const { data: resData, error: resErr } = await supabase
        .from('reservations')
        .select('*')
        .eq('hotel_id', activeHotel.id)
        .order('check_in_date', { ascending: false })
        .limit(50);
      if (resErr) throw resErr;

      const { data: rtData, error: rtErr } = await supabase
        .from('room_types')
        .select('*')
        .eq('hotel_id', activeHotel.id);
      if (rtErr) throw rtErr;
      setRoomTypes(rtData || []);

      const { data: chData, error: chErr } = await supabase
        .from('channels')
        .select('*')
        .eq('hotel_id', activeHotel.id);
      if (chErr) throw chErr;
      setChannels(chData || []);

      setReservations((resData || []) as Reservation[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState label="Loading reservations…" className="min-h-[60vh]" />;
  if (error) return <ErrorState message={error} onRetry={fetchData} className="min-h-[60vh]" />;

  const roomTypeName = (id: string) => roomTypes.find((rt) => rt.id === id)?.name || 'Unknown';
  const channelName = (id: string | null) => channels.find((c) => c.id === id)?.name || '—';

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-[1200px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reservations</h1>
        <p className="text-sm text-muted-foreground mt-1">Recent bookings across all channels</p>
      </div>

      {reservations.length === 0 ? (
        <EmptyState title="No reservations found" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Reservations ({reservations.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room Type</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Nights</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((res) => (
                  <TableRow key={res.id}>
                    <TableCell className="font-medium">{res.guest_name || '—'}</TableCell>
                    <TableCell>{roomTypeName(res.room_type_id)}</TableCell>
                    <TableCell className="text-muted-foreground">{channelName(res.channel_id)}</TableCell>
                    <TableCell>{res.check_in_date}</TableCell>
                    <TableCell>{res.check_out_date}</TableCell>
                    <TableCell>{res.nights}</TableCell>
                    <TableCell className="font-medium">{formatCents(res.total_amount_cents)}</TableCell>
                    <TableCell>
                      <Badge variant={res.status === 'CANCELLED' ? 'destructive' : res.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                        {res.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
