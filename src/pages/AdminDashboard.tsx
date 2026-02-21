import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, BedDouble, CalendarRange, Users, BarChart3,
  LogOut, Menu, X, Settings, DollarSign, TrendingUp, Clock,
  CheckCircle, XCircle, Eye, Pencil, Trash2, Plus, Save,
  FileText, RefreshCw, ImageIcon, Upload
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

type Tab = 'dashboard' | 'rooms' | 'bookings' | 'customers' | 'revenue' | 'gallery' | 'settings';

type GalleryCategory = 'featured' | 'rooms' | 'restaurant' | 'wellness' | 'entertainment';

const GALLERY_CATEGORIES: { id: GalleryCategory; label: string }[] = [
  { id: 'featured', label: 'Nổi bật' },
  { id: 'rooms', label: 'Hạng phòng' },
  { id: 'restaurant', label: 'Nhà hàng & Ẩm thực' },
  { id: 'wellness', label: 'Chăm sóc sức khỏe' },
  { id: 'entertainment', label: 'Vui chơi giải trí' },
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  checked_in: 'bg-blue-100 text-blue-800',
  checked_out: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
  checked_in: 'Đang ở',
  checked_out: 'Đã trả phòng',
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState<any>(null);

  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [galleryCategory, setGalleryCategory] = useState<GalleryCategory>('featured');
  const [editingGalleryImage, setEditingGalleryImage] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchData();
    fetchGalleryImages();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/admin/login'); return; }
    const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (!role) { navigate('/admin/login'); }
  };

  const fetchData = async () => {
    setLoading(true);
    const [{ data: b }, { data: r }] = await Promise.all([
      supabase.from('bookings').select('*, rooms(name_vi)').order('created_at', { ascending: false }),
      supabase.from('rooms').select('*').order('price_vnd'),
    ]);
    setBookings(b || []);
    setRooms(r || []);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const fetchGalleryImages = async () => {
    const { data } = await supabase.from('gallery_images').select('*').order('sort_order');
    setGalleryImages(data || []);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const ext = file.name.split('.').pop();
    const path = `${galleryCategory}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('gallery').upload(path, file);
    if (uploadError) {
      toast({ title: 'Lỗi upload ảnh', description: uploadError.message, variant: 'destructive' });
      setUploadingImage(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(path);
    const { error: insertError } = await supabase.from('gallery_images').insert({
      category: galleryCategory,
      image_url: urlData.publicUrl,
      title_vi: '',
      title_en: '',
      sort_order: galleryImages.filter(g => g.category === galleryCategory).length,
    });
    if (insertError) {
      toast({ title: 'Lỗi lưu ảnh', variant: 'destructive' });
    } else {
      toast({ title: 'Đã thêm ảnh ✓' });
      fetchGalleryImages();
    }
    setUploadingImage(false);
    e.target.value = '';
  };

  const updateGalleryImage = async () => {
    if (!editingGalleryImage) return;
    const { error } = await supabase.from('gallery_images').update({
      title_vi: editingGalleryImage.title_vi,
      title_en: editingGalleryImage.title_en,
      description_vi: editingGalleryImage.description_vi,
      description_en: editingGalleryImage.description_en,
      sort_order: editingGalleryImage.sort_order,
      is_active: editingGalleryImage.is_active,
      category: editingGalleryImage.category,
    }).eq('id', editingGalleryImage.id);
    if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); return; }
    toast({ title: 'Đã cập nhật ✓' });
    setEditingGalleryImage(null);
    fetchGalleryImages();
  };

  const deleteGalleryImage = async (id: string) => {
    if (!confirm('Xóa ảnh này?')) return;
    const { error } = await supabase.from('gallery_images').delete().eq('id', id);
    if (error) { toast({ title: 'Lỗi xóa', variant: 'destructive' }); return; }
    toast({ title: 'Đã xóa ✓' });
    fetchGalleryImages();
  };

  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); return; }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    toast({ title: 'Cập nhật thành công' });
  };

  const updateRoom = async () => {
    if (!editingRoom) return;
    const { error } = await supabase.from('rooms').update({
      name_vi: editingRoom.name_vi,
      name_en: editingRoom.name_en,
      price_vnd: editingRoom.price_vnd,
      capacity: editingRoom.capacity,
      description_vi: editingRoom.description_vi,
      weekend_multiplier: editingRoom.weekend_multiplier,
      peak_multiplier: editingRoom.peak_multiplier,
      is_active: editingRoom.is_active,
    }).eq('id', editingRoom.id);
    if (error) { toast({ title: 'Lỗi lưu phòng', variant: 'destructive' }); return; }
    toast({ title: 'Đã lưu thông tin phòng ✓' });
    setEditingRoom(null);
    fetchData();
  };

  // Stats
  const totalRevenue = bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (b.total_price_vnd || 0), 0);
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const monthRevenue = bookings
    .filter(b => b.status !== 'cancelled' && new Date(b.created_at).getMonth() === new Date().getMonth())
    .reduce((sum, b) => sum + (b.total_price_vnd || 0), 0);

  const navItems: { id: Tab; icon: any; label: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
    { id: 'bookings', icon: CalendarRange, label: 'Đặt phòng' },
    { id: 'rooms', icon: BedDouble, label: 'Quản lý phòng' },
    { id: 'gallery', icon: ImageIcon, label: 'Thư viện ảnh' },
    { id: 'customers', icon: Users, label: 'Khách hàng' },
    { id: 'revenue', icon: BarChart3, label: 'Doanh thu' },
    { id: 'settings', icon: Settings, label: 'Cài đặt' },
  ];

  return (
    <div className="min-h-screen bg-secondary flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-card border-r border-border flex flex-col`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <p className="font-display text-sm font-bold text-foreground">Tuấn Đạt Luxury</p>
              <p className="text-xs text-muted-foreground">Quản trị hệ thống</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded hover:bg-secondary transition-colors">
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${tab === item.id ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-border space-y-1">
          <a href="/" target="_blank" className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary transition-all text-sm`}>
            <Eye className="h-4 w-4 shrink-0" />
            {sidebarOpen && 'Xem website'}
          </a>
          <button onClick={handleSignOut} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-all text-sm`}>
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && 'Đăng xuất'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {navItems.find(n => n.id === tab)?.label}
            </h1>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" /> Làm mới
            </Button>
          </div>

          {/* DASHBOARD */}
          {tab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Tổng đặt phòng', value: bookings.length, icon: CalendarRange, color: 'text-blue-600' },
                  { label: 'Chờ xác nhận', value: pendingCount, icon: Clock, color: 'text-yellow-600' },
                  { label: 'Đang ở', value: confirmedCount, icon: CheckCircle, color: 'text-green-600' },
                  { label: 'Doanh thu tháng', value: monthRevenue.toLocaleString('vi') + '₫', icon: TrendingUp, color: 'text-primary' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card rounded-xl border border-border p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Recent bookings */}
              <div className="bg-card rounded-xl border border-border p-5">
                <h2 className="font-display text-lg font-semibold mb-4">Đặt phòng gần đây</h2>
                <div className="space-y-3">
                  {bookings.slice(0, 5).map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{b.guest_name}</p>
                        <p className="text-xs text-muted-foreground">{b.rooms?.name_vi} · {b.guest_phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary">{b.total_price_vnd?.toLocaleString('vi')}₫</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[b.status]}`}>{statusLabels[b.status]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* BOOKINGS */}
          {tab === 'bookings' && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary">
                    <tr>
                      {['Mã đặt', 'Khách hàng', 'Phòng', 'Nhận - Trả', 'Tổng tiền', 'Trạng thái', 'Thao tác'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bookings.map(b => (
                      <tr key={b.id} className="hover:bg-secondary/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{b.booking_code}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{b.guest_name}</p>
                          <p className="text-xs text-muted-foreground">{b.guest_phone}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{b.rooms?.name_vi || b.room_id}</td>
                        <td className="px-4 py-3 text-xs">
                          {b.check_in} → {b.check_out}
                        </td>
                        <td className="px-4 py-3 font-semibold text-primary">{b.total_price_vnd?.toLocaleString('vi')}₫</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[b.status]}`}>{statusLabels[b.status]}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Select value={b.status} onValueChange={(v) => updateBookingStatus(b.id, v)}>
                            <SelectTrigger className="h-7 text-xs w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusLabels).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {bookings.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">Chưa có đặt phòng nào</div>
                )}
              </div>
            </div>
          )}

          {/* ROOMS */}
          {tab === 'rooms' && (
            <div className="space-y-4">
              {editingRoom && (
                <div className="bg-card rounded-xl border-2 border-primary p-6">
                  <h3 className="font-display text-lg font-semibold mb-4">Chỉnh sửa: {editingRoom.name_vi}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Tên phòng (VI)</label>
                      <Input value={editingRoom.name_vi} onChange={e => setEditingRoom({ ...editingRoom, name_vi: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Tên phòng (EN)</label>
                      <Input value={editingRoom.name_en} onChange={e => setEditingRoom({ ...editingRoom, name_en: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Giá cơ bản (VND/đêm)</label>
                      <Input type="number" value={editingRoom.price_vnd} onChange={e => setEditingRoom({ ...editingRoom, price_vnd: +e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Sức chứa (người)</label>
                      <Input type="number" value={editingRoom.capacity} onChange={e => setEditingRoom({ ...editingRoom, capacity: +e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Hệ số cuối tuần</label>
                      <Input type="number" step="0.1" value={editingRoom.weekend_multiplier} onChange={e => setEditingRoom({ ...editingRoom, weekend_multiplier: +e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Hệ số cao điểm</label>
                      <Input type="number" step="0.1" value={editingRoom.peak_multiplier} onChange={e => setEditingRoom({ ...editingRoom, peak_multiplier: +e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Mô tả (VI)</label>
                      <Textarea value={editingRoom.description_vi || ''} onChange={e => setEditingRoom({ ...editingRoom, description_vi: e.target.value })} rows={2} />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="is_active" checked={editingRoom.is_active} onChange={e => setEditingRoom({ ...editingRoom, is_active: e.target.checked })} />
                      <label htmlFor="is_active" className="text-sm">Hiển thị phòng</label>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="hero" onClick={updateRoom}><Save className="h-4 w-4 mr-2" />Lưu thay đổi</Button>
                    <Button variant="outline" onClick={() => setEditingRoom(null)}>Hủy</Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rooms.map(room => (
                  <div key={room.id} className="bg-card rounded-xl border border-border p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-display text-lg font-semibold">{room.name_vi}</h3>
                        <p className="text-xs text-muted-foreground">{room.name_en}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${room.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {room.is_active ? 'Đang hiển thị' : 'Ẩn'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                      <div className="bg-secondary rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Giá/đêm</p>
                        <p className="font-bold text-primary text-sm">{room.price_vnd?.toLocaleString('vi')}₫</p>
                      </div>
                      <div className="bg-secondary rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Cuối tuần</p>
                        <p className="font-bold text-sm">x{room.weekend_multiplier}</p>
                      </div>
                      <div className="bg-secondary rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Cao điểm</p>
                        <p className="font-bold text-sm">x{room.peak_multiplier}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setEditingRoom(room)}>
                      <Pencil className="h-4 w-4 mr-2" />Chỉnh sửa
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GALLERY */}
          {tab === 'gallery' && (
            <div className="space-y-4">
              {/* Category filter */}
              <div className="flex flex-wrap gap-2">
                {GALLERY_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setGalleryCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      galleryCategory === cat.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-accent border border-border'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Upload */}
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-semibold">
                    {GALLERY_CATEGORIES.find(c => c.id === galleryCategory)?.label}
                  </h3>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} disabled={uploadingImage} />
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                      <Upload className="h-4 w-4" />
                      {uploadingImage ? 'Đang tải...' : 'Thêm ảnh'}
                    </span>
                  </label>
                </div>

                {/* Edit form */}
                {editingGalleryImage && (
                  <div className="bg-secondary rounded-xl p-4 mb-4 border-2 border-primary">
                    <h4 className="font-semibold mb-3">Chỉnh sửa ảnh</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Tiêu đề (VI)</label>
                        <Input value={editingGalleryImage.title_vi || ''} onChange={e => setEditingGalleryImage({ ...editingGalleryImage, title_vi: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Tiêu đề (EN)</label>
                        <Input value={editingGalleryImage.title_en || ''} onChange={e => setEditingGalleryImage({ ...editingGalleryImage, title_en: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Danh mục</label>
                        <Select value={editingGalleryImage.category} onValueChange={v => setEditingGalleryImage({ ...editingGalleryImage, category: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {GALLERY_CATEGORIES.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Thứ tự</label>
                        <Input type="number" value={editingGalleryImage.sort_order} onChange={e => setEditingGalleryImage({ ...editingGalleryImage, sort_order: +e.target.value })} />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={editingGalleryImage.is_active} onChange={e => setEditingGalleryImage({ ...editingGalleryImage, is_active: e.target.checked })} />
                        <label className="text-sm">Hiển thị</label>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="hero" size="sm" onClick={updateGalleryImage}><Save className="h-4 w-4 mr-1" />Lưu</Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingGalleryImage(null)}>Hủy</Button>
                    </div>
                  </div>
                )}

                {/* Image grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {galleryImages.filter(g => g.category === galleryCategory).map(img => (
                    <div key={img.id} className="group relative rounded-xl overflow-hidden border border-border">
                      <img src={img.image_url} alt={img.title_vi || ''} className="w-full aspect-[4/3] object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => setEditingGalleryImage(img)} className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors">
                          <Pencil className="h-4 w-4 text-white" />
                        </button>
                        <button onClick={() => deleteGalleryImage(img.id)} className="p-2 bg-red-500/50 rounded-full hover:bg-red-500/80 transition-colors">
                          <Trash2 className="h-4 w-4 text-white" />
                        </button>
                      </div>
                      {!img.is_active && (
                        <span className="absolute top-2 left-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">Ẩn</span>
                      )}
                      {img.title_vi && (
                        <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">{img.title_vi}</p>
                      )}
                    </div>
                  ))}
                </div>

                {galleryImages.filter(g => g.category === galleryCategory).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Chưa có ảnh trong danh mục này. Nhấn "Thêm ảnh" để bắt đầu.</p>
                )}
              </div>
            </div>
          )}

          {/* CUSTOMERS */}
          {tab === 'customers' && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary">
                    <tr>
                      {['Họ tên', 'Điện thoại', 'Email', 'Số lần đặt', 'Tổng chi tiêu', 'Lần đặt gần nhất'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {Object.values(bookings.reduce((acc: any, b) => {
                      const key = b.guest_phone;
                      if (!acc[key]) acc[key] = { name: b.guest_name, phone: b.guest_phone, email: b.guest_email, count: 0, total: 0, last: b.created_at };
                      acc[key].count++;
                      acc[key].total += b.total_price_vnd || 0;
                      if (b.created_at > acc[key].last) acc[key].last = b.created_at;
                      return acc;
                    }, {})).map((c: any, i) => (
                      <tr key={i} className="hover:bg-secondary/50">
                        <td className="px-4 py-3 font-medium">{c.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.phone}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.email || '—'}</td>
                        <td className="px-4 py-3 text-center font-semibold">{c.count}</td>
                        <td className="px-4 py-3 font-semibold text-primary">{c.total.toLocaleString('vi')}₫</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(c.last), 'dd/MM/yyyy', { locale: vi })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REVENUE */}
          {tab === 'revenue' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Tổng doanh thu', value: totalRevenue, icon: DollarSign },
                  { label: 'Tháng này', value: monthRevenue, icon: TrendingUp },
                  { label: 'TB/đặt phòng', value: bookings.length ? Math.round(totalRevenue / bookings.length) : 0, icon: BarChart3 },
                ].map((s, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{s.label}</span>
                      <s.icon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-2xl font-bold text-primary">{s.value.toLocaleString('vi')}₫</p>
                  </div>
                ))}
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-display text-lg font-semibold mb-4">Chi tiết doanh thu theo phòng</h3>
                {rooms.map(room => {
                  const roomBookings = bookings.filter(b => b.room_id === room.id && b.status !== 'cancelled');
                  const roomRevenue = roomBookings.reduce((sum, b) => sum + (b.total_price_vnd || 0), 0);
                  const pct = totalRevenue ? (roomRevenue / totalRevenue) * 100 : 0;
                  return (
                    <div key={room.id} className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{room.name_vi}</span>
                        <span className="text-primary font-semibold">{roomRevenue.toLocaleString('vi')}₫</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-gold-gradient rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{roomBookings.length} đặt phòng · {pct.toFixed(1)}%</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {tab === 'settings' && (
            <div className="space-y-4 max-w-xl">
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-display text-lg font-semibold mb-4">Thông tin tài khoản Admin</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">dovuongcokhi.japan@gmail.com</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Vai trò</span>
                    <span className="font-semibold text-primary">Administrator</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Quyền hạn</span>
                    <span className="font-medium">Toàn quyền</span>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-display text-lg font-semibold mb-4">Cài đặt hệ thống</h3>
                <p className="text-sm text-muted-foreground">Quản lý toàn bộ nội dung website qua các tab ở trên. Thay đổi giá phòng tại tab "Quản lý phòng".</p>
                <div className="mt-4 flex gap-2">
                  <a href="/" target="_blank">
                    <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-2" />Xem website</Button>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
