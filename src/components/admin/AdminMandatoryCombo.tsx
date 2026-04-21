import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMandatoryComboDates, MandatoryComboDate, MandatoryRuleType } from '@/hooks/useMandatoryComboDates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, Pencil, AlertTriangle } from 'lucide-react';

type EditState = Partial<MandatoryComboDate> & { _new?: boolean };

const WEEKDAYS = [
  { v: 0, label: 'CN' },
  { v: 1, label: 'T2' },
  { v: 2, label: 'T3' },
  { v: 3, label: 'T4' },
  { v: 4, label: 'T5' },
  { v: 5, label: 'T6' },
  { v: 6, label: 'T7' },
];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const AdminMandatoryCombo = () => {
  const { ranges, loading, fetchAll } = useMandatoryComboDates();
  const { toast } = useToast();
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  const startNew = () => {
    setEditing({
      _new: true,
      label: '',
      date_from: '',
      date_to: '',
      note: '',
      is_active: true,
      rule_type: 'date_range',
      weekdays: [],
      months: [],
      banner_title: '',
      banner_message: '',
    });
  };

  const startEdit = (r: MandatoryComboDate) =>
    setEditing({
      ...r,
      weekdays: r.weekdays || [],
      months: r.months || [],
      banner_title: r.banner_title || '',
      banner_message: r.banner_message || '',
    });

  const toggleArrayValue = (arr: number[] | undefined, v: number) => {
    const a = arr || [];
    return a.includes(v) ? a.filter(x => x !== v) : [...a, v].sort((x, y) => x - y);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.label?.trim()) {
      toast({ title: 'Vui lòng nhập tên kỳ lễ', variant: 'destructive' });
      return;
    }
    const ruleType: MandatoryRuleType = (editing.rule_type as MandatoryRuleType) || 'date_range';

    if (ruleType === 'date_range') {
      if (!editing.date_from || !editing.date_to) {
        toast({ title: 'Vui lòng nhập ngày bắt đầu và ngày kết thúc', variant: 'destructive' });
        return;
      }
      if (editing.date_from > editing.date_to) {
        toast({ title: 'Ngày bắt đầu phải ≤ ngày kết thúc', variant: 'destructive' });
        return;
      }
    } else {
      if (!(editing.weekdays || []).length || !(editing.months || []).length) {
        toast({ title: 'Vui lòng chọn ít nhất 1 ngày trong tuần và 1 tháng', variant: 'destructive' });
        return;
      }
    }

    setSaving(true);
    const payload: any = {
      label: editing.label.trim(),
      note: editing.note || null,
      is_active: !!editing.is_active,
      rule_type: ruleType,
      banner_title: editing.banner_title?.trim() || null,
      banner_message: editing.banner_message?.trim() || null,
      date_from: ruleType === 'date_range' ? editing.date_from : null,
      date_to: ruleType === 'date_range' ? editing.date_to : null,
      weekdays: ruleType === 'weekday_month' ? (editing.weekdays || []) : null,
      months: ruleType === 'weekday_month' ? (editing.months || []) : null,
    };
    const { error } = editing._new
      ? await (supabase as any).from('mandatory_combo_dates').insert(payload)
      : await (supabase as any).from('mandatory_combo_dates').update(payload).eq('id', editing.id);
    setSaving(false);
    if (error) { toast({ title: 'Lỗi lưu', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Đã lưu ✓' });
    setEditing(null);
    fetchAll();
  };

  const remove = async (id: string) => {
    if (!confirm('Xoá kỳ lễ này?')) return;
    const { error } = await (supabase as any).from('mandatory_combo_dates').delete().eq('id', id);
    if (error) { toast({ title: 'Lỗi xoá', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Đã xoá ✓' });
    fetchAll();
  };

  const toggle = async (r: MandatoryComboDate) => {
    await (supabase as any).from('mandatory_combo_dates').update({ is_active: !r.is_active }).eq('id', r.id);
    fetchAll();
  };

  const describeRule = (r: MandatoryComboDate) => {
    if (r.rule_type === 'weekday_month') {
      const wd = (r.weekdays || []).map(v => WEEKDAYS.find(w => w.v === v)?.label).filter(Boolean).join(', ');
      const mo = (r.months || []).map(m => `T${m}`).join(', ');
      return `${wd || '—'} · tháng ${mo || '—'}`;
    }
    return `${r.date_from || '—'} → ${r.date_to || '—'}`;
  };

  if (loading) return <div className="p-4">Đang tải...</div>;

  const ruleType = (editing?.rule_type as MandatoryRuleType) || 'date_range';

  return (
    <div className="space-y-6">
      <div className="bg-destructive/10 border-l-4 border-destructive rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-destructive">Ngày BẮT BUỘC khách đặt combo ăn uống</p>
          <p className="text-muted-foreground mt-1">
            Hỗ trợ 2 loại quy tắc: <strong>Khoảng ngày cố định</strong> (lễ Tết) và <strong>Cuối tuần theo tháng</strong> (T6/T7/CN của tháng 6–7).
            Khi check-in khớp quy tắc → khách <strong>BẮT BUỘC</strong> chọn combo / suất ăn / món riêng đủ tối thiểu.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Quản lý quy tắc bắt buộc combo</h2>
        <Button onClick={startNew} variant="gold" className="gap-1"><Plus className="h-4 w-4" /> Thêm quy tắc mới</Button>
      </div>

      {/* Editor */}
      {editing && (
        <div className="bg-card border-2 border-primary/40 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing._new ? 'Thêm quy tắc mới' : 'Chỉnh sửa quy tắc'}</h3>

          {/* Rule type switch */}
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">Loại quy tắc *</label>
            <div className="inline-flex rounded-lg border border-border overflow-hidden">
              {([
                { v: 'date_range', label: 'Khoảng ngày cố định' },
                { v: 'weekday_month', label: 'Cuối tuần theo tháng' },
              ] as const).map(opt => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setEditing({ ...editing, rule_type: opt.v })}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    ruleType === opt.v ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Tên quy tắc *</label>
              <Input
                value={editing.label || ''}
                onChange={e => setEditing({ ...editing, label: e.target.value })}
                placeholder='VD: "Lễ 2/9 2026" hoặc "Cuối tuần tháng 6 & 7"'
                maxLength={100}
              />
            </div>

            {ruleType === 'date_range' ? (
              <>
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Từ ngày *</label>
                  <Input type="date" value={editing.date_from || ''} onChange={e => setEditing({ ...editing, date_from: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Đến ngày *</label>
                  <Input type="date" value={editing.date_to || ''} onChange={e => setEditing({ ...editing, date_to: e.target.value })} />
                </div>
              </>
            ) : (
              <>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Áp dụng vào các ngày trong tuần *</label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map(w => {
                      const on = (editing.weekdays || []).includes(w.v);
                      return (
                        <button
                          key={w.v}
                          type="button"
                          onClick={() => setEditing({ ...editing, weekdays: toggleArrayValue(editing.weekdays as number[] | undefined, w.v) })}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                            on ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-muted'
                          }`}
                        >
                          {w.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Áp dụng vào các tháng *</label>
                  <div className="flex flex-wrap gap-2">
                    {MONTHS.map(m => {
                      const on = (editing.months || []).includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setEditing({ ...editing, months: toggleArrayValue(editing.months as number[] | undefined, m) })}
                          className={`w-12 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                            on ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-muted'
                          }`}
                        >
                          T{m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Tiêu đề banner hiển thị cho khách</label>
              <Input
                value={editing.banner_title || ''}
                onChange={e => setEditing({ ...editing, banner_title: e.target.value })}
                placeholder='VD: "Cuối tuần mùa hè: Bắt buộc đặt combo ăn uống"'
                maxLength={150}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Nội dung banner (giải thích lý do)</label>
              <Textarea
                value={editing.banner_message || ''}
                onChange={e => setEditing({ ...editing, banner_message: e.target.value })}
                placeholder="VD: Vào các ngày Thứ 6, Thứ 7, Chủ Nhật trong tháng 6 và 7, nhà hàng phục vụ theo hình thức combo do lượng khách đông..."
                rows={3}
                maxLength={800}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Ghi chú nội bộ (tùy chọn)</label>
              <Textarea
                value={editing.note || ''}
                onChange={e => setEditing({ ...editing, note: e.target.value })}
                rows={2}
                maxLength={500}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={!!editing.is_active} onCheckedChange={v => setEditing({ ...editing, is_active: v })} />
              <span className="text-sm">{editing.is_active ? 'Đang bật' : 'Đang tắt'}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button onClick={save} disabled={saving} variant="gold" className="gap-1"><Save className="h-4 w-4" /> {saving ? 'Đang lưu...' : 'Lưu'}</Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>Hủy</Button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Tên</th>
                <th className="px-4 py-3 text-left">Loại</th>
                <th className="px-4 py-3 text-left">Áp dụng</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {ranges.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Chưa có quy tắc nào</td></tr>
              )}
              {ranges.map(r => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.label}</p>
                    {(r.banner_title || r.note) && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{r.banner_title || r.note}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      {r.rule_type === 'weekday_month' ? 'Cuối tuần' : 'Khoảng ngày'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{describeRule(r)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(r)} className={`text-xs font-bold px-2 py-1 rounded-full ${r.is_active ? 'bg-chart-2/15 text-chart-2' : 'bg-muted text-muted-foreground'}`}>
                      {r.is_active ? '● Đang bật' : '○ Đã tắt'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminMandatoryCombo;
