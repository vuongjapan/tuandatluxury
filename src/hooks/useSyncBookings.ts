import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const SYNC_FLAG_KEY = 'tdl_synced_v1';

/**
 * On login, attach existing bookings (no user_id yet) to the current member
 * by matching phone OR email.
 */
export function useSyncBookings() {
  const { user, supabaseUser } = useAuth();
  const { toast } = useToast();
  const ranRef = useRef(false);

  useEffect(() => {
    if (!supabaseUser || !user) return;
    if (ranRef.current) return;
    const flagKey = `${SYNC_FLAG_KEY}_${supabaseUser.id}`;
    if (localStorage.getItem(flagKey)) return;

    ranRef.current = true;
    (async () => {
      try {
        const { data, error } = await supabase.rpc('sync_user_bookings' as any, {
          _user_id: supabaseUser.id,
          _phone: user.phone || '',
          _email: user.email || '',
        });
        if (!error) {
          const count = (data as number) || 0;
          if (count > 0) {
            toast({
              title: '🔗 Đồng bộ đặt phòng cũ',
              description: `Tìm thấy ${count} đơn đặt phòng đã được thêm vào tài khoản của bạn.`,
            });
          }
          localStorage.setItem(flagKey, '1');
        }
      } catch (e) {
        console.warn('[sync_user_bookings]', e);
      }
    })();
  }, [supabaseUser, user, toast]);
}
