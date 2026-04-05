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
  status: 'open' | 'closed' | 'limited' | 'combo';
  rooms_available: number;
  note?: string;
}

export interface SpecialDatePrice {
  id: string;
  date: string;
  is_active: boolean;
  note: string | null;
}

export interface SpecialRoomPrice {
  id: string;
  special_date_id: string;
  room_id: string;
  price: number;
}

export interface RoomImage {
  id: string;
  room_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  is_active: boolean;
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

function dbRoomToRoom(db: DBRoom, staticFallback?: Room, images?: RoomImage[]): Room {
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
    images: images?.map(img => img.image_url) || [],
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

function getSafeData<T>(
  result: PromiseSettledResult<any>,
  fallback: T,
): T {
  if (result.status !== 'fulfilled' || result.value?.error) return fallback;
  return (result.value?.data ?? fallback) as T;
}

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function fetchRoomsData() {
  const [roomsResult, monthlyPricesResult, dailyAvailabilityResult, specialDatesResult, specialRoomPricesResult, roomImagesResult] = await Promise.allSettled([
    supabase.from('rooms').select('*').eq('is_active', true).order('price_vnd'),
    supabase.from('room_monthly_prices').select('*'),
    supabase.from('room_daily_availability').select('*'),
    supabase.from('special_date_prices').select('*').eq('is_active', true),
    supabase.from('special_room_prices').select('*'),
    supabase.from('room_images').select('*').eq('is_active', true).order('sort_order'),
  ]);

  return {
    dbRooms: getSafeData<DBRoom[]>(roomsResult, []),
    monthlyPrices: getSafeData<MonthlyPrice[]>(monthlyPricesResult, []),
    dailyAvailability: getSafeData<DailyAvailability[]>(dailyAvailabilityResult, []),
    specialDates: getSafeData<SpecialDatePrice[]>(specialDatesResult, []),
    specialRoomPrices: getSafeData<SpecialRoomPrice[]>(specialRoomPricesResult, []),
    roomImages: getSafeData<RoomImage[]>(roomImagesResult, []),
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
  const specialDates = data?.specialDates || [];
  const specialRoomPrices = data?.specialRoomPrices || [];
  const roomImages = data?.roomImages || [];

  // Build a map of date -> special_date_id for fast lookup
  const specialDateMap = useMemo(() => {
    const map: Record<string, SpecialDatePrice> = {};
    specialDates.forEach(sd => { map[sd.date] = sd; });
    return map;
  }, [specialDates]);

  const rooms: Room[] = useMemo(() => {
    if (dbRooms.length === 0) return staticRooms;
    return dbRooms.map((db) => {
      const fallback = staticRooms.find((s) => s.id === db.id);
      const images = roomImages.filter(img => img.room_id === db.id);
      return dbRoomToRoom(db, fallback, images);
    });
  }, [dbRooms, roomImages]);

  const getRoomPrice = useCallback((room: Room, date: Date): number => {
    const dateStr = toDateStr(date);
    const specialDate = specialDateMap[dateStr];
    if (specialDate) {
      const srp = specialRoomPrices.find(p => p.special_date_id === specialDate.id && p.room_id === room.id);
      if (srp) return srp.price;
    }
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
  }, [monthlyPrices, specialDateMap, specialRoomPrices]);

  const isSpecialDate = useCallback((date: Date): SpecialDatePrice | null => {
    return specialDateMap[toDateStr(date)] || null;
  }, [specialDateMap]);

  const getAvailability = useCallback((roomId: string, date: Date): DailyAvailability | null => {
    const dateStr = toDateStr(date);
    return dailyAvailability.find((a) => a.room_id === roomId && a.date === dateStr) || null;
  }, [dailyAvailability]);

  const isDateAvailable = useCallback((roomId: string, date: Date): boolean => {
    const avail = getAvailability(roomId, date);
    if (!avail) return true;
    return avail.status === 'open' || avail.status === 'combo' || (avail.status === 'limited' && avail.rooms_available > 0);
  }, [getAvailability]);

  const hasComboRequiredDays = useCallback((roomId: string, checkIn: Date, checkOut: Date): boolean => {
    const d = new Date(checkIn);
    const endDate = new Date(checkOut);
    while (d < endDate) {
      const avail = getAvailability(roomId, d);
      if (avail?.status === 'combo') return true;
      d.setDate(d.getDate() + 1);
    }
    return false;
  }, [getAvailability]);

  return {
    rooms,
    loading,
    fetchRooms: refetch,
    getRoomPrice,
    getAvailability,
    isDateAvailable,
    hasComboRequiredDays,
    isSpecialDate,
    monthlyPrices,
    dailyAvailability,
    specialDates,
    specialRoomPrices,
    roomImages,
  };
}
