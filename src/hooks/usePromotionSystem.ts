import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FlashSale {
  id: string;
  title_vi: string;
  title_en: string;
  description_vi: string | null;
  description_en: string | null;
  start_time: string;
  end_time: string;
  is_active: boolean;
  sort_order: number;
  items?: FlashSaleItem[];
}

export interface FlashSaleItem {
  id: string;
  flash_sale_id: string;
  item_type: string;
  item_id: string;
  item_name_vi: string;
  item_name_en: string;
  image_url: string | null;
  original_price: number;
  sale_price: number;
  quantity_limit: number;
  quantity_sold: number;
  sort_order: number;
}

export interface DiscountCode {
  id: string;
  code: string;
  title_vi: string;
  title_en: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  applies_to: string;
  max_uses: number;
  used_count: number;
  max_uses_per_user: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface GlobalDiscount {
  id: string;
  title_vi: string;
  title_en: string;
  discount_percent: number;
  applies_to: string;
  start_date: string;
  end_date: string;
  allow_stacking: boolean;
  max_total_discount: number;
  is_active: boolean;
}

export interface SmartPricingRule {
  id: string;
  rule_type: string;
  title_vi: string;
  title_en: string;
  badge_text_vi: string | null;
  badge_text_en: string | null;
  min_days_advance: number | null;
  day_of_week: number | null;
  specific_date: string | null;
  occupancy_threshold: number | null;
  discount_percent: number;
  applies_to: string;
  is_active: boolean;
  sort_order: number;
}

export const useFlashSales = () => {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    const now = new Date().toISOString();
    const { data: sales } = await supabase
      .from('flash_sales' as any)
      .select('*')
      .eq('is_active', true)
      .lte('start_time', now)
      .gte('end_time', now)
      .order('sort_order');

    if (sales && sales.length > 0) {
      const saleIds = (sales as any[]).map((s: any) => s.id);
      const { data: items } = await supabase
        .from('flash_sale_items' as any)
        .select('*')
        .in('flash_sale_id', saleIds)
        .order('sort_order');

      const salesWithItems = (sales as any[]).map((s: any) => ({
        ...s,
        items: ((items as any[]) || []).filter((i: any) => i.flash_sale_id === s.id),
      }));
      setFlashSales(salesWithItems as FlashSale[]);
    } else {
      setFlashSales([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);
  return { flashSales, loading, refetch: fetch };
};

export const useDiscountCodes = () => {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('discount_codes' as any)
      .select('*')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .order('created_at', { ascending: false });
    setCodes((data as any as DiscountCode[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);
  return { codes, loading, refetch: fetch };
};

export const useGlobalDiscounts = () => {
  const [discounts, setDiscounts] = useState<GlobalDiscount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('global_discounts' as any)
      .select('*')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now);
    setDiscounts((data as any as GlobalDiscount[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);
  return { discounts, loading, refetch: fetch };
};

export const useSmartPricing = () => {
  const [rules, setRules] = useState<SmartPricingRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('smart_pricing_rules' as any)
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    setRules((data as any as SmartPricingRule[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);
  return { rules, loading, refetch: fetch };
};

// Validate a discount code – check both `discount_codes` (admin promotions) and `voucher_codes` (batch QR)
export const validateDiscountCode = async (
  code: string,
  orderType: 'room' | 'food',
  orderAmount: number,
): Promise<{ valid: boolean; discount?: DiscountCode; message?: string }> => {
  const upper = code.toUpperCase().trim();
  const now = new Date();

  // 1) Try discount_codes (admin-defined promotions)
  const { data: dc } = await supabase
    .from('discount_codes' as any)
    .select('*')
    .eq('code', upper)
    .eq('is_active', true)
    .maybeSingle();

  if (dc) {
    const d = dc as any as DiscountCode;
    if (now < new Date(d.start_date) || now > new Date(d.end_date)) return { valid: false, message: 'Mã đã hết hạn' };
    if (d.used_count >= d.max_uses) return { valid: false, message: 'Mã đã hết lượt sử dụng' };
    if (d.applies_to !== 'all' && d.applies_to !== orderType) return { valid: false, message: `Mã chỉ áp dụng cho ${d.applies_to === 'room' ? 'đặt phòng' : 'đồ ăn'}` };
    if (orderAmount < d.min_order_amount) return { valid: false, message: `Đơn tối thiểu ${d.min_order_amount.toLocaleString()}₫` };
    return { valid: true, discount: d };
  }

  // 2) Fallback: voucher_codes (batch-generated QR vouchers like TDLUX-XXXX)
  const { data: vc } = await supabase
    .from('voucher_codes' as any)
    .select('*')
    .eq('code', upper)
    .maybeSingle();

  if (!vc) return { valid: false, message: 'Mã không tồn tại' };
  const v = vc as any;
  if (v.status !== 'active') return { valid: false, message: 'Mã không còn hiệu lực' };
  if (now < new Date(v.start_date)) return { valid: false, message: 'Mã chưa đến ngày sử dụng' };
  if (now > new Date(v.end_date)) return { valid: false, message: 'Mã đã hết hạn' };
  if (v.used_count >= v.usage_limit) return { valid: false, message: 'Mã đã được sử dụng' };

  // Map voucher_codes → DiscountCode shape so DiscountCodeInput can render & Booking flow can apply
  const mapped: DiscountCode = {
    id: v.id,
    code: v.code,
    title_vi: v.campaign_name || `Voucher ${v.code}`,
    title_en: v.campaign_name || `Voucher ${v.code}`,
    discount_type: v.discount_type,
    discount_value: Number(v.discount_value),
    min_order_amount: 0,
    applies_to: 'all',
    max_uses: v.usage_limit,
    used_count: v.used_count,
    max_uses_per_user: 1,
    start_date: v.start_date,
    end_date: v.end_date,
    is_active: true,
  };
  return { valid: true, discount: mapped };
};
