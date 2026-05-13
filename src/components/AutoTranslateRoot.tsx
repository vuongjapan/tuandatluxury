/**
 * AutoTranslateRoot v2 — DB-driven translation.
 *
 * Khi user đổi sang ≠ vi:
 * 1. Tải tất cả rows từ bảng `translations` (vi_text, en/ja/zh/ko_text).
 * 2. Build map { vi_text -> translated }.
 * 3. Walk DOM, thay text node có nội dung khớp vi_text bằng bản dịch.
 * 4. MutationObserver bắt nội dung mới (lazy load, modal, dữ liệu fetch sau).
 * 5. Khi quay lại vi → khôi phục text gốc.
 *
 * KHÔNG gọi AI realtime. Bản dịch lấy từ DB do admin chạy sẵn.
 */
import { useEffect, useRef } from 'react';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'KBD', 'SAMP',
  'INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'SVG', 'PATH',
]);

function shouldSkipElement(el: Element): boolean {
  if (SKIP_TAGS.has(el.tagName)) return true;
  if (el.hasAttribute?.('data-no-translate')) return true;
  if (el.classList?.contains('admin-area')) return true;
  if (el.closest?.('[data-admin]')) return true;
  return false;
}

function emit(active: boolean) {
  window.dispatchEvent(new CustomEvent('tdl-translating', { detail: { active } }));
}

const SS_PREFIX = 'tdl_db_translations_v1::';

async function loadTranslationMap(lang: Language): Promise<Record<string, string>> {
  const cacheKey = SS_PREFIX + lang;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      // Background refresh, but return cache immediately
      refreshInBackground(lang);
      return JSON.parse(cached);
    }
  } catch {}
  return await fetchAndCache(lang);
}

async function fetchAndCache(lang: Language): Promise<Record<string, string>> {
  const col = `${lang}_text`;
  const { data, error } = await supabase
    .from('translations' as any)
    .select(`vi_text, ${col}`);
  if (error || !data) return {};
  const map: Record<string, string> = {};
  for (const row of data as any[]) {
    const vi = (row.vi_text || '').toString().trim();
    const tr = (row[col] || '').toString().trim();
    if (vi && tr) map[vi] = tr;
  }
  try { sessionStorage.setItem(SS_PREFIX + lang, JSON.stringify(map)); } catch {}
  return map;
}

let bgInflight: Partial<Record<Language, boolean>> = {};
function refreshInBackground(lang: Language) {
  if (bgInflight[lang]) return;
  bgInflight[lang] = true;
  fetchAndCache(lang).finally(() => { bgInflight[lang] = false; });
}

type Replacements = Record<string, string>;

function applyToTree(root: Node, map: Replacements, originals: WeakMap<Text, string>) {
  if (!Object.keys(map).length) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n: Node) {
      const t = n as Text;
      const parent = t.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      let cur: Element | null = parent;
      while (cur) {
        if (shouldSkipElement(cur)) return NodeFilter.FILTER_REJECT;
        cur = cur.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let cur: Node | null;
  // eslint-disable-next-line no-cond-assign
  while ((cur = walker.nextNode())) {
    const t = cur as Text;
    const original = originals.get(t) ?? (t.nodeValue ?? '');
    const trimmed = original.trim();
    if (!trimmed) continue;
    const tr = map[trimmed];
    if (!tr) continue;
    if (!originals.has(t)) originals.set(t, original);
    // Preserve leading/trailing whitespace
    const lead = original.match(/^\s*/)?.[0] ?? '';
    const tail = original.match(/\s*$/)?.[0] ?? '';
    const next = `${lead}${tr}${tail}`;
    if (t.nodeValue !== next) t.nodeValue = next;
  }
}

function restoreTree(originals: WeakMap<Text, string>) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  let cur: Node | null;
  // eslint-disable-next-line no-cond-assign
  while ((cur = walker.nextNode())) {
    const t = cur as Text;
    const orig = originals.get(t);
    if (orig != null && t.nodeValue !== orig) t.nodeValue = orig;
  }
}

const AutoTranslateRoot = () => {
  const { language } = useLanguage();
  const originalsRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const mapRef = useRef<Replacements>({});
  const langRef = useRef<Language>(language);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    langRef.current = language;
    const originals = originalsRef.current;

    if (language === 'vi') {
      mapRef.current = {};
      restoreTree(originals);
      return;
    }

    let cancelled = false;
    emit(true);

    (async () => {
      const map = await loadTranslationMap(language);
      if (cancelled || langRef.current !== language) { emit(false); return; }
      mapRef.current = map;
      applyToTree(document.body, map, originals);
      emit(false);
    })();

    const scheduleApply = () => {
      if (debounceRef.current != null) return;
      debounceRef.current = window.setTimeout(() => {
        debounceRef.current = null;
        if (langRef.current === 'vi') return;
        applyToTree(document.body, mapRef.current, originals);
      }, 200);
    };

    const observer = new MutationObserver((mutations) => {
      let relevant = false;
      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length > 0) { relevant = true; break; }
        if (m.type === 'characterData') {
          const t = m.target as Text;
          if (!originals.has(t)) { relevant = true; break; }
        }
      }
      if (relevant) scheduleApply();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      cancelled = true;
      observer.disconnect();
      if (debounceRef.current != null) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      emit(false);
    };
  }, [language]);

  return null;
};

export default AutoTranslateRoot;
