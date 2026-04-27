import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  booking: any;
  onUpdated?: (newEmail: string) => void;
}

const LAST_EMAIL_KEY = 'tdl_last_invoice_recipient';

export const SendInvoiceEmailButton = ({ booking, onUpdated }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState(
    booking.guest_email || (typeof window !== 'undefined' ? localStorage.getItem(LAST_EMAIL_KEY) || '' : '')
  );
  const [saveToProfile, setSaveToProfile] = useState(true);

  const hasEmail = !!booking.guest_email;

  const send = async (targetEmail: string) => {
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      toast({ title: 'Email không hợp lệ', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      // Optionally save email back to booking
      if (!hasEmail && saveToProfile) {
        await supabase.from('bookings').update({ guest_email: targetEmail }).eq('id', booking.id);
        onUpdated?.(targetEmail);
      }

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
        booking: { ...booking, guest_email: targetEmail },
        room_name: booking.rooms?.name_vi || booking.room_id,
        invoice_number: booking.booking_code,
        combos_with_dishes,
        food_items: foods || [],
        override_email: targetEmail,
      };
      if (isPaid) payload.type = 'deposit_paid';

      const { error } = await supabase.functions.invoke('send-booking-email', { body: payload });
      if (error) throw error;

      try { localStorage.setItem(LAST_EMAIL_KEY, targetEmail); } catch {}

      toast({
        title: '✅ Đã gửi email + 2 PDF',
        description: `Tới ${targetEmail}${!hasEmail && saveToProfile ? ' · Đã lưu email vào hồ sơ' : ''}`,
      });
      setOpen(false);
    } catch (e: any) {
      toast({ title: 'Gửi email lỗi', description: e?.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleClick = () => {
    if (hasEmail) {
      // Send straight to existing email
      send(booking.guest_email);
    } else {
      setOpen(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={sending}
        className={`p-1 rounded hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed ${
          hasEmail ? 'text-primary' : 'text-muted-foreground'
        }`}
        title={hasEmail ? `Gửi tới ${booking.guest_email}` : 'Nhập email để gửi'}
      >
        {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Gửi hóa đơn qua email
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-muted border border-border text-foreground text-xs px-3 py-2 rounded-lg">
              ⚠️ Đơn <strong>{booking.booking_code}</strong> chưa có email khách.
              Nhập email nhận hóa đơn (gồm 2 PDF: tóm tắt + chi tiết).
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email nhận</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                autoFocus
              />
            </div>

            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveToProfile}
                onChange={(e) => setSaveToProfile(e.target.checked)}
                className="rounded border-border"
              />
              <span>Lưu email này vào hồ sơ khách</span>
            </label>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={sending}>
                Hủy
              </Button>
              <Button size="sm" onClick={() => send(email)} disabled={sending || !email}>
                {sending ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Đang gửi...</> : 'Gửi hóa đơn'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
