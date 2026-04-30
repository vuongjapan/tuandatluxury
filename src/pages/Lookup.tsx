import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Loader2, Calendar, FileText, ArrowLeft, UtensilsCrossed, Phone, MessageSquare, UserPlus, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';

const statusLabels: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
  checked_in: 'Đang ở',
  checked_out: 'Hoàn thành',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  checked_in: 'bg-blue-100 text-blue-800',
  checked_out: 'bg-stone-100 text-stone-700',
};

const Lookup = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [advPhone, setAdvPhone] = useState('');
  const [advEmail, setAdvEmail] = useState('');
  const [advDate, setAdvDate] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<any[] | null>(null);
  const [foodOrders, setFoodOrders] = useState<any[]>([]);
  const [manualInvoices, setManualInvoices] = useState<any[]>([]);

  const detect = (q: string): { kind: 'code' | 'email' | 'phone' | 'unknown'; value: string } => {
    const v = q.trim();
    if (!v) return { kind: 'unknown', value: v };
    if (v.includes('@')) return { kind: 'email', value: v.toLowerCase() };
    // Booking codes: TD202604A00014, TDTD202604C00001, TD-MAN-12345678, etc.
    if (/^TD/i.test(v) || /^[A-Z]{2,4}[-A-Z0-9]{4,}/i.test(v)) return { kind: 'code', value: v.toUpperCase() };
    if (/^[\d\s+()-]{6,}$/.test(v)) return { kind: 'phone', value: v.replace(/\s+/g, '') };
    return { kind: 'unknown', value: v };
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() && !advPhone.trim() && !advEmail.trim()) {
      toast({ title: 'Nhập thông tin để tra cứu', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setBookings(null);
    setFoodOrders([]);

    try {
      let bQuery = supabase.from('bookings').select('*').eq('visibility', 'visible').order('created_at', { ascending: false }).limit(30);
      let fQuery = supabase.from('food_orders').select('*').order('created_at', { ascending: false }).limit(30);

      if (query.trim()) {
        const d = detect(query);
        if (d.kind === 'code') {
          bQuery = bQuery.eq('booking_code', d.value);
          fQuery = fQuery.eq('food_order_id', d.value);
        } else if (d.kind === 'email') {
          bQuery = bQuery.eq('guest_email', d.value);
          fQuery = fQuery.eq('guest_email', d.value);
        } else if (d.kind === 'phone') {
          bQuery = bQuery.eq('guest_phone', d.value);
          fQuery = fQuery.eq('phone', d.value);
        } else {
          bQuery = bQuery.or(`booking_code.eq.${d.value.toUpperCase()},guest_phone.eq.${d.value},guest_email.eq.${d.value.toLowerCase()}`);
        }
      } else {
        const conds: string[] = [];
        if (advPhone.trim()) conds.push(`guest_phone.eq.${advPhone.trim()}`);
        if (advEmail.trim()) conds.push(`guest_email.eq.${advEmail.trim().toLowerCase()}`);
        if (conds.length) bQuery = bQuery.or(conds.join(','));
        if (advDate) bQuery = bQuery.eq('check_in', advDate);

        const fConds: string[] = [];
        if (advPhone.trim()) fConds.push(`phone.eq.${advPhone.trim()}`);
        if (advEmail.trim()) fConds.push(`guest_email.eq.${advEmail.trim().toLowerCase()}`);
        if (fConds.length) fQuery = fQuery.or(fConds.join(','));
      }

      const [b, f] = await Promise.all([bQuery, fQuery]);
      setBookings(b.data || []);
      setFoodOrders(f.data || []);
    } finally {
      setLoading(false);
    }
  };

  const totalFound = (bookings?.length || 0) + foodOrders.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16 max-w-3xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-6">
            <Search className="h-10 w-10 text-primary mx-auto mb-3" />
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Tra cứu đặt phòng
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Tuấn Đạt Luxury Hotel · Không cần đăng nhập
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-card-hover p-6 md:p-8">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">
                  Mã đặt phòng, SĐT, hoặc Email
                </label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="VD: TD202604A00014 / 0901234567 / abc@gmail.com"
                    className="pl-9 h-11 text-base"
                  />
                </div>
              </div>

              <Button type="submit" variant="hero" className="w-full gap-2 h-11" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Tra cứu
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs uppercase tracking-wider text-muted-foreground hover:text-primary"
              >
                {showAdvanced ? 'Ẩn' : 'Hoặc tìm theo nhiều điều kiện'}
              </button>
              <div className="flex-1 h-px bg-border" />
            </div>

            {showAdvanced && (
              <div className="space-y-3 bg-secondary/40 rounded-xl p-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">SĐT</label>
                  <Input value={advPhone} onChange={(e) => setAdvPhone(e.target.value)} placeholder="0901234567" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Email</label>
                  <Input value={advEmail} onChange={(e) => setAdvEmail(e.target.value)} placeholder="abc@gmail.com" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Ngày nhận phòng</label>
                  <Input type="date" value={advDate} onChange={(e) => setAdvDate(e.target.value)} />
                </div>
                <Button type="button" onClick={() => handleSearch()} variant="outline" className="w-full gap-2" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Tìm kiếm
                </Button>
              </div>
            )}
          </div>

          {/* Results */}
          {bookings !== null && (
            <div className="mt-6 space-y-4">
              <h2 className="font-display text-xl font-bold text-foreground">
                {totalFound > 0 ? `✅ Tìm thấy ${totalFound} kết quả` : '😕 Không tìm thấy đơn nào'}
              </h2>

              {totalFound === 0 && (
                <div className="bg-card rounded-xl border border-border p-6 text-sm text-center space-y-3">
                  <p className="text-muted-foreground">Vui lòng kiểm tra lại:</p>
                  <ul className="text-muted-foreground space-y-1">
                    <li>· Mã đặt phòng trong email xác nhận</li>
                    <li>· SĐT hoặc Email đã dùng khi đặt</li>
                  </ul>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    <a href="tel:0983605768"><Button size="sm" variant="outline" className="gap-1.5"><Phone className="h-3.5 w-3.5" /> 098.360.5768</Button></a>
                    <a href="https://zalo.me/0384418811" target="_blank" rel="noreferrer"><Button size="sm" variant="outline" className="gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Zalo</Button></a>
                  </div>
                </div>
              )}

              {bookings.map((b) => (
                <div key={b.id} className="bg-card rounded-xl border border-border p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-mono font-semibold text-foreground">{b.booking_code}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColors[b.status] || 'bg-secondary'}`}>
                          {statusLabels[b.status] || b.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {b.guest_name} · {(b.guest_phone || '').replace(/(\d{4})\d{3}(\d{3})/, '$1•••$2')}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {format(new Date(b.check_in), 'dd/MM')} → {format(new Date(b.check_out), 'dd/MM/yyyy')} · {b.room_quantity} phòng · {b.guests_count} khách
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Tổng</p>
                      <p className="font-semibold text-foreground">{formatVnd(b.total_price_vnd)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Đã cọc</p>
                      <p className="font-semibold text-green-700">{formatVnd(b.deposit_amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Còn lại</p>
                      <p className={`font-semibold ${b.remaining_amount > 0 ? 'text-amber-700' : 'text-foreground'}`}>{formatVnd(b.remaining_amount)}</p>
                    </div>
                  </div>

                  {b.sepay_qr_url && b.remaining_amount > 0 && (
                    <details className="mt-3 border-t border-border pt-3">
                      <summary className="cursor-pointer text-xs text-primary inline-flex items-center gap-1">
                        <QrCode className="h-3 w-3" /> Xem QR thanh toán cọc
                      </summary>
                      <div className="mt-2 flex flex-col items-center gap-1">
                        <img src={b.sepay_qr_url} alt="QR" className="w-40 h-40 border border-border rounded-lg" />
                        <p className="text-xs text-muted-foreground">BIDV · 96247TUANDATLUXURY</p>
                      </div>
                    </details>
                  )}

                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
                    <Link to={`/invoice/${b.booking_code}`}>
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <FileText className="h-3.5 w-3.5" /> Hóa đơn
                      </Button>
                    </Link>
                    <a href="tel:0983605768">
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <Phone className="h-3.5 w-3.5" /> Hỗ trợ
                      </Button>
                    </a>
                  </div>
                </div>
              ))}

              {foodOrders.map((f) => (
                <div key={f.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <UtensilsCrossed className="h-4 w-4 text-primary" />
                        <span className="font-mono font-semibold">{f.food_order_id}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColors[f.status] || 'bg-secondary'}`}>
                          {statusLabels[f.status] || f.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {f.customer_name} · {format(new Date(f.created_at), 'dd/MM/yyyy HH:mm')}
                      </p>
                      <p className="text-sm font-semibold text-primary mt-1">{formatVnd(f.total_amount)}</p>
                    </div>
                    <Link to={`/food-invoice/${f.food_order_id}`}>
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <FileText className="h-3.5 w-3.5" /> Xem
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}

              {totalFound > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-sm">
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-primary" /> Đăng ký thành viên để:
                  </p>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    <li>✓ Lưu lịch sử đặt phòng tự động</li>
                    <li>✓ Nhận ưu đãi VIP đến 10%</li>
                    <li>✓ Chat trực tiếp với khách sạn</li>
                  </ul>
                  <Link to="/member" className="inline-block mt-3">
                    <Button size="sm" variant="hero" className="gap-1.5">
                      <UserPlus className="h-3.5 w-3.5" /> Đăng ký miễn phí
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Về trang chủ
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Lookup;
