import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, Download, Search, X, User, Calendar, UtensilsCrossed, Crown, Mail, Phone,
  MessageSquare, Clock, Save, Edit3, Send, ShieldCheck, Tag, Gift,
} from 'lucide-react';
import { format } from 'date-fns';
import { useMemberChat } from '@/hooks/useMemberChat';
import { useToast } from '@/hooks/use-toast';
import { AssignVoucherDialog } from '@/components/admin/AssignVoucherDialog';

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';

type TierKey = 'standard' | 'vip' | 'super_vip';

interface CustomerRow {
  key: string;
  userId?: string | null;
  profileId?: string | null;
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  confirmedBookings: number;
  totalSpent: number;
  lastBookingAt: string | null;
  tier: TierKey;
  manualTier?: string | null;
  accountStatus?: string | null;
  adminTags?: string[] | null;
  adminNotes?: string | null;
  isMember: boolean;
  createdAt?: string | null;
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

type DetailTab = 'info' | 'bookings' | 'messages' | 'timeline';

const AdminCustomers = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | TierKey | 'member' | 'guest' | 'blocked'>('all');
  const [selected, setSelected] = useState<CustomerRow | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('info');
  const [editing, setEditing] = useState(false);

  const reload = async () => {
    setLoading(true);
    const [{ data: bs }, { data: fs }, { data: ps }] = await Promise.all([
      supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(2000),
      supabase.from('food_orders').select('*').order('created_at', { ascending: false }).limit(2000),
      supabase.from('profiles').select('*').limit(2000),
    ]);

    const map = new Map<string, CustomerRow>();

    // Seed with profiles (members)
    (ps || []).forEach((p: any) => {
      const key = (p.email?.toLowerCase() || p.phone || `u_${p.user_id}`).trim();
      map.set(key, {
        key,
        userId: p.user_id,
        profileId: p.id,
        name: p.full_name || '',
        email: p.email || '',
        phone: p.phone || '',
        totalBookings: 0,
        confirmedBookings: 0,
        totalSpent: 0,
        lastBookingAt: null,
        tier: 'standard',
        manualTier: p.manual_tier,
        accountStatus: p.account_status || 'active',
        adminTags: p.admin_tags || [],
        adminNotes: p.admin_notes,
        isMember: true,
        createdAt: p.created_at,
        bookings: [],
        foodOrders: [],
      });
    });

    (bs || []).forEach((b: any) => {
      const key = (b.guest_email?.toLowerCase() || b.guest_phone || 'unknown').trim();
      if (!key || key === 'unknown') return;
      const cur = map.get(key) || {
        key,
        name: b.guest_name || '',
        email: b.guest_email || '',
        phone: b.guest_phone || '',
        totalBookings: 0, confirmedBookings: 0, totalSpent: 0,
        lastBookingAt: null, tier: 'standard' as TierKey,
        isMember: false, bookings: [], foodOrders: [],
      };
      cur.bookings.push(b);
      cur.totalBookings += 1;
      if (b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'checked_out') {
        cur.confirmedBookings += 1;
        cur.totalSpent += b.total_price_vnd || 0;
      }
      if (!cur.lastBookingAt || new Date(b.created_at) > new Date(cur.lastBookingAt)) {
        cur.lastBookingAt = b.created_at;
        if (!cur.name) cur.name = b.guest_name || cur.name;
        if (!cur.email) cur.email = b.guest_email || cur.email;
        if (!cur.phone) cur.phone = b.guest_phone || cur.phone;
      }
      map.set(key, cur);
    });

    (fs || []).forEach((f: any) => {
      const key = (f.guest_email?.toLowerCase() || f.phone || '').trim();
      if (!key) return;
      const cur = map.get(key);
      if (cur) cur.foodOrders.push(f);
    });

    const list = Array.from(map.values()).map((c) => ({
      ...c,
      tier: (c.manualTier as TierKey) || computeTier(c.confirmedBookings),
    }));
    list.sort((a, b) => b.totalSpent - a.totalSpent);
    setCustomers(list);
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (filter === 'member' && !c.isMember) return false;
      if (filter === 'guest' && c.isMember) return false;
      if (filter === 'blocked' && c.accountStatus !== 'blocked') return false;
      if ((filter === 'standard' || filter === 'vip' || filter === 'super_vip') && c.tier !== filter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.bookings.some((b) => (b.booking_code || '').toLowerCase().includes(q))
      );
    });
  }, [customers, search, filter]);

  const handleExport = () => {
    const headers = ['Tên', 'Email', 'SĐT', 'Tổng booking', 'Đã xác nhận', 'Tổng chi (VND)', 'Tier', 'Thành viên', 'Trạng thái', 'Booking gần nhất'];
    const rows = filtered.map((c) => [
      c.name, c.email, c.phone, c.totalBookings, c.confirmedBookings, c.totalSpent,
      tierLabel[c.tier], c.isMember ? 'Có' : 'Vãng lai', c.accountStatus || 'active',
      c.lastBookingAt ? format(new Date(c.lastBookingAt), 'dd/MM/yyyy HH:mm') : '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `khach-hang-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const counts = useMemo(() => ({
    all: customers.length,
    member: customers.filter((c) => c.isMember).length,
    vip: customers.filter((c) => c.tier === 'vip').length,
    super_vip: customers.filter((c) => c.tier === 'super_vip').length,
    guest: customers.filter((c) => !c.isMember).length,
    blocked: customers.filter((c) => c.accountStatus === 'blocked').length,
  }), [customers]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Khách hàng</h2>
          <p className="text-sm text-muted-foreground">Tổng hợp thành viên + khách vãng lai, gộp theo email/SĐT.</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV ({filtered.length})
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên, SĐT, email, mã đơn..." className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1 bg-secondary rounded-lg p-1">
          {(
            [
              ['all', `Tất cả (${counts.all})`],
              ['member', `Thành viên (${counts.member})`],
              ['vip', `VIP (${counts.vip})`],
              ['super_vip', `Siêu VIP (${counts.super_vip})`],
              ['guest', `Vãng lai (${counts.guest})`],
              ['blocked', `Bị khóa (${counts.blocked})`],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filter === k ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              {label}
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
                <th className="px-4 py-3 font-semibold text-center">Loại</th>
                <th className="px-4 py-3 font-semibold">Gần nhất</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">Không có khách nào.</td></tr>
              )}
              {filtered.map((c) => (
                <tr
                  key={c.key}
                  onClick={() => { setSelected(c); setDetailTab('info'); setEditing(false); }}
                  className="border-t border-border hover:bg-secondary/40 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {c.name || '—'}
                    {c.accountStatus === 'blocked' && <span className="ml-1.5 text-[10px] text-destructive">🚫</span>}
                  </td>
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
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${tierClass[c.tier]}`}>{tierLabel[c.tier]}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs">
                    {c.isMember ? <span className="text-primary font-medium">Member</span> : <span className="text-muted-foreground">Guest</span>}
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

      {/* Detail drawer */}
      {selected && (
        <CustomerDetail
          customer={selected}
          tab={detailTab}
          setTab={setDetailTab}
          editing={editing}
          setEditing={setEditing}
          onClose={() => { setSelected(null); setEditing(false); }}
          onSaved={() => reload()}
          toast={toast}
        />
      )}
    </div>
  );
};

// ==================== Customer Detail Drawer ====================
const CustomerDetail = ({ customer, tab, setTab, editing, setEditing, onClose, onSaved, toast }: any) => {
  const c: CustomerRow = customer;
  const avgPerBooking = c.confirmedBookings > 0 ? Math.round(c.totalSpent / c.confirmedBookings) : 0;

  const totalNights = c.bookings.reduce((s, b) => {
    const ci = new Date(b.check_in); const co = new Date(b.check_out);
    return s + Math.max(1, Math.round((co.getTime() - ci.getTime()) / 86400000));
  }, 0);
  const avgNights = c.bookings.length > 0 ? (totalNights / c.bookings.length).toFixed(1) : '0';

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-full max-w-3xl bg-card overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-5 z-10">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full bg-gold-gradient flex items-center justify-center shrink-0">
                <User className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold text-foreground truncate">{c.name || '(Chưa có tên)'}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tierClass[c.tier]}`}>{tierLabel[c.tier]}</span>
                  {c.isMember && <span className="text-primary">· Thành viên</span>}
                  {c.accountStatus === 'blocked' && <span className="text-destructive">· Bị khóa</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {c.phone || '—'} · {c.email || '—'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg shrink-0"><X className="h-5 w-5" /></button>
          </div>

          <div className="flex flex-wrap gap-2">
            {c.isMember && (
              <Button size="sm" variant={editing ? 'default' : 'outline'} onClick={() => setEditing(!editing)} className="gap-1.5">
                <Edit3 className="h-3.5 w-3.5" /> {editing ? 'Đang sửa' : 'Sửa'}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setTab('messages')} className="gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> Nhắn tin
            </Button>
            {c.phone && (
              <a href={`tel:${c.phone}`}><Button size="sm" variant="outline" className="gap-1.5"><Phone className="h-3.5 w-3.5" /> Gọi</Button></a>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 border-b border-border -mb-5">
            {(
              [
                ['info', 'Thông tin'],
                ['bookings', `Đặt phòng (${c.bookings.length})`],
                ['messages', 'Tin nhắn'],
                ['timeline', 'Lịch sử'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k as DetailTab)}
                className={`px-3 py-2 text-sm font-semibold border-b-2 transition-all ${
                  tab === k ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {tab === 'info' && (editing && c.isMember ? (
            <CustomerEditForm customer={c} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); onSaved(); }} toast={toast} />
          ) : (
            <CustomerInfoView customer={c} avgPerBooking={avgPerBooking} avgNights={avgNights} />
          ))}

          {tab === 'bookings' && (
            <div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                <KpiCard label="Đặt phòng" value={String(c.confirmedBookings)} sub={`/${c.totalBookings} đơn`} />
                <KpiCard label="Tổng chi" value={formatVnd(c.totalSpent)} />
                <KpiCard label="Đêm TB" value={String(avgNights)} sub="/booking" />
                <KpiCard label="Tier" value={tierLabel[c.tier]} highlight />
              </div>
              <div className="space-y-2 max-h-[55vh] overflow-y-auto">
                {c.bookings.length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">Chưa có booking.</p>}
                {c.bookings.map((b) => (
                  <div key={b.id} className="border border-border rounded-lg p-3 text-sm">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{b.booking_code}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary">{b.status}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(b.check_in), 'dd/MM')} → {format(new Date(b.check_out), 'dd/MM/yyyy')} · {b.room_quantity} phòng
                        </p>
                      </div>
                      <span className="font-semibold text-primary text-xs">{formatVnd(b.total_price_vnd)}</span>
                    </div>
                  </div>
                ))}
                {c.foodOrders.length > 0 && (
                  <>
                    <p className="text-xs uppercase text-muted-foreground mt-4 mb-2 flex items-center gap-1"><UtensilsCrossed className="h-3 w-3" /> Đặt món ({c.foodOrders.length})</p>
                    {c.foodOrders.map((f) => (
                      <div key={f.id} className="border border-border rounded-lg p-3 text-sm">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="font-mono font-semibold">{f.food_order_id}</span>
                            <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(f.created_at), 'dd/MM/yyyy HH:mm')}</p>
                          </div>
                          <span className="font-semibold text-primary text-xs">{formatVnd(f.total_amount)}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {tab === 'messages' && (
            c.isMember && c.userId
              ? <AdminChatPanel userId={c.userId} customerName={c.name} />
              : <div className="text-center py-10 text-sm text-muted-foreground">
                  Khách vãng lai — không có chat trong app.
                  <p className="mt-2">Liên hệ trực tiếp qua điện thoại/Zalo.</p>
                </div>
          )}

          {tab === 'timeline' && (
            <Timeline customer={c} />
          )}
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ label, value, sub, highlight }: any) => (
  <div className={`border rounded-lg p-3 text-center ${highlight ? 'border-primary bg-primary/5' : 'border-border'}`}>
    <p className={`text-base font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
    {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
  </div>
);

const CustomerInfoView = ({ customer, avgPerBooking, avgNights }: any) => {
  const c: CustomerRow = customer;
  return (
    <div className="space-y-3 text-sm">
      <Row label="Họ tên" value={c.name} />
      <Row label="Email" value={c.email} />
      <Row label="SĐT" value={c.phone} />
      {c.isMember && (
        <>
          <Row label="Tham gia" value={c.createdAt ? format(new Date(c.createdAt), 'dd/MM/yyyy') : '—'} />
          <Row label="Trạng thái" value={c.accountStatus || 'active'} />
        </>
      )}
      <Row label="Tier hiện tại" value={`${tierLabel[c.tier]}${c.manualTier ? ' (gán thủ công)' : ' (tự động)'}`} />
      <Row label="Tổng chi" value={formatVnd(c.totalSpent)} />
      <Row label="Trung bình / booking" value={formatVnd(avgPerBooking)} />
      <Row label="Đêm trung bình" value={avgNights} />

      {c.adminTags && c.adminTags.length > 0 && (
        <Row label="Tag nội bộ" value={
          <div className="flex flex-wrap gap-1">
            {c.adminTags.map((t) => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary">{t}</span>)}
          </div>
        } />
      )}
      {c.adminNotes && (
        <Row label="Ghi chú" value={<span className="text-xs italic">{c.adminNotes}</span>} />
      )}
    </div>
  );
};

const Row = ({ label, value }: any) => (
  <div className="flex gap-3 py-2 border-b border-border last:border-0">
    <span className="text-xs uppercase tracking-wider text-muted-foreground w-32 shrink-0">{label}</span>
    <span className="flex-1 text-foreground">{value || <span className="text-muted-foreground/60">—</span>}</span>
  </div>
);

// ==================== Edit Form (admin only) ====================
const CustomerEditForm = ({ customer, onCancel, onSaved, toast }: any) => {
  const c: CustomerRow = customer;
  const [form, setForm] = useState({
    full_name: c.name || '',
    phone: c.phone || '',
    email: c.email || '',
    manual_tier: c.manualTier || '',
    manual_tier_note: '',
    account_status: c.accountStatus || 'active',
    admin_notes: c.adminNotes || '',
    admin_tags_str: (c.adminTags || []).join(', '),
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!c.userId) return;
    setSaving(true);
    const payload: any = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      manual_tier: form.manual_tier || null,
      manual_tier_note: form.manual_tier_note || null,
      account_status: form.account_status,
      admin_notes: form.admin_notes || null,
      admin_tags: form.admin_tags_str.split(',').map((s) => s.trim()).filter(Boolean),
    };
    const { error } = await supabase.from('profiles').update(payload).eq('user_id', c.userId);
    setSaving(false);
    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Đã cập nhật ✓' });
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs uppercase font-semibold text-muted-foreground mb-1 block">Họ tên</label>
          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div>
          <label className="text-xs uppercase font-semibold text-muted-foreground mb-1 block">SĐT</label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs uppercase font-semibold text-muted-foreground mb-1 block">Email</label>
          <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5"><Crown className="h-4 w-4 text-primary" /> Hạng thành viên</p>
        <div className="flex gap-2 flex-wrap">
          {(['', 'standard', 'vip', 'super_vip'] as const).map((t) => (
            <button
              key={t || 'auto'}
              type="button"
              onClick={() => setForm({ ...form, manual_tier: t })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${form.manual_tier === t ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}
            >
              {t === '' ? 'Tự động' : tierLabel[t as TierKey]}
            </button>
          ))}
        </div>
        {form.manual_tier && (
          <Input className="mt-2" value={form.manual_tier_note} onChange={(e) => setForm({ ...form, manual_tier_note: e.target.value })} placeholder="Lý do gán thủ công..." />
        )}
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Trạng thái tài khoản</p>
        <div className="flex gap-2">
          {(['active', 'restricted', 'blocked'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setForm({ ...form, account_status: s })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${form.account_status === s ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}
            >
              {s === 'active' ? 'Hoạt động' : s === 'restricted' ? 'Hạn chế' : 'Khóa'}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <label className="text-xs uppercase font-semibold text-muted-foreground mb-1 block flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Tag nội bộ (cách nhau dấu phẩy)</label>
        <Input value={form.admin_tags_str} onChange={(e) => setForm({ ...form, admin_tags_str: e.target.value })} placeholder="VIP, Khó tính, Ưu tiên..." />
      </div>

      <div>
        <label className="text-xs uppercase font-semibold text-muted-foreground mb-1 block">Ghi chú nội bộ (khách không thấy)</label>
        <Textarea rows={3} value={form.admin_notes} onChange={(e) => setForm({ ...form, admin_notes: e.target.value })} placeholder="Khách hay hỏi combo, thích view biển..." />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel}>Hủy</Button>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu
        </Button>
      </div>
    </div>
  );
};

// ==================== Admin Chat Panel ====================
const AdminChatPanel = ({ userId, customerName }: { userId: string; customerName: string }) => {
  const { messages, loading, sendMessage } = useMemberChat(userId, true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    const r = await sendMessage(text);
    setSending(false);
    if (!r.error) setText('');
  };

  return (
    <div className="flex flex-col h-[60vh]">
      <p className="text-sm text-muted-foreground mb-2">Chat với <span className="font-semibold">{customerName || 'thành viên'}</span></p>
      <div className="flex-1 border border-border rounded-xl bg-secondary/30 p-3 overflow-y-auto space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-full"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-10">Chưa có tin nhắn.</p>
        ) : messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
              m.sender === 'admin' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border rounded-bl-sm'
            }`}>
              <p className="whitespace-pre-wrap">{m.content}</p>
              <p className={`text-[10px] mt-0.5 ${m.sender === 'admin' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {format(new Date(m.created_at), 'HH:mm dd/MM')}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Trả lời khách..." />
        <Button onClick={handleSend} disabled={sending || !text.trim()} className="gap-1.5">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Gửi
        </Button>
      </div>
    </div>
  );
};

// ==================== Timeline ====================
const Timeline = ({ customer }: { customer: CustomerRow }) => {
  const events: { time: string; label: string; icon: any }[] = [];
  if (customer.createdAt && customer.isMember) events.push({ time: customer.createdAt, label: 'Tạo tài khoản thành viên', icon: User });
  customer.bookings.forEach((b) => {
    events.push({ time: b.created_at, label: `Đặt phòng ${b.booking_code} · ${formatVnd(b.total_price_vnd)}`, icon: Calendar });
    if (b.deposit_amount > 0) events.push({ time: b.created_at, label: `Cọc ${formatVnd(b.deposit_amount)}`, icon: Crown });
  });
  customer.foodOrders.forEach((f) => {
    events.push({ time: f.created_at, label: `Đặt món ${f.food_order_id} · ${formatVnd(f.total_amount)}`, icon: UtensilsCrossed });
  });
  events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className="space-y-2">
      {events.length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">Chưa có hoạt động.</p>}
      {events.map((e, i) => (
        <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
          <e.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">{e.label}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(e.time), 'HH:mm dd/MM/yyyy')}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminCustomers;
