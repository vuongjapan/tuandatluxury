import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Promotion {
  id: string;
  title_vi: string;
  title_en: string;
  description_vi: string | null;
  description_en: string | null;
  icon: string;
  image_url: string | null;
  benefits_vi: string[];
  benefits_en: string[];
  discount_percent: number;
  applies_to_tier: string;
  sort_order: number;
  is_active: boolean;
}

export const usePromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPromotions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('promotions' as any)
      .select('*')
      .order('sort_order');
    setPromotions((data as any as Promotion[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPromotions(); }, []);

  return { promotions, loading, refetch: fetchPromotions };
};
