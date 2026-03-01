import { useState, useEffect, useMemo } from 'react';
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
  FileText, RefreshCw, ImageIcon, Upload, ChevronLeft, ChevronRight, UtensilsCrossed
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AMENITY_ICONS } from '@/data/rooms';
import AdminDining from '@/components/AdminDining';
import { useSiteSettings } from '@/hooks/useSiteSettings';

type Tab = 'dashboard' | 'rooms' | 'bookings' | 'customers' | 'revenue' | 'gallery' | 'dining' | 'settings';

type GalleryCategory = 'featured' | 'rooms' | 'restaurant' | 'wellness' | 'entertainment';

const GALLERY_CATEGORIES: { id: GalleryCategory; label: string }[] = [
  { id: 'featured', label: 'Nổi bật' },
  { id: 'rooms', label: 'Hạng phòng' },
  { id: 'restaurant', label: 'Nhà hàng & Ẩm thực' },
  { id: 'wellness', label: 'Chăm sóc sức khỏe' },
  { id: 'entertainment', label: 'Vui chơi giải trí' },
];

const ALL_AMENITIES = Object.keys(AMENITY_ICONS);

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

const MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [uploadingRoomImage, setUploadingRoomImage] = useState(false);

  // Monthly prices
  const [monthlyPrices, setMonthlyPrices] = useState<any[]>([]);
  const [mpRoom, setMpRoom] = useState('');
  const [mpYear, setMpYear] = useState(new Date().getFullYear());
  const [mpMonth, setMpMonth] = useState(new Date().getMonth() + 1);
  const [mpWeekday, setMpWeekday] = useState('');
  const [mpWeekend, setMpWeekend] = useState('');
  const [mpSunday, setMpSunday] = useState('');

  // Daily availability
  const [dailyAvailability, setDailyAvailability] = useState<any[]>([]);
  const [daRoom, setDaRoom] = useState('');
  const [daCalMonth, setDaCalMonth] = useState(new Date());

  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [galleryCategory, setGalleryCategory] = useState<GalleryCategory>('featured');
  const [editingGalleryImage, setEditingGalleryImage] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { settings, updateSetting } = useSiteSettings();
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setLocalSettings({ ...settings });
  }, [settings]);

  useEffect(() => {
    checkAuth();
    fetchData();
    fetchGalleryImages();
    fetchMonthlyPrices();
    fetchDailyAvailability();
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

  const fetchMonthlyPrices = async () => {
    const { data } = await supabase.from('room_monthly_prices').select('*').order('year').order('month');
    setMonthlyPrices(data || []);
  };

  const fetchDailyAvailability = async () => {
    const { data } = await supabase.from('room_daily_availability').select('*').order('date');
    setDailyAvailability(data || []);
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

  // Room image upload
  const handleRoomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingRoom) return;
    setUploadingRoomImage(true);
    const ext = file.name.split('.').pop();
    const path = `rooms/${editingRoom.id}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('gallery').upload(path, file);
    if (uploadError) {
      toast({ title: 'Lỗi upload ảnh phòng', description: uploadError.message, variant: 'destructive' });
      setUploadingRoomImage(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(path);
    setEditingRoom({ ...editingRoom, image_url: urlData.publicUrl });
    toast({ title: 'Đã upload ảnh phòng ✓' });
    setUploadingRoomImage(false);
    e.target.value = '';
  };

  const toggleAmenity = (amenity: string) => {
    if (!editingRoom) return;
    const current = editingRoom.amenities || [];
    const updated = current.includes(amenity) ? current.filter((a: string) => a !== amenity) : [...current, amenity];
    setEditingRoom({ ...editingRoom, amenities: updated });
  };

  const updateRoom = async () => {
    if (!editingRoom) return;
    const { error } = await supabase.from('rooms').update({
      name_vi: editingRoom.name_vi,
      name_en: editingRoom.name_en,
      name_ja: editingRoom.name_ja,
      name_zh: editingRoom.name_zh,
      price_vnd: editingRoom.price_vnd,
      capacity: editingRoom.capacity,
      size_sqm: editingRoom.size_sqm,
      description_vi: editingRoom.description_vi,
      description_en: editingRoom.description_en,
      description_ja: editingRoom.description_ja,
      description_zh: editingRoom.description_zh,
      is_active: editingRoom.is_active,
      amenities: editingRoom.amenities,
      image_url: editingRoom.image_url,
    }).eq('id', editingRoom.id);
    if (error) { toast({ title: 'Lỗi lưu phòng', variant: 'destructive' }); return; }
    toast({ title: 'Đã lưu thông tin phòng ✓' });
    setEditingRoom(null);
    fetchData();
  };

  // Monthly price upsert
  const saveMonthlyPrice = async () => {
    if (!mpRoom || !mpWeekday || !mpWeekend || !mpSunday) {
      toast({ title: 'Vui lòng điền đầy đủ giá', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('room_monthly_prices').upsert({
      room_id: mpRoom,
      year: mpYear,
      month: mpMonth,
      price_weekday: parseInt(mpWeekday),
      price_weekend: parseInt(mpWeekend),
      price_sunday: parseInt(mpSunday),
    }, { onConflict: 'room_id,year,month' });
    if (error) { toast({ title: 'Lỗi', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Đã lưu bảng giá tháng ✓' });
    fetchMonthlyPrices();
  };

  const deleteMonthlyPrice = async (id: string) => {
    const { error } = await supabase.from('room_monthly_prices').delete().eq('id', id);
    if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); return; }
    toast({ title: 'Đã xóa ✓' });
    fetchMonthlyPrices();
  };

  // Load existing price when room/year/month change
  useEffect(() => {
    if (!mpRoom) return;
    const existing = monthlyPrices.find((p: any) => p.room_id === mpRoom && p.year === mpYear && p.month === mpMonth);
    if (existing) {
      setMpWeekday(String(existing.price_weekday));
      setMpWeekend(String(existing.price_weekend));
      setMpSunday(String(existing.price_sunday));
    } else {
      const room = rooms.find((r: any) => r.id === mpRoom);
      setMpWeekday(room ? String(room.price_vnd) : '');
      setMpWeekend(room ? String(room.price_vnd) : '');
      setMpSunday(room ? String(room.price_vnd) : '');
    }
  }, [mpRoom, mpYear, mpMonth, monthlyPrices, rooms]);

  // Daily availability toggle
  const toggleDayAvailability = async (roomId: string, dateStr: string, currentStatus: string | null) => {
    const nextStatus = currentStatus === null ? 'closed' : currentStatus === 'open' ? 'closed' : currentStatus === 'closed' ? 'limited' : 'open';
    if (currentStatus === null) {
      // Insert new
      await supabase.from('room_daily_availability').insert({ room_id: roomId, date: dateStr, status: nextStatus, rooms_available: nextStatus === 'limited' ? 1 : 0 });
    } else if (nextStatus === 'open') {
      // Delete record (default is open)
      const existing = dailyAvailability.find((a: any) => a.room_id === roomId && a.date === dateStr);
      if (existing) await supabase.from('room_daily_availability').delete().eq('id', existing.id);
    } else {
      const existing = dailyAvailability.find((a: any) => a.room_id === roomId && a.date === dateStr);
      if (existing) {
        await supabase.from('room_daily_availability').update({ status: nextStatus, rooms_available: nextStatus === 'limited' ? 1 : 0 }).eq('id', existing.id);
      } else {
        await supabase.from('room_daily_availability').insert({ room_id: roomId, date: dateStr, status: nextStatus, rooms_available: nextStatus === 'limited' ? 1 : 0 });
      }
    }
    fetchDailyAvailability();
  };

  // Stats
  const totalRevenue = bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (b.total_price_vnd || 0), 0);
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const monthRevenue = bookings
    .filter(b => b.status !== 'cancelled' && new Date(b.created_at).getMonth() === new Date().getMonth())
    .reduce((sum, b) => sum + (b.total_price_vnd || 0), 0);

  // Availability calendar helpers
  const daYear = daCalMonth.getFullYear();
  const daMonth = daCalMonth.getMonth();
  const daDaysInMonth = new Date(daYear, daMonth + 1, 0).getDate();
  const daFirstDay = new Date(daYear, daMonth, 1).getDay();
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const navItems: { id: Tab; icon: any; label: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
    { id: 'bookings', icon: CalendarRange, label: 'Đặt phòng' },
    { id: 'rooms', icon: BedDouble, label: 'Quản lý phòng' },
    { id: 'gallery', icon: ImageIcon, label: 'Thư viện ảnh' },
    { id: 'dining', icon: UtensilsCrossed, label: 'Ẩm thực' },
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
          <a href="/" target="_blank" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary transition-all text-sm">
            <Eye className="h-4 w-4 shrink-0" />
            {sidebarOpen && 'Xem website'}
          </a>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-all text-sm">
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
            <Button variant="outline" size="sm" onClick={() => { fetchData(); fetchMonthlyPrices(); fetchDailyAvailability(); }}>
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
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-xl border border-border p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </motion.div>
                ))}
              </div>

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
                        <td className="px-4 py-3 text-xs">{b.check_in} → {b.check_out}</td>
                        <td className="px-4 py-3 font-semibold text-primary">{b.total_price_vnd?.toLocaleString('vi')}₫</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[b.status]}`}>{statusLabels[b.status]}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Select value={b.status} onValueChange={(v) => updateBookingStatus(b.id, v)}>
                            <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
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

          {/* ROOMS - Full management */}
          {tab === 'rooms' && (
            <div className="space-y-6">
              {/* Room editing form */}
              {editingRoom && (
                <div className="bg-card rounded-xl border-2 border-primary p-6">
                  <h3 className="font-display text-lg font-semibold mb-4">Chỉnh sửa: {editingRoom.name_vi}</h3>
                  
                  {/* Room image */}
                  <div className="mb-4">
                    <label className="text-xs text-muted-foreground uppercase font-semibold mb-2 block">Ảnh phòng</label>
                    <div className="flex items-start gap-4">
                      {editingRoom.image_url && (
                        <img src={editingRoom.image_url} alt="" className="w-40 h-28 object-cover rounded-lg border border-border" />
                      )}
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={handleRoomImageUpload} disabled={uploadingRoomImage} />
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                          <Upload className="h-4 w-4" />
                          {uploadingRoomImage ? 'Đang tải...' : 'Upload ảnh mới'}
                        </span>
                      </label>
                    </div>
                  </div>

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
                      <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Tên phòng (JA)</label>
                      <Input value={editingRoom.name_ja || ''} onChange={e => setEditingRoom({ ...editingRoom, name_ja: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Tên phòng (ZH)</label>
                      <Input value={editingRoom.name_zh || ''} onChange={e => setEditingRoom({ ...editingRoom, name_zh: e.target.value })} />
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
                      <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Diện tích (m²)</label>
                      <Input type="number" value={editingRoom.size_sqm} onChange={e => setEditingRoom({ ...editingRoom, size_sqm: +e.target.value })} />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="is_active" checked={editingRoom.is_active} onChange={e => setEditingRoom({ ...editingRoom, is_active: e.target.checked })} />
                      <label htmlFor="is_active" className="text-sm">Hiển thị phòng</label>
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Mô tả (VI)</label>
                      <Textarea value={editingRoom.description_vi || ''} onChange={e => setEditingRoom({ ...editingRoom, description_vi: e.target.value })} rows={2} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Mô tả (EN)</label>
                      <Textarea value={editingRoom.description_en || ''} onChange={e => setEditingRoom({ ...editingRoom, description_en: e.target.value })} rows={2} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Mô tả (JA)</label>
                      <Textarea value={editingRoom.description_ja || ''} onChange={e => setEditingRoom({ ...editingRoom, description_ja: e.target.value })} rows={2} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Mô tả (ZH)</label>
                      <Textarea value={editingRoom.description_zh || ''} onChange={e => setEditingRoom({ ...editingRoom, description_zh: e.target.value })} rows={2} />
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="mt-4">
                    <label className="text-xs text-muted-foreground uppercase font-semibold mb-2 block">Tiện nghi</label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_AMENITIES.map(amenity => {
                        const isSelected = (editingRoom.amenities || []).includes(amenity);
                        return (
                          <button
                            key={amenity}
                            onClick={() => toggleAmenity(amenity)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                            }`}
                          >
                            {AMENITY_ICONS[amenity]?.label.vi || amenity}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="hero" onClick={updateRoom}><Save className="h-4 w-4 mr-2" />Lưu thay đổi</Button>
                    <Button variant="outline" onClick={() => setEditingRoom(null)}>Hủy</Button>
                  </div>
                </div>
              )}

              {/* Room cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rooms.map(room => (
                  <div key={room.id} className="bg-card rounded-xl border border-border p-5">
                    <div className="flex gap-4 mb-3">
                      {room.image_url && (
                        <img src={room.image_url} alt="" className="w-24 h-16 object-cover rounded-lg border border-border" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-display text-lg font-semibold">{room.name_vi}</h3>
                            <p className="text-xs text-muted-foreground">{room.name_en}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${room.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {room.is_active ? 'Đang hiển thị' : 'Ẩn'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(room.amenities || []).slice(0, 6).map((a: string) => (
                        <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          {AMENITY_ICONS[a]?.label.vi || a}
                        </span>
                      ))}
                    </div>
                    <div className="bg-secondary rounded-lg p-2 mb-4 text-center">
                      <p className="text-xs text-muted-foreground">Giá cơ bản</p>
                      <p className="font-bold text-primary text-sm">{room.price_vnd?.toLocaleString('vi')}₫/đêm</p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setEditingRoom(room)}>
                      <Pencil className="h-4 w-4 mr-2" />Chỉnh sửa
                    </Button>
                  </div>
                ))}
              </div>

              {/* ===== BẢNG GIÁ THEO THÁNG ===== */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-display text-lg font-semibold mb-2">
                  <DollarSign className="h-5 w-5 inline mr-2 text-primary" />
                  Bảng giá theo tháng
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Thiết lập 3 mức giá cho mỗi tháng: <strong>Ngày thường</strong> (T2→T5), <strong>Cuối tuần</strong> (T6 & T7), <strong>Chủ nhật</strong> (CN).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Phòng</label>
                    <Select value={mpRoom} onValueChange={setMpRoom}>
                      <SelectTrigger><SelectValue placeholder="Chọn phòng" /></SelectTrigger>
                      <SelectContent>
                        {rooms.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.name_vi}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Năm</label>
                    <Select value={String(mpYear)} onValueChange={v => setMpYear(+v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Tháng</label>
                    <Select value={String(mpMonth)} onValueChange={v => setMpMonth(+v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Ngày thường</label>
                    <Input type="number" value={mpWeekday} onChange={e => setMpWeekday(e.target.value)} placeholder="VND" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Cuối tuần</label>
                    <Input type="number" value={mpWeekend} onChange={e => setMpWeekend(e.target.value)} placeholder="VND" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Chủ nhật</label>
                    <div className="flex gap-2">
                      <Input type="number" value={mpSunday} onChange={e => setMpSunday(e.target.value)} placeholder="VND" />
                      <Button variant="hero" onClick={saveMonthlyPrice} className="shrink-0">
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Existing monthly prices table */}
                {monthlyPrices.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary">
                        <tr>
                          {['Phòng', 'Tháng', 'Ngày thường', 'Cuối tuần', 'Chủ nhật', ''].map(h => (
                            <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {monthlyPrices.map((p: any) => (
                          <tr key={p.id} className="hover:bg-secondary/50">
                            <td className="px-3 py-2">{rooms.find(r => r.id === p.room_id)?.name_vi || p.room_id}</td>
                            <td className="px-3 py-2">{MONTH_NAMES[p.month - 1]} {p.year}</td>
                            <td className="px-3 py-2 font-semibold text-primary">{p.price_weekday?.toLocaleString('vi')}₫</td>
                            <td className="px-3 py-2 font-semibold text-primary">{p.price_weekend?.toLocaleString('vi')}₫</td>
                            <td className="px-3 py-2 font-semibold text-primary">{p.price_sunday?.toLocaleString('vi')}₫</td>
                            <td className="px-3 py-2">
                              <button onClick={() => deleteMonthlyPrice(p.id)} className="text-destructive hover:text-destructive/80">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ===== TRẠNG THÁI BÁN THEO NGÀY ===== */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-display text-lg font-semibold mb-2">
                  <CalendarRange className="h-5 w-5 inline mr-2 text-primary" />
                  Trạng thái bán theo ngày
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click vào ngày để chuyển trạng thái: <strong className="text-green-600">Mở</strong> → <strong className="text-destructive">Đóng</strong> → <strong className="text-yellow-600">Giới hạn</strong> → Mở.
                </p>

                <div className="flex flex-wrap gap-3 mb-4 items-center">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Phòng</label>
                    <Select value={daRoom} onValueChange={setDaRoom}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Chọn phòng" /></SelectTrigger>
                      <SelectContent>
                        {rooms.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.name_vi}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setDaCalMonth(new Date(daYear, daMonth - 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-display text-lg font-semibold min-w-[140px] text-center">
                      {MONTH_NAMES[daMonth]} {daYear}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => setDaCalMonth(new Date(daYear, daMonth + 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {daRoom && (
                  <div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {dayNames.map(d => (
                        <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: daFirstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                      {Array.from({ length: daDaysInMonth }).map((_, i) => {
                        const d = i + 1;
                        const dateStr = `${daYear}-${String(daMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const avail = dailyAvailability.find((a: any) => a.room_id === daRoom && a.date === dateStr);
                        const status = avail?.status || 'open';

                        return (
                          <button
                            key={d}
                            onClick={() => toggleDayAvailability(daRoom, dateStr, avail ? status : null)}
                            className={`
                              min-h-[48px] rounded-lg text-center transition-all duration-200 flex flex-col items-center justify-center cursor-pointer border
                              ${status === 'open' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 hover:bg-green-100' : ''}
                              ${status === 'closed' ? 'bg-destructive/10 border-destructive/30 hover:bg-destructive/20' : ''}
                              ${status === 'limited' ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700 hover:bg-yellow-100' : ''}
                            `}
                          >
                            <span className="text-sm font-medium text-foreground">{d}</span>
                            <span className={`text-[9px] font-semibold ${
                              status === 'open' ? 'text-green-600' : status === 'closed' ? 'text-destructive' : 'text-yellow-600'
                            }`}>
                              {status === 'open' ? 'Mở' : status === 'closed' ? 'Đóng' : 'GH'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-300" /> Mở bán</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-destructive/20 border border-destructive/40" /> Đóng bán</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-400" /> Giới hạn</span>
                    </div>
                  </div>
                )}

                {!daRoom && (
                  <p className="text-center text-muted-foreground py-8">Chọn phòng để quản lý trạng thái bán.</p>
                )}
              </div>
            </div>
          )}

          {/* GALLERY */}
          {tab === 'gallery' && (
            <div className="space-y-4">
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

          {/* DINING */}
          {tab === 'dining' && <AdminDining />}

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

          {tab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              {/* Account info */}
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

              {/* Map embed */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-display text-lg font-semibold mb-2">🗺️ Bản đồ khách sạn</h3>
                <p className="text-xs text-muted-foreground mb-3">Dán link Google Maps Embed vào đây (lấy từ Google Maps → Chia sẻ → Nhúng bản đồ)</p>
                <Textarea
                  rows={3}
                  value={localSettings.map_embed_url || ''}
                  onChange={e => setLocalSettings(prev => ({ ...prev, map_embed_url: e.target.value }))}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  className="text-xs"
                />
                {localSettings.map_embed_url && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-border">
                    <iframe src={localSettings.map_embed_url} width="100%" height="150" style={{ border: 0 }} loading="lazy" title="Preview" />
                  </div>
                )}
              </div>

              {/* Platform links */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-display text-lg font-semibold mb-2">🌐 Nền tảng đặt phòng quốc tế</h3>
                <p className="text-xs text-muted-foreground mb-4">Chỉnh sửa link và tên hiển thị cho các nền tảng</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Tên nền tảng 1</label>
                      <Input value={localSettings.platform_booking_name || ''} onChange={e => setLocalSettings(prev => ({ ...prev, platform_booking_name: e.target.value }))} placeholder="Booking.com" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Link</label>
                      <Input value={localSettings.platform_booking_url || ''} onChange={e => setLocalSettings(prev => ({ ...prev, platform_booking_url: e.target.value }))} placeholder="https://www.booking.com/..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Tên nền tảng 2</label>
                      <Input value={localSettings.platform_agoda_name || ''} onChange={e => setLocalSettings(prev => ({ ...prev, platform_agoda_name: e.target.value }))} placeholder="Agoda" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Link</label>
                      <Input value={localSettings.platform_agoda_url || ''} onChange={e => setLocalSettings(prev => ({ ...prev, platform_agoda_url: e.target.value }))} placeholder="https://www.agoda.com/..." />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save button */}
              <Button
                disabled={savingSettings}
                onClick={async () => {
                  setSavingSettings(true);
                  const keys = ['map_embed_url', 'platform_booking_url', 'platform_booking_name', 'platform_agoda_url', 'platform_agoda_name'];
                  for (const key of keys) {
                    if (localSettings[key] !== settings[key]) {
                      await updateSetting(key, localSettings[key] || '');
                    }
                  }
                  setSavingSettings(false);
                  toast({ title: 'Đã lưu cài đặt ✓' });
                }}
              >
                <Save className="h-4 w-4 mr-2" /> {savingSettings ? 'Đang lưu...' : 'Lưu tất cả cài đặt'}
              </Button>

              <div className="mt-4">
                <a href="/" target="_blank">
                  <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-2" />Xem website</Button>
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
