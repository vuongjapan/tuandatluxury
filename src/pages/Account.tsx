import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Calendar, MessageSquare, Gift, Settings as SettingsIcon, Crown,
  Save, Loader2, FileText, Phone, Mail, LogOut, Hash, Send, MapPin,
  CalendarDays, Cake, IdCard, UserCircle2, Heart, Sparkles, Eye, EyeOff,
  ArrowLeft, Download, QrCode, ChevronRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, TIER_LABELS, TIER_COLORS } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSyncBookings } from '@/hooks/useSyncBookings';
import { useMemberChat } from '@/hooks/useMemberChat';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type TabKey = 'profile' | 'bookings' | 'messages' | 'vouchers' | 'settings';

const formatVnd = (n: number) =>
  new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';

const statusLabels: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
  checked_in: 'Đang ở',
  checked_out: 'Hoàn thành',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  checked_in: 'bg-blue-100 text-blue-800 border-blue-200',
  checked_out: 'bg-stone-100 text-stone-700 border-stone-200',
};

const Account = () => {
  const navigate = useNavigate();
  const { user, supabaseUser, loading: authLoading, signOut, refreshUser } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const params = useParams();

  // auto-sync legacy bookings
  useSyncBookings();

  const [tab, setTab] = useState<TabKey>('profile');
  const [bookings, setBookings] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [profileExt, setProfileExt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showCccd, setShowCccd] = useState(false);

  // edit form
  const [form, setForm] = useState({
    full_name: '', phone: '', date_of_birth: '', gender: '', address: '',
    id_card: '', nationality: 'Việt Nam', room_preferences: '', special_requests: '',
    avatar_url: '', cover_url: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !supabaseUser) navigate('/member');
  }, [authLoading, supabaseUser, navigate]);

  // Load extended profile + bookings + vouchers
  useEffect(() => {
    const load = async () => {
      if (!supabaseUser || !user?.email) return;
      setLoading(true);
      const email = user.email.toLowerCase();
      const phoneNorm = (user.phone || '').replace(/\s+/g, '');

      const [pRes, bRes, vRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', supabaseUser.id).maybeSingle(),
        supabase
          .from('bookings')
          .select('*')
          .or(
            phoneNorm
              ? `user_id.eq.${supabaseUser.id},guest_email.eq.${email},guest_phone.eq.${phoneNorm}`
              : `user_id.eq.${supabaseUser.id},guest_email.eq.${email}`,
          )
          .order('created_at', { ascending: false }),
        supabase
          .from('voucher_codes' as any)
          .select('*')
          .eq('status', 'active')
          .order('end_date', { ascending: true })
          .limit(50),
      ]);

      const p: any = pRes.data || {};
      setProfileExt(p);
      setForm({
        full_name: p.full_name || user.fullName || '',
        phone: p.phone || user.phone || '',
        date_of_birth: p.date_of_birth || '',
        gender: p.gender || '',
        address: p.address || '',
        id_card: p.id_card || '',
        nationality: p.nationality || 'Việt Nam',
        room_preferences: p.room_preferences || '',
        special_requests: p.special_requests || '',
        avatar_url: p.avatar_url || '',
        cover_url: p.cover_url || '',
      });

      // dedupe bookings
      const seen = new Set<string>();
      const uniq = (bRes.data || []).filter((b: any) => {
        if (seen.has(b.id)) return false;
        seen.add(b.id);
        return true;
      });
      setBookings(uniq);
      setVouchers((vRes.data as any[]) || []);
      setLoading(false);
    };
    if (supabaseUser) load();
  }, [supabaseUser, user]);

  // tab from URL hash
  useEffect(() => {
    const h = window.location.hash.replace('#', '');
    if (['profile', 'bookings', 'messages', 'vouchers', 'settings'].includes(h)) {
      setTab(h as TabKey);
    }
  }, []);

  const handleSave = async () => {
    if (!supabaseUser) return;
    if (!form.full_name.trim()) {
      toast({ title: 'Vui lòng nhập họ tên', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload: any = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      address: form.address || null,
      id_card: form.id_card || null,
      nationality: form.nationality || null,
      room_preferences: form.room_preferences || null,
      special_requests: form.special_requests || null,
      avatar_url: form.avatar_url || null,
      cover_url: form.cover_url || null,
    };
    const { error } = await supabase.from('profiles').update(payload).eq('user_id', supabaseUser.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Lỗi cập nhật', description: error.message, variant: 'destructive' });
      return;
    }
    setProfileExt({ ...profileExt, ...payload });
    setEditing(false);
    await refreshUser();
    toast({ title: 'Đã lưu thay đổi ✓' });
  };

  const totalSpent = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((s, b) => s + (b.total_price_vnd || 0), 0);

  // Tier progress
  const VIP_NEXT = user?.tier === 'normal' ? 3 : user?.tier === 'vip' ? 10 : 10;
  const VIP_NEXT_LABEL = user?.tier === 'normal' ? 'VIP' : user?.tier === 'vip' ? 'Siêu VIP' : 'Siêu VIP';
  const progress = Math.min(100, ((user?.bookingCount || 0) / VIP_NEXT) * 100);

  // Booking detail subroute
  const bookingCode = params.bookingCode;
  const detailBooking = useMemo(
    () => (bookingCode ? bookings.find((b) => b.booking_code === bookingCode) : null),
    [bookingCode, bookings],
  );

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // ==================== BOOKING DETAIL VIEW ====================
  if (bookingCode) {
    if (loading) {
      return (
        <div className="min-h-screen bg-background">
          <Header />
          <div className="pt-32 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        </div>
      );
    }
    if (!detailBooking) {
      return (
        <div className="min-h-screen bg-background">
          <Header />
          <div className="pt-32 max-w-2xl mx-auto px-4 text-center">
            <p className="text-muted-foreground">Không tìm thấy đặt phòng <span className="font-mono">{bookingCode}</span>.</p>
            <Button onClick={() => navigate('/account#bookings')} variant="outline" className="mt-4 gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Quay lại
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16 max-w-3xl mx-auto px-4">
          <button onClick={() => navigate('/account#bookings')} className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-4">
            <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách
          </button>

          <div className="bg-card rounded-2xl border border-border shadow-card-hover p-6 md:p-8">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Mã đặt phòng</p>
                <h1 className="font-display text-2xl font-bold font-mono text-foreground">{detailBooking.booking_code}</h1>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${statusColors[detailBooking.status] || 'bg-secondary'}`}>
                {statusLabels[detailBooking.status] || detailBooking.status}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-6 text-sm">
              <InfoRow icon={CalendarDays} label="Nhận phòng" value={format(new Date(detailBooking.check_in), 'EEE dd/MM/yyyy')} />
              <InfoRow icon={CalendarDays} label="Trả phòng" value={format(new Date(detailBooking.check_out), 'EEE dd/MM/yyyy')} />
              <InfoRow icon={User} label="Số khách" value={`${detailBooking.guests_count} khách`} />
              <InfoRow icon={Hash} label="Số phòng" value={`${detailBooking.room_quantity} phòng`} />
            </div>

            {/* Payment breakdown */}
            <div className="border-t border-border pt-5 space-y-2 text-sm">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-primary" /> Chi tiết thanh toán
              </h3>
              <PayRow label="Tiền phòng" value={detailBooking.room_subtotal} />
              {detailBooking.combo_total > 0 && <PayRow label="Tiền ăn (combo)" value={detailBooking.combo_total} />}
              {detailBooking.individual_food_total > 0 && <PayRow label="Đặt món riêng" value={detailBooking.individual_food_total} />}
              {detailBooking.extra_person_surcharge > 0 && <PayRow label="Phụ thu khách" value={detailBooking.extra_person_surcharge} />}
              {(detailBooking.member_discount_amount > 0 || detailBooking.promotion_discount_amount > 0 || detailBooking.discount_code_amount > 0) && (
                <PayRow
                  label="Giảm giá"
                  value={-(
                    (detailBooking.member_discount_amount || 0) +
                    (detailBooking.promotion_discount_amount || 0) +
                    (detailBooking.discount_code_amount || 0)
                  )}
                  className="text-green-700"
                />
              )}
              <div className="border-t border-border pt-2 mt-2">
                <PayRow label="TỔNG" value={detailBooking.total_price_vnd} bold />
                <PayRow label="Đã cọc" value={detailBooking.deposit_amount} className="text-green-700" />
                {detailBooking.remaining_amount > 0 && <PayRow label="Còn lại khi nhận phòng" value={detailBooking.remaining_amount} className="text-amber-700" bold />}
              </div>
            </div>

            {/* QR */}
            {detailBooking.sepay_qr_url && detailBooking.remaining_amount > 0 && (
              <div className="mt-6 border-t border-border pt-5">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-primary" /> Thanh toán cọc còn lại
                </h3>
                <p className="text-xs text-muted-foreground mb-3">BIDV · 96247TUANDATLUXURY</p>
                <img src={detailBooking.sepay_qr_url} alt="QR" className="w-48 h-48 border border-border rounded-lg" />
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-border">
              <Link to={`/invoice/${detailBooking.booking_code}`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Xem hóa đơn
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/account#messages')}>
                <MessageSquare className="h-3.5 w-3.5" /> Liên hệ hỗ trợ
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ==================== MAIN ACCOUNT VIEW ====================
  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'profile', label: 'Thông tin', icon: User },
    { key: 'bookings', label: `Đặt phòng (${bookings.length})`, icon: Calendar },
    { key: 'messages', label: 'Tin nhắn', icon: MessageSquare },
    { key: 'vouchers', label: 'Ưu đãi', icon: Gift },
    { key: 'settings', label: 'Cài đặt', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-16">
        {/* Cover */}
        <div className="relative max-w-6xl mx-auto px-4">
          <div
            className="h-48 md:h-64 rounded-b-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-secondary"
            style={form.cover_url ? { backgroundImage: `url(${form.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          />
          {/* Avatar + name overlay */}
          <div className="px-2 md:px-6 -mt-12 md:-mt-16 flex flex-col md:flex-row md:items-end gap-4">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background bg-gold-gradient flex items-center justify-center shrink-0 overflow-hidden">
              {form.avatar_url ? (
                <img src={form.avatar_url} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <UserCircle2 className="h-16 w-16 text-primary-foreground" />
              )}
            </div>
            <div className="flex-1 pb-2">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{form.full_name || user.fullName}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${TIER_COLORS[user.tier]}`}>
                  <Crown className="h-3 w-3 inline mr-1" /> {TIER_LABELS[user.tier][language]}
                </span>
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {form.address || 'Việt Nam'}
                </span>
                <span className="text-xs text-muted-foreground">
                  · Thành viên từ {profileExt?.created_at ? format(new Date(profileExt.created_at), 'MM/yyyy') : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Layout: sidebar + content */}
        <div className="max-w-6xl mx-auto px-4 mt-8 grid md:grid-cols-[220px_1fr] gap-6">
          {/* Sidebar */}
          <aside className="md:sticky md:top-24 md:self-start">
            <nav className="bg-card rounded-2xl border border-border p-2 flex md:flex-col gap-1 overflow-x-auto">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); window.history.replaceState(null, '', `/account#${t.key}`); }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all w-full justify-start ${
                    tab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <t.icon className="h-4 w-4 shrink-0" />
                  <span>{t.label}</span>
                </button>
              ))}
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full justify-start mt-2 border-t border-border md:border-t md:pt-3"
              >
                <LogOut className="h-4 w-4" /> Đăng xuất
              </button>
            </nav>
          </aside>

          {/* Main content */}
          <section className="bg-card rounded-2xl border border-border p-5 md:p-7 min-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                {/* PROFILE TAB */}
                {tab === 'profile' && (
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" /> Thông tin cá nhân
                      </h2>
                      {!editing ? (
                        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                          ✏️ Chỉnh sửa
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Hủy</Button>
                          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Lưu
                          </Button>
                        </div>
                      )}
                    </div>

                    {!editing ? (
                      <div className="space-y-3 text-sm">
                        <ViewRow icon={User} label="Họ tên" value={form.full_name} />
                        <ViewRow icon={Mail} label="Email" value={user.email} />
                        <ViewRow icon={Phone} label="Số điện thoại" value={form.phone} />
                        <ViewRow icon={Cake} label="Ngày sinh" value={form.date_of_birth ? format(new Date(form.date_of_birth), 'dd/MM/yyyy') : ''} />
                        <ViewRow icon={UserCircle2} label="Giới tính" value={form.gender} />
                        <ViewRow icon={MapPin} label="Địa chỉ" value={form.address} />
                        <ViewRow icon={IdCard} label="CCCD" value={form.id_card ? (showCccd ? form.id_card : '••••••••') : ''} action={form.id_card ? (
                          <button onClick={() => setShowCccd(!showCccd)} className="text-xs text-primary inline-flex items-center gap-1">
                            {showCccd ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            {showCccd ? 'Ẩn' : 'Hiện'}
                          </button>
                        ) : null} />
                        <ViewRow icon={Heart} label="Sở thích phòng" value={form.room_preferences} />
                        <ViewRow icon={Sparkles} label="Yêu cầu đặc biệt" value={form.special_requests} />

                        {/* Tier progress */}
                        <div className="mt-6 border-t border-border pt-5">
                          <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                            <Crown className="h-4 w-4 text-primary" /> Hạng thành viên: <span className={`px-2 py-0.5 text-xs rounded-full ${TIER_COLORS[user.tier]}`}>{TIER_LABELS[user.tier][language]}</span>
                          </p>
                          {user.tier !== 'super_vip' && (
                            <>
                              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-gold-gradient transition-all" style={{ width: `${progress}%` }} />
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                {user.bookingCount}/{VIP_NEXT} lần đặt → {VIP_NEXT_LABEL}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-3">
                        <Field label="Họ tên *" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
                        <Field label="Số điện thoại" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                        <Field label="Ngày sinh" type="date" value={form.date_of_birth} onChange={(v) => setForm({ ...form, date_of_birth: v })} />
                        <Field label="Giới tính (Nam/Nữ/Khác)" value={form.gender} onChange={(v) => setForm({ ...form, gender: v })} />
                        <Field label="Địa chỉ" value={form.address} onChange={(v) => setForm({ ...form, address: v })} className="sm:col-span-2" />
                        <Field label="CCCD" value={form.id_card} onChange={(v) => setForm({ ...form, id_card: v })} />
                        <Field label="Quốc tịch" value={form.nationality} onChange={(v) => setForm({ ...form, nationality: v })} />
                        <Field label="URL ảnh đại diện" value={form.avatar_url} onChange={(v) => setForm({ ...form, avatar_url: v })} className="sm:col-span-2" />
                        <Field label="URL ảnh bìa" value={form.cover_url} onChange={(v) => setForm({ ...form, cover_url: v })} className="sm:col-span-2" />
                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Sở thích phòng</label>
                          <Textarea rows={2} value={form.room_preferences} onChange={(e) => setForm({ ...form, room_preferences: e.target.value })} placeholder="VD: View biển, tầng cao..." />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Yêu cầu đặc biệt</label>
                          <Textarea rows={2} value={form.special_requests} onChange={(e) => setForm({ ...form, special_requests: e.target.value })} placeholder="VD: Không hành, gối thấp..." />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* BOOKINGS TAB */}
                {tab === 'bookings' && (
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2 mb-4">
                      <Calendar className="h-5 w-5 text-primary" /> Lịch sử đặt phòng
                    </h2>
                    {bookings.length === 0 ? (
                      <EmptyState text="Chưa có đơn đặt phòng nào." />
                    ) : (
                      <div className="space-y-3">
                        {bookings.map((b) => (
                          <Link
                            key={b.id}
                            to={`/account/booking/${b.booking_code}`}
                            className="block border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-sm transition-all"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono font-semibold text-foreground">{b.booking_code}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${statusColors[b.status] || 'bg-secondary'}`}>
                                    {statusLabels[b.status] || b.status}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  📅 {format(new Date(b.check_in), 'dd/MM')} → {format(new Date(b.check_out), 'dd/MM/yyyy')}
                                  {' · '}{b.room_quantity} phòng · {b.guests_count} khách
                                </p>
                                <div className="flex items-center gap-3 mt-1.5 text-sm">
                                  <span className="font-semibold text-primary">{formatVnd(b.total_price_vnd)}</span>
                                  {b.remaining_amount > 0 && (
                                    <span className="text-xs text-amber-700">Còn {formatVnd(b.remaining_amount)}</span>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground self-center" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* MESSAGES TAB */}
                {tab === 'messages' && supabaseUser && (
                  <ChatPanel userId={supabaseUser.id} />
                )}

                {/* VOUCHERS TAB */}
                {tab === 'vouchers' && (
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2 mb-4">
                      <Gift className="h-5 w-5 text-primary" /> Ưu đãi của tôi
                    </h2>

                    <div className="border border-primary/20 rounded-xl p-4 bg-primary/5 mb-6">
                      <p className="font-semibold text-foreground flex items-center gap-2">
                        <Crown className="h-4 w-4 text-primary" /> {TIER_LABELS[user.tier][language]}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {user.tier === 'normal' ? 'Đặt 3 lần để nâng hạng VIP, nhận giảm 5–10% tiền phòng.' :
                         user.tier === 'vip' ? 'Tự động giảm 5–10% tiền phòng khi đặt.' :
                         'Tự động giảm tối đa khi đặt phòng.'}
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground mb-3">Voucher khả dụng ({vouchers.length}):</p>
                    {vouchers.length === 0 ? (
                      <EmptyState text="Hiện chưa có voucher khả dụng." />
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {vouchers.map((v) => (
                          <div key={v.id} className="border border-primary/20 rounded-xl p-4 bg-primary/5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono font-bold text-base text-primary tracking-wider">{v.code}</span>
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
                    )}
                  </div>
                )}

                {/* SETTINGS TAB */}
                {tab === 'settings' && (
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2 mb-4">
                      <SettingsIcon className="h-5 w-5 text-primary" /> Cài đặt tài khoản
                    </h2>
                    <div className="space-y-4 text-sm">
                      <div className="border border-border rounded-xl p-4">
                        <p className="font-semibold mb-1">Email đăng nhập</p>
                        <p className="text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="border border-border rounded-xl p-4">
                        <p className="font-semibold mb-2">Hỗ trợ</p>
                        <p className="text-muted-foreground">📞 098.360.5768 · 💬 Zalo 038.441.8811</p>
                      </div>
                      <Button variant="destructive" onClick={() => signOut()} className="gap-2">
                        <LogOut className="h-4 w-4" /> Đăng xuất
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </section>
        </div>

        {/* Quick KPI strip */}
        {!loading && (
          <div className="max-w-6xl mx-auto px-4 mt-6">
            <div className="grid grid-cols-3 gap-3">
              <MiniStat icon={Calendar} label="Đơn đặt phòng" value={bookings.length} />
              <MiniStat icon={Crown} label="Tổng chi" value={formatVnd(totalSpent)} />
              <MiniStat icon={Gift} label="Voucher" value={vouchers.length} />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

// ==================== Sub-components ====================

const InfoRow = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-start gap-2">
    <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  </div>
);

const ViewRow = ({ icon: Icon, label, value, action }: any) => (
  <div className="flex items-center gap-3 py-2 border-b border-border last:border-0">
    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
    <span className="text-xs uppercase tracking-wider text-muted-foreground w-32 shrink-0">{label}</span>
    <span className="flex-1 text-foreground font-medium truncate">{value || <span className="text-muted-foreground/60">—</span>}</span>
    {action}
  </div>
);

const Field = ({ label, value, onChange, type = 'text', className = '' }: any) => (
  <div className={className}>
    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{label}</label>
    <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const PayRow = ({ label, value, bold, className = '' }: any) => (
  <div className={`flex justify-between ${bold ? 'font-bold text-base' : ''} ${className}`}>
    <span>{label}</span>
    <span>{formatVnd(value)}</span>
  </div>
);

const MiniStat = ({ icon: Icon, label, value }: any) => (
  <div className="bg-card rounded-xl border border-border p-4 text-center">
    <Icon className="h-5 w-5 mx-auto mb-1.5 text-primary" />
    <p className="text-lg font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-xl">{text}</div>
);

// ==================== Chat Panel ====================
const ChatPanel = ({ userId }: { userId: string }) => {
  const { messages, loading, sendMessage } = useMemberChat(userId, false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    const r = await sendMessage(text);
    setSending(false);
    if (!r.error) setText('');
  };

  // auto-scroll
  const endRef = useMemo(() => ({ current: null as HTMLDivElement | null }), []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, endRef]);

  return (
    <div className="flex flex-col h-[60vh]">
      <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2 mb-3">
        <MessageSquare className="h-5 w-5 text-primary" /> Tin nhắn với khách sạn
      </h2>

      <div className="flex-1 border border-border rounded-xl bg-secondary/30 p-4 overflow-y-auto space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
            <MessageSquare className="h-10 w-10 opacity-30" />
            <p>Chưa có tin nhắn nào.</p>
            <p className="text-xs">Gửi tin nhắn để được hỗ trợ trực tiếp.</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === 'member' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                m.sender === 'member'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-card border border-border rounded-bl-sm'
              }`}>
                <p className="whitespace-pre-wrap">{m.content}</p>
                <p className={`text-[10px] mt-1 ${m.sender === 'member' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {format(new Date(m.created_at), 'HH:mm dd/MM')}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={(el) => (endRef.current = el)} />
      </div>

      <div className="flex gap-2 mt-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Nhập tin nhắn..."
          disabled={sending}
        />
        <Button onClick={handleSend} disabled={sending || !text.trim()} className="gap-1.5">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Gửi
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        📞 Gọi nhanh: 098.360.5768 · 💬 Zalo: 038.441.8811
      </p>
    </div>
  );
};

export default Account;
