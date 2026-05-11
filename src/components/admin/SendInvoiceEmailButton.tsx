import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  booking: any;
  onUpdated?: (newEmail: string) => void;
}

const LAST_EMAIL_KEY = 'tdl_last_invoice_recipient';

export const isValidEmail = (email?: string | null) =>
  !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const SUSPICIOUS_FRAGMENTS = [
  'gmail.coma', 'gmail.co', 'gmail.con', 'gmail.vom', 'gmial.com', 'gmai.com', 'gamil.com', 'gnail.com',
  'yahoo.coma', 'yaho.com', 'yahoo.con',
  'hotmail.coma', 'hotmial.com', 'hotnail.com',
  'outlook.coma', 'outlok.com',
];

export const emailLooksSuspicious = (email?: string | null) => {
  if (!email) return true;
  if (!isValidEmail(email)) return true;
  const lower = email.toLowerCase();
  return SUSPICIOUS_FRAGMENTS.some((t) => lower.includes(t));
};

export const SendInvoiceEmailButton = ({ booking, onUpdated }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState(
    booking.guest_email || (typeof window !== 'undefined' ? localStorage.getItem(LAST_EMAIL_KEY) || '' : '')
  );
  const [saveToProfile, setSaveToProfile] = useState(true);

  const originalEmail = booking.guest_email || '';
  const emailChanged = email.trim() !== originalEmail.trim();
  const valid = isValidEmail(email);

  const send = async () => {
    const targetEmail = email.trim();
    if (!isValidEmail(targetEmail)) {
      toast({ title: 'Email không hợp lệ, kiểm tra lại!', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      // Save email to booking + profile if changed and user opted in
      if (saveToProfile && emailChanged) {
        await supabase.from('bookings').update({ guest_email: targetEmail }).eq('id', booking.id);
        if (booking.user_id) {
          await supabase.from('profiles').update({ email: targetEmail }).eq('user_id', booking.user_id);
        }
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
        title: `📧 Đã gửi tới ${targetEmail}`,
        description: emailChanged && saveToProfile ? 'Đã cập nhật email vào hồ sơ khách.' : undefined,
      });
      setOpen(false);
    } catch (e: any) {
      toast({ title: 'Gửi email lỗi', description: e?.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const suspicious = emailLooksSuspicious(originalEmail);

  return (
    <>
      <button
        onClick={() => {
          setEmail(originalEmail || (typeof window !== 'undefined' ? localStorage.getItem(LAST_EMAIL_KEY) || '' : ''));
          setSaveToProfile(true);
          setOpen(true);
        }}
        disabled={sending}
        className={`p-1 rounded hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed ${
          originalEmail && !suspicious ? 'text-primary' : 'text-destructive'
        }`}
        title={originalEmail ? `Gửi tới ${originalEmail}` : 'Nhập email để gửi'}
      >
        {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Gửi lại hóa đơn
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 text-sm">
            <div className="text-xs text-muted-foreground">
              Đơn <strong className="text-foreground">{booking.booking_code}</strong> · {booking.guest_name}
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Email hiện tại:</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs">{originalEmail || <em className="text-muted-foreground">Chưa có email</em>}</span>
                {suspicious && originalEmail && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-semibold">
                    <AlertTriangle className="h-3 w-3" /> Có thể sai
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Sửa email (nếu cần): *
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                autoFocus
                className={
                  email
                    ? valid
                      ? 'border-primary focus-visible:ring-primary'
                      : 'border-destructive focus-visible:ring-destructive'
                    : ''
                }
              />
              {email && !valid && (
                <p className="text-[11px] text-destructive mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Email không đúng định dạng
                </p>
              )}
              {email && valid && emailLooksSuspicious(email) && (
                <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Domain trông giống lỗi gõ — kiểm tra lại
                </p>
              )}
              {email && valid && !emailLooksSuspicious(email) && (
                <p className="text-[11px] text-primary mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Email hợp lệ
                </p>
              )}
            </div>

            {emailChanged && valid && (
              <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveToProfile}
                  onChange={(e) => setSaveToProfile(e.target.checked)}
                  className="rounded border-border"
                />
                <span>Cập nhật email mới vào hồ sơ khách{booking.user_id ? ' (và tài khoản thành viên)' : ''}</span>
              </label>
            )}

            <div className="text-[11px] text-muted-foreground bg-muted/50 rounded p-2">
              Sẽ gửi: Hóa đơn tóm tắt (PDF) + Hóa đơn chi tiết (PDF)
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={sending}>
                Hủy
              </Button>
              <Button size="sm" onClick={send} disabled={sending || !valid}>
                {sending ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Đang gửi...</>
                ) : (
                  <><Mail className="h-3.5 w-3.5 mr-1" /> Xác nhận & Gửi</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
