import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Search, X, Eye, FileText, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  checked_in: 'bg-blue-100 text-blue-800',
  checked_out: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
  checked_in: 'Đang ở',
  checked_out: 'Đã trả phòng',
};

const paymentLabels: Record<string, string> = {
  PENDING: '⏳ Chưa thanh toán',
  PARTIAL: '💰 Đặt cọc',
  PAID: '✅ Đã thanh toán',
};

interface Props {
  bookings: any[];
  setBookings: (fn: (prev: any[]) => any[]) => void;
  onMoveToTrash: (booking: any) => void;
  onRefresh: () => void;
}

const AdminBookings = ({ bookings, setBookings, onMoveToTrash, onRefresh }: Props) => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); return; }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    toast({ title: 'Cập nhật thành công' });
  };

  const resendEmail = async (booking: any) => {
    if (!booking.guest_email) {
      toast({ title: 'Khách không có email', variant: 'destructive' });
      return;
    }
    setSendingEmail(booking.id);
    try {
      const [{ data: combos }, { data: foods }] = await Promise.all([
        supabase.from('booking_combos').select('*').eq('booking_id', booking.id),
        supabase.from('booking_food_items').select('*').eq('booking_id', booking.id),
      ]);
      const combos_with_dishes = await Promise.all((combos || []).map(async (c: any) => {
        let dishes = Array.isArray(c.dishes_snapshot) ? c.dishes_snapshot : [];
        if (dishes.length === 0 && c.combo_menu_id) {
          const { data: dd } = await supabase
            .from('combo_menu_dishes')
            .select('name_vi, name_en, sort_order')
            .eq('combo_menu_id', c.combo_menu_id)
            .order('sort_order');
          dishes = dd || [];
        }
        return { ...c, dishes };
      }));

      const isPaid = booking.payment_status === 'PAID';
      const payload: any = {
        booking,
        room_name: booking.rooms?.name_vi || booking.room_id,
        invoice_number: booking.booking_code,
        combos_with_dishes,
        food_items: foods || [],
      };
      if (isPaid) payload.type = 'deposit_paid';

      const { error } = await supabase.functions.invoke('send-booking-email', { body: payload });
      if (error) throw error;
      toast({
        title: '✅ Đã gửi email + 2 PDF',
        description: `Đã gửi tới ${booking.guest_email}`,
      });
    } catch (e: any) {
      toast({ title: 'Gửi email lỗi', description: e?.message, variant: 'destructive' });
    } finally {
      setSendingEmail(null);
    }
  };

  const filtered = bookings.filter(b => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        b.guest_name?.toLowerCase().includes(s) ||
        b.guest_phone?.includes(s) ||
        b.booking_code?.toLowerCase().includes(s) ||
        b.guest_email?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    checkedIn: bookings.filter(b => b.status === 'checked_in').length,
  };

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tổng đơn', value: stats.total, color: 'text-foreground' },
          { label: 'Chờ xác nhận', value: stats.pending, color: 'text-yellow-600' },
          { label: 'Đã xác nhận', value: stats.confirmed, color: 'text-green-600' },
          { label: 'Đang ở', value: stats.checkedIn, color: 'text-blue-600' },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, SĐT, mã đặt..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead className="bg-secondary">
              <tr>
                {['Mã đặt', 'Khách hàng', 'Phòng', 'Nhận → Trả', 'Tổng tiền', 'Thanh toán', 'Trạng thái', ''].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-semibold text-muted-foreground text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-3 py-3 font-mono text-xs font-bold text-primary">{b.booking_code}</td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-xs">{b.guest_name}</p>
                    <p className="text-[11px] text-muted-foreground">{b.guest_phone}</p>
                    {b.guest_email && <p className="text-[10px] text-muted-foreground">{b.guest_email}</p>}
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {b.rooms?.name_vi || b.room_id}
                    {b.room_quantity > 1 && <span className="text-primary ml-1">×{b.room_quantity}</span>}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {b.check_in} → {b.check_out}
                    <br />
                    <span className="text-muted-foreground">{b.guests_count} khách</span>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-primary text-xs">{b.total_price_vnd?.toLocaleString('vi')}₫</p>
                    {b.deposit_amount > 0 && (
                      <p className="text-[10px] text-muted-foreground">Cọc: {b.deposit_amount.toLocaleString('vi')}₫</p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs">{paymentLabels[b.payment_status] || b.payment_status}</span>
                  </td>
                  <td className="px-3 py-3">
                    <Select value={b.status} onValueChange={(v) => updateBookingStatus(b.id, v)}>
                      <SelectTrigger className="h-7 text-xs w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <a href={`/invoice/${b.booking_code}`} target="_blank" className="p-1 rounded hover:bg-secondary" title="Xem hóa đơn">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      </a>
                      <button
                        onClick={() => resendEmail(b)}
                        disabled={sendingEmail === b.id || !b.guest_email}
                        className="p-1 rounded hover:bg-primary/10 text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                        title={b.guest_email ? `Gửi email + 2 PDF tới ${b.guest_email}` : 'Khách không có email'}
                      >
                        {sendingEmail === b.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Mail className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => onMoveToTrash(b)} className="p-1 rounded hover:bg-destructive/10 text-destructive" title="Thùng rác">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {search || filterStatus !== 'all' ? 'Không tìm thấy đơn phù hợp' : 'Chưa có đặt phòng nào'}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Hiển thị {filtered.length} / {bookings.length} đơn</p>
    </div>
  );
};

export default AdminBookings;
