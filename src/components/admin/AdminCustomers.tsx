import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Download, Search, X, User, Calendar, UtensilsCrossed, Crown, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';

type TierKey = 'standard' | 'vip' | 'super_vip';

interface CustomerRow {
  key: string;
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  confirmedBookings: number;
  totalSpent: number;
  lastBookingAt: string | null;
  tier: TierKey;
  bookings: any[];
  foodOrders: any[];
}

const tierLabel: Record<TierKey, string> = { standard: 'Thường', vip: 'VIP', super_vip: 'Siêu VIP' };
const tierClass: Record<TierKey, string> = {
  standard: 'bg-muted text-muted-foreground',
  vip: 'bg-primary/15 text-primary',
  super_vip: 'bg-gold-gradient text-primary-foreground',
};

const computeTier = (count: number): TierKey => {
  if (count >= 10) return 'super_vip';
  if (count >= 3) return 'vip';
  return 'standard';
};

const AdminCustomers = () => {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | TierKey>('all');
  const [selected, setSelected] = useState<CustomerRow | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: bs }, { data: fs }] = await Promise.all([
        supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('food_orders').select('*').order('created_at', { ascending: false }).limit(1000),
      ]);

      const map = new Map<string, CustomerRow>();
      (bs || []).forEach((b) => {
        const key = (b.guest_email?.toLowerCase() || b.guest_phone || 'unknown').trim();
        if (!key || key === 'unknown') return;
        const cur = map.get(key) || {
          key,
          name: b.guest_name || '',
          email: b.guest_email || '',
          phone: b.guest_phone || '',
          totalBookings: 0,
          confirmedBookings: 0,
          totalSpent: 0,
          lastBookingAt: null,
          tier: 'standard' as TierKey,
          bookings: [],
          foodOrders: [],
        };
        cur.bookings.push(b);
        cur.totalBookings += 1;
        if (b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'checked_out') {
          cur.confirmedBookings += 1;
          cur.totalSpent += b.total_price_vnd || 0;
        }
        if (!cur.lastBookingAt || new Date(b.created_at) > new Date(cur.lastBookingAt)) {
          cur.lastBookingAt = b.created_at;
          cur.name = b.guest_name || cur.name;
          cur.email = b.guest_email || cur.email;
          cur.phone = b.guest_phone || cur.phone;
        }
        map.set(key, cur);
      });

      (fs || []).forEach((f) => {
        const key = (f.guest_email?.toLowerCase() || f.phone || '').trim();
        if (!key) return;
        const cur = map.get(key);
        if (cur) cur.foodOrders.push(f);
      });

      const list = Array.from(map.values()).map((c) => ({ ...c, tier: computeTier(c.confirmedBookings) }));
      list.sort((a, b) => b.totalSpent - a.totalSpent);
      setCustomers(list);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (tierFilter !== 'all' && c.tier !== tierFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
      );
    });
  }, [customers, search, tierFilter]);

  const handleExport = () => {
    const headers = ['Tên', 'Email', 'SĐT', 'Tổng booking', 'Đã xác nhận', 'Tổng chi tiêu (VND)', 'Tier', 'Booking gần nhất'];
    const rows = filtered.map((c) => [
      c.name,
      c.email,
      c.phone,
      c.totalBookings,
      c.confirmedBookings,
      c.totalSpent,
      tierLabel[c.tier],
      c.lastBookingAt ? format(new Date(c.lastBookingAt), 'dd/MM/yyyy HH:mm') : '',
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `khach-hang-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tierCounts = useMemo(() => {
    return {
      all: customers.length,
      standard: customers.filter((c) => c.tier === 'standard').length,
      vip: customers.filter((c) => c.tier === 'vip').length,
      super_vip: customers.filter((c) => c.tier === 'super_vip').length,
    };
  }, [customers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Quản lý khách hàng</h2>
          <p className="text-sm text-muted-foreground">Tổng hợp từ đơn đặt phòng và đơn đặt món, gộp theo email/SĐT.</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV ({filtered.length})
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email, SĐT..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {(['all', 'standard', 'vip', 'super_vip'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTierFilter(k)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                tierFilter === k ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
              }`}
            >
              {k === 'all' ? 'Tất cả' : tierLabel[k]} ({tierCounts[k]})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Khách</th>
                <th className="px-4 py-3 font-semibold">Liên hệ</th>
                <th className="px-4 py-3 font-semibold text-center">Booking</th>
                <th className="px-4 py-3 font-semibold text-right">Tổng chi</th>
                <th className="px-4 py-3 font-semibold text-center">Tier</th>
                <th className="px-4 py-3 font-semibold">Gần nhất</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted-foreground">Không có khách nào.</td>
                </tr>
              )}
              {filtered.map((c) => (
                <tr
                  key={c.key}
                  onClick={() => setSelected(c)}
                  className="border-t border-border hover:bg-secondary/40 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-foreground">{c.name || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="text-xs">{c.email || '—'}</div>
                    <div className="text-xs">{c.phone || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold">{c.confirmedBookings}</span>
                    <span className="text-muted-foreground text-xs">/{c.totalBookings}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">{formatVnd(c.totalSpent)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${tierClass[c.tier]}`}>
                      {tierLabel[c.tier]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {c.lastBookingAt ? format(new Date(c.lastBookingAt), 'dd/MM/yyyy') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => setSelected(null)} />
          <div className="w-full max-w-2xl bg-card overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-card border-b border-border p-5 flex items-center justify-between z-10">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" /> {selected.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                  {selected.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{selected.email}</span>}
                  {selected.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{selected.phone}</span>}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-secondary rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-border rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{selected.confirmedBookings}</p>
                  <p className="text-xs text-muted-foreground">Đã xác nhận</p>
                </div>
                <div className="border border-border rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{formatVnd(selected.totalSpent)}</p>
                  <p className="text-xs text-muted-foreground">Tổng chi</p>
                </div>
                <div className="border border-border rounded-lg p-3 text-center">
                  <Crown className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${tierClass[selected.tier]}`}>
                    {tierLabel[selected.tier]}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> Đơn đặt phòng ({selected.bookings.length})
                </h4>
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {selected.bookings.map((b) => (
                    <div key={b.id} className="border border-border rounded-lg p-3 text-sm">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-mono font-semibold">{b.booking_code}</span>
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-secondary">{b.status}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(b.check_in), 'dd/MM')} → {format(new Date(b.check_out), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <span className="font-semibold text-primary text-xs">{formatVnd(b.total_price_vnd)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selected.foodOrders.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-1.5">
                    <UtensilsCrossed className="h-4 w-4" /> Đơn đặt món ({selected.foodOrders.length})
                  </h4>
                  <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                    {selected.foodOrders.map((f) => (
                      <div key={f.id} className="border border-border rounded-lg p-3 text-sm">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="font-mono font-semibold">{f.food_order_id}</span>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(f.created_at), 'dd/MM/yyyy HH:mm')}
                            </p>
                          </div>
                          <span className="font-semibold text-primary text-xs">{formatVnd(f.total_amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
