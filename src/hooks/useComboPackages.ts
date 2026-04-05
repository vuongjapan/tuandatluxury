import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ComboPackage {
  id: string;
  name: string;
  price_per_person: number;
  image_url: string | null;
  description_vi: string | null;
  description_en: string | null;
  menu_count: number;
  dishes_per_menu: number;
  sort_order: number;
  is_active: boolean;
}

export interface ComboMenu {
  id: string;
  combo_package_id: string;
  menu_number: number;
  name_vi: string;
  name_en: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ComboMenuDish {
  id: string;
  combo_menu_id: string;
  name_vi: string;
  name_en: string;
  image_url: string | null;
  sort_order: number;
}

export function useComboPackages() {
  const [packages, setPackages] = useState<ComboPackage[]>([]);
  const [menus, setMenus] = useState<ComboMenu[]>([]);
  const [dishes, setDishes] = useState<ComboMenuDish[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: p }, { data: m }, { data: d }] = await Promise.all([
      supabase.from('combo_packages').select('*').order('sort_order'),
      supabase.from('combo_menus').select('*').order('sort_order'),
      supabase.from('combo_menu_dishes').select('*').order('sort_order'),
    ]);
    setPackages((p as ComboPackage[]) || []);
    setMenus((m as ComboMenu[]) || []);
    setDishes((d as ComboMenuDish[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const getMenusByPackage = (pkgId: string) =>
    menus.filter(m => m.combo_package_id === pkgId);

  const getDishesByMenu = (menuId: string) =>
    dishes.filter(d => d.combo_menu_id === menuId);

  return { packages, menus, dishes, loading, fetchAll, getMenusByPackage, getDishesByMenu };
}
