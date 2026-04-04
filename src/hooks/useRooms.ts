import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Room } from '@/data/rooms';
import { rooms as staticRooms } from '@/data/rooms';

export interface MonthlyPrice {
  id: string;
  room_id: string;
  year: number;
  month: number;
  price_weekday: number;
  price_weekend: number;
  price_sunday: number;
}

export interface DailyAvailability {
  id: string;
  room_id: string;
  date: string;
  status: 'open' | 'closed' | 'limited';
  rooms_available: number;
  note?: string;
}

export interface DBRoom {
  id: string;
  name_vi: string;
  name_en: string;
  name_ja: string;
  name_zh: string;
  description_vi: string | null;
  description_en: string | null;
  description_ja: string | null;
  description_zh: string | null;
  price_vnd: number;
  capacity: number;
  size_sqm: number;
  amenities: string[] | null;
  image_url: string | null;
  weekend_multiplier: number | null;
  peak_multiplier: number | null;
  is_active: boolean | null;
}

function dbRoomToRoom(db: DBRoom, staticFallback?: Room): Room {
  return {
    id: db.id,
    name: { vi: db.name_vi, en: db.name_en, ja: db.name_ja, zh: db.name_zh },
    description: {
      vi: db.description_vi || '', en: db.description_en || '',
      ja: db.description_ja || '', zh: db.description_zh || '',
    },
    priceVND: db.price_vnd,
    capacity: db.capacity,
    size: db.size_sqm,
    amenities: db.amenities || [],
    image: db.image_url || staticFallback?.image || '/placeholder.svg',
    weekendMultiplier: db.weekend_multiplier || 1.3,
    peakMultiplier: db.peak_multiplier || 1.5,
  };
}

function getNightType(date: Date): 'weekday' | 'weekend' | 'sunday' {
  const day = date.getDay();
  if (day === 0) return 'sunday';
  if (day === 5 || day === 6) return 'weekend';
  return 'weekday';
}

function getSafeData<T>(result: PromiseSettledResult<{ data: T | null; error: unknown }>, fallback: T): T {
  if (result.status !== 'fulfilled' || result.value.error) return fallback;
  return result.value.data ?? fallback;
}

async function fetchRoomsData() {
  const [roomsResult, monthlyPricesResult, dailyAvailabilityResult] = await Promise.allSettled([
    supabase.from('rooms').select('*').eq('is_active', true).order('price_vnd'),
    supabase.from('room_monthly_prices').select('*'),
    supabase.from('room_daily_availability').select('*'),
  ]);

  return {
    dbRooms: getSafeData(roomsResult, [] as DBRoom[]),
    monthlyPrices: getSafeData(monthlyPricesResult, [] as MonthlyPrice[]),
    dailyAvailability: getSafeData(dailyAvailabilityResult, [] as DailyAvailability[]),
  };
}

export function useRooms() {
  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['rooms-data'],
    queryFn: fetchRoomsData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const dbRooms = data?.dbRooms || [];
  const monthlyPrices = data?.monthlyPrices || [];
  const dailyAvailability = data?.dailyAvailability || [];

  const rooms: Room[] = useMemo(() => {
    if (dbRooms.length === 0) return staticRooms;
    return dbRooms.map((db) => {
      const fallback = staticRooms.find((s) => s.id === db.id);
      return dbRoomToRoom(db, fallback);
    });
  }, [dbRooms]);

  const getRoomPrice = useCallback((room: Room, date: Date): number => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const nightType = getNightType(date);

    const mp = monthlyPrices.find((p) => p.room_id === room.id && p.year === year && p.month === month);
    if (mp) {
      if (nightType === 'weekday') return mp.price_weekday;
      if (nightType === 'weekend') return mp.price_weekend;
      return mp.price_sunday;
    }

    return room.priceVND;
  }, [monthlyPrices]);

  const getAvailability = useCallback((roomId: string, date: Date): DailyAvailability | null => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return dailyAvailability.find((a) => a.room_id === roomId && a.date === dateStr) || null;
  }, [dailyAvailability]);

  const isDateAvailable = useCallback((roomId: string, date: Date): boolean => {
    const avail = getAvailability(roomId, date);
    if (!avail) return true;
    return avail.status === 'open' || (avail.status === 'limited' && avail.rooms_available > 0);
  }, [getAvailability]);

  return {
    rooms,
    loading,
    fetchRooms: refetch,
    getRoomPrice,
    getAvailability,
    isDateAvailable,
    monthlyPrices,
    dailyAvailability,
  };
}
