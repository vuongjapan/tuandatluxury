import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SiteSettings {
  map_embed_url: string;
  google_maps_url: string;
  platform_booking_url: string;
  platform_booking_name: string;
  platform_agoda_url: string;
  platform_agoda_name: string;
  [key: string]: string;
}

const DEFAULTS: SiteSettings = {
  map_embed_url: '',
  google_maps_url: 'https://maps.app.goo.gl/pBbcvrqXQQT4PVfn6',
  platform_booking_url: 'https://www.booking.com/Share-fQj3dBe',
  platform_booking_name: 'Booking.com',
  platform_agoda_url: 'https://www.agoda.com/vi-vn/tuan-dat-luxury-flc-sam-son/hotel/sam-son-vn.html?cid=1844104&ds=xB8wClEMQP3qTg7f',
  platform_agoda_name: 'Agoda',
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data } = await supabase.from('site_settings').select('key, value') as { data: { key: string; value: string }[] | null };
    if (data) {
      const mapped = { ...DEFAULTS };
      data.forEach(row => { mapped[row.key] = row.value; });
      setSettings(mapped);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const updateSetting = async (key: string, value: string) => {
    const { error } = await supabase.from('site_settings').upsert({ key, value, updated_at: new Date().toISOString() } as any, { onConflict: 'key' } as any);
    if (!error) setSettings(prev => ({ ...prev, [key]: value }));
    return error;
  };

  return { settings, loading, updateSetting, refetch: fetchSettings };
}
