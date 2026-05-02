import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const VISITOR_KEY = 'tdl_visitor_id';
const SESSION_KEY = 'tdl_pv_session_id';

function getVisitorId(): string {
  try {
    let v = localStorage.getItem(VISITOR_KEY);
    if (!v) {
      v = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(VISITOR_KEY, v);
    }
    return v;
  } catch { return 'anon'; }
}

function getSessionId(): string {
  try {
    let s = sessionStorage.getItem(SESSION_KEY);
    if (!s) {
      s = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch { return 'anon'; }
}

function detectDevice(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(ua) || (/(android)/.test(ua) && !/mobile/.test(ua))) return 'tablet';
  if (/mobi|iphone|ipod|android|blackberry|iemobile|opera mini/.test(ua)) return 'mobile';
  return 'desktop';
}

function detectReferrerSource(ref: string): string {
  if (!ref) return 'direct';
  try {
    const host = new URL(ref).hostname.toLowerCase();
    if (host.includes('google.')) return 'google';
    if (host.includes('facebook.') || host.includes('fb.')) return 'facebook';
    if (host.includes('zalo.')) return 'zalo';
    if (host.includes('instagram.')) return 'instagram';
    if (host.includes('tiktok.')) return 'tiktok';
    if (host.includes('youtube.')) return 'youtube';
    if (host.includes('bing.')) return 'bing';
    if (host === window.location.hostname) return 'internal';
    return 'other';
  } catch { return 'direct'; }
}

export type PageType =
  | 'home'
  | 'rooms_list'
  | 'room_detail'
  | 'booking_step1'
  | 'booking_step2'
  | 'booking_step3'
  | 'booking_step4'
  | 'booking_done'
  | 'about'
  | 'food_order'
  | 'services'
  | 'promotions'
  | 'explore'
  | 'lookup'
  | 'account'
  | 'invoice'
  | 'dining'
  | 'blog'
  | 'reviews'
  | 'live'
  | 'transport'
  | 'other';

interface TrackingPayload {
  page_type: PageType;
  page_label?: string | null;
  room_id?: string | null;
  room_name?: string | null;
}

export function trackPageView(payload: TrackingPayload, pathname: string) {
  // Skip admin routes
  if (pathname.startsWith('/admin')) return;
  try {
    const ref = document.referrer || '';
    supabase.from('page_views').insert({
      page_type: payload.page_type,
      page_path: pathname,
      page_label: payload.page_label || null,
      domain: window.location.hostname,
      full_url: window.location.href.slice(0, 1000),
      room_id: payload.room_id || null,
      room_name: payload.room_name || null,
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      referrer: ref ? ref.slice(0, 500) : null,
      referrer_source: detectReferrerSource(ref),
      device: detectDevice(),
      user_agent: navigator.userAgent.slice(0, 500),
    }).then(() => {}, () => {});
  } catch {
    // silent
  }
}

export function usePageTracking(payload: TrackingPayload) {
  const { pathname } = useLocation();
  const trackedRef = useRef<string>('');
  useEffect(() => {
    const key = `${pathname}|${payload.page_type}|${payload.room_id || ''}`;
    if (trackedRef.current === key) return;
    trackedRef.current = key;
    trackPageView(payload, pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, payload.page_type, payload.room_id]);
}
