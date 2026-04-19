import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, CheckCircle2, AlertCircle, Database, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ClassifiedItem {
  type: 'hotel' | 'restaurant' | 'cafe' | 'attraction';
  name: string;
  slug: string;
  zone: string;
  price_tier: 'budget' | 'mid' | 'premium' | 'luxury';
  tags: string[];
  description: string;
  status: 'active' | 'needs_review';
}

const BATCH_SIZE = 25;

const PRICE_FROM: Record<string, number> = { budget: 200_000, mid: 600_000, premium: 1_500_000, luxury: 3_000_000 };
const PRICE_TO: Record<string, number> = { budget: 500_000, mid: 1_500_000, premium: 3_000_000, luxury: 10_000_000 };

const AdminQuickImport = () => {
  const { toast } = useToast();
  const [raw, setRaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [classified, setClassified] = useState<ClassifiedItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const lines = raw.split('\n').map(s => s.trim()).filter(Boolean);

  const handleClassify = async () => {
    if (lines.length === 0) {
      toast({ variant: 'destructive', title: 'Nhập danh sách trước' });
      return;
    }
    setLoading(true);
    setClassified([]);
    const all: ClassifiedItem[] = [];
    const batches: string[][] = [];
    for (let i = 0; i < lines.length; i += BATCH_SIZE) batches.push(lines.slice(i, i + BATCH_SIZE));
    setProgress({ done: 0, total: batches.length });

    try {
      for (let i = 0; i < batches.length; i++) {
        const { data, error } = await supabase.functions.invoke('quick-import', {
          body: { items: batches[i] },
        });
        if (error) throw error;
        if (data?.error === 'rate_limited') {
          toast({ variant: 'destructive', title: 'Rate limit — chờ vài giây rồi thử lại' });
          break;
        }
        if (data?.error === 'credits_exhausted') {
          toast({ variant: 'destructive', title: 'Hết credit AI' });
          break;
        }
        if (Array.isArray(data?.results)) all.push(...data.results);
        setProgress({ done: i + 1, total: batches.length });
        setClassified([...all]);
      }
      toast({ title: `Đã phân loại ${all.length} mục` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Lỗi', description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (classified.length === 0) return;
    setSaving(true);
    const grouped = {
      hotel: classified.filter(c => c.type === 'hotel'),
      restaurant: classified.filter(c => c.type === 'restaurant'),
      cafe: classified.filter(c => c.type === 'cafe'),
      attraction: classified.filter(c => c.type === 'attraction'),
    };
    let saved = 0;
    try {
      if (grouped.hotel.length) {
        const rows = grouped.hotel.map(h => ({
          name: h.name, slug: h.slug, zone: h.zone, beach_zone: h.zone,
          price_from: PRICE_FROM[h.price_tier], price_to: PRICE_TO[h.price_tier],
          near_beach: h.tags.includes('gan_bien') || h.tags.includes('view_bien'),
          family_friendly: h.tags.includes('gia_dinh'),
          couple_friendly: h.tags.includes('cap_doi') || h.tags.includes('honeymoon'),
          group_friendly: h.tags.includes('doan'),
          luxury_level: h.price_tier,
          description: h.description, tags: h.tags, status: h.status,
        }));
        const { error } = await supabase.from('external_hotels').upsert(rows, { onConflict: 'slug' });
        if (error) throw error;
        saved += rows.length;
      }
      if (grouped.restaurant.length) {
        const rows = grouped.restaurant.map(r => ({
          name: r.name, slug: r.slug, zone: r.zone, area: r.zone,
          avg_price: PRICE_FROM[r.price_tier], price_tier: r.price_tier,
          seafood: r.tags.includes('hai_san'),
          family_friendly: r.tags.includes('gia_dinh'),
          local_famous: r.tags.includes('noi_tieng'),
          description: r.description, tags: r.tags, status: r.status,
        }));
        const { error } = await supabase.from('restaurants').upsert(rows, { onConflict: 'slug' });
        if (error) throw error;
        saved += rows.length;
      }
      if (grouped.cafe.length) {
        const rows = grouped.cafe.map(c => ({
          name: c.name, slug: c.slug, zone: c.zone, area: c.zone,
          avg_price: PRICE_FROM[c.price_tier],
          chill: c.tags.includes('chill'),
          sea_view: c.tags.includes('view_bien') || c.tags.includes('sea_view'),
          checkin: c.tags.includes('check_in'),
          night_open: c.tags.includes('mo_dem'),
          description: c.description, tags: c.tags, status: c.status,
        }));
        const { error } = await supabase.from('cafes').upsert(rows, { onConflict: 'slug' });
        if (error) throw error;
        saved += rows.length;
      }
      if (grouped.attraction.length) {
        const rows = grouped.attraction.map(a => ({
          name: a.name, slug: a.slug, zone: a.zone, area: a.zone,
          free_or_paid: a.tags.includes('mien_phi') ? 'free' : 'paid',
          family: a.tags.includes('gia_dinh'),
          nightlife: a.tags.includes('dem'),
          checkin: a.tags.includes('check_in'),
          description: a.description, tags: a.tags, status: a.status,
        }));
        const { error } = await supabase.from('attractions').upsert(rows, { onConflict: 'slug' });
        if (error) throw error;
        saved += rows.length;
      }
      toast({ title: `Đã lưu ${saved} mục vào database` });
      setClassified([]);
      setRaw('');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Lỗi lưu', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const removeItem = (idx: number) => setClassified(prev => prev.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">Quick Import Sầm Sơn</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Paste mỗi địa điểm 1 dòng. AI sẽ tự phân loại (khách sạn / quán ăn / cafe / điểm chơi), gắn zone, tags, mô tả ngắn.
        </p>
        <Textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={`Khách sạn Dragon Sea\nKhách sạn Vạn Chài\nFLC Grand Hotel\nNhà hàng Hồng Thanh\nCafe Sunset\nChợ đêm Sầm Sơn`}
          rows={10}
          className="font-mono text-sm"
        />
        <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{lines.length} dòng · {Math.ceil(lines.length / BATCH_SIZE)} batch · 25 items/batch</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setRaw(''); setClassified([]); }} disabled={loading}>
              Xoá
            </Button>
            <Button onClick={handleClassify} disabled={loading || lines.length === 0} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? `Đang xử lý ${progress.done}/${progress.total}` : 'Phân loại bằng AI'}
            </Button>
          </div>
        </div>
      </div>

      {classified.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h3 className="font-display font-semibold">Kết quả ({classified.length})</h3>
            <Button onClick={handleSaveAll} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              Lưu tất cả vào database
            </Button>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {classified.map((c, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant="outline" className="text-[10px]">{c.type}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{c.zone}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{c.price_tier}</Badge>
                    {c.status === 'needs_review' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-600"><AlertCircle className="h-3 w-3" /> cần review</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600"><CheckCircle2 className="h-3 w-3" /> ok</span>
                    )}
                  </div>
                  <p className="font-semibold text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {c.tags.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 bg-background rounded">{t}</span>)}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeItem(i)} className="shrink-0">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuickImport;
