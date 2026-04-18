import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RoomPopupSettings {
  id: string;
  room_id: string;
  badge_vi: string | null;
  badge_en: string | null;
  badge_color: string | null;
  cta_primary_vi: string | null;
  cta_primary_en: string | null;
  cta_secondary_vi: string | null;
  cta_secondary_en: string | null;
  highlights_vi: string[];
  highlights_en: string[];
  policy_vi: string | null;
  policy_en: string | null;
  short_pitch_vi: string | null;
  short_pitch_en: string | null;
  is_active: boolean;
}

async function fetchAll(): Promise<RoomPopupSettings[]> {
  const { data, error } = await supabase
    .from('room_popup_settings')
    .select('*')
    .eq('is_active', true);
  if (error) {
    console.error('useRoomPopupSettings:', error);
    return [];
  }
  return (data || []) as RoomPopupSettings[];
}

/** Returns popup settings keyed by room_id. */
export function useRoomPopupSettings() {
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['room-popup-settings'],
    queryFn: fetchAll,
    staleTime: 5 * 60 * 1000,
  });

  const map = new Map<string, RoomPopupSettings>();
  data.forEach((s) => map.set(s.room_id, s));

  return { settings: data, byRoomId: map, loading: isLoading, refetch };
}
