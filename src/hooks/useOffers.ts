import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type OfferCategory = 'Theo mùa' | 'Thành viên' | 'Cặp đôi' | 'Đoàn' | 'Đặc biệt';

export interface Offer {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  category: string;
  cover_image_url: string | null;
  conditions: string | null;
  expires_at: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const OFFER_CATEGORIES: OfferCategory[] = [
  'Theo mùa',
  'Thành viên',
  'Cặp đôi',
  'Đoàn',
  'Đặc biệt',
];

interface UseOffersOpts {
  featuredOnly?: boolean;
  limit?: number;
  /** When true, also include hidden offers (admin only). */
  includeHidden?: boolean;
}

export const useOffers = (opts: UseOffersOpts = {}) => {
  const { featuredOnly = false, limit, includeHidden = false } = opts;
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('offers' as any)
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (!includeHidden) q = q.eq('is_active', true);
    if (featuredOnly) q = q.eq('is_featured', true);
    if (limit) q = q.limit(limit);

    const { data } = await q;
    setOffers((data as any as Offer[]) || []);
    setLoading(false);
  }, [featuredOnly, limit, includeHidden]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  return { offers, loading, refetch: fetchOffers };
};

export const useOffer = (slug?: string) => {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('offers' as any)
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      setOffer((data as any as Offer) || null);
      setLoading(false);
    })();
  }, [slug]);

  return { offer, loading };
};

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
