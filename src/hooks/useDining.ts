import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DiningCategory {
  id: string;
  slug: string;
  name_vi: string;
  name_en: string;
  description_vi: string | null;
  description_en: string | null;
  image_url: string | null;
  serving_hours: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface DiningItem {
  id: string;
  category_id: string;
  name_vi: string;
  name_en: string;
  description_vi: string | null;
  description_en: string | null;
  image_url: string | null;
  price_vnd: number;
  is_combo: boolean;
  combo_serves: number | null;
  sort_order: number;
  is_active: boolean;
}

export function useDining() {
  const [categories, setCategories] = useState<DiningCategory[]>([]);
  const [items, setItems] = useState<DiningItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: cats }, { data: its }] = await Promise.all([
      supabase.from('dining_categories').select('*').order('sort_order'),
      supabase.from('dining_items').select('*').order('sort_order'),
    ]);
    setCategories((cats as DiningCategory[]) || []);
    setItems((its as DiningItem[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const getItemsByCategory = (categoryId: string) =>
    items.filter(i => i.category_id === categoryId);

  return { categories, items, loading, fetchAll, getItemsByCategory };
}
