import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOffers, slugify, OFFER_CATEGORIES, type Offer } from '@/hooks/useOffers';
import { compressImage } from '@/lib/compressImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RichTextEditor from '@/components/RichTextEditor';
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, ArrowUp, ArrowDown, ArrowLeft, Save, Image as ImageIcon, Loader2 } from 'lucide-react';

type FilterType = 'all' | 'active' | 'hidden' | 'expiring';

const emptyOffer = (sortOrder: number): Partial<Offer> => ({
  slug: '',
  title: '',
  summary: '',
  content: '',
  category: 'Theo mùa',
  cover_image_url: '',
  conditions: '',
  expires_at: null,
  is_featured: false,
  is_active: true,
  sort_order: sortOrder,
});

const AdminOffers = () => {
  const { offers, refetch } = useOffers({ includeHidden: true });
  const { toast } = useToast();
  const [editing, setEditing] = useState<Partial<Offer> | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const featuredCount = offers.filter(o => o.is_featured && o.is_active).length;

  const filtered = useMemo(() => {
    const now = Date.now();
    return offers.filter(o => {
      if (filter === 'active') return o.is_active;
      if (filter === 'hidden') return !o.is_active;
      if (filter === 'expiring') {
        if (!o.expires_at) return false;
        const exp = new Date(o.expires_at).getTime();
        return exp > now && exp - now < 7 * 24 * 60 * 60 * 1000;
      }
      return true;
    });
  }, [offers, filter]);

  const startNew = () => {
    setSlugManuallyEdited(false);
    setEditing(emptyOffer(offers.length));
  };
  const startEdit = (o: Offer) => {
    setSlugManuallyEdited(true);
    setEditing({ ...o });
  };
  const cancel = () => setEditing(null);

  const updateField = <K extends keyof Offer>(key: K, value: Offer[K]) => {
    setEditing(prev => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value } as Partial<Offer>;
      if (key === 'title' && !slugManuallyEdited) {
        next.slug = slugify(String(value || ''));
      }
      return next;
    });
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 1200, quality: 0.8 });
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const { error } = await supabase.storage.from('offers').upload(path, compressed, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('offers').getPublicUrl(path);
      updateField('cover_image_url', data.publicUrl);
      toast({ title: 'Đã tải ảnh ✓' });
    } catch (e: any) {
      toast({ title: 'Lỗi tải ảnh', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const save = async (publish: boolean) => {
    if (!editing) return;
    if (!editing.title?.trim()) {
      toast({ title: 'Cần tiêu đề', variant: 'destructive' });
      return;
    }
    let slug = (editing.slug || slugify(editing.title)).trim();
    if (!slug) slug = `uu-dai-${Date.now()}`;

    if (publish && editing.is_featured) {
      const otherFeatured = offers.filter(
        o => o.is_featured && o.is_active && o.id !== editing.id
      ).length;
      if (otherFeatured >= 3) {
        if (!confirm('Đã có 3 bài "Nổi bật" trên trang chủ. Bài này vẫn lưu nhưng có thể không hiển thị. Tiếp tục?')) return;
      }
    }

    setSaving(true);
    const payload: any = {
      slug,
      title: editing.title.trim(),
      summary: editing.summary || null,
      content: editing.content || '',
      category: editing.category || 'Đặc biệt',
      cover_image_url: editing.cover_image_url || null,
      conditions: editing.conditions || null,
      expires_at: editing.expires_at || null,
      is_featured: !!editing.is_featured,
      is_active: publish ? !!editing.is_active : false,
      sort_order: editing.sort_order ?? 0,
    };

    const op = editing.id
      ? supabase.from('offers' as any).update(payload).eq('id', editing.id)
      : supabase.from('offers' as any).insert(payload);
    const { error } = await op;
    setSaving(false);

    if (error) {
      toast({ title: 'Lỗi lưu', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: publish ? 'Đã xuất bản ✓' : 'Đã lưu nháp ✓' });
    setEditing(null);
    refetch();
  };

  const remove = async (o: Offer) => {
    if (!confirm(`Xóa ưu đãi "${o.title}"? Hành động này không thể hoàn tác.`)) return;
    const { error } = await supabase.from('offers' as any).delete().eq('id', o.id);
    if (error) {
      toast({ title: 'Lỗi xóa', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Đã xóa ✓' });
    refetch();
  };

  const toggleActive = async (o: Offer) => {
    await supabase.from('offers' as any).update({ is_active: !o.is_active }).eq('id', o.id);
    refetch();
  };
  const toggleFeatured = async (o: Offer) => {
    if (!o.is_featured && featuredCount >= 3) {
      toast({ title: 'Đã đủ 3 bài nổi bật', description: 'Hãy bỏ "nổi bật" 1 bài khác trước.', variant: 'destructive' });
      return;
    }
    await supabase.from('offers' as any).update({ is_featured: !o.is_featured }).eq('id', o.id);
    refetch();
  };

  const moveOrder = async (o: Offer, direction: -1 | 1) => {
    const sorted = [...offers].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(x => x.id === o.id);
    const swapWith = sorted[idx + direction];
    if (!swapWith) return;
    await Promise.all([
      supabase.from('offers' as any).update({ sort_order: swapWith.sort_order }).eq('id', o.id),
      supabase.from('offers' as any).update({ sort_order: o.sort_order }).eq('id', swapWith.id),
    ]);
    refetch();
  };

  const fmtDate = (iso: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  // ===== EDIT FORM =====
  if (editing) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" onClick={cancel}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại danh sách
          </Button>
          <div className="flex gap-2">
            {editing.id && (
              <Button variant="destructive" size="sm" onClick={() => editing.id && remove(editing as Offer)}>
                <Trash2 className="h-4 w-4 mr-1" /> Xóa
              </Button>
            )}
            <Button variant="outline" onClick={() => save(false)} disabled={saving}>
              Lưu nháp
            </Button>
            <Button variant="gold" onClick={() => save(true)} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Lưu & Xuất bản
            </Button>
          </div>
        </div>

        {/* Title */}
        <div>
          <Label>Tiêu đề bài *</Label>
          <Input
            value={editing.title || ''}
            onChange={e => updateField('title', e.target.value)}
            placeholder="Nhập tiêu đề ưu đãi..."
            className="text-lg"
          />
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            <span>URL:</span>
            <code className="bg-muted px-1.5 py-0.5 rounded">/uu-dai/</code>
            <Input
              value={editing.slug || ''}
              onChange={e => { setSlugManuallyEdited(true); updateField('slug', slugify(e.target.value)); }}
              className="h-6 text-xs flex-1 max-w-xs"
              placeholder="ten-bai-viet"
            />
          </div>
        </div>

        {/* Cover image */}
        <div>
          <Label>Ảnh bìa</Label>
          {editing.cover_image_url ? (
            <div className="relative inline-block">
              <img src={editing.cover_image_url} alt="cover" className="w-full max-w-md h-48 object-cover rounded" />
              <label className="absolute bottom-2 right-2 bg-background/90 backdrop-blur px-3 py-1.5 rounded text-xs cursor-pointer hover:bg-background">
                {uploading ? 'Đang tải...' : 'Thay ảnh'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
              </label>
            </div>
          ) : (
            <label className="block border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
              {uploading ? (
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
              ) : (
                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
              )}
              <p className="text-sm text-muted-foreground mt-2">Click để tải ảnh lên (1200×800px, ≤2MB)</p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])}
              />
            </label>
          )}
        </div>

        {/* Category + expiry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Danh mục</Label>
            <Select value={editing.category} onValueChange={v => updateField('category', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OFFER_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Ngày hết hạn (để trống = không giới hạn)</Label>
            <Input
              type="date"
              value={editing.expires_at ? String(editing.expires_at).slice(0, 10) : ''}
              onChange={e => updateField('expires_at', e.target.value ? new Date(e.target.value).toISOString() : null as any)}
            />
          </div>
        </div>

        {/* Summary */}
        <div>
          <Label>Mô tả ngắn (1–2 dòng, hiện trên card)</Label>
          <Textarea
            value={editing.summary || ''}
            onChange={e => updateField('summary', e.target.value)}
            rows={2}
            placeholder="Mô tả ngắn về ưu đãi..."
          />
        </div>

        {/* Content */}
        <div>
          <Label>Nội dung đầy đủ</Label>
          <RichTextEditor
            value={editing.content || ''}
            onChange={html => updateField('content', html)}
            placeholder="Nhập nội dung chi tiết bài viết..."
          />
        </div>

        {/* Conditions */}
        <div>
          <Label>Điều kiện áp dụng (mỗi dòng 1 điều kiện)</Label>
          <Textarea
            value={editing.conditions || ''}
            onChange={e => updateField('conditions', e.target.value)}
            rows={4}
            placeholder="Áp dụng từ thứ 2 đến thứ 5&#10;Không áp dụng dịp lễ tết&#10;..."
          />
        </div>

        {/* Display settings */}
        <div className="space-y-3 p-4 bg-secondary rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Hiện trên web</Label>
              <p className="text-xs text-muted-foreground">Tắt để ẩn khỏi trang web ngay lập tức</p>
            </div>
            <Switch checked={!!editing.is_active} onCheckedChange={v => updateField('is_active', v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Nổi bật trên trang chủ</Label>
              <p className="text-xs text-muted-foreground">Tối đa 3 bài. Hiện đã có {featuredCount} bài nổi bật.</p>
            </div>
            <Switch checked={!!editing.is_featured} onCheckedChange={v => updateField('is_featured', v)} />
          </div>
        </div>
      </div>
    );
  }

  // ===== LIST =====
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">Quản lý Ưu đãi</h2>
          <p className="text-sm text-muted-foreground">{offers.length} bài · {featuredCount}/3 nổi bật</p>
        </div>
        <Button variant="gold" onClick={startNew}>
          <Plus className="h-4 w-4 mr-2" /> Thêm bài mới
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {([
          ['all', 'Tất cả'],
          ['active', 'Đang hiện'],
          ['hidden', 'Đã ẩn'],
          ['expiring', 'Sắp hết hạn'],
        ] as [FilterType, string][]).map(([k, label]) => (
          <Button
            key={k}
            size="sm"
            variant={filter === k ? 'default' : 'outline'}
            onClick={() => setFilter(k)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left p-3 w-16">Ảnh</th>
              <th className="text-left p-3">Tiêu đề</th>
              <th className="text-left p-3 hidden sm:table-cell">Danh mục</th>
              <th className="text-left p-3 hidden md:table-cell">Hết hạn</th>
              <th className="text-center p-3">Nổi bật</th>
              <th className="text-center p-3">Hiện</th>
              <th className="text-right p-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Chưa có ưu đãi nào.</td></tr>
            ) : filtered.map((o, idx) => (
              <tr key={o.id} className="border-t border-border hover:bg-secondary/40">
                <td className="p-3">
                  {o.cover_image_url ? (
                    <img src={o.cover_image_url} alt={o.title} className="w-14 h-10 object-cover rounded" />
                  ) : <div className="w-14 h-10 bg-muted rounded" />}
                </td>
                <td className="p-3">
                  <p className="font-medium line-clamp-1">{o.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">/{o.slug}</p>
                </td>
                <td className="p-3 hidden sm:table-cell">
                  <Badge variant="outline" className="text-[10px]">{o.category}</Badge>
                </td>
                <td className="p-3 hidden md:table-cell text-xs text-muted-foreground">{fmtDate(o.expires_at)}</td>
                <td className="p-3 text-center">
                  <button onClick={() => toggleFeatured(o)} title="Đổi trạng thái nổi bật">
                    <Star className={`h-4 w-4 ${o.is_featured ? 'fill-[#C9A84C] text-[#C9A84C]' : 'text-muted-foreground'}`} />
                  </button>
                </td>
                <td className="p-3 text-center">
                  <button onClick={() => toggleActive(o)} title="Ẩn/hiện">
                    {o.is_active
                      ? <Eye className="h-4 w-4 text-green-600 mx-auto" />
                      : <EyeOff className="h-4 w-4 text-muted-foreground mx-auto" />}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <div className="inline-flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveOrder(o, -1)} disabled={idx === 0}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveOrder(o, 1)} disabled={idx === filtered.length - 1}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(o)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(o)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOffers;
