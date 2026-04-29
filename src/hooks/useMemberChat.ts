import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MemberMessage {
  id: string;
  user_id: string;
  sender: 'member' | 'admin';
  content: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Real-time chat hook between member and admin.
 * - userId: target user (the member). For member view → own id. For admin view → selected member's id.
 * - asAdmin: who is sending. Determines the `sender` value when calling sendMessage().
 */
export function useMemberChat(userId: string | undefined, asAdmin = false) {
  const [messages, setMessages] = useState<MemberMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<any>(null);

  // Initial load + realtime subscribe
  useEffect(() => {
    if (!userId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data } = await supabase
        .from('member_messages' as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(500);
      if (!cancelled) {
        setMessages((data as any) || []);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`member_chat_${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'member_messages', filter: `user_id=eq.${userId}` },
        (payload) => {
          const msg = payload.new as MemberMessage;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      cancelled = true;
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [userId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!userId || !content.trim()) return { error: 'invalid' };
      const { error } = await supabase.from('member_messages' as any).insert({
        user_id: userId,
        sender: asAdmin ? 'admin' : 'member',
        content: content.trim(),
      });
      return { error: error?.message };
    },
    [userId, asAdmin],
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await supabase
      .from('member_messages' as any)
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq(asAdmin ? 'sender' : 'sender', asAdmin ? 'member' : 'admin')
      .eq('is_read', false);
  }, [userId, asAdmin]);

  return { messages, loading, sendMessage, markAllRead };
}
