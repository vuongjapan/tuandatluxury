import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PromoPopup {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  position: 'bottom-left' | 'bottom-right' | 'center';
  display_delay_seconds: number;
  dismiss_duration_hours: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  sort_order: number;
}

export function usePromoPopups() {
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['promo-popups'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('promo_popups')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) {
        console.warn('promo_popups fetch failed', error);
        return [] as PromoPopup[];
      }
      return (data || []) as PromoPopup[];
    },
    staleTime: 60 * 1000,
  });

  const now = new Date();
  const activePopups = data.filter((p) => {
    if (!p.is_active) return false;
    if (p.start_date && new Date(p.start_date) > now) return false;
    if (p.end_date && new Date(p.end_date) < now) return false;
    return true;
  });

  return { popups: data, activePopups, isLoading, refetch };
}
