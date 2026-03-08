import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SiteSettings {
  header_logo_url: string;
  hero_image_url: string;
  chatbot_avatar_url: string;
  map_embed_url: string;
  map_embed_code: string;
  google_maps_url: string;
  platform_booking_url: string;
  platform_booking_name: string;
  platform_agoda_url: string;
  platform_agoda_name: string;
  [key: string]: string;
}

const DEFAULTS: SiteSettings = {
  header_logo_url: '',
  hero_image_url: '',
  map_embed_url: '',
  map_embed_code: '',
  google_maps_url: 'https://maps.app.goo.gl/pBbcvrqXQQT4PVfn6',
  platform_booking_url: 'https://www.booking.com/hotel/vn/tuan-dat-luxury-flc-sam-son-sam-son.vi.html',
  platform_booking_name: 'Booking.com',
  platform_agoda_url: 'https://www.agoda.com/vi-vn/tuan-dat-luxury-flc-sam-son/hotel/sam-son-vn.html?cid=1844104&ds=xB8wClEMQP3qTg7f',
  platform_agoda_name: 'Agoda',
};

async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data } = await supabase.from('site_settings').select('key, value') as { data: { key: string; value: string }[] | null };
  const mapped = { ...DEFAULTS };
  if (data) {
    data.forEach(row => { mapped[row.key] = row.value; });
  }
  return mapped;
}

export function useSiteSettings() {
  const queryClient = useQueryClient();

  const { data: settings = DEFAULTS, isLoading: loading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: fetchSiteSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateSetting = async (key: string, value: string) => {
    const { error } = await supabase.from('site_settings').upsert({ key, value, updated_at: new Date().toISOString() } as any, { onConflict: 'key' } as any);
    if (!error) {
      queryClient.setQueryData(['site-settings'], (prev: SiteSettings | undefined) => ({
        ...(prev || DEFAULTS),
        [key]: value,
      }));
    }
    return error;
  };

  const refetch = () => queryClient.invalidateQueries({ queryKey: ['site-settings'] });

  return { settings, loading, updateSetting, refetch };
}
