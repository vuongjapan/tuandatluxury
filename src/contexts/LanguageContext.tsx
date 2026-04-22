/**
 * LanguageContext v3 — i18n + currency
 * - 4 ngôn ngữ: vi · en · ja · zh
 * - 4 tiền tệ: VND · USD · JPY · CNY (tỷ giá lấy từ bảng exchange_rates)
 * - Lưu vào localStorage; auto-detect lần đầu từ navigator.language
 * - Tự nạp font Noto Sans JP/SC khi cần (CJK)
 */
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { translate, translations, LANG_LABELS, type Language } from '@/i18n/translations';

export type { Language };
export type Currency = 'VND' | 'USD' | 'JPY' | 'CNY';

const CURRENCY_LABELS: Record<Currency, string> = {
  VND: 'VND ₫',
  USD: 'USD $',
  JPY: 'JPY ¥',
  CNY: 'CNY ¥',
};

const DEFAULT_CURRENCY_FOR_LANG: Record<Language, Currency> = {
  vi: 'VND', en: 'USD', ja: 'JPY', zh: 'CNY',
};

interface ExchangeRates {
  usd_rate: number;
  jpy_rate: number;
  cny_rate: number;
}

const DEFAULT_RATES: ExchangeRates = { usd_rate: 25400, jpy_rate: 168, cny_rate: 3500 };

interface LanguageContextType {
  language: Language;
  currency: Currency;
  rates: ExchangeRates;
  setLanguage: (lang: Language) => void;
  setCurrency: (cur: Currency) => void;
  t: (key: string) => string;
  /** pick(vi, en): trả về `vi` cho ngôn ngữ vi; ngược lại trả về `en` (dùng cho ja/zh là fallback an toàn). */
  pick: <T>(vi: T, en: T) => T;
  formatPrice: (priceVND: number) => string;
  /** Convert VND → currency (number, không có ký hiệu). */
  convertPrice: (priceVND: number) => number;
  langLabels: typeof LANG_LABELS;
  currencyLabels: typeof CURRENCY_LABELS;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const LS_LANG = 'tdl_lang';
const LS_CURRENCY = 'tdl_currency';

function detectInitialLang(): Language {
  if (typeof window === 'undefined') return 'vi';
  const saved = localStorage.getItem(LS_LANG) as Language | null;
  if (saved && ['vi', 'en', 'ja', 'zh'].includes(saved)) return saved;
  const nav = (navigator.language || 'vi').toLowerCase();
  if (nav.startsWith('ja')) return 'ja';
  if (nav.startsWith('zh')) return 'zh';
  if (nav.startsWith('en')) return 'en';
  return 'vi';
}

function detectInitialCurrency(lang: Language): Currency {
  if (typeof window === 'undefined') return DEFAULT_CURRENCY_FOR_LANG[lang];
  const saved = localStorage.getItem(LS_CURRENCY) as Currency | null;
  if (saved && ['VND', 'USD', 'JPY', 'CNY'].includes(saved)) return saved;
  return DEFAULT_CURRENCY_FOR_LANG[lang];
}

/** Inject Noto Sans JP/SC khi cần. */
function ensureCjkFont(lang: Language) {
  if (typeof document === 'undefined') return;
  if (lang !== 'ja' && lang !== 'zh') return;
  const id = lang === 'ja' ? 'noto-jp-font' : 'noto-sc-font';
  if (document.getElementById(id)) return;
  const family = lang === 'ja' ? 'Noto+Sans+JP' : 'Noto+Sans+SC';
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${family}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => detectInitialLang());
  const [currency, setCurrencyState] = useState<Currency>(() => detectInitialCurrency(detectInitialLang()));
  const [rates, setRates] = useState<ExchangeRates>(DEFAULT_RATES);

  // Tải tỷ giá từ DB (1 lần) + subscribe realtime
  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data } = await supabase
        .from('exchange_rates' as any)
        .select('usd_rate, jpy_rate, cny_rate')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancel && data) {
        setRates({
          usd_rate: Number((data as any).usd_rate) || DEFAULT_RATES.usd_rate,
          jpy_rate: Number((data as any).jpy_rate) || DEFAULT_RATES.jpy_rate,
          cny_rate: Number((data as any).cny_rate) || DEFAULT_RATES.cny_rate,
        });
      }
    })();

    const channel = supabase
      .channel('exchange_rates_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exchange_rates' }, (payload: any) => {
        const r = payload.new || payload.record;
        if (r) {
          setRates({
            usd_rate: Number(r.usd_rate) || DEFAULT_RATES.usd_rate,
            jpy_rate: Number(r.jpy_rate) || DEFAULT_RATES.jpy_rate,
            cny_rate: Number(r.cny_rate) || DEFAULT_RATES.cny_rate,
          });
        }
      })
      .subscribe();

    return () => { cancel = true; supabase.removeChannel(channel); };
  }, []);

  // Áp dụng <html lang>, font CJK
  useEffect(() => {
    document.documentElement.lang = language;
    ensureCjkFont(language);
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LS_LANG, lang);
    // Khi đổi ngôn ngữ, mặc định đổi tiền tệ theo ngôn ngữ — trừ khi user đã chọn riêng trước đó
    const savedCur = localStorage.getItem(LS_CURRENCY);
    if (!savedCur) {
      const defCur = DEFAULT_CURRENCY_FOR_LANG[lang];
      setCurrencyState(defCur);
    }
  }, []);

  const setCurrency = useCallback((cur: Currency) => {
    setCurrencyState(cur);
    localStorage.setItem(LS_CURRENCY, cur);
  }, []);

  const t = useCallback((key: string) => translate(key, language), [language]);

  const pick = useCallback(<T,>(vi: T, en: T): T => (language === 'vi' ? vi : en), [language]);

  const convertPrice = useCallback((vnd: number) => {
    if (!Number.isFinite(vnd) || vnd <= 0) return 0;
    switch (currency) {
      case 'VND': return vnd;
      case 'USD': return vnd / (rates.usd_rate || DEFAULT_RATES.usd_rate);
      case 'JPY': return vnd / (rates.jpy_rate || DEFAULT_RATES.jpy_rate);
      case 'CNY': return vnd / (rates.cny_rate || DEFAULT_RATES.cny_rate);
      default: return vnd;
    }
  }, [currency, rates]);

  const formatPrice = useCallback((vnd: number) => {
    if (!Number.isFinite(vnd)) return '';
    if (vnd <= 0) {
      // Giữ "Liên hệ" khi giá ≤ 0 → để PriceDisplay xử lý badge
      return '0';
    }
    switch (currency) {
      case 'VND':
        return `${new Intl.NumberFormat('vi-VN').format(vnd)}đ`;
      case 'USD': {
        const v = vnd / (rates.usd_rate || DEFAULT_RATES.usd_rate);
        return `$${v < 10 ? v.toFixed(1) : Math.round(v).toLocaleString('en-US')}`;
      }
      case 'JPY': {
        const v = Math.round(vnd / (rates.jpy_rate || DEFAULT_RATES.jpy_rate));
        return `¥${v.toLocaleString('ja-JP')}`;
      }
      case 'CNY': {
        const v = vnd / (rates.cny_rate || DEFAULT_RATES.cny_rate);
        return `¥${v < 10 ? v.toFixed(1) : Math.round(v).toLocaleString('zh-CN')}`;
      }
      default:
        return `${vnd}đ`;
    }
  }, [currency, rates]);

  const value = useMemo(() => ({
    language, currency, rates,
    setLanguage, setCurrency,
    t, pick, formatPrice, convertPrice,
    langLabels: LANG_LABELS,
    currencyLabels: CURRENCY_LABELS,
  }), [language, currency, rates, setLanguage, setCurrency, t, pick, formatPrice, convertPrice]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};

// Re-export for convenience
export { LANG_LABELS };
