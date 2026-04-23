import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, Award, Building2, UserPlus } from 'lucide-react';
import { useDiscountConfig, updateDiscountConfig } from '@/hooks/useDiscountConfig';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useQueryClient } from '@tanstack/react-query';

const AdminDiscountConfig = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { config, loading } = useDiscountConfig();
  const { settings, updateSetting } = useSiteSettings();

  const [form, setForm] = useState(config);
  const [saving, setSaving] = useState(false);
  const [extraPct, setExtraPct] = useState<string>('15');
  const [savingExtra, setSavingExtra] = useState(false);

  useEffect(() => { if (!loading) setForm(config); }, [loading, config]);
  useEffect(() => { setExtraPct(settings.extra_person_surcharge_percent || '15'); }, [settings.extra_person_surcharge_percent]);

  const saveExtraPct = async () => {
    const n = parseFloat(extraPct);
    if (isNaN(n) || n < 0 || n > 100) {
      toast({ title: 'Giá trị không hợp lệ (0–100)', variant: 'destructive' });
      return;
    }
    setSavingExtra(true);
    const err = await updateSetting('extra_person_surcharge_percent', String(n));
    setSavingExtra(false);
    if (err) toast({ title: 'Lỗi lưu', variant: 'destructive' });
    else toast({ title: `Đã lưu phụ thu ${n}% ✓` });
  };

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
      min_individual_per_person: form.min_individual_per_person,
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

      {/* Min individual food per person (for mandatory holidays) */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          🍤 Mức tối thiểu đặt món riêng
        </h3>
        <p className="text-xs text-muted-foreground -mt-2">
          Áp dụng vào ngày lễ bắt buộc đặt ăn: nếu khách không chọn Suất ăn / Combo, họ phải đặt món riêng đủ mức này × số khách để được tiếp tục.
        </p>
        <div>
          <Label>Mức tối thiểu / người (đ)</Label>
          <Input
            type="number"
            min={0}
            step={10000}
            value={form.min_individual_per_person ?? 300000}
            onChange={(e) => set('min_individual_per_person', Math.max(0, parseInt(e.target.value) || 0))}
          />
          <p className="text-xs text-muted-foreground mt-1">
            VD: 300.000đ → Đoàn 4 người cần đặt ≥ 1.200.000đ món riêng để bỏ qua Suất ăn / Combo.
          </p>
        </div>
      </div>

      {/* Extra-person surcharge */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" /> Phụ thu vượt định mức khách / phòng
        </h3>
        <p className="text-xs text-muted-foreground -mt-2">
          Khi số khách vượt định mức (Standard 2, Deluxe 4, Family 4), mỗi khách thêm bị phụ thu theo % tiền phòng. Banner phụ thu chỉ hiện khi vượt định mức.
        </p>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <Label>Phụ thu mỗi khách thêm (%)</Label>
            <Input type="number" min={0} max={100} step={1} value={extraPct} onChange={(e) => setExtraPct(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">Mặc định 15%. Hiện tại: <strong>{extraPct}%</strong></p>
          </div>
          <Button variant="gold" onClick={saveExtraPct} disabled={savingExtra} className="gap-2">
            <Save className="h-4 w-4" /> {savingExtra ? 'Đang lưu...' : 'Lưu phụ thu'}
          </Button>
        </div>
      </div>

      <Button onClick={save} disabled={saving} variant="gold" className="w-full sm:w-auto gap-2">
        <Save className="h-4 w-4" /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
      </Button>
    </div>
  );
};

export default AdminDiscountConfig;
