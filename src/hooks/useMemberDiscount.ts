import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MemberDiscountConfig {
  room_percent: number;
  food_percent: number;
  code: string;
}

export interface PerPersonComboConfig {
  enabled: boolean;
}

const DEFAULT_DISCOUNT: MemberDiscountConfig = { room_percent: 10, food_percent: 15, code: 'MEMBER2025' };
const DEFAULT_PER_PERSON: PerPersonComboConfig = { enabled: false };

function safeParse<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return { ...fallback, ...JSON.parse(raw) }; } catch { return fallback; }
}

export function useMemberDiscount() {
  const { data, isLoading } = useQuery({
    queryKey: ['site-settings', 'member-discounts'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('key, value').in('key', ['member_discounts', 'per_person_combo']);
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => { map[r.key] = r.value; });
      return {
        discount: safeParse<MemberDiscountConfig>(map.member_discounts, DEFAULT_DISCOUNT),
        perPerson: safeParse<PerPersonComboConfig>(map.per_person_combo, DEFAULT_PER_PERSON),
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    discount: data?.discount || DEFAULT_DISCOUNT,
    perPerson: data?.perPerson || DEFAULT_PER_PERSON,
    loading: isLoading,
  };
}

export async function updateMemberDiscount(cfg: MemberDiscountConfig) {
  return supabase.from('site_settings').upsert({
    key: 'member_discounts',
    value: JSON.stringify(cfg),
    updated_at: new Date().toISOString(),
  } as any, { onConflict: 'key' } as any);
}

export async function updatePerPersonCombo(cfg: PerPersonComboConfig) {
  return supabase.from('site_settings').upsert({
    key: 'per_person_combo',
    value: JSON.stringify(cfg),
    updated_at: new Date().toISOString(),
  } as any, { onConflict: 'key' } as any);
}
