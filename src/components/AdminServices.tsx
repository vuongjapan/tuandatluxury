import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/compressImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Save, Trash2, Pencil, Upload, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ServiceRow {
  id: string;
  name_vi: string;
  name_en: string;
  description_vi: string | null;
  description_en: string | null;
  icon: string;
  image_url: string | null;
  category: string;
  is_bookable: boolean;
  is_free: boolean;
  price_vnd: number;
  schedule: string | null;
  vehicle_types: any;
  sort_order: number;
  is_active: boolean;
}

const ICONS = ['🏊','🍽️','📶','🅿️','👨‍👩‍👧‍👦','🛎️','🏖️','✈️','🌊','🚐','💆','🎾','🏋️','🧖','🎵','☕'];

const AdminServices = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<'services' | 'bookings'>('services');

  const fetchServices = async () => {
    const { data } = await supabase.from('services').select('*').order('sort_order') as any;
    setServices(data || []);
  };

  const fetchBookings = async () => {
    const { data } = await supabase.from('service_bookings').select('*, services(name_vi, icon)').order('created_at', { ascending: false }) as any;
    setBookings(data || []);
  };

  useEffect(() => { fetchServices(); fetchBookings(); }, []);

  const newService = (): ServiceRow => ({
    id: '',
    name_vi: '', name_en: '',
    description_vi: '', description_en: '',
    icon: '🏨', image_url: null,
    category: 'amenity', is_bookable: false,
    is_free: true, price_vnd: 0,
    schedule: null, vehicle_types: null,
    sort_order: services.length, is_active: true,
  });

  const handleSave = async () => {
    if (!editing) return;
    const payload = {
      name_vi: editing.name_vi,
      name_en: editing.name_en,
      description_vi: editing.description_vi,
      description_en: editing.description_en,
      icon: editing.icon,
      image_url: editing.image_url,
      category: editing.category,
      is_bookable: editing.is_bookable,
      is_free: editing.is_free,
      price_vnd: editing.price_vnd,
      schedule: editing.schedule,
      vehicle_types: editing.vehicle_types,
      sort_order: editing.sort_order,
      is_active: editing.is_active,
    };

    let error;
    if (adding) {
      ({ error } = await supabase.from('services').insert(payload as any));
    } else {
      ({ error } = await supabase.from('services').update(payload as any).eq('id', editing.id));
    }
    if (error) { toast({ title: 'Lỗi', description: error.message, variant: 'destructive' }); return; }
    toast({ title: adding ? 'Đã thêm dịch vụ ✓' : 'Đã cập nhật ✓' });
    setEditing(null);
    setAdding(false);
    fetchServices();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa dịch vụ này?')) return;
    await supabase.from('services').delete().eq('id', id);
    toast({ title: 'Đã xóa ✓' });
    fetchServices();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `services/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('gallery').upload(path, file);
    if (error) { toast({ title: 'Lỗi upload', variant: 'destructive' }); setUploading(false); return; }
    const { data } = supabase.storage.from('gallery').getPublicUrl(path);
    setEditing({ ...editing, image_url: data.publicUrl });
    setUploading(false);
  };

  const updateBookingStatus = async (id: string, status: string) => {
    await supabase.from('service_bookings').update({ status } as any).eq('id', id);
    toast({ title: 'Đã cập nhật ✓' });
    fetchBookings();
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-4">
        <Button variant={tab === 'services' ? 'default' : 'outline'} size="sm" onClick={() => setTab('services')}>
          Quản lý dịch vụ
        </Button>
        <Button variant={tab === 'bookings' ? 'default' : 'outline'} size="sm" onClick={() => setTab('bookings')}>
          Đơn đặt dịch vụ ({bookings.filter(b => b.status === 'pending').length})
        </Button>
      </div>

      {tab === 'services' && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Danh sách dịch vụ</h3>
            <Button size="sm" onClick={() => { setEditing(newService()); setAdding(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Thêm
            </Button>
          </div>

          {editing && (
            <div className="bg-secondary rounded-xl p-4 space-y-3 border border-border">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-sm">{adding ? 'Thêm dịch vụ' : 'Sửa dịch vụ'}</h4>
                <Button variant="ghost" size="sm" onClick={() => { setEditing(null); setAdding(false); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Tên (VI)</label>
                  <Input value={editing.name_vi} onChange={e => setEditing({ ...editing, name_vi: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium">Tên (EN)</label>
                  <Input value={editing.name_en} onChange={e => setEditing({ ...editing, name_en: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium">Mô tả (VI)</label>
                  <Textarea value={editing.description_vi || ''} onChange={e => setEditing({ ...editing, description_vi: e.target.value })} rows={2} />
                </div>
                <div>
                  <label className="text-xs font-medium">Mô tả (EN)</label>
                  <Textarea value={editing.description_en || ''} onChange={e => setEditing({ ...editing, description_en: e.target.value })} rows={2} />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium">Icon</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ICONS.map(ic => (
                      <button key={ic} onClick={() => setEditing({ ...editing, icon: ic })}
                        className={`text-xl p-1 rounded ${editing.icon === ic ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-secondary'}`}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium">Danh mục</label>
                  <Select value={editing.category} onValueChange={v => setEditing({ ...editing, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amenity">Tiện nghi</SelectItem>
                      <SelectItem value="shuttle">Đưa đón</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium">Giá (VNĐ)</label>
                  <Input type="number" value={editing.price_vnd} onChange={e => setEditing({ ...editing, price_vnd: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs font-medium">Lịch trình</label>
                  <Input value={editing.schedule || ''} onChange={e => setEditing({ ...editing, schedule: e.target.value })} placeholder="7:00 - 22:00" />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.is_bookable} onChange={e => setEditing({ ...editing, is_bookable: e.target.checked })} />
                  Cho phép đặt
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.is_free} onChange={e => setEditing({ ...editing, is_free: e.target.checked })} />
                  Miễn phí
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} />
                  Hiển thị
                </label>
                <label className="text-sm">
                  Thứ tự:
                  <Input type="number" className="w-16 inline ml-2" value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} />
                </label>
              </div>

              {/* Image */}
              <div className="flex items-center gap-3">
                {editing.image_url && <img src={editing.image_url} alt="" className="h-16 w-24 object-cover rounded" />}
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild><span><Upload className="h-3 w-3 mr-1" />{uploading ? 'Đang upload...' : 'Upload ảnh'}</span></Button>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>

              <Button onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Lưu</Button>
            </div>
          )}

          <div className="space-y-2">
            {services.map(s => (
              <div key={s.id} className="flex items-center gap-3 bg-card p-3 rounded-lg border border-border">
                <span className="text-2xl">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{s.name_vi}</p>
                  <p className="text-xs text-muted-foreground">{s.category === 'amenity' ? 'Tiện nghi' : 'Đưa đón'} • {s.is_free ? 'Miễn phí' : `${s.price_vnd.toLocaleString()}đ`}</p>
                </div>
                {!s.is_active && <Badge variant="outline" className="text-xs">Ẩn</Badge>}
                <Button variant="ghost" size="sm" onClick={() => { setEditing(s); setAdding(false); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(s.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'bookings' && (
        <div className="space-y-3">
          <h3 className="font-semibold">Đơn đặt dịch vụ</h3>
          {bookings.length === 0 && <p className="text-muted-foreground text-sm">Chưa có đơn đặt dịch vụ nào.</p>}
          {bookings.map(b => (
            <div key={b.id} className="bg-card p-4 rounded-lg border border-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{b.services?.icon}</span>
                  <span className="font-medium text-sm">{b.services?.name_vi}</span>
                </div>
                <Badge className={statusColors[b.status] || 'bg-gray-100'}>
                  {b.status === 'pending' ? 'Chờ xác nhận' : b.status === 'confirmed' ? 'Đã xác nhận' : b.status === 'cancelled' ? 'Đã hủy' : 'Hoàn thành'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                <span>👤 {b.guest_name}</span>
                <span>📞 {b.guest_phone}</span>
                <span>📅 {b.booking_date} {b.booking_time || ''}</span>
                <span>💰 {b.total_price_vnd > 0 ? `${b.total_price_vnd.toLocaleString()}đ` : 'Miễn phí'}
                  {b.discount_percent > 0 && ` (-${b.discount_percent}%)`}
                </span>
                {b.pickup_location && <span>📍 {b.pickup_location}</span>}
                {b.vehicle_type && <span>🚗 {b.vehicle_type}</span>}
                <span>👥 {b.guests_count} khách</span>
                <span>{b.payment_method === 'online' ? '💳 Online' : '🏨 Tại KS'}</span>
              </div>
              {b.notes && <p className="text-xs text-muted-foreground italic">📝 {b.notes}</p>}
              {b.status === 'pending' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="default" onClick={() => updateBookingStatus(b.id, 'confirmed')}>Xác nhận</Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateBookingStatus(b.id, 'cancelled')}>Hủy</Button>
                </div>
              )}
              {b.status === 'confirmed' && (
                <Button size="sm" variant="outline" onClick={() => updateBookingStatus(b.id, 'completed')}>Hoàn thành</Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminServices;
