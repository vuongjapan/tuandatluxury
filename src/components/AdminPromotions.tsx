import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/compressImage';
import { usePromotions, Promotion } from '@/hooks/usePromotions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Trash2, Upload, Eye, EyeOff, GripVertical } from 'lucide-react';

const TIER_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'member', label: 'Thành viên đã đăng nhập' },
];

const AdminPromotions = () => {
  const { promotions, refetch } = usePromotions();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [uploading, setUploading] = useState(false);
  const [benefitsText, setBenefitsText] = useState('');
  const [benefitsEnText, setBenefitsEnText] = useState('');

  const startEdit = (p: Promotion) => {
    setEditing({ ...p });
    setBenefitsText(p.benefits_vi.join('\n'));
    setBenefitsEnText(p.benefits_en.join('\n'));
  };

  const startNew = () => {
    const newPromo: Promotion = {
      id: '',
      title_vi: '',
      title_en: '',
      description_vi: null,
      description_en: null,
      icon: '🎁',
      image_url: null,
      benefits_vi: [],
      benefits_en: [],
      discount_percent: 0,
      applies_to_tier: 'all',
      sort_order: promotions.length,
      is_active: true,
    };
    setEditing(newPromo);
    setBenefitsText('');
    setBenefitsEnText('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `promotions/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('gallery').upload(path, file);
    if (error) {
      toast({ title: 'Lỗi upload', description: error.message, variant: 'destructive' });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(path);
    setEditing(prev => prev ? { ...prev, image_url: urlData.publicUrl } : prev);
    toast({ title: 'Đã upload ảnh ✓' });
    setUploading(false);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!editing) return;
    const payload = {
      title_vi: editing.title_vi,
      title_en: editing.title_en,
      description_vi: editing.description_vi,
      description_en: editing.description_en,
      icon: editing.icon,
      image_url: editing.image_url,
      benefits_vi: benefitsText.split('\n').filter(Boolean),
      benefits_en: benefitsEnText.split('\n').filter(Boolean),
      discount_percent: editing.discount_percent,
      applies_to_tier: editing.applies_to_tier,
      sort_order: editing.sort_order,
      is_active: editing.is_active,
    };

    if (editing.id) {
      const { error } = await (supabase.from('promotions' as any) as any).update(payload).eq('id', editing.id);
      if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); return; }
    } else {
      const { error } = await (supabase.from('promotions' as any) as any).insert(payload);
      if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); return; }
    }
    toast({ title: 'Đã lưu ✓' });
    setEditing(null);
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa ưu đãi này?')) return;
    await (supabase.from('promotions' as any) as any).delete().eq('id', id);
    toast({ title: 'Đã xóa ✓' });
    refetch();
  };

  const toggleActive = async (p: Promotion) => {
    await (supabase.from('promotions' as any) as any).update({ is_active: !p.is_active }).eq('id', p.id);
    refetch();
  };

  if (editing) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 space-y-4 max-w-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">{editing.id ? 'Chỉnh sửa ưu đãi' : 'Thêm ưu đãi mới'}</h3>
          <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>✕</Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tiêu đề (VI)</label>
            <Input value={editing.title_vi} onChange={e => setEditing({ ...editing, title_vi: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tiêu đề (EN)</label>
            <Input value={editing.title_en} onChange={e => setEditing({ ...editing, title_en: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Icon (emoji)</label>
            <Input value={editing.icon} onChange={e => setEditing({ ...editing, icon: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">% Giảm giá</label>
            <Input type="number" value={editing.discount_percent} onChange={e => setEditing({ ...editing, discount_percent: parseInt(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Áp dụng cho</label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={editing.applies_to_tier}
              onChange={e => setEditing({ ...editing, applies_to_tier: e.target.value })}
            >
              {TIER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Quyền lợi (VI) — mỗi dòng 1 mục</label>
          <Textarea rows={4} value={benefitsText} onChange={e => setBenefitsText(e.target.value)} placeholder="Giảm 10% khi đặt sớm&#10;Tặng bữa sáng" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Quyền lợi (EN) — mỗi dòng 1 mục</label>
          <Textarea rows={4} value={benefitsEnText} onChange={e => setBenefitsEnText(e.target.value)} placeholder="10% early bird discount&#10;Complimentary breakfast" />
        </div>

        {/* Image */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Ảnh minh họa</label>
          <div className="flex items-center gap-3 mt-1">
            <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:bg-secondary transition-colors text-sm">
              <Upload className="h-4 w-4" /> {uploading ? 'Đang upload...' : 'Chọn ảnh'}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            {editing.image_url && (
              <img src={editing.image_url} alt="" className="h-16 w-24 object-cover rounded-lg border border-border" />
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" /> Lưu</Button>
          <Button variant="outline" onClick={() => setEditing(null)}>Hủy</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{promotions.length} ưu đãi</p>
        <Button size="sm" onClick={startNew}><Plus className="h-4 w-4 mr-2" /> Thêm ưu đãi</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {promotions.map(p => (
          <div key={p.id} className="bg-card rounded-xl border border-border p-4 flex gap-4">
            <div className="text-3xl shrink-0">{p.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm truncate">{p.title_vi}</h4>
                <Badge variant={p.is_active ? 'default' : 'secondary'} className="text-xs shrink-0">
                  {p.is_active ? 'Hiện' : 'Ẩn'}
                </Badge>
              </div>
              <ul className="text-xs text-muted-foreground space-y-0.5 mb-2">
                {p.benefits_vi.slice(0, 2).map((b, i) => <li key={i}>• {b}</li>)}
                {p.benefits_vi.length > 2 && <li>... +{p.benefits_vi.length - 2}</li>}
              </ul>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => startEdit(p)}>Sửa</Button>
                <Button variant="ghost" size="sm" onClick={() => toggleActive(p)}>
                  {p.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {p.image_url && (
              <img src={p.image_url} alt="" className="h-20 w-20 rounded-lg object-cover shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPromotions;
