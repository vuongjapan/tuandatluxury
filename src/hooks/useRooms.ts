import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Room } from '@/data/rooms';
import { PEAK_MONTHS } from '@/data/rooms';
import { rooms as staticRooms } from '@/data/rooms';

export interface PriceOverride {
  room_id: string;
  override_date: string;
  price_vnd: number;
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

// Convert DB room to frontend Room format
function dbRoomToRoom(db: DBRoom, staticFallback?: Room): Room {
  return {
    id: db.id,
    name: {
      vi: db.name_vi,
      en: db.name_en,
      ja: db.name_ja,
      zh: db.name_zh,
    },
    description: {
      vi: db.description_vi || '',
      en: db.description_en || '',
      ja: db.description_ja || '',
      zh: db.description_zh || '',
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

export function useRooms() {
  const [dbRooms, setDbRooms] = useState<DBRoom[]>([]);
  const [priceOverrides, setPriceOverrides] = useState<PriceOverride[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    setLoading(true);
    const [{ data: roomsData }, { data: overridesData }] = await Promise.all([
      supabase.from('rooms').select('*').eq('is_active', true).order('price_vnd'),
      supabase.from('room_price_overrides').select('*'),
    ]);
    setDbRooms((roomsData as DBRoom[]) || []);
    setPriceOverrides((overridesData as PriceOverride[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRooms(); }, []);

  const rooms: Room[] = useMemo(() => {
    if (dbRooms.length === 0) return staticRooms;
    return dbRooms.map(db => {
      const fallback = staticRooms.find(s => s.id === db.id);
      return dbRoomToRoom(db, fallback);
    });
  }, [dbRooms]);

  // Get price for a room on a specific date, considering overrides
  const getRoomPriceWithOverrides = (room: Room, date: Date): number => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const override = priceOverrides.find(o => o.room_id === room.id && o.override_date === dateStr);
    if (override) return override.price_vnd;

    // Default dynamic pricing
    const month = date.getMonth() + 1;
    const day = date.getDay();
    const isWeekend = day === 0 || day === 6;
    const isPeak = PEAK_MONTHS.includes(month);

    let price = room.priceVND;
    if (isWeekend) price *= room.weekendMultiplier;
    if (isPeak) price *= room.peakMultiplier;

    return Math.round(price / 1000) * 1000;
  };

  return { rooms, loading, fetchRooms, getRoomPriceWithOverrides, priceOverrides };
}
