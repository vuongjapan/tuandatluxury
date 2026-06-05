import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SiteSettings {
  header_logo_url: string;
  hero_image_url: string;
  hero_video_url: string;
  hero_title: string;
  hero_subtitle: string;
  chatbot_avatar_url: string;
  map_embed_url: string;
  map_embed_code: string;
  google_maps_url: string;
  platform_booking_url: string;
  platform_booking_name: string;
  platform_agoda_url: string;
  platform_agoda_name: string;
  about_image_url: string;
  [key: string]: string;
}

const DEFAULTS: SiteSettings = {
  header_logo_url: '',
  chatbot_avatar_url: '',
  hero_image_url: '',
  hero_video_url: '',
  hero_title: '',
  hero_subtitle: '',
  map_embed_url: '',
  map_embed_code: '',
  about_image_url: '',
  google_maps_url: 'https://maps.app.goo.gl/pBbcvrqXQQT4PVfn6',
  platform_booking_url: 'https://www.booking.com/hotel/vn/tuan-dat-luxury-flc-sam-son-sam-son.vi.html',
  platform_booking_name: 'Booking.com',
  platform_agoda_url: 'https://www.agoda.com/vi-vn/tuan-dat-luxury-flc-sam-son/hotel/sam-son-vn.html?cid=1844104&ds=xB8wClEMQP3qTg7f',
  platform_agoda_name: 'Agoda',
};

const LS_KEY = 'tdl:site_settings_v1';

function readCache(): SiteSettings | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
    if (!raw) return null;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { return null; }
}

function writeCache(s: SiteSettings) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* quota */ }
}

async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data } = await supabase.from('site_settings').select('key, value') as { data: { key: string; value: string }[] | null };
  const mapped = { ...DEFAULTS };
  if (data) {
    data.forEach(row => { mapped[row.key] = row.value; });
  }
  writeCache(mapped);
  return mapped;
}

export function useSiteSettings() {
  const queryClient = useQueryClient();

  const cached = readCache();
  const { data: settings = cached || DEFAULTS, isLoading: loading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: fetchSiteSettings,
    initialData: cached || undefined,
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 ngày — khớp lịch refresh tuần
    gcTime: 7 * 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const updateSetting = async (key: string, value: string) => {
    const { error } = await supabase.from('site_settings').upsert({ key, value, updated_at: new Date().toISOString() } as any, { onConflict: 'key' } as any);
    if (!error) {
      queryClient.setQueryData(['site-settings'], (prev: SiteSettings | undefined) => {
        const next = { ...(prev || DEFAULTS), [key]: value } as SiteSettings;
        writeCache(next);
        return next;
      });
    }
    return error;
  };

  const refetch = () => queryClient.invalidateQueries({ queryKey: ['site-settings'] });

  return { settings, loading, updateSetting, refetch };
}
