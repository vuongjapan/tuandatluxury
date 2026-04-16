import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { clearAppClientState, resetApp, syncStoredRole } from '@/lib/appState';

export type MemberTier = 'normal' | 'vip' | 'super_vip';

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  bookingCount: number;
  tier: MemberTier;
}

interface AuthContextType {
  user: AuthUser | null;
  supabaseUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getTier(count: number): MemberTier {
  if (count >= 10) return 'super_vip';
  if (count >= 3) return 'vip';
  return 'normal';
}

export const TIER_LABELS: Record<MemberTier, Record<string, string>> = {
  normal: { vi: 'Thành viên', en: 'Member', ja: 'メンバー', zh: '会员' },
  vip: { vi: 'VIP', en: 'VIP', ja: 'VIP', zh: 'VIP' },
  super_vip: { vi: 'Siêu VIP', en: 'Super VIP', ja: 'スーパーVIP', zh: '超级VIP' },
};

export const TIER_COLORS: Record<MemberTier, string> = {
  normal: 'bg-muted text-muted-foreground',
  vip: 'bg-primary/20 text-primary',
  super_vip: 'bg-gold-gradient text-primary-foreground',
};

const STORAGE_KEY = 'tdl_auth_user';

function isInvalidSessionError(error: unknown) {
  const status = (error as { status?: number } | null)?.status;
  return status === 401 || status === 403;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const persistUser = (u: AuthUser | null) => {
    setUser(u);
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const fetchUserData = useCallback(async (sbUser: User) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', sbUser.id)
        .maybeSingle();

      const email = sbUser.email || '';
      const { count } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('guest_email', email)
        .eq('status', 'confirmed');

      const bookingCount = count || 0;

      const authUser: AuthUser = {
        id: sbUser.id,
        email,
        fullName: profile?.full_name || email.split('@')[0],
        phone: profile?.phone || undefined,
        bookingCount,
        tier: getTier(bookingCount),
      };

      persistUser(authUser);

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', sbUser.id)
        .eq('role', 'admin')
        .maybeSingle();

      const nextRole = roleData ? 'admin' : 'user';
      if (syncStoredRole(nextRole, true)) return;

      setIsAdmin(!!roleData);
    } catch (err) {
      console.warn('Failed to fetch user data:', err);

      if (isInvalidSessionError(err)) {
        resetApp({ preserveAuth: false, nextRole: 'guest', redirectTo: '/member' });
        return;
      }

      persistUser(null);
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    // Try to restore cached user while loading
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setUser(JSON.parse(saved));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const sbUser = session?.user ?? null;

      setSupabaseUser(sbUser);

      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
        persistUser(null);
        setIsAdmin(false);
        syncStoredRole('guest', false);
        setLoading(false);
        return;
      }

      if (!sbUser) {
        persistUser(null);
        setIsAdmin(false);
        syncStoredRole('guest', false);
        setLoading(false);
        return;
      }

      void fetchUserData(sbUser).finally(() => setLoading(false));
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const sbUser = session?.user ?? null;
      setSupabaseUser(sbUser);
      if (sbUser) {
        fetchUserData(sbUser).finally(() => setLoading(false));
      } else {
        persistUser(null);
        setIsAdmin(false);
        syncStoredRole('guest', false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { error: error.message };
    const { data: { user: newUser } } = await supabase.auth.getUser();
    if (newUser) {
      await supabase.from('profiles').update({ phone, full_name: fullName, email }).eq('user_id', newUser.id);
    }
    return {};
  };

  const signIn = async (email: string, password: string) => {
    clearAppClientState({ preserveAuth: false, preserveVersion: true, nextRole: 'guest' });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    resetApp({ preserveAuth: true, nextRole: roleData ? 'admin' : 'user' });
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    persistUser(null);
    setSupabaseUser(null);
    setIsAdmin(false);
    resetApp({ preserveAuth: false, nextRole: 'guest', redirectTo: '/' });
  };

  const refreshUser = async () => {
    if (supabaseUser) await fetchUserData(supabaseUser);
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, isAdmin, signUp, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
