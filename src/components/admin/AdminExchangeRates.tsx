import { useEffect, useState } from 'react';
import { Coins, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Rates {
  id?: string;
  usd_rate: number;
  jpy_rate: number;
  cny_rate: number;
  updated_at?: string;
}

const DEFAULTS: Rates = { usd_rate: 25400, jpy_rate: 168, cny_rate: 3500 };

const AdminExchangeRates = () => {
  const { toast } = useToast();
  const [rates, setRates] = useState<Rates>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchRates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('exchange_rates' as any)
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && data) {
      const d = data as any;
      setRates({
        id: d.id,
        usd_rate: Number(d.usd_rate) || DEFAULTS.usd_rate,
        jpy_rate: Number(d.jpy_rate) || DEFAULTS.jpy_rate,
        cny_rate: Number(d.cny_rate) || DEFAULTS.cny_rate,
        updated_at: d.updated_at,
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchRates(); }, []);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      usd_rate: rates.usd_rate,
      jpy_rate: rates.jpy_rate,
      cny_rate: rates.cny_rate,
      updated_at: new Date().toISOString(),
    };
    const { error } = rates.id
      ? await supabase.from('exchange_rates' as any).update(payload).eq('id', rates.id)
      : await supabase.from('exchange_rates' as any).insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Đã lưu tỷ giá', description: 'Áp dụng ngay trên toàn website.' });
      fetchRates();
    }
  };

  const sample = 700000;
  const fmtUSD = (rates.usd_rate ? sample / rates.usd_rate : 0).toFixed(2);
  const fmtJPY = Math.round(rates.jpy_rate ? sample / rates.jpy_rate : 0).toLocaleString('ja-JP');
  const fmtCNY = (rates.cny_rate ? sample / rates.cny_rate : 0).toFixed(2);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">Tỷ giá ngoại tệ</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Nhập số VND tương ứng với <strong>1 đơn vị ngoại tệ</strong>. Ví dụ: nếu 1 USD = 25.400 VND → nhập <code>25400</code>.
        </p>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Đang tải…</div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="usd">1 USD = ? VND</Label>
              <Input
                id="usd"
                type="number"
                value={rates.usd_rate}
                onChange={(e) => setRates({ ...rates, usd_rate: Number(e.target.value) })}
                placeholder="25400"
              />
            </div>
            <div>
              <Label htmlFor="jpy">1 JPY = ? VND</Label>
              <Input
                id="jpy"
                type="number"
                value={rates.jpy_rate}
                onChange={(e) => setRates({ ...rates, jpy_rate: Number(e.target.value) })}
                placeholder="168"
              />
            </div>
            <div>
              <Label htmlFor="cny">1 CNY = ? VND</Label>
              <Input
                id="cny"
                type="number"
                value={rates.cny_rate}
                onChange={(e) => setRates({ ...rates, cny_rate: Number(e.target.value) })}
                placeholder="3500"
              />
            </div>

            <div className="bg-secondary rounded-lg p-4 text-sm space-y-1">
              <p className="font-semibold mb-2">Ví dụ phòng 700.000 VND sẽ hiển thị:</p>
              <p>🇻🇳 VND: <strong>700.000đ</strong></p>
              <p>🇺🇸 USD: <strong>${fmtUSD}</strong></p>
              <p>🇯🇵 JPY: <strong>¥{fmtJPY}</strong></p>
              <p>🇨🇳 CNY: <strong>¥{fmtCNY}</strong></p>
            </div>

            {rates.updated_at && (
              <p className="text-xs text-muted-foreground">
                Cập nhật lần cuối: {new Date(rates.updated_at).toLocaleString('vi-VN')}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                {saving ? 'Đang lưu…' : 'Lưu tỷ giá'}
              </Button>
              <Button variant="outline" onClick={fetchRates} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Làm mới
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminExchangeRates;
