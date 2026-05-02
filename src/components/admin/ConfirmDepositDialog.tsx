import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

interface Props {
  booking: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed?: (updated: any) => void;
}

export const ConfirmDepositDialog = ({ booking, open, onOpenChange, onConfirmed }: Props) => {
  const { toast } = useToast();
  const expectedDeposit = booking.deposit_amount || Math.round((booking.total_price_vnd || 0) * 0.5);
  const [amount, setAmount] = useState<number>(expectedDeposit);
  const [sendEmail, setSendEmail] = useState(true);
  const [busy, setBusy] = useState(false);

  const fmt = (n: number) => (n || 0).toLocaleString('vi') + '₫';

  const handleConfirm = async () => {
    if (!amount || amount <= 0) {
      toast({ title: 'Số tiền không hợp lệ', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const total = booking.total_price_vnd || 0;
      const isFullPaid = amount >= total - 1000;
      const newStatus = isFullPaid ? 'PAID' : 'DEPOSIT_PAID';
      const remaining = Math.max(0, total - amount);
      const nowIso = new Date().toISOString();

      // Step 1: Update booking
      const { error: updErr } = await supabase
        .from('bookings')
        .update({
          payment_status: newStatus,
          deposit_paid_amount: amount,
          deposit_paid_at: nowIso,
          deposit_manually_confirmed: true,
          payment_auto_detected: false,
          remaining_amount: remaining,
        })
        .eq('id', booking.id);
      if (updErr) throw updErr;

      // Step 2: Send email + 2 PDFs (deposit_paid type) — PDF auto reads new payment_status
      if (sendEmail && booking.guest_email) {
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

        const updatedBooking = {
          ...booking,
          payment_status: newStatus,
          deposit_paid_amount: amount,
          deposit_paid_at: nowIso,
          remaining_amount: remaining,
        };

        const { error: emailErr } = await supabase.functions.invoke('send-booking-email', {
          body: {
            type: 'deposit_paid',
            booking: updatedBooking,
            room_name: booking.rooms?.name_vi || booking.room_id,
            invoice_number: booking.booking_code,
            combos_with_dishes,
            food_items: foods || [],
          },
        });
        if (emailErr) throw emailErr;

        await supabase.from('bookings')
          .update({ deposit_email_sent_at: nowIso })
          .eq('id', booking.id);
      }

      toast({
        title: '✅ Đã xác nhận cọc & gửi email',
        description: booking.guest_email
          ? `Đã gửi tới ${booking.guest_email}`
          : 'Khách chưa có email — chỉ cập nhật trạng thái',
      });

      onConfirmed?.({
        ...booking,
        payment_status: newStatus,
        deposit_paid_amount: amount,
        deposit_paid_at: nowIso,
        deposit_manually_confirmed: true,
        remaining_amount: remaining,
        deposit_email_sent_at: sendEmail && booking.guest_email ? nowIso : booking.deposit_email_sent_at,
      });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Lỗi xác nhận', description: e?.message || String(e), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Xác nhận đã nhận cọc
          </DialogTitle>
          <DialogDescription>
            Dùng khi khách CK sai nội dung và webhook không tự nhận diện.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-sm">
          <div className="bg-secondary rounded-lg p-3 space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Đơn:</span>
              <strong className="font-mono">{booking.booking_code}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Khách:</span>
              <strong>{booking.guest_name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span>{booking.guest_email || <em className="text-destructive">chưa có</em>}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1 mt-1">
              <span className="text-muted-foreground">Cọc dự kiến (50%):</span>
              <strong className="text-amber-700">{fmt(expectedDeposit)}</strong>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase block mb-1">
              Số tiền thực nhận <span className="text-destructive">*</span>
            </label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value || '0'))}
              min={1000}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              {amount >= (booking.total_price_vnd || 0) - 1000
                ? '→ Đủ tiền: trạng thái sẽ là ĐÃ THANH TOÁN ĐỦ'
                : '→ Trạng thái sẽ là ĐÃ ĐẶT CỌC'}
            </p>
          </div>

          <div className="space-y-1.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg p-3">
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 mb-1">
              Hệ thống sẽ tự động:
            </p>
            <p className="text-xs flex items-center gap-1.5">✅ Cập nhật trạng thái thanh toán</p>
            <p className="text-xs flex items-center gap-1.5">✅ Tạo lại 2 PDF với dấu "ĐÃ CỌC"</p>
            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                disabled={!booking.guest_email}
                className="rounded border-border"
              />
              <span>📧 Gửi email xác nhận + PDF cho khách</span>
            </label>
            {!booking.guest_email && (
              <p className="text-[11px] text-destructive ml-5">
                (Đơn này chưa có email — chỉ cập nhật trạng thái)
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={busy || !amount}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {busy ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Đang xử lý...</>
              ) : (
                <>✅ Xác nhận {sendEmail && booking.guest_email ? '& Gửi email' : ''}</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
