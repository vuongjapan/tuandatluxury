import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Calendar, UtensilsCrossed, Gift, Crown, Save, Loader2, FileText, Phone, Mail, LogOut, Hash, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, TIER_LABELS, TIER_COLORS } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type TabKey = 'overview' | 'bookings' | 'food' | 'vouchers' | 'profile';

const formatVnd = (n: number) =>
  new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';

const statusLabels: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
  checked_in: 'Đang ở',
  checked_out: 'Đã trả phòng',
};

const statusClasses: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  checked_in: 'bg-blue-100 text-blue-800',
  checked_out: 'bg-gray-100 text-gray-700',
};

const Account = () => {
  const navigate = useNavigate();
  const { user, supabaseUser, loading: authLoading, signOut, refreshUser } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();

  const [tab, setTab] = useState<TabKey>('overview');
  const [bookings, setBookings] = useState<any[]>([]);
  const [foodOrders, setFoodOrders] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // profile form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!authLoading && !supabaseUser) navigate('/member');
  }, [authLoading, supabaseUser, navigate]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      if (!user?.email) return;
      setLoading(true);
      const email = user.email.toLowerCase();
      const phoneNorm = (user.phone || '').replace(/\s+/g, '');

      const [bRes, fRes, vRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .or(phoneNorm ? `guest_email.eq.${email},guest_phone.eq.${phoneNorm}` : `guest_email.eq.${email}`)
          .order('created_at', { ascending: false }),
        supabase
          .from('food_orders')
          .select('*')
          .or(phoneNorm ? `guest_email.eq.${email},phone.eq.${phoneNorm}` : `guest_email.eq.${email}`)
          .order('created_at', { ascending: false }),
        supabase
          .from('voucher_codes' as any)
          .select('*')
          .eq('status', 'active')
          .order('end_date', { ascending: true })
          .limit(50),
      ]);

      setBookings(bRes.data || []);
      setFoodOrders(fRes.data || []);
      setVouchers((vRes.data as any[]) || []);
      setLoading(false);
    };
    if (user) load();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!supabaseUser) return;
    if (!fullName.trim() || !phone.trim()) {
      toast({ title: 'Vui lòng nhập đầy đủ', variant: 'destructive' });
      return;
    }
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim() })
      .eq('user_id', supabaseUser.id);
    setSavingProfile(false);
    if (error) {
      toast({ title: 'Lỗi cập nhật', description: error.message, variant: 'destructive' });
      return;
    }
    await refreshUser();
    toast({ title: 'Đã cập nhật thông tin ✓' });
  };

  const totalSpent = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((s, b) => s + (b.total_price_vnd || 0), 0);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'overview', label: 'Tổng quan', icon: User },
    { key: 'bookings', label: `Đặt phòng (${bookings.length})`, icon: Calendar },
    { key: 'food', label: `Đặt món (${foodOrders.length})`, icon: UtensilsCrossed },
    { key: 'vouchers', label: 'Voucher', icon: Gift },
    { key: 'profile', label: 'Thông tin', icon: User },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16 max-w-6xl mx-auto px-4">
        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border shadow-card-hover p-6 md:p-8 mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gold-gradient flex items-center justify-center shrink-0">
              <Crown className="h-9 w-9 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                {user.fullName}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${TIER_COLORS[user.tier]}`}>
                  {TIER_LABELS[user.tier][language]}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-foreground">
                  {user.bookingCount} lượt đặt
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-foreground">
                  Tổng chi: {formatVnd(totalSpent)}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => signOut()} className="gap-2">
              <LogOut className="h-4 w-4" /> Đăng xuất
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto bg-card rounded-xl border border-border p-1 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                tab === t.key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-card rounded-2xl border border-border p-6 md:p-8 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {tab === 'overview' && (
                <div className="grid sm:grid-cols-3 gap-4">
                  <StatCard icon={Calendar} label="Đơn đặt phòng" value={bookings.length} sub={`${bookings.filter(b => b.status === 'confirmed' || b.status === 'checked_in').length} đã xác nhận`} />
                  <StatCard icon={UtensilsCrossed} label="Đơn đặt món" value={foodOrders.length} sub={`${foodOrders.filter(f => f.status !== 'cancelled').length} hợp lệ`} />
                  <StatCard icon={Gift} label="Voucher khả dụng" value={vouchers.length} sub="Cập nhật tự động" />
                </div>
              )}

              {tab === 'bookings' && (
                <div className="space-y-3">
                  {bookings.length === 0 && <EmptyState text="Chưa có đơn đặt phòng nào." />}
                  {bookings.map((b) => (
                    <div key={b.id} className="border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-mono font-semibold text-foreground">{b.booking_code}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusClasses[b.status] || 'bg-secondary'}`}>
                              {statusLabels[b.status] || b.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(b.check_in), 'dd/MM/yyyy')} → {format(new Date(b.check_out), 'dd/MM/yyyy')}
                            {' • '} {b.guests_count} khách
                          </p>
                          <p className="text-sm font-semibold text-primary mt-1">{formatVnd(b.total_price_vnd)}</p>
                        </div>
                        <Link to={`/invoice/${b.booking_code}`}>
                          <Button size="sm" variant="outline" className="gap-1.5">
                            <FileText className="h-3.5 w-3.5" /> Hóa đơn
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'food' && (
                <div className="space-y-3">
                  {foodOrders.length === 0 && <EmptyState text="Chưa có đơn đặt món nào." />}
                  {foodOrders.map((f) => (
                    <div key={f.id} className="border border-border rounded-xl p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-mono font-semibold">{f.food_order_id}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusClasses[f.status] || 'bg-secondary'}`}>
                              {statusLabels[f.status] || f.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(f.created_at), 'dd/MM/yyyy HH:mm')}
                            {f.room_number && ` • Phòng ${f.room_number}`}
                          </p>
                          <p className="text-sm font-semibold text-primary mt-1">{formatVnd(f.total_amount)}</p>
                        </div>
                        <Link to={`/food-invoice/${f.food_order_id}`}>
                          <Button size="sm" variant="outline" className="gap-1.5">
                            <ExternalLink className="h-3.5 w-3.5" /> Xem
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'vouchers' && (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Các voucher còn hiệu lực có thể áp dụng khi đặt phòng. Mỗi mã chỉ dùng 1 lần.
                  </p>
                  {vouchers.length === 0 && <EmptyState text="Hiện chưa có voucher khả dụng." />}
                  <div className="grid sm:grid-cols-2 gap-3">
                    {vouchers.map((v) => (
                      <div key={v.id} className="border border-primary/20 rounded-xl p-4 bg-primary/5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-lg text-primary tracking-wider">{v.code}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold">
                            {v.discount_type === 'percent' ? `-${v.discount_value}%` : `-${formatVnd(v.discount_value)}`}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          HSD: {v.end_date ? format(new Date(v.end_date), 'dd/MM/yyyy') : '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'profile' && (
                <div className="max-w-md space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Họ tên</label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nguyễn Văn A" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Số điện thoại</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0912 345 678" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Email</label>
                    <Input value={user.email} disabled />
                    <p className="text-xs text-muted-foreground mt-1">Email không thể thay đổi.</p>
                  </div>
                  <Button onClick={handleSaveProfile} disabled={savingProfile} className="gap-2">
                    {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Lưu thay đổi
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/lookup" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
            <Phone className="h-3 w-3" /> Tra cứu đơn không cần đăng nhập
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub }: any) => (
  <div className="border border-border rounded-xl p-5 text-center">
    <Icon className="h-7 w-7 text-primary mx-auto mb-2" />
    <p className="text-3xl font-bold text-foreground">{value}</p>
    <p className="text-sm font-semibold text-foreground mt-1">{label}</p>
    <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="text-center py-10 text-muted-foreground text-sm">{text}</div>
);

export default Account;
