import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PromoBanner {
  id: string;
  title_vi: string;
  title_en: string;
  badge_vi: string;
  badge_en: string;
  bullets_vi: string[];
  bullets_en: string[];
  image_url: string | null;
  cta_label_vi: string;
  cta_label_en: string;
  cta_link: string;
  sort_order: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

export function usePromoBanners() {
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['promo-banners'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('promo_banners')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) {
        console.warn('Failed to fetch promo banners:', error);
        return [] as PromoBanner[];
      }
      return ((data || []) as any[]).map((b) => ({
        ...b,
        bullets_vi: Array.isArray(b.bullets_vi) ? b.bullets_vi : [],
        bullets_en: Array.isArray(b.bullets_en) ? b.bullets_en : [],
      })) as PromoBanner[];
    },
    staleTime: 60 * 1000,
  });

  // Active for public display (filter by date on client just in case)
  const now = new Date();
  const activeBanners = data.filter((b) => {
    if (!b.is_active) return false;
    if (b.start_date && new Date(b.start_date) > now) return false;
    if (b.end_date && new Date(b.end_date) < now) return false;
    return true;
  });

  return { banners: data, activeBanners, isLoading, refetch };
}
