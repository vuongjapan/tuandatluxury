import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'tdl_session_id';

function getSessionId(): string {
  try {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return 'anon';
  }
}

export async function logSearch(payload: {
  keyword?: string;
  budget?: number;
  people_count?: number;
  zone?: string;
  vibes?: string[];
  result_count?: number;
}) {
  try {
    await supabase.from('search_logs').insert({
      ...payload,
      session_id: getSessionId(),
    });
  } catch (e) {
    // silent
  }
}

export async function logAiEvent(payload: {
  event_type: string;
  query?: string;
  result_type?: string;
  clicked_item?: string;
  meta?: Record<string, any>;
}) {
  try {
    await supabase.from('ai_logs').insert({
      ...payload,
      session_id: getSessionId(),
    });
  } catch (e) {
    // silent
  }
}
