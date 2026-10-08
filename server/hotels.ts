import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Hotel } from '@/types';

export async function getAccessibleHotels(): Promise<Hotel[]> {
  const supabase = createServerSupabaseClient();
  const { data: memberships, error: membershipError } = await supabase
    .from('hotel_members')
    .select('hotel_id, role')
    .order('created_at', { ascending: true });
  if (membershipError) throw membershipError;
  if (!memberships?.length) return [];

  const ids = memberships.map((membership) => membership.hotel_id);
  const { data: hotels, error: hotelError } = await supabase
    .from('hotels')
    .select('*')
    .in('id', ids)
    .order('name', { ascending: true });
  if (hotelError) throw hotelError;

  const byId = new Map((hotels || []).map((hotel) => [hotel.id, hotel]));
  return memberships.map((m) => byId.get(m.hotel_id)).filter((hotel): hotel is Hotel => Boolean(hotel));
}

export async function getPrimaryAccessibleHotel(): Promise<Hotel | null> {
  return (await getAccessibleHotels())[0] || null;
}
