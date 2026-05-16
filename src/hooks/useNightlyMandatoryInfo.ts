import { useMemo } from 'react';
import { useMandatoryComboDates, type MandatoryComboDate } from './useMandatoryComboDates';

export interface NightInfo {
  date: string;          // YYYY-MM-DD
  dayLabel: string;      // CN, T2..T7
  formattedDate: string; // DD/MM
  mandatory: boolean;
  rule: MandatoryComboDate | null;
}

const VI_DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const EN_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Build per-night mandatory info between checkIn (inclusive) and checkOut (exclusive).
 * Re-uses the existing `getMatchingRange` matcher from useMandatoryComboDates so the
 * source of truth stays the admin-configured rules.
 */
export function useNightlyMandatoryInfo(
  checkIn: Date | undefined,
  checkOut: Date | undefined,
  language: 'vi' | 'en' | 'ja' | 'zh' = 'vi',
) {
  const { getMatchingRange, loading } = useMandatoryComboDates();

  const nights = useMemo<NightInfo[]>(() => {
    if (!checkIn || !checkOut) return [];
    const out: NightInfo[] = [];
    const cur = new Date(checkIn);
    cur.setHours(0, 0, 0, 0);
    const end = new Date(checkOut);
    end.setHours(0, 0, 0, 0);

    const labels = language === 'vi' ? VI_DAY_LABELS : EN_DAY_LABELS;

    // Hard cap to avoid runaway loops on weird inputs
    let guard = 0;
    while (cur < end && guard < 60) {
      const rule = getMatchingRange(new Date(cur));
      const date = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`;
      out.push({
        date,
        dayLabel: labels[cur.getDay()],
        formattedDate: `${pad(cur.getDate())}/${pad(cur.getMonth() + 1)}`,
        mandatory: !!rule,
        rule: rule || null,
      });
      cur.setDate(cur.getDate() + 1);
      guard++;
    }
    return out;
  }, [checkIn, checkOut, getMatchingRange, language]);

  const mandatoryNights = useMemo(() => nights.filter(n => n.mandatory), [nights]);
  const optionalNights = useMemo(() => nights.filter(n => !n.mandatory), [nights]);
  const hasAnyMandatory = mandatoryNights.length > 0;

  return { nights, mandatoryNights, optionalNights, hasAnyMandatory, loading };
}
