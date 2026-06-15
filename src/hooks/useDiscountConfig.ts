import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DiscountConfig {
  id: string;
  vip_tier1_bookings: number;
  vip_tier1_discount: number;
  vip_tier2_bookings: number;
  vip_tier2_discount: number;
  vip_tier3_bookings: number;
  vip_tier3_discount: number;
  vip_applies_to: string;
  group_min_people: number;
  group_discount_min: number;
  group_discount_max: number;
  group_note: string;
  min_individual_per_person: number;
}

const DEFAULT: DiscountConfig = {
  id: '',
  vip_tier1_bookings: 2,
  vip_tier1_discount: 5,
  vip_tier2_bookings: 3,
  vip_tier2_discount: 8,
  vip_tier3_bookings: 5,
  vip_tier3_discount: 10,
  vip_applies_to: 'room_only',
  group_min_people: 30,
  group_discount_min: 5,
  group_discount_max: 10,
  group_note: 'Liên hệ trực tiếp để được báo giá đoàn tốt nhất',
  min_individual_per_person: 300000,
};

export function useDiscountConfig() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['discount-config'],
    queryFn: async () => {
      const { data } = await supabase.from('discount_config' as any).select('*').limit(1).maybeSingle();
      return (data as any as DiscountConfig) || DEFAULT;
    },
    staleTime: 60_000,
  });
  return { config: data || DEFAULT, loading: isLoading, refetch };
}

export async function updateDiscountConfig(id: string, patch: Partial<DiscountConfig>) {
  return supabase.from('discount_config' as any).update(patch as any).eq('id', id);
}

export interface VipTierInfo {
  tier: 0 | 1 | 2 | 3;
  percent: number;
  label: string; // e.g. "VIP Hạng 2" or "Thành viên"
}

/** Returns highest applicable VIP tier given the user's confirmed booking count. */
export function getVipTierInfo(cfg: DiscountConfig, totalBookings: number): VipTierInfo {
  if (totalBookings >= cfg.vip_tier3_bookings) return { tier: 3, percent: cfg.vip_tier3_discount, label: 'VIP Hạng 3' };
  if (totalBookings >= cfg.vip_tier2_bookings) return { tier: 2, percent: cfg.vip_tier2_discount, label: 'VIP Hạng 2' };
  if (totalBookings >= cfg.vip_tier1_bookings) return { tier: 1, percent: cfg.vip_tier1_discount, label: 'VIP Hạng 1' };
  return { tier: 0, percent: 0, label: 'Thành viên' };
}

/** Backwards-compatible helper: only returns the percent. */
export function getVipDiscountPercent(cfg: DiscountConfig, totalBookings: number): number {
  return getVipTierInfo(cfg, totalBookings).percent;
}

export function useUserBookingCount(email: string | null | undefined) {
  const { data, isLoading } = useQuery({
    queryKey: ['user-booking-count', email],
    queryFn: async () => {
      if (!email) return 0;
      const { data } = await supabase
        .from('user_bookings_count' as any)
        .select('total_bookings')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();
      return ((data as any)?.total_bookings as number) || 0;
    },
    enabled: !!email,
    staleTime: 30_000,
  });
  return { totalBookings: data || 0, loading: isLoading };
}
