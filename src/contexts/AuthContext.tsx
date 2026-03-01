import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const persistUser = (u: AuthUser | null) => {
    setUser(u);
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const fetchUserData = useCallback(async (sbUser: User) => {
    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('user_id', sbUser.id)
      .maybeSingle();

    // Count completed bookings by email
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

    // Check admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', sbUser.id)
      .eq('role', 'admin')
      .maybeSingle();
    setIsAdmin(!!roleData);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sbUser = session?.user ?? null;
      setSupabaseUser(sbUser);
      if (sbUser) {
        await fetchUserData(sbUser);
      } else {
        persistUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const sbUser = session?.user ?? null;
      setSupabaseUser(sbUser);
      if (sbUser) {
        fetchUserData(sbUser);
      } else {
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
    // Update profile with phone
    const { data: { user: newUser } } = await supabase.auth.getUser();
    if (newUser) {
      await supabase.from('profiles').update({ phone, full_name: fullName }).eq('user_id', newUser.id);
    }
    return {};
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    persistUser(null);
    setIsAdmin(false);
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
