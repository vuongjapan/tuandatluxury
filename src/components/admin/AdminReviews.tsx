import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Star, Check, X, Trash2, Sparkles, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Review {
  id: string;
  guest_name: string;
  guest_email: string | null;
  rating: number;
  title: string | null;
  content: string;
  room_type: string | null;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
}

const AdminReviews = () => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase.from('reviews' as any).select('*').order('created_at', { ascending: false });
    setReviews((data as unknown as Review[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const update = async (id: string, patch: Partial<Review>) => {
    const { error } = await supabase.from('reviews' as any).update(patch as any).eq('id', id);
    if (error) toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    else fetchAll();
  };

  const remove = async (id: string) => {
    if (!confirm('Xoá đánh giá này?')) return;
    const { error } = await supabase.from('reviews' as any).delete().eq('id', id);
    if (error) toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    else fetchAll();
  };

  const filtered = reviews.filter(r => {
    if (filter === 'pending') return !r.is_approved;
    if (filter === 'approved') return r.is_approved;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {(['pending', 'approved', 'all'] as const).map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
              {f === 'pending' ? `Chờ duyệt (${reviews.filter(r => !r.is_approved).length})` : f === 'approved' ? `Đã duyệt (${reviews.filter(r => r.is_approved).length})` : `Tất cả (${reviews.length})`}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Làm mới
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Không có đánh giá</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-[260px]">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-semibold">{r.guest_name}</p>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} size={14} className={n <= r.rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'} />
                      ))}
                    </div>
                    {r.is_approved && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">Đã duyệt</span>}
                    {r.is_featured && <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">Nổi bật</span>}
                  </div>
                  {r.title && <p className="font-medium mb-1">{r.title}</p>}
                  <p className="text-sm text-muted-foreground mb-2">{r.content}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.room_type && <>📍 {r.room_type} · </>}
                    {r.guest_email && <>{r.guest_email} · </>}
                    {format(new Date(r.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!r.is_approved && (
                    <Button size="sm" variant="default" onClick={() => update(r.id, { is_approved: true })} className="gap-1">
                      <Check className="h-3 w-3" /> Duyệt
                    </Button>
                  )}
                  {r.is_approved && (
                    <Button size="sm" variant="outline" onClick={() => update(r.id, { is_approved: false })} className="gap-1">
                      <X className="h-3 w-3" /> Bỏ duyệt
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => update(r.id, { is_featured: !r.is_featured })} className="gap-1">
                    <Sparkles className="h-3 w-3" /> {r.is_featured ? 'Bỏ nổi bật' : 'Nổi bật'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(r.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
