import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Hash, Phone, Loader2, Calendar, FileText, ArrowLeft, UtensilsCrossed } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type Mode = 'code' | 'contact';

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';

const statusLabels: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
  checked_in: 'Đang ở',
  checked_out: 'Đã trả phòng',
};

const Lookup = () => {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('code');
  const [bookingCode, setBookingCode] = useState('');
  const [phone, setPhone] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [foodResults, setFoodResults] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);
    setFoodResults([]);

    try {
      if (mode === 'code') {
        if (!bookingCode.trim() || !phone.trim()) {
          toast({ title: 'Nhập đủ mã booking và SĐT', variant: 'destructive' });
          setLoading(false);
          return;
        }
        const { data } = await supabase
          .from('bookings')
          .select('*')
          .eq('booking_code', bookingCode.trim().toUpperCase())
          .eq('guest_phone', phone.trim())
          .order('created_at', { ascending: false });
        setResults(data || []);
      } else {
        if (!contact.trim()) {
          toast({ title: 'Nhập SĐT hoặc Email', variant: 'destructive' });
          setLoading(false);
          return;
        }
        const c = contact.trim();
        const isEmail = c.includes('@');
        const filterB = isEmail ? `guest_email.eq.${c.toLowerCase()}` : `guest_phone.eq.${c}`;
        const filterF = isEmail ? `guest_email.eq.${c.toLowerCase()}` : `phone.eq.${c}`;

        const [b, f] = await Promise.all([
          supabase.from('bookings').select('*').or(filterB).order('created_at', { ascending: false }).limit(20),
          supabase.from('food_orders').select('*').or(filterF).order('created_at', { ascending: false }).limit(20),
        ]);
        setResults(b.data || []);
        setFoodResults(f.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16 max-w-3xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center">
            Tra cứu đơn đặt
          </h1>
          <p className="text-center text-muted-foreground mt-2 text-sm">
            Khách vãng lai có thể tra cứu mà không cần đăng nhập.
          </p>

          <div className="bg-card rounded-2xl border border-border shadow-card-hover p-6 md:p-8 mt-6">
            {/* Mode tabs */}
            <div className="flex rounded-xl bg-secondary p-1 mb-6">
              <button
                type="button"
                onClick={() => setMode('code')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  mode === 'code' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                <Hash className="h-3.5 w-3.5 inline mr-1.5" /> Mã booking + SĐT
              </button>
              <button
                type="button"
                onClick={() => setMode('contact')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  mode === 'contact' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                <Phone className="h-3.5 w-3.5 inline mr-1.5" /> SĐT / Email
              </button>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              {mode === 'code' ? (
                <>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Mã booking</label>
                    <Input value={bookingCode} onChange={(e) => setBookingCode(e.target.value)} placeholder="VD: TDL2026XXXX" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Số điện thoại đặt</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0912 345 678" />
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Số điện thoại hoặc Email</label>
                  <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="0912... hoặc email@example.com" />
                  <p className="text-xs text-muted-foreground mt-1">Hệ thống sẽ liệt kê tất cả đơn trùng SĐT/Email.</p>
                </div>
              )}

              <Button type="submit" variant="hero" className="w-full gap-2" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Tra cứu
              </Button>
            </form>
          </div>

          {/* Results */}
          {results !== null && (
            <div className="mt-6 space-y-4">
              <h2 className="font-display text-xl font-bold text-foreground">
                Kết quả ({results.length + foodResults.length})
              </h2>

              {results.length === 0 && foodResults.length === 0 && (
                <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">
                  Không tìm thấy đơn nào khớp. Vui lòng kiểm tra lại thông tin.
                </div>
              )}

              {results.map((b) => (
                <div key={b.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-mono font-semibold">{b.booking_code}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary font-semibold">
                          {statusLabels[b.status] || b.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {b.guest_name} • {format(new Date(b.check_in), 'dd/MM/yyyy')} → {format(new Date(b.check_out), 'dd/MM/yyyy')}
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

              {foodResults.map((f) => (
                <div key={f.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <UtensilsCrossed className="h-4 w-4 text-primary" />
                        <span className="font-mono font-semibold">{f.food_order_id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary font-semibold">
                          {statusLabels[f.status] || f.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {f.customer_name} • {format(new Date(f.created_at), 'dd/MM/yyyy HH:mm')}
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
