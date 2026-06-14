import { useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'tdl_visitor_id';
const SESSION_KEY = 'tdl_visitor_session_bumped';
const GEO_KEY = 'tdl_visitor_geo'; // cache geo lookup per session

let fpPromise: Promise<any> | null = null;
const getFp = () => {
  if (!fpPromise) fpPromise = FingerprintJS.load();
  return fpPromise;
};

interface Geo {
  country?: string | null;
  country_code?: string | null;
  region?: string | null;
  city?: string | null;
}

async function fetchGeo(): Promise<Geo> {
  try {
    const cached = sessionStorage.getItem(GEO_KEY);
    if (cached) return JSON.parse(cached) as Geo;
  } catch { /* ignore */ }

  // ipwho.is — free, HTTPS, no API key, returns country/region/city
  try {
    const res = await fetch('https://ipwho.is/?fields=success,country,country_code,region,city', {
      cache: 'no-store',
    });
    if (res.ok) {
      const j = await res.json();
      if (j && j.success !== false) {
        const geo: Geo = {
          country: j.country || null,
          country_code: j.country_code || null,
          region: j.region || null,
          city: j.city || null,
        };
        try { sessionStorage.setItem(GEO_KEY, JSON.stringify(geo)); } catch { /* ignore */ }
        return geo;
      }
    }
  } catch { /* ignore network errors */ }
  return {};
}

async function recordVisit() {
  try {
    let visitorId = localStorage.getItem(STORAGE_KEY) || '';
    if (!visitorId) {
      const fp = await getFp();
      const r = await fp.get();
      visitorId = r.visitorId;
      localStorage.setItem(STORAGE_KEY, visitorId);
    }
    if (!visitorId || visitorId.length < 8) return;

    const path = window.location.pathname + window.location.search;
    const ua = navigator.userAgent;
    const source = document.referrer ? new URL(document.referrer).hostname : null;
    const geo = await fetchGeo();

    const alreadyBumped = sessionStorage.getItem(SESSION_KEY) === visitorId;

    await supabase.rpc('track_visitor' as any, {
      p_visitor_id: visitorId,
      p_path: path,
      p_user_agent: ua,
      p_source_domain: source,
      p_country: geo.country ?? null,
      p_country_code: geo.country_code ?? null,
      p_region: geo.region ?? null,
      p_city: geo.city ?? null,
      p_bump: !alreadyBumped,
    });

    sessionStorage.setItem(SESSION_KEY, visitorId);
  } catch (e) {
    console.warn('visitor tracker failed', e);
  }
}

/** Heartbeat: ping last_seen every 30s so "đang online" stays accurate. */
async function heartbeat() {
  const visitorId = localStorage.getItem(STORAGE_KEY);
  if (!visitorId || visitorId.length < 8) return;
  await supabase.rpc('visitor_heartbeat' as any, { p_visitor_id: visitorId });
}

export function useVisitorTracker() {
  useEffect(() => {
    void recordVisit();
    const id = window.setInterval(() => { void heartbeat(); }, 30_000);
    return () => window.clearInterval(id);
  }, []);
}
