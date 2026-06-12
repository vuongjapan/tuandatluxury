import { useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'tdl_visitor_id';
const SESSION_KEY = 'tdl_visitor_session_bumped';

let fpPromise: Promise<any> | null = null;
const getFp = () => {
  if (!fpPromise) fpPromise = FingerprintJS.load();
  return fpPromise;
};

async function recordVisit() {
  try {
    let visitorId = localStorage.getItem(STORAGE_KEY) || '';
    if (!visitorId) {
      const fp = await getFp();
      const r = await fp.get();
      visitorId = r.visitorId;
      localStorage.setItem(STORAGE_KEY, visitorId);
    }

    const path = window.location.pathname + window.location.search;
    const ua = navigator.userAgent;
    const source = document.referrer ? new URL(document.referrer).hostname : null;

    // Bump only once per browser session
    const alreadyBumped = sessionStorage.getItem(SESSION_KEY) === visitorId;

    const { data: existing } = await supabase
      .from('visitors' as any)
      .select('id, visit_count')
      .eq('visitor_id', visitorId)
      .maybeSingle();

    if (!existing) {
      await supabase.from('visitors' as any).insert({
        visitor_id: visitorId,
        visit_count: 1,
        source_domain: source,
        last_path: path,
        user_agent: ua,
      });
    } else {
      await supabase
        .from('visitors' as any)
        .update({
          visit_count: alreadyBumped ? (existing as any).visit_count : (existing as any).visit_count + 1,
          last_seen: new Date().toISOString(),
          last_path: path,
          user_agent: ua,
          source_domain: source ?? undefined,
        })
        .eq('visitor_id', visitorId);
    }

    sessionStorage.setItem(SESSION_KEY, visitorId);
  } catch (e) {
    console.warn('visitor tracker failed', e);
  }
}

/** Heartbeat: ping last_seen every 30s so "đang online" stays accurate. */
async function heartbeat() {
  const visitorId = localStorage.getItem(STORAGE_KEY);
  if (!visitorId) return;
  await supabase
    .from('visitors' as any)
    .update({ last_seen: new Date().toISOString() })
    .eq('visitor_id', visitorId);
}

export function useVisitorTracker() {
  useEffect(() => {
    void recordVisit();
    const id = window.setInterval(() => { void heartbeat(); }, 30_000);
    return () => window.clearInterval(id);
  }, []);
}
