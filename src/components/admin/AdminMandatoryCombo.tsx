import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMandatoryComboDates, MandatoryComboDate } from '@/hooks/useMandatoryComboDates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, Pencil, AlertTriangle } from 'lucide-react';

type EditState = Partial<MandatoryComboDate> & { _new?: boolean };

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
    });
  };

  const startEdit = (r: MandatoryComboDate) => setEditing({ ...r });

  const save = async () => {
    if (!editing) return;
    if (!editing.label?.trim() || !editing.date_from || !editing.date_to) {
      toast({ title: 'Vui lòng nhập tên kỳ, ngày bắt đầu và ngày kết thúc', variant: 'destructive' });
      return;
    }
    if (editing.date_from > editing.date_to) {
      toast({ title: 'Ngày bắt đầu phải ≤ ngày kết thúc', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      label: editing.label.trim(),
      date_from: editing.date_from,
      date_to: editing.date_to,
      note: editing.note || null,
      is_active: !!editing.is_active,
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

  if (loading) return <div className="p-4">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-destructive/10 border-l-4 border-destructive rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-destructive">Ngày BẮT BUỘC khách đặt combo ăn uống</p>
          <p className="text-muted-foreground mt-1">
            Khi bật: khách đặt phòng có ngày check-in trong khoảng ngày này <strong>BẮT BUỘC</strong> phải chọn combo.
            Không chọn combo → không thể hoàn tất đặt phòng.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Quản lý kỳ lễ bắt buộc combo</h2>
        <Button onClick={startNew} variant="gold" className="gap-1"><Plus className="h-4 w-4" /> Thêm kỳ lễ mới</Button>
      </div>

      {/* Editor */}
      {editing && (
        <div className="bg-card border-2 border-primary/40 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing._new ? 'Thêm kỳ lễ mới' : 'Chỉnh sửa kỳ lễ'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Tên kỳ lễ *</label>
              <Input
                value={editing.label || ''}
                onChange={e => setEditing({ ...editing, label: e.target.value })}
                placeholder='VD: "Lễ 2/9 2026"'
                maxLength={100}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Từ ngày *</label>
              <Input type="date" value={editing.date_from || ''} onChange={e => setEditing({ ...editing, date_from: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Đến ngày *</label>
              <Input type="date" value={editing.date_to || ''} onChange={e => setEditing({ ...editing, date_to: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Ghi chú hiển thị cho khách</label>
              <Textarea
                value={editing.note || ''}
                onChange={e => setEditing({ ...editing, note: e.target.value })}
                placeholder="VD: Trong dịp lễ này, khách lưu trú bắt buộc đặt combo ăn uống..."
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
                <th className="px-4 py-3 text-left">Tên kỳ lễ</th>
                <th className="px-4 py-3 text-left">Từ ngày</th>
                <th className="px-4 py-3 text-left">Đến ngày</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {ranges.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Chưa có kỳ lễ nào</td></tr>
              )}
              {ranges.map(r => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.label}</p>
                    {r.note && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{r.note}</p>}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{r.date_from}</td>
                  <td className="px-4 py-3 tabular-nums">{r.date_to}</td>
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
