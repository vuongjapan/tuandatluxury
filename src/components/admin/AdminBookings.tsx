import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Search, X, Eye, FileText, MailWarning, EyeOff, CheckCircle2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DownloadPDFButtons } from '@/components/DownloadPDFButtons';
import { SendInvoiceEmailButton, emailLooksSuspicious } from '@/components/admin/SendInvoiceEmailButton';
import { ConfirmDepositDialog } from '@/components/admin/ConfirmDepositDialog';

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
  DEPOSIT_PAID: '🟢 Đã đặt cọc',
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

  const [hideTarget, setHideTarget] = useState<any>(null);
  const [hideReason, setHideReason] = useState('');
  const [confirmTarget, setConfirmTarget] = useState<any>(null);

  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); return; }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    toast({ title: 'Cập nhật thành công' });
  };

  const handleEmailUpdated = (bookingId: string, newEmail: string) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, guest_email: newEmail } : b));
  };

  const toggleVisibility = async (b: any, hide: boolean) => {
    const payload: any = hide
      ? { visibility: 'hidden', hidden_reason: hideReason || null, hidden_at: new Date().toISOString() }
      : { visibility: 'visible', hidden_reason: null, hidden_at: null };
    const { error } = await supabase.from('bookings').update(payload).eq('id', b.id);
    if (error) { toast({ title: 'Lỗi', description: error.message, variant: 'destructive' }); return; }
    setBookings(prev => prev.map(x => x.id === b.id ? { ...x, ...payload } : x));
    toast({ title: hide ? '👁 Đã ẩn đơn khỏi tra cứu' : '✅ Đã hiện lại đơn' });
    setHideTarget(null);
    setHideReason('');
  };


  const filtered = bookings.filter(b => {
    if (filterStatus === 'no_email') {
      if (b.guest_email) return false;
    } else if (filterStatus !== 'all' && b.status !== filterStatus) {
      return false;
    }
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

  const noEmailCount = bookings.filter(b => !b.guest_email).length;

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
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
            <SelectItem value="no_email">
              <span className="flex items-center gap-1.5">
                <MailWarning className="h-3.5 w-3.5" />
                Chưa có email {noEmailCount > 0 && `(${noEmailCount})`}
              </span>
            </SelectItem>
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
                  <td className="px-3 py-3 font-mono text-xs font-bold text-primary">
                    {b.booking_code}
                    {b.visibility === 'hidden' && (
                      <span className="ml-1 inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-semibold">
                        <EyeOff className="h-2.5 w-2.5" /> Đã ẩn
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-xs">{b.guest_name}</p>
                    <p className="text-[11px] text-muted-foreground">{b.guest_phone}</p>
                    {b.guest_email ? (
                      emailLooksSuspicious(b.guest_email) ? (
                        <p className="text-[10px] text-destructive flex items-center gap-1 truncate max-w-[200px]" title="Email có thể gõ sai">
                          <MailWarning className="h-3 w-3 shrink-0" /> {b.guest_email}
                        </p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{b.guest_email}</p>
                      )
                    ) : (
                      <p className="text-[10px] text-destructive flex items-center gap-1">
                        <MailWarning className="h-3 w-3" /> Chưa có email
                      </p>
                    )}
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
                    {b.deposit_manually_confirmed && (
                      <p className="text-[9px] text-emerald-700 mt-0.5">🖐 Xác nhận thủ công</p>
                    )}
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
                      <DownloadPDFButtons
                        bookingId={b.id}
                        bookingCode={b.booking_code}
                        isPaid={b.payment_status === 'PAID' || b.payment_status === 'DEPOSIT_PAID'}
                        compact
                      />
                      <SendInvoiceEmailButton
                        booking={b}
                        onUpdated={(newEmail) => handleEmailUpdated(b.id, newEmail)}
                      />
                      {b.payment_status === 'PENDING' && (
                        <button
                          onClick={() => setConfirmTarget(b)}
                          className="p-1 rounded hover:bg-emerald-50 text-emerald-700"
                          title="Xác nhận đã nhận cọc thủ công (khi khách CK sai nội dung)"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {b.visibility === 'hidden' ? (
                        <button onClick={() => toggleVisibility(b, false)} className="p-1 rounded hover:bg-secondary text-green-700" title="Hiện lại">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button onClick={() => { setHideTarget(b); setHideReason(''); }} className="p-1 rounded hover:bg-secondary text-amber-600" title="Ẩn khỏi tra cứu">
                          <EyeOff className="h-3.5 w-3.5" />
                        </button>
                      )}
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
      <AlertDialog open={!!hideTarget} onOpenChange={(o) => !o && setHideTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <EyeOff className="h-4 w-4" /> Ẩn đơn {hideTarget?.booking_code}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>Đơn này sẽ bị <strong>ẩn khỏi trang tra cứu của khách</strong> và lịch sử của thành viên.</p>
                <p className="text-muted-foreground">✓ Vẫn hiển thị trong admin · ✓ Dữ liệu không bị xóa</p>
                <div className="pt-2">
                  <label className="text-xs font-semibold uppercase block mb-1">Lý do ẩn (tuỳ chọn)</label>
                  <Textarea rows={2} value={hideReason} onChange={(e) => setHideReason(e.target.value)} placeholder="VD: Hủy đơn đột xuất, đã xử lý..." />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => hideTarget && toggleVisibility(hideTarget, true)}>
              <EyeOff className="h-4 w-4 mr-1.5" /> Xác nhận ẩn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {confirmTarget && (
        <ConfirmDepositDialog
          booking={confirmTarget}
          open={!!confirmTarget}
          onOpenChange={(o) => !o && setConfirmTarget(null)}
          onConfirmed={(updated) => {
            setBookings(prev => prev.map(x => x.id === updated.id ? { ...x, ...updated } : x));
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
};

export default AdminBookings;
