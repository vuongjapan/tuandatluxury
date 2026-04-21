import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type MandatoryRuleType = 'date_range' | 'weekday_month';

export interface MandatoryComboDate {
  id: string;
  date_from: string | null; // YYYY-MM-DD
  date_to: string | null;   // YYYY-MM-DD
  label: string;
  note: string | null;
  is_active: boolean;
  rule_type: MandatoryRuleType;
  weekdays: number[] | null; // 0=Sun..6=Sat
  months: number[] | null;   // 1..12
  banner_title: string | null;
  banner_message: string | null;
}

export function useMandatoryComboDates() {
  const [ranges, setRanges] = useState<MandatoryComboDate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('mandatory_combo_dates')
      .select('*')
      .order('rule_type', { ascending: true })
      .order('date_from', { ascending: true, nullsFirst: false });
    setRanges((data as MandatoryComboDate[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  /**
   * Returns the matching active rule if `checkIn` matches any active mandatory rule
   * (either a fixed date range OR a weekday-month rule), otherwise null.
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
    const dow = checkIn.getDay();
    const month = checkIn.getMonth() + 1;

    return ranges.find(r => {
      if (!r.is_active) return false;
      if (r.rule_type === 'date_range') {
        return !!r.date_from && !!r.date_to && ci >= r.date_from && ci <= r.date_to;
      }
      if (r.rule_type === 'weekday_month') {
        const months = Array.isArray(r.months) ? r.months : [];
        const weekdays = Array.isArray(r.weekdays) ? r.weekdays : [];
        return months.includes(month) && weekdays.includes(dow);
      }
      return false;
    }) || null;
  };

  return { ranges, loading, fetchAll, getMatchingRange };
}
