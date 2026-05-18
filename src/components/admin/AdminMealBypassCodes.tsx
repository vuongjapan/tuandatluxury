import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, Pencil, Copy, KeyRound, Dices } from 'lucide-react';

interface BypassCode {
  id: string;
  code: string;
  description: string | null;
  valid_from: string | null;
  valid_to: string | null;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

type EditState = Partial<BypassCode> & { _new?: boolean };

const randomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

const AdminMealBypassCodes = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<BypassCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('meal_bypass_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast({ title: 'Lỗi tải dữ liệu', description: error.message, variant: 'destructive' });
    setRows((data as BypassCode[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const startNew = () => setEditing({
    _new: true, code: '', description: '',
    valid_from: '', valid_to: '', max_uses: 999, is_active: true,
  });
  const startEdit = (r: BypassCode) => setEditing({ ...r });

  const save = async () => {
    if (!editing) return;
    if (!editing.code?.trim()) {
      toast({ title: 'Vui lòng nhập mã', variant: 'destructive' }); return;
    }
    setSaving(true);
    const payload: any = {
      code: editing.code.trim().toUpperCase(),
      description: editing.description || null,
      valid_from: editing.valid_from || null,
      valid_to: editing.valid_to || null,
      max_uses: editing.max_uses ?? 999,
      is_active: !!editing.is_active,
    };
    const { error } = editing._new
      ? await (supabase as any).from('meal_bypass_codes').insert(payload)
      : await (supabase as any).from('meal_bypass_codes').update(payload).eq('id', editing.id);
    setSaving(false);
    if (error) { toast({ title: 'Lỗi lưu', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Đã lưu ✓' });
    setEditing(null);
    fetchAll();
  };

  const remove = async (id: string) => {
    if (!confirm('Xoá mã này?')) return;
    const { error } = await (supabase as any).from('meal_bypass_codes').delete().eq('id', id);
    if (error) { toast({ title: 'Lỗi xoá', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Đã xoá ✓' });
    fetchAll();
  };

  const toggle = async (r: BypassCode) => {
    await (supabase as any).from('meal_bypass_codes').update({ is_active: !r.is_active }).eq('id', r.id);
    fetchAll();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: `Đã copy ${code}` });
  };

  if (loading) return <div className="p-4">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-primary/10 border-l-4 border-primary rounded-lg p-4 flex items-start gap-3">
        <KeyRound className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold">Mã miễn trừ bắt buộc ăn</p>
          <p className="text-muted-foreground mt-1">
            Cấp mã cho khách VIP để bỏ qua yêu cầu chọn combo trong những ngày bắt buộc.
            Khách nhập mã trong bước 2 đặt phòng để vượt qua kiểm tra cho từng đêm.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">🔑 Mã bypass bắt buộc ăn</h2>
        <Button onClick={startNew} variant="gold" className="gap-1">
          <Plus className="h-4 w-4" /> Tạo mã mới
        </Button>
      </div>

      {editing && (
        <div className="bg-card border-2 border-primary/40 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing._new ? 'Tạo mã mới' : 'Chỉnh sửa mã'}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Mã *</label>
              <div className="flex gap-2">
                <Input
                  value={editing.code || ''}
                  onChange={e => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                  placeholder="TUANDAT06"
                  className="uppercase"
                  maxLength={32}
                />
                <Button type="button" variant="outline" onClick={() => setEditing({ ...editing, code: randomCode() })} className="shrink-0 gap-1">
                  <Dices className="h-4 w-4" /> Ngẫu nhiên
                </Button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Ghi chú nội bộ</label>
              <Textarea
                value={editing.description || ''}
                onChange={e => setEditing({ ...editing, description: e.target.value })}
                placeholder="VD: Mã tháng 6 cho khách VIP"
                rows={2}
                maxLength={300}
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Hiệu lực từ</label>
              <Input type="date" value={editing.valid_from || ''} onChange={e => setEditing({ ...editing, valid_from: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Đến</label>
              <Input type="date" value={editing.valid_to || ''} onChange={e => setEditing({ ...editing, valid_to: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Giới hạn lượt dùng</label>
              <Input
                type="number" min={1}
                value={editing.max_uses ?? 999}
                onChange={e => setEditing({ ...editing, max_uses: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="flex items-center gap-2 self-end pb-2">
              <Switch checked={!!editing.is_active} onCheckedChange={v => setEditing({ ...editing, is_active: v })} />
              <span className="text-sm">{editing.is_active ? 'Đang bật' : 'Đang tắt'}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button onClick={save} disabled={saving} variant="gold" className="gap-1">
              <Save className="h-4 w-4" /> {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>Huỷ</Button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Mã</th>
                <th className="px-4 py-3 text-left">Hiệu lực</th>
                <th className="px-4 py-3 text-left">Sử dụng</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Chưa có mã nào</td></tr>
              )}
              {rows.map(r => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <p className="font-mono font-bold">{r.code}</p>
                    {r.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{r.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {r.valid_from || '—'} → {r.valid_to || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs tabular-nums">
                    {r.used_count}/{r.max_uses}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(r)} className={`text-xs font-bold px-2 py-1 rounded-full ${r.is_active ? 'bg-chart-2/15 text-chart-2' : 'bg-muted text-muted-foreground'}`}>
                      {r.is_active ? '● Đang bật' : '○ Đã tắt'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => copyCode(r.code)} title="Copy"><Copy className="h-3.5 w-3.5" /></Button>
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

export default AdminMealBypassCodes;
