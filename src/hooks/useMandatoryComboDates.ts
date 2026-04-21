import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MandatoryComboDate {
  id: string;
  date_from: string; // YYYY-MM-DD
  date_to: string;   // YYYY-MM-DD
  label: string;
  note: string | null;
  is_active: boolean;
}

export function useMandatoryComboDates() {
  const [ranges, setRanges] = useState<MandatoryComboDate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('mandatory_combo_dates')
      .select('*')
      .order('date_from', { ascending: true });
    setRanges((data as MandatoryComboDate[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  /**
   * Returns the matching active range if `checkIn` falls within any active mandatory window,
   * otherwise null.
   */
  const getMatchingRange = (checkIn: Date | undefined): MandatoryComboDate | null => {
    if (!checkIn) return null;
    const ymd = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    const ci = ymd(checkIn);
    return ranges.find(r => r.is_active && ci >= r.date_from && ci <= r.date_to) || null;
  };

  return { ranges, loading, fetchAll, getMatchingRange };
}
