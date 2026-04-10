import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MenuItemPrice {
  id: string;
  menu_item_id: string;
  label_vi: string;
  label_en: string;
  price_vnd: number;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  name_vi: string;
  name_en: string;
  description_vi: string | null;
  description_en: string | null;
  price_vnd: number;
  category: string;
  image_url: string | null;
  is_popular: boolean;
  sort_order: number;
  price_variants?: MenuItemPrice[];
}

const PAGE_SIZE = 20;

export function useMenuItems() {
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const cacheRef = useRef<MenuItem[] | null>(null);

  useEffect(() => {
    const fetch = async () => {
      if (cacheRef.current) {
        setAllItems(cacheRef.current);
        setLoading(false);
        return;
      }
      setLoading(true);
      const [{ data: menuData }, { data: priceData }] = await Promise.all([
        supabase.from('menu_items').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('menu_item_prices').select('*').eq('is_active', true).order('sort_order'),
      ]);
      const prices = (priceData || []) as MenuItemPrice[];
      const priceMap = new Map<string, MenuItemPrice[]>();
      prices.forEach(p => {
        const list = priceMap.get(p.menu_item_id) || [];
        list.push(p);
        priceMap.set(p.menu_item_id, list);
      });
      const items = ((menuData || []) as MenuItem[]).map(item => ({
        ...item,
        price_variants: priceMap.get(item.id) || [],
      }));
      cacheRef.current = items;
      setAllItems(items);
      setLoading(false);
    };
    fetch();
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(allItems.map(i => i.category))];
    return cats.sort();
  }, [allItems]);

  const filtered = useMemo(() => {
    let result = allItems;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(i =>
        i.name_vi.toLowerCase().includes(s) ||
        i.name_en.toLowerCase().includes(s)
      );
    }

    if (category) {
      result = result.filter(i => i.category === category);
    }

    if (priceRange) {
      switch (priceRange) {
        case '<100k': result = result.filter(i => i.price_vnd < 100000); break;
        case '100k-500k': result = result.filter(i => i.price_vnd >= 100000 && i.price_vnd <= 500000); break;
        case '500k-1m': result = result.filter(i => i.price_vnd > 500000 && i.price_vnd <= 1000000); break;
        case '>1m': result = result.filter(i => i.price_vnd > 1000000); break;
      }
    }

    return result;
  }, [allItems, search, category, priceRange]);

  const paginated = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);
  const hasMore = paginated.length < filtered.length;

  const popularItems = useMemo(() => allItems.filter(i => i.is_popular).slice(0, 10), [allItems]);

  const loadMore = useCallback(() => setPage(p => p + 1), []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setCategory(null);
    setPriceRange(null);
    setPage(1);
  }, []);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, category, priceRange]);

  const invalidateCache = useCallback(() => {
    cacheRef.current = null;
  }, []);

  return {
    items: paginated,
    allItems: filtered,
    loading,
    search, setSearch,
    category, setCategory,
    priceRange, setPriceRange,
    categories,
    popularItems,
    hasMore, loadMore,
    clearFilters,
    totalCount: filtered.length,
    invalidateCache,
  };
}
