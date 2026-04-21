import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, Award, Building2 } from 'lucide-react';
import { useDiscountConfig, updateDiscountConfig } from '@/hooks/useDiscountConfig';
import { useQueryClient } from '@tanstack/react-query';

const AdminDiscountConfig = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { config, loading } = useDiscountConfig();

  const [form, setForm] = useState(config);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading) setForm(config); }, [loading, config]);

  const set = (k: keyof typeof form, v: any) => setForm(prev => ({ ...prev, [k]: v }));
  const setNum = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    set(k, Math.max(0, parseInt(e.target.value) || 0));

  const save = async () => {
    if (!config.id) {
      toast({ title: 'Lỗi', description: 'Chưa có cấu hình mặc định', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await updateDiscountConfig(config.id, {
      vip_tier1_bookings: form.vip_tier1_bookings,
      vip_tier1_discount: form.vip_tier1_discount,
      vip_tier2_bookings: form.vip_tier2_bookings,
      vip_tier2_discount: form.vip_tier2_discount,
      group_min_people: form.group_min_people,
      group_discount_min: form.group_discount_min,
      group_discount_max: form.group_discount_max,
      group_note: form.group_note,
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } else {
      qc.invalidateQueries({ queryKey: ['discount-config'] });
      toast({ title: 'Đã lưu', description: 'Web và email tự cập nhật ngay' });
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold mb-1">Ưu đãi Thành viên & Đoàn</h2>
        <p className="text-sm text-muted-foreground">
          Cấu hình giảm giá VIP và đoàn/công ty. Web và email tự cập nhật realtime sau khi lưu.
        </p>
      </div>

      {/* VIP */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h3 className="font-semibold flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" /> Thành viên VIP
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30">
          <div>
            <Label>Hạng 1 — Số lần đặt</Label>
            <Input type="number" min={1} value={form.vip_tier1_bookings} onChange={setNum('vip_tier1_bookings')} />
          </div>
          <div>
            <Label>Hạng 1 — Giảm % tiền phòng</Label>
            <Input type="number" min={0} max={100} value={form.vip_tier1_discount} onChange={setNum('vip_tier1_discount')} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30">
          <div>
            <Label>Hạng 2 — Số lần đặt</Label>
            <Input type="number" min={1} value={form.vip_tier2_bookings} onChange={setNum('vip_tier2_bookings')} />
          </div>
          <div>
            <Label>Hạng 2 — Giảm % tiền phòng</Label>
            <Input type="number" min={0} max={100} value={form.vip_tier2_discount} onChange={setNum('vip_tier2_discount')} />
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic">
          ⓘ Giảm chỉ áp dụng cho tiền phòng, không áp dụng đồ ăn.
        </p>
      </div>

      {/* Group */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h3 className="font-semibold flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" /> Đoàn / Công ty
        </h3>

        <div>
          <Label>Số người tối thiểu</Label>
          <Input type="number" min={1} value={form.group_min_people} onChange={setNum('group_min_people')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Mức giảm tối thiểu (%)</Label>
            <Input type="number" min={0} max={100} value={form.group_discount_min} onChange={setNum('group_discount_min')} />
          </div>
          <div>
            <Label>Mức giảm tối đa (%)</Label>
            <Input type="number" min={0} max={100} value={form.group_discount_max} onChange={setNum('group_discount_max')} />
          </div>
        </div>

        <div>
          <Label>Ghi chú hiển thị cho khách</Label>
          <Textarea
            rows={3}
            value={form.group_note}
            onChange={(e) => set('group_note', e.target.value)}
            placeholder="VD: Liên hệ trực tiếp để được báo giá đoàn tốt nhất"
          />
        </div>
      </div>

      <Button onClick={save} disabled={saving} variant="gold" className="w-full sm:w-auto gap-2">
        <Save className="h-4 w-4" /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
      </Button>
    </div>
  );
};

export default AdminDiscountConfig;
