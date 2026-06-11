import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'tdl_vt_session';
const VISITOR_CACHE_KEY = 'tdl_vt_visitor';
const PAGES_KEY = 'tdl_vt_pages';

let visitorIdPromise: Promise<string> | null = null;
let currentRowId: string | null = null;
let lastPath: string | null = null;
let lastPathStart = 0;

function detectDevice(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(ua) || (/(android)/.test(ua) && !/mobile/.test(ua))) return 'tablet';
  if (/mobi|iphone|ipod|android|blackberry|iemobile|opera mini/.test(ua)) return 'mobile';
  return 'desktop';
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'Edge';
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  if (/Firefox\//.test(ua)) return 'Firefox';
  return 'Other';
}

function detectOS(): string {
  const ua = navigator.userAgent;
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Other';
}

function detectReferrerSource(ref: string): string {
  if (!ref) return 'direct';
  try {
    const host = new URL(ref).hostname.toLowerCase();
    if (host === window.location.hostname) return 'internal';
    if (host.includes('google.')) return 'organic_search';
    if (host.includes('bing.') || host.includes('yahoo.') || host.includes('duckduckgo.')) return 'organic_search';
    if (host.includes('facebook.') || host.includes('instagram.') || host.includes('tiktok.') || host.includes('zalo.') || host.includes('youtube.')) return 'organic_social';
    return 'referral';
  } catch { return 'direct'; }
}

function getSessionId(): string {
  try {
    let s = sessionStorage.getItem(SESSION_KEY);
    if (!s) {
      s = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, s);
      sessionStorage.removeItem(PAGES_KEY);
    }
    return s;
  } catch { return 'anon'; }
}

function getPages(): Array<{ page: string; time_spent: number; timestamp: string }> {
  try { return JSON.parse(sessionStorage.getItem(PAGES_KEY) || '[]'); } catch { return []; }
}

function savePages(pages: any[]) {
  try { sessionStorage.setItem(PAGES_KEY, JSON.stringify(pages.slice(-50))); } catch {}
}

async function getVisitorId(): Promise<string> {
  try {
    const cached = localStorage.getItem(VISITOR_CACHE_KEY);
    if (cached) return cached;
  } catch {}
  if (!visitorIdPromise) {
    visitorIdPromise = (async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        try { localStorage.setItem(VISITOR_CACHE_KEY, result.visitorId); } catch {}
        return result.visitorId;
      } catch {
        const fallback = `fb_${Math.random().toString(36).slice(2, 14)}`;
        try { localStorage.setItem(VISITOR_CACHE_KEY, fallback); } catch {}
        return fallback;
      }
    })();
  }
  return visitorIdPromise;
}

async function geoLookup(): Promise<{ country?: string; country_code?: string; city?: string }> {
  try {
    const cached = sessionStorage.getItem('tdl_vt_geo');
    if (cached) return JSON.parse(cached);
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) return {};
    const j = await res.json();
    const out = { country: j.country_name, country_code: j.country_code, city: j.city };
    sessionStorage.setItem('tdl_vt_geo', JSON.stringify(out));
    return out;
  } catch { return {}; }
}

export async function initVisitorTracking() {
  try {
    const [visitor_id, geo] = await Promise.all([getVisitorId(), geoLookup()]);
    const session_id = getSessionId();
    const source_domain = window.location.hostname;
    const ref = document.referrer || '';

    // Check existing row for (visitor, domain, session)
    const { data: existing } = await supabase
      .from('visitor_tracking')
      .select('id, visit_count')
      .eq('visitor_id', visitor_id)
      .eq('source_domain', source_domain)
      .eq('session_id', session_id)
      .maybeSingle();

    if (existing) {
      currentRowId = existing.id;
      await supabase.from('visitor_tracking')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      // Count prior visits for visit_count increment
      const { count } = await supabase
        .from('visitor_tracking')
        .select('id', { count: 'exact', head: true })
        .eq('visitor_id', visitor_id)
        .eq('source_domain', source_domain);
      const visit_count = (count || 0) + 1;

      const { data: inserted } = await supabase.from('visitor_tracking').insert({
        visitor_id,
        session_id,
        source_domain,
        visit_count,
        country: geo.country || null,
        country_code: geo.country_code || null,
        city: geo.city || null,
        device_type: detectDevice(),
        browser: detectBrowser(),
        os: detectOS(),
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        referrer: ref ? ref.slice(0, 500) : null,
        referrer_source: detectReferrerSource(ref),
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        user_agent: navigator.userAgent.slice(0, 500),
        pages_this_session: [],
      }).select('id').maybeSingle();
      if (inserted) currentRowId = inserted.id;
    }

    // Heartbeat every 60s
    setInterval(async () => {
      if (!currentRowId) return;
      await supabase.from('visitor_tracking')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', currentRowId);
    }, 60_000);
  } catch (e) {
    // silent
  }
}

export async function trackVisitorPage(path: string, label?: string) {
  try {
    // close out previous page time
    const now = Date.now();
    const pages = getPages();
    if (lastPath && lastPathStart) {
      const time_spent = Math.round((now - lastPathStart) / 1000);
      const last = pages[pages.length - 1];
      if (last && last.page === lastPath) {
        last.time_spent = (last.time_spent || 0) + time_spent;
      }
    }
    pages.push({ page: label ? `${label} (${path})` : path, time_spent: 0, timestamp: new Date().toISOString() });
    savePages(pages);
    lastPath = path;
    lastPathStart = now;

    if (!currentRowId) {
      // ensure init has happened
      const visitor_id = await getVisitorId();
      const session_id = getSessionId();
      const source_domain = window.location.hostname;
      const { data } = await supabase.from('visitor_tracking')
        .select('id').eq('visitor_id', visitor_id).eq('source_domain', source_domain).eq('session_id', session_id)
        .maybeSingle();
      if (data) currentRowId = data.id;
    }
    if (currentRowId) {
      await supabase.from('visitor_tracking')
        .update({ pages_this_session: pages, last_seen: new Date().toISOString() })
        .eq('id', currentRowId);
    }
  } catch {}
}
