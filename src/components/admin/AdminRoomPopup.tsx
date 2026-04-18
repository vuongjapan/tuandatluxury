import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Plus, Trash2, ImageIcon } from 'lucide-react';
import { compressImage } from '@/lib/compressImage';

interface PopupSetting {
  id?: string;
  room_id: string;
  badge_vi: string;
  badge_en: string;
  cta_primary_vi: string;
  cta_primary_en: string;
  cta_secondary_vi: string;
  cta_secondary_en: string;
  highlights_vi: string[];
  highlights_en: string[];
  policy_vi: string;
  policy_en: string;
  short_pitch_vi: string;
  short_pitch_en: string;
  is_active: boolean;
}

const empty = (room_id: string): PopupSetting => ({
  room_id,
  badge_vi: '', badge_en: '',
  cta_primary_vi: 'Đặt ngay', cta_primary_en: 'Book Now',
  cta_secondary_vi: 'Chat tư vấn', cta_secondary_en: 'Chat with us',
  highlights_vi: [], highlights_en: [],
  policy_vi: '', policy_en: '',
  short_pitch_vi: '', short_pitch_en: '',
  is_active: true,
});

const AdminRoomPopup = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, PopupSetting>>({});
  const [images, setImages] = useState<Record<string, any[]>>({});
  const [activeRoom, setActiveRoom] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const [{ data: r }, { data: s }, { data: imgs }] = await Promise.all([
      supabase.from('rooms').select('id, name_vi, name_en').order('price_vnd'),
      supabase.from('room_popup_settings').select('*'),
      supabase.from('room_images').select('*').order('sort_order'),
    ]);
    setRooms(r || []);
    const map: Record<string, PopupSetting> = {};
    (r || []).forEach((rm: any) => { map[rm.id] = empty(rm.id); });
    (s || []).forEach((row: any) => {
      map[row.room_id] = { ...empty(row.room_id), ...row };
    });
    setSettings(map);
    const imgMap: Record<string, any[]> = {};
    (imgs || []).forEach((img: any) => {
      (imgMap[img.room_id] ||= []).push(img);
    });
    setImages(imgMap);
    if (!activeRoom && r?.length) setActiveRoom(r[0].id);
  };

  useEffect(() => { load(); }, []);

  const cur = settings[activeRoom];

  const updateField = <K extends keyof PopupSetting>(k: K, v: PopupSetting[K]) =>
    setSettings((prev) => ({ ...prev, [activeRoom]: { ...prev[activeRoom], [k]: v } }));

  const save = async () => {
    if (!cur) return;
    setSaving(true);
    const payload = { ...cur };
    delete (payload as any).id;
    const { error } = await supabase
      .from('room_popup_settings')
      .upsert({ ...payload, room_id: activeRoom }, { onConflict: 'room_id' });
    setSaving(false);
    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Đã lưu cấu hình popup' });
      load();
    }
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const path = `rooms/${activeRoom}/${Date.now()}-${compressed.name}`;
      const { error: upErr } = await supabase.storage.from('gallery').upload(path, compressed);
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('gallery').getPublicUrl(path);
      const sort = (images[activeRoom]?.length || 0) + 1;
      const { error } = await supabase.from('room_images').insert({
        room_id: activeRoom, image_url: pub.publicUrl, sort_order: sort, is_active: true,
      });
      if (error) throw error;
      toast({ title: 'Đã upload ảnh' });
      load();
    } catch (e: any) {
      toast({ title: 'Lỗi upload', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const updateImage = async (id: string, patch: any) => {
    const { error } = await supabase.from('room_images').update(patch).eq('id', id);
    if (error) toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    else load();
  };

  const deleteImage = async (id: string) => {
    if (!confirm('Xóa ảnh này?')) return;
    const { error } = await supabase.from('room_images').delete().eq('id', id);
    if (error) toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    else load();
  };

  if (!cur) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold">Quản lý Popup Phòng</h2>
        <p className="text-sm text-muted-foreground">Tùy chỉnh nội dung popup chi tiết hiển thị khi khách bấm "Xem thêm" trên thẻ phòng.</p>
      </div>

      {/* Room tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {rooms.map((r) => (
          <button
            key={r.id}
            onClick={() => setActiveRoom(r.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              activeRoom === r.id ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'
            }`}
          >
            {r.name_vi}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popup config */}
        <div className="space-y-4 bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Nội dung Popup</h3>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Hiển thị</Label>
              <Switch checked={cur.is_active} onCheckedChange={(v) => updateField('is_active', v)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Badge (VI)</Label>
              <Input value={cur.badge_vi} onChange={(e) => updateField('badge_vi', e.target.value)} placeholder="HOT, BEST SELLER..." />
            </div>
            <div>
              <Label>Badge (EN)</Label>
              <Input value={cur.badge_en} onChange={(e) => updateField('badge_en', e.target.value)} placeholder="HOT, BEST SELLER..." />
            </div>
          </div>

          <div>
            <Label>Mô tả ngắn (VI)</Label>
            <Textarea rows={2} value={cur.short_pitch_vi} onChange={(e) => updateField('short_pitch_vi', e.target.value)} placeholder="Phòng đẹp, view biển trực diện..." />
          </div>
          <div>
            <Label>Mô tả ngắn (EN)</Label>
            <Textarea rows={2} value={cur.short_pitch_en} onChange={(e) => updateField('short_pitch_en', e.target.value)} />
          </div>

          <div>
            <Label>Highlights (VI) — mỗi dòng một mục</Label>
            <Textarea
              rows={3}
              value={cur.highlights_vi.join('\n')}
              onChange={(e) => updateField('highlights_vi', e.target.value.split('\n').filter(Boolean))}
              placeholder={'Ban công hướng biển\nGiường King cao cấp\nFree ăn sáng'}
            />
          </div>
          <div>
            <Label>Highlights (EN)</Label>
            <Textarea
              rows={3}
              value={cur.highlights_en.join('\n')}
              onChange={(e) => updateField('highlights_en', e.target.value.split('\n').filter(Boolean))}
            />
          </div>

          <div>
            <Label>Chính sách (VI)</Label>
            <Textarea rows={3} value={cur.policy_vi} onChange={(e) => updateField('policy_vi', e.target.value)} placeholder="Check-in 14:00, Check-out 12:00..." />
          </div>
          <div>
            <Label>Chính sách (EN)</Label>
            <Textarea rows={3} value={cur.policy_en} onChange={(e) => updateField('policy_en', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>CTA chính (VI)</Label>
              <Input value={cur.cta_primary_vi} onChange={(e) => updateField('cta_primary_vi', e.target.value)} />
            </div>
            <div>
              <Label>CTA chính (EN)</Label>
              <Input value={cur.cta_primary_en} onChange={(e) => updateField('cta_primary_en', e.target.value)} />
            </div>
            <div>
              <Label>CTA phụ (VI)</Label>
              <Input value={cur.cta_secondary_vi} onChange={(e) => updateField('cta_secondary_vi', e.target.value)} />
            </div>
            <div>
              <Label>CTA phụ (EN)</Label>
              <Input value={cur.cta_secondary_en} onChange={(e) => updateField('cta_secondary_en', e.target.value)} />
            </div>
          </div>

          <Button onClick={save} disabled={saving} variant="gold" className="w-full gap-2">
            <Save className="h-4 w-4" /> {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </Button>
        </div>

        {/* Gallery + captions */}
        <div className="space-y-4 bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Gallery & Caption ảnh</h3>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
              />
              <span className="inline-flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90">
                <Plus className="h-4 w-4" /> {uploading ? 'Đang upload...' : 'Thêm ảnh'}
              </span>
            </label>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {(images[activeRoom] || []).length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Chưa có ảnh nào. Thêm ảnh để hiển thị trong popup.
              </div>
            )}
            {(images[activeRoom] || []).map((img: any) => (
              <div key={img.id} className="flex gap-3 p-2 border border-border rounded-lg">
                <img src={img.image_url} alt="" className="h-20 w-28 object-cover rounded flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Input
                    placeholder="Caption (VI) — VD: Ban công hướng biển"
                    defaultValue={img.caption_vi || ''}
                    onBlur={(e) => e.target.value !== (img.caption_vi || '') && updateImage(img.id, { caption_vi: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Caption (EN) — Sea-view balcony"
                    defaultValue={img.caption_en || ''}
                    onBlur={(e) => e.target.value !== (img.caption_en || '') && updateImage(img.id, { caption_en: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      defaultValue={img.sort_order}
                      onBlur={(e) => Number(e.target.value) !== img.sort_order && updateImage(img.id, { sort_order: Number(e.target.value) })}
                      className="h-7 w-20 text-xs"
                    />
                    <button onClick={() => deleteImage(img.id)} className="ml-auto p-1.5 hover:bg-destructive/10 text-destructive rounded">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRoomPopup;
