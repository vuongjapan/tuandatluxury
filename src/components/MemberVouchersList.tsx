import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Gift, Copy, CheckCircle2, Phone, MessageSquare, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Props {
  userId: string;
}

interface Row {
  id: string;
  voucher_code: string;
  used_at: string | null;
  assigned_at: string;
  voucher?: {
    code: string;
    discount_type: string;
    discount_value: number;
    end_date: string | null;
    campaign_name: string | null;
  } | null;
}

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';

export const MemberVouchersList = ({ userId }: Props) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: assigned } = await supabase
        .from('member_vouchers' as any)
        .select('*')
        .eq('user_id', userId)
        .eq('is_visible', true)
        .order('assigned_at', { ascending: false });

      const codes = ((assigned as any[]) || []).map((r) => r.voucher_code);
      let vMap: Record<string, any> = {};
      if (codes.length > 0) {
        const { data: vs } = await supabase
          .from('voucher_codes' as any)
          .select('code, discount_type, discount_value, end_date, campaign_name')
          .in('code', codes);
        ((vs as any[]) || []).forEach((v) => { vMap[v.code] = v; });
      }
      const merged: Row[] = ((assigned as any[]) || []).map((r) => ({
        id: r.id,
        voucher_code: r.voucher_code,
        used_at: r.used_at,
        assigned_at: r.assigned_at,
        voucher: vMap[r.voucher_code] || null,
      }));
      setRows(merged);
      setLoading(false);
    };
    if (userId) load();
  }, [userId]);

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      toast({ title: 'Đã sao chép mã ✓' });
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };

  if (loading) {
    return <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Gift className="h-4 w-4 text-primary" /> Mã ưu đãi của tôi
      </p>

      {rows.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-6 text-center text-sm text-muted-foreground">
          <p>Chưa có mã ưu đãi nào.</p>
          <p className="mt-1">Liên hệ khách sạn để nhận ưu đãi đặc biệt:</p>
          <div className="mt-3 flex justify-center gap-3 flex-wrap">
            <a href="tel:0983605768" className="inline-flex items-center gap-1.5 text-primary hover:underline">
              <Phone className="h-3.5 w-3.5" /> 098.360.5768
            </a>
            <a href="https://zalo.me/0384418811" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
              <MessageSquare className="h-3.5 w-3.5" /> Zalo: 038.441.8811
            </a>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {rows.map((r) => {
            const v = r.voucher;
            const used = !!r.used_at;
            const discountLabel = v
              ? v.discount_type === 'percent' ? `-${v.discount_value}%` : `-${formatVnd(v.discount_value)}`
              : '';
            return (
              <div
                key={r.id}
                className={`border rounded-xl p-4 ${
                  used ? 'border-border bg-muted/40 opacity-60' : 'border-primary/30 bg-primary/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-base text-primary tracking-wider">{r.voucher_code}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold">
                    {used ? 'Đã dùng' : 'Khả dụng'} {discountLabel && `· ${discountLabel}`}
                  </span>
                </div>
                {v?.campaign_name && (
                  <p className="text-xs text-muted-foreground mt-1.5">{v.campaign_name}</p>
                )}
                {v?.end_date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    HSD: {format(new Date(v.end_date), 'dd/MM/yyyy')}
                  </p>
                )}
                {used ? (
                  <p className="text-xs text-muted-foreground mt-2">
                    Đã dùng ngày {format(new Date(r.used_at!), 'dd/MM/yyyy')}
                  </p>
                ) : (
                  <button
                    onClick={() => copy(r.voucher_code)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    {copied === r.voucher_code ? (
                      <><CheckCircle2 className="h-3.5 w-3.5" /> Đã sao chép</>
                    ) : (
                      <><Copy className="h-3.5 w-3.5" /> Sao chép mã</>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
