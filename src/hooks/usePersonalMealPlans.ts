import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PersonalMealPlan {
  id: string;
  guest_count: number;
  name: string;
  price: number;
  items: string[];
  image_url: string | null;
  note: string | null;
  is_active: boolean;
  sort_order: number;
}

export function usePersonalMealPlans(activeOnly = true) {
  const [plans, setPlans] = useState<PersonalMealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    let q = (supabase as any).from('personal_meal_plans').select('*').order('guest_count', { ascending: true }).order('sort_order', { ascending: true });
    if (activeOnly) q = q.eq('is_active', true);
    const { data } = await q;
    const normalized = ((data as any[]) || []).map(r => ({
      ...r,
      items: Array.isArray(r.items) ? r.items : (typeof r.items === 'string' ? JSON.parse(r.items || '[]') : []),
    })) as PersonalMealPlan[];
    setPlans(normalized);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [activeOnly]);

  const getPlansFor = (count: number) => plans.filter(p => p.guest_count === count && p.is_active);

  /** Suggest closest combinations (e.g., 7 → [5,2]) using available guest_count buckets. */
  const suggestCombination = (target: number): number[] => {
    if (target <= 0) return [];
    const buckets = Array.from(new Set(plans.filter(p => p.is_active).map(p => p.guest_count))).sort((a, b) => b - a);
    if (buckets.length === 0) return [];
    const result: number[] = [];
    let remaining = target;
    for (const b of buckets) {
      while (remaining >= b) { result.push(b); remaining -= b; }
      if (remaining === 0) break;
    }
    return remaining === 0 ? result : [];
  };

  return { plans, loading, fetchAll, getPlansFor, suggestCombination };
}
