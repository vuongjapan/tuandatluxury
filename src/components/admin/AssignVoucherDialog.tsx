import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Gift, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  userId: string;
  customerName: string;
  customerEmail?: string;
}

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';

export const AssignVoucherDialog = ({ open, onOpenChange, userId, customerName, customerEmail }: Props) => {
  const { toast } = useToast();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string>('');
  const [note, setNote] = useState('');
  const [notify, setNotify] = useState<'email' | 'app' | 'none'>('email');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelected('');
    setNote('');
    (async () => {
      const { data } = await supabase
        .from('voucher_codes' as any)
        .select('code, discount_type, discount_value, end_date, campaign_name, status')
        .eq('status', 'active')
        .order('end_date', { ascending: true })
        .limit(200);
      setVouchers((data as any[]) || []);
      setLoading(false);
    })();
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vouchers;
    return vouchers.filter((v: any) =>
      v.code.toLowerCase().includes(q) ||
      (v.campaign_name || '').toLowerCase().includes(q),
    );
  }, [vouchers, search]);

  const handleAssign = async () => {
    if (!selected) {
      toast({ title: 'Chọn voucher trước', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('member_vouchers' as any).insert({
      user_id: userId,
      voucher_code: selected,
      assigned_note: note || null,
      notified: notify !== 'none',
      notified_at: notify !== 'none' ? new Date().toISOString() : null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Lỗi gán voucher', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: '🎁 Đã gán voucher', description: `${selected} cho ${customerName}` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" /> Gửi voucher cho {customerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Tìm voucher</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nhập mã hoặc tên chiến dịch..."
                className="pl-8"
              />
            </div>
          </div>

          <div className="border border-border rounded-lg max-h-56 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">Không có voucher khả dụng.</p>
            ) : (
              filtered.map((v: any) => (
                <button
                  key={v.code}
                  type="button"
                  onClick={() => setSelected(v.code)}
                  className={`w-full text-left px-3 py-2 border-b border-border/50 last:border-0 text-sm hover:bg-secondary transition-colors ${
                    selected === v.code ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-semibold text-foreground">{v.code}</span>
                    <span className="text-xs text-primary font-semibold">
                      {v.discount_type === 'percent' ? `-${v.discount_value}%` : `-${formatVnd(v.discount_value)}`}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {v.campaign_name || '—'} · HSD: {v.end_date ? format(new Date(v.end_date), 'dd/MM/yyyy') : '—'}
                  </p>
                </button>
              ))
            )}
          </div>

          <div>
            <Label className="text-xs">Lý do gán (nội bộ)</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Khách mới, tặng ưu đãi chào mừng..." />
          </div>

          <div>
            <Label className="text-xs">Thông báo cho khách</Label>
            <div className="flex flex-col gap-1.5 mt-1.5 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" checked={notify === 'email'} onChange={() => setNotify('email')} />
                Gửi email ngay {customerEmail && <span className="text-xs text-muted-foreground">({customerEmail})</span>}
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={notify === 'app'} onChange={() => setNotify('app')} />
                Gửi tin nhắn trong app
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={notify === 'none'} onChange={() => setNotify('none')} />
                Không thông báo (khách tự xem)
              </label>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              ⚠️ Hiện tại chỉ ghi cờ "đã thông báo". Email/tin nhắn tự động sẽ bổ sung sau.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleAssign} disabled={submitting || !selected} className="gap-1.5">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
            Gửi voucher
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
