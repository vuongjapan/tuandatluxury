import { useState, useEffect, useMemo } from 'react';
import { compressImage } from '@/lib/compressImage';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, BedDouble, CalendarRange, Users, BarChart3,
  LogOut, Menu, X, DollarSign, TrendingUp, Clock,
  CheckCircle, XCircle, Eye, Pencil, Trash2, Plus, Save,
  FileText, RefreshCw, ImageIcon, Upload, ChevronLeft, ChevronRight, UtensilsCrossed, Gift, Sparkles, Download, UploadCloud, RotateCcw, Archive, MapPin, BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AMENITY_ICONS } from '@/data/rooms';
import AdminDining from '@/components/AdminDining';
import AdminPromotions from '@/components/AdminPromotions';
import AdminServices from '@/components/AdminServices';
import AdminFoodMenu from '@/components/AdminFoodMenu';
import AdminImageOptimizer from '@/components/AdminImageOptimizer';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import AdminMembers from '@/components/AdminMembers';
import AdminBlog from '@/components/AdminBlog';
import AdminCombo from '@/components/AdminCombo';
import AdminSpecialPrices from '@/components/AdminSpecialPrices';


type Tab = 'dashboard' | 'rooms' | 'bookings' | 'customers' | 'revenue' | 'gallery' | 'dining' | 'promotions' | 'services' | 'map' | 'trash' | 'food-menu' | 'members' | 'blog' | 'combos' | 'special-prices';

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

// Trash localStorage helpers
const TRASH_KEY = 'tdl_admin_trash';
interface TrashItem {
  type: 'booking';
  data: any;
  deletedAt: string;
}

function getTrash(): TrashItem[] {
  try { return JSON.parse(localStorage.getItem(TRASH_KEY) || '[]'); } catch { return []; }
}
function saveTrash(items: TrashItem[]) { localStorage.setItem(TRASH_KEY, JSON.stringify(items)); }

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser, isAdmin, loading: authLoading, signOut: authSignOut } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [uploadingRoomImage, setUploadingRoomImage] = useState(false);
  const [trashItems, setTrashItems] = useState<TrashItem[]>(getTrash());

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

  // Map management
  const { settings: siteSettings, updateSetting } = useSiteSettings();
  const [mapEmbedCode, setMapEmbedCode] = useState('');
  const [mapSaving, setMapSaving] = useState(false);
  const [mapPreview, setMapPreview] = useState(false);

  useEffect(() => {
    setMapEmbedCode(siteSettings.map_embed_code || '');
  }, [siteSettings.map_embed_code]);

  const saveMapEmbed = async () => {
    setMapSaving(true);
    const err = await updateSetting('map_embed_code', mapEmbedCode);
    setMapSaving(false);
    if (err) { toast({ title: 'Lỗi lưu bản đồ', variant: 'destructive' }); return; }
    toast({ title: 'Đã lưu bản đồ ✓' });
  };

  // Auth guard using AuthContext - no race condition
  useEffect(() => {
    if (authLoading) return;
    if (!authUser || !isAdmin) {
      navigate('/admin/login');
    }
  }, [authLoading, authUser, isAdmin, navigate]);

  useEffect(() => {
    if (authLoading || !authUser || !isAdmin) return;
    fetchData();
    fetchGalleryImages();
    fetchMonthlyPrices();
    fetchDailyAvailability();
  }, [authLoading, authUser, isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: b, error: bookingsError }, { data: r, error: roomsError }] = await Promise.all([
        supabase.from('bookings').select('*, rooms(name_vi)').order('created_at', { ascending: false }),
        supabase.from('rooms').select('*').order('price_vnd'),
      ]);

      if (bookingsError || roomsError) {
        toast({
          title: 'Lỗi tải dữ liệu admin',
          description: bookingsError?.message || roomsError?.message,
          variant: 'destructive',
        });
      }

      setBookings(b || []);
      setRooms(r || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyPrices = async () => {
    const { data, error } = await supabase.from('room_monthly_prices').select('*').order('year').order('month');
    if (error) {
      toast({ title: 'Lỗi tải giá tháng', description: error.message, variant: 'destructive' });
      return;
    }
    setMonthlyPrices(data || []);
  };

  const fetchDailyAvailability = async () => {
    const { data, error } = await supabase.from('room_daily_availability').select('*').order('date');
    if (error) {
      toast({ title: 'Lỗi tải lịch bán', description: error.message, variant: 'destructive' });
      return;
    }
    setDailyAvailability(data || []);
  };

  const handleSignOut = async () => {
    await authSignOut();
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
    try {
      const compressed = await compressImage(file, { maxWidth: 1200, quality: 0.7 });
      const path = `${galleryCategory}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('gallery').upload(path, compressed);
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
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
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

  const handleRoomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingRoom) return;
    setUploadingRoomImage(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 1200, quality: 0.7 });
      const path = `rooms/${editingRoom.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('gallery').upload(path, compressed);
      if (uploadError) {
        toast({ title: 'Lỗi upload ảnh phòng', description: uploadError.message, variant: 'destructive' });
        setUploadingRoomImage(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(path);
      setEditingRoom({ ...editingRoom, image_url: urlData.publicUrl });
      toast({ title: 'Đã upload ảnh phòng ✓' });
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    }
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

  const toggleDayAvailability = async (roomId: string, dateStr: string, currentStatus: string | null) => {
    const nextStatus = currentStatus === null ? 'closed' : currentStatus === 'open' ? 'closed' : currentStatus === 'closed' ? 'limited' : currentStatus === 'limited' ? 'combo' : 'open';
    const existing = dailyAvailability.find((a: any) => a.room_id === roomId && a.date === dateStr);

    let error: any = null;

    if (currentStatus === null) {
      const result = await supabase.from('room_daily_availability').insert({ room_id: roomId, date: dateStr, status: nextStatus, rooms_available: nextStatus === 'limited' ? 1 : 0 });
      error = result.error;
    } else if (nextStatus === 'open') {
      if (existing) {
        const result = await supabase.from('room_daily_availability').delete().eq('id', existing.id);
        error = result.error;
      }
    } else if (existing) {
      const result = await supabase.from('room_daily_availability').update({ status: nextStatus, rooms_available: nextStatus === 'limited' ? 1 : 0 }).eq('id', existing.id);
      error = result.error;
    } else {
      const result = await supabase.from('room_daily_availability').insert({ room_id: roomId, date: dateStr, status: nextStatus, rooms_available: nextStatus === 'limited' ? 1 : 0 });
      error = result.error;
    }

    if (error) {
      toast({ title: 'Không thể cập nhật trạng thái ngày', description: error.message, variant: 'destructive' });
      return;
    }

    fetchDailyAvailability();
  };

  const moveBookingToTrash = async (booking: any) => {
    if (!confirm('Chuyển đơn đặt phòng này vào thùng rác?')) return;
    const newTrash = [...trashItems, { type: 'booking' as const, data: booking, deletedAt: new Date().toISOString() }];
    saveTrash(newTrash);
    setTrashItems(newTrash);
    // Cancel in DB
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id);
    setBookings(prev => prev.filter(b => b.id !== booking.id));
    toast({ title: 'Đã chuyển vào thùng rác' });
  };

  const restoreFromTrash = async (index: number) => {
    const item = trashItems[index];
    if (item.type === 'booking') {
      await supabase.from('bookings').update({ status: 'pending' }).eq('id', item.data.id);
      fetchData();
    }
    const newTrash = trashItems.filter((_, i) => i !== index);
    saveTrash(newTrash);
    setTrashItems(newTrash);
    toast({ title: 'Đã khôi phục' });
  };

  const permanentDelete = (index: number) => {
    if (!confirm('Xóa vĩnh viễn? Không thể hoàn tác!')) return;
    const newTrash = trashItems.filter((_, i) => i !== index);
    saveTrash(newTrash);
    setTrashItems(newTrash);
    toast({ title: 'Đã xóa vĩnh viễn' });
  };

  const handleBackup = async () => {
    const [{ data: b }, { data: r }, { data: g }, { data: mp }, { data: da }, { data: s }, { data: ss }] = await Promise.all([
      supabase.from('bookings').select('*'),
      supabase.from('rooms').select('*'),
      supabase.from('gallery_images').select('*'),
      supabase.from('room_monthly_prices').select('*'),
      supabase.from('room_daily_availability').select('*'),
      supabase.from('services').select('*'),
      supabase.from('site_settings').select('*'),
    ]);
    const backup = { exportedAt: new Date().toISOString(), bookings: b, rooms: r, gallery_images: g, room_monthly_prices: mp, room_daily_availability: da, services: s, site_settings: ss };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tuandat-backup-${format(new Date(), 'yyyyMMdd-HHmm')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Đã xuất backup thành công ✓' });
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.exportedAt) throw new Error('File không hợp lệ');
        if (!confirm(`Khôi phục dữ liệu từ backup ${data.exportedAt}?\nDữ liệu hiện tại sẽ được ghi đè.`)) return;

        // Restore site_settings
        if (data.site_settings?.length) {
          for (const s of data.site_settings) {
            await supabase.from('site_settings').upsert(s as any, { onConflict: 'key' } as any);
          }
        }
        toast({ title: 'Đã khôi phục dữ liệu ✓', description: `Backup từ ${data.exportedAt}` });
        fetchData();
        fetchGalleryImages();
        fetchMonthlyPrices();
        fetchDailyAvailability();
      } catch (err: any) {
        toast({ title: 'Lỗi khôi phục', description: err.message, variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
    { id: 'promotions', icon: Gift, label: 'Ưu đãi' },
    { id: 'services', icon: Sparkles, label: 'Dịch vụ' },
    { id: 'food-menu', icon: UtensilsCrossed, label: 'Menu đồ ăn' },
    { id: 'customers', icon: Users, label: 'Khách hàng' },
    { id: 'members', icon: Users, label: 'Thành viên' },
    { id: 'revenue', icon: BarChart3, label: 'Doanh thu' },
    { id: 'blog', icon: BookOpen, label: 'Blog' },
    { id: 'combos', icon: UtensilsCrossed, label: 'Combo ăn uống' },
    { id: 'map', icon: MapPin, label: 'Bản đồ' },
    { id: 'trash', icon: Archive, label: 'Thùng rác' },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary flex relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 
        bg-card border-r border-border flex flex-col 
        transform transition-all duration-300 
        ${sidebarOpen 
          ? 'translate-x-0 w-64' 
          : '-translate-x-full lg:translate-x-0 lg:w-16 w-64'}
      `}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className={`overflow-hidden transition-all ${sidebarOpen ? 'w-auto' : 'lg:w-0 lg:hidden'}`}>
            <p className="font-display text-sm font-bold text-foreground whitespace-nowrap">Tuấn Đạt Luxury</p>
            <p className="text-xs text-muted-foreground whitespace-nowrap">Quản trị hệ thống</p>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded hover:bg-secondary transition-colors shrink-0">
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); if (window.innerWidth < 1024) setSidebarOpen(false); }}
              title={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${tab === item.id ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className={`text-sm whitespace-nowrap overflow-hidden transition-all ${sidebarOpen ? 'opacity-100 w-auto' : 'lg:opacity-0 lg:w-0 lg:hidden'}`}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-border space-y-1">
          <a href="/" target="_blank" title="Xem website" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary transition-all text-sm">
            <Eye className="h-4 w-4 shrink-0" />
            <span className={`whitespace-nowrap overflow-hidden transition-all ${sidebarOpen ? 'opacity-100 w-auto' : 'lg:opacity-0 lg:w-0 lg:hidden'}`}>Xem website</span>
          </a>
          <button onClick={handleSignOut} title="Đăng xuất" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-all text-sm">
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={`whitespace-nowrap overflow-hidden transition-all ${sidebarOpen ? 'opacity-100 w-auto' : 'lg:opacity-0 lg:w-0 lg:hidden'}`}>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto min-w-0">
        <div className="p-3 sm:p-6">
          <div className="flex items-center justify-between mb-6 gap-2">
            {/* Mobile menu button - always visible on mobile */}
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-card border border-border shrink-0">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-display text-lg sm:text-2xl font-bold text-foreground truncate flex-1">
              {navItems.find(n => n.id === tab)?.label}
            </h1>
            <Button variant="outline" size="sm" onClick={() => { fetchData(); fetchMonthlyPrices(); fetchDailyAvailability(); }} className="shrink-0">
              <RefreshCw className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Làm mới</span>
            </Button>
          </div>

          {/* DASHBOARD */}
          {tab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: 'Tổng đặt phòng', value: bookings.length, icon: CalendarRange, color: 'text-blue-600' },
                  { label: 'Chờ xác nhận', value: pendingCount, icon: Clock, color: 'text-yellow-600' },
                  { label: 'Đang ở', value: confirmedCount, icon: CheckCircle, color: 'text-green-600' },
                  { label: 'Doanh thu tháng', value: monthRevenue.toLocaleString('vi') + '₫', icon: TrendingUp, color: 'text-primary' },
                ].map((stat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-xl border border-border p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <span className="text-xs sm:text-sm text-muted-foreground">{stat.label}</span>
                      <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                    </div>
                    <p className={`text-lg sm:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
                <h2 className="font-display text-lg font-semibold mb-4">Đặt phòng gần đây</h2>
                <div className="space-y-3">
                  {bookings.slice(0, 5).map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{b.guest_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{b.rooms?.name_vi} · {b.guest_phone}</p>
                      </div>
                      <div className="text-right shrink-0">
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
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-secondary">
                    <tr>
                      {['Mã đặt', 'Khách hàng', 'Phòng', 'Nhận - Trả', 'Tổng tiền', 'Trạng thái', 'Thao tác'].map(h => (
                        <th key={h} className="px-3 sm:px-4 py-3 text-left font-semibold text-muted-foreground text-xs sm:text-sm">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bookings.map(b => (
                      <tr key={b.id} className="hover:bg-secondary/50 transition-colors">
                        <td className="px-3 sm:px-4 py-3 font-mono text-xs font-bold text-primary">{b.booking_code}</td>
                        <td className="px-3 sm:px-4 py-3">
                          <p className="font-medium text-xs sm:text-sm">{b.guest_name}</p>
                          <p className="text-xs text-muted-foreground">{b.guest_phone}</p>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-muted-foreground text-xs sm:text-sm">{b.rooms?.name_vi || b.room_id}</td>
                        <td className="px-3 sm:px-4 py-3 text-xs">{b.check_in} → {b.check_out}</td>
                        <td className="px-3 sm:px-4 py-3 font-semibold text-primary text-xs sm:text-sm">{b.total_price_vnd?.toLocaleString('vi')}₫</td>
                        <td className="px-3 sm:px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[b.status]}`}>{statusLabels[b.status]}</span>
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Select value={b.status} onValueChange={(v) => updateBookingStatus(b.id, v)}>
                              <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.entries(statusLabels).map(([k, v]) => (
                                  <SelectItem key={k} value={k}>{v}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <button onClick={() => moveBookingToTrash(b)} className="p-1 rounded hover:bg-destructive/10 text-destructive" title="Chuyển vào thùng rác">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
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
              {editingRoom && (
                <div className="bg-card rounded-xl border-2 border-primary p-4 sm:p-6">
                  <h3 className="font-display text-lg font-semibold mb-4">Chỉnh sửa: {editingRoom.name_vi}</h3>
                  
                  <div className="mb-4">
                    <label className="text-xs text-muted-foreground uppercase font-semibold mb-2 block">Ảnh phòng</label>
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      {editingRoom.image_url && (
                        <img
                          src={editingRoom.image_url}
                          alt=""
                          className="w-full sm:w-40 h-28 object-cover rounded-lg border border-border"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                        />
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button variant="hero" onClick={updateRoom}><Save className="h-4 w-4 mr-2" />Lưu thay đổi</Button>
                    <Button variant="outline" onClick={() => setEditingRoom(null)}>Hủy</Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rooms.map(room => (
                  <div key={room.id} className="bg-card rounded-xl border border-border p-4 sm:p-5">
                    <div className="flex gap-3 sm:gap-4 mb-3">
                      {room.image_url && (
                        <img
                          src={room.image_url}
                          alt=""
                          className="w-20 sm:w-24 h-14 sm:h-16 object-cover rounded-lg border border-border"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-display text-base sm:text-lg font-semibold truncate">{room.name_vi}</h3>
                            <p className="text-xs text-muted-foreground truncate">{room.name_en}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${room.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {room.is_active ? 'Hiện' : 'Ẩn'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(room.amenities || []).slice(0, 4).map((a: string) => (
                        <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          {AMENITY_ICONS[a]?.label.vi || a}
                        </span>
                      ))}
                    </div>
                    <div className="bg-secondary rounded-lg p-2 mb-3 text-center">
                      <p className="text-xs text-muted-foreground">Giá cơ bản</p>
                      <p className="font-bold text-primary text-sm">{room.price_vnd?.toLocaleString('vi')}₫/đêm</p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setEditingRoom(room)}>
                      <Pencil className="h-4 w-4 mr-2" />Chỉnh sửa
                    </Button>
                  </div>
                ))}
              </div>

              {/* Monthly prices */}
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <h3 className="font-display text-lg font-semibold mb-2">
                  <DollarSign className="h-5 w-5 inline mr-2 text-primary" />
                  Bảng giá theo tháng
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Thiết lập 3 mức giá: <strong>Ngày thường</strong> (T2→T5), <strong>Cuối tuần</strong> (T6 & T7), <strong>Chủ nhật</strong> (CN).
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
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

                {monthlyPrices.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[500px]">
                      <thead className="bg-secondary">
                        <tr>
                          {['Phòng', 'Tháng', 'Ngày thường', 'Cuối tuần', 'Chủ nhật', ''].map(h => (
                            <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {monthlyPrices.map((p: any) => (
                          <tr key={p.id} className="hover:bg-secondary/50">
                            <td className="px-3 py-2 text-xs sm:text-sm">{rooms.find(r => r.id === p.room_id)?.name_vi || p.room_id}</td>
                            <td className="px-3 py-2 text-xs sm:text-sm">{MONTH_NAMES[p.month - 1]} {p.year}</td>
                            <td className="px-3 py-2 font-semibold text-primary text-xs sm:text-sm">{p.price_weekday?.toLocaleString('vi')}₫</td>
                            <td className="px-3 py-2 font-semibold text-primary text-xs sm:text-sm">{p.price_weekend?.toLocaleString('vi')}₫</td>
                            <td className="px-3 py-2 font-semibold text-primary text-xs sm:text-sm">{p.price_sunday?.toLocaleString('vi')}₫</td>
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

              {/* Daily availability */}
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <h3 className="font-display text-lg font-semibold mb-2">
                  <CalendarRange className="h-5 w-5 inline mr-2 text-primary" />
                  Trạng thái bán theo ngày
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click vào ngày để chuyển: <strong className="text-green-600">Mở</strong> → <strong className="text-destructive">Đóng</strong> → <strong className="text-yellow-600">Giới hạn</strong> → <strong className="text-purple-600">Combo bắt buộc</strong> → Mở.
                </p>

                <div className="flex flex-wrap gap-3 mb-4 items-center">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Phòng</label>
                    <Select value={daRoom} onValueChange={setDaRoom}>
                      <SelectTrigger className="w-40 sm:w-48"><SelectValue placeholder="Chọn phòng" /></SelectTrigger>
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
                    <span className="font-display text-base sm:text-lg font-semibold min-w-[120px] sm:min-w-[140px] text-center">
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
                              min-h-[40px] sm:min-h-[48px] rounded-lg text-center transition-all duration-200 flex flex-col items-center justify-center cursor-pointer border
                              ${status === 'open' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 hover:bg-green-100' : ''}
                              ${status === 'closed' ? 'bg-destructive/10 border-destructive/30 hover:bg-destructive/20' : ''}
                              ${status === 'limited' ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700 hover:bg-yellow-100' : ''}
                              ${status === 'combo' ? 'bg-purple-50 border-purple-300 dark:bg-purple-900/20 dark:border-purple-700 hover:bg-purple-100' : ''}
                            `}
                          >
                            <span className="text-xs sm:text-sm font-medium text-foreground">{d}</span>
                            <span className={`text-[8px] sm:text-[9px] font-semibold ${
                              status === 'open' ? 'text-green-600' : status === 'closed' ? 'text-destructive' : status === 'combo' ? 'text-purple-600' : 'text-yellow-600'
                            }`}>
                              {status === 'open' ? 'Mở' : status === 'closed' ? 'Đóng' : status === 'combo' ? 'Combo' : 'GH'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap gap-3 sm:gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-300" /> Mở bán</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-destructive/20 border border-destructive/40" /> Đóng bán</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-400" /> Giới hạn</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-100 border border-purple-400" /> Combo bắt buộc</span>
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
            <div className="space-y-6">
              {/* Image Optimizer Tool */}
              <div className="bg-card border border-border rounded-xl p-4">
                <AdminImageOptimizer />
              </div>

              <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {GALLERY_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setGalleryCategory(cat.id)}
                    className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                      galleryCategory === cat.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-accent border border-border'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <h3 className="font-display text-base sm:text-lg font-semibold truncate">
                    {GALLERY_CATEGORIES.find(c => c.id === galleryCategory)?.label}
                  </h3>
                  <label className="cursor-pointer shrink-0">
                    <input type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} disabled={uploadingImage} />
                    <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors">
                      <Upload className="h-4 w-4" />
                      {uploadingImage ? 'Đang tải...' : 'Thêm ảnh'}
                    </span>
                  </label>
                </div>

                {editingGalleryImage && (
                  <div className="bg-secondary rounded-xl p-4 mb-4 border-2 border-primary">
                    <h4 className="font-semibold mb-3">Chỉnh sửa ảnh</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {galleryImages.filter(g => g.category === galleryCategory).map(img => (
                    <div key={img.id} className="group relative rounded-xl overflow-hidden border border-border">
                      <img
                        src={img.image_url}
                        alt={img.title_vi || ''}
                        className="w-full aspect-[4/3] object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                      />
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
                  <p className="text-center text-muted-foreground py-8">Chưa có ảnh trong danh mục này.</p>
                )}
              </div>
              </div>
            </div>
          )}

          {tab === 'dining' && <AdminDining />}
          {tab === 'promotions' && <AdminPromotions />}
          {tab === 'services' && <AdminServices />}
          {tab === 'food-menu' && <AdminFoodMenu />}

          {/* CUSTOMERS */}
          {tab === 'customers' && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="bg-secondary">
                    <tr>
                      {['Họ tên', 'Điện thoại', 'Email', 'Số lần đặt', 'Tổng chi tiêu', 'Gần nhất'].map(h => (
                        <th key={h} className="px-3 sm:px-4 py-3 text-left font-semibold text-muted-foreground text-xs sm:text-sm">{h}</th>
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
                        <td className="px-3 sm:px-4 py-3 font-medium text-xs sm:text-sm">{c.name}</td>
                        <td className="px-3 sm:px-4 py-3 text-muted-foreground text-xs sm:text-sm">{c.phone}</td>
                        <td className="px-3 sm:px-4 py-3 text-muted-foreground text-xs sm:text-sm">{c.email || '—'}</td>
                        <td className="px-3 sm:px-4 py-3 text-center font-semibold">{c.count}</td>
                        <td className="px-3 sm:px-4 py-3 font-semibold text-primary text-xs sm:text-sm">{c.total.toLocaleString('vi')}₫</td>
                        <td className="px-3 sm:px-4 py-3 text-xs text-muted-foreground">{format(new Date(c.last), 'dd/MM/yyyy', { locale: vi })}</td>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Tổng doanh thu', value: totalRevenue, icon: DollarSign },
                  { label: 'Tháng này', value: monthRevenue, icon: TrendingUp },
                  { label: 'TB/đặt phòng', value: bookings.length ? Math.round(totalRevenue / bookings.length) : 0, icon: BarChart3 },
                ].map((s, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{s.label}</span>
                      <s.icon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-primary">{s.value.toLocaleString('vi')}₫</p>
                  </div>
                ))}
              </div>

              <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
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

          {/* MAP & HEADER */}
          {tab === 'map' && (
            <div className="space-y-4">
              {/* Hero Video Management */}
              <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
                <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  🎬 Video / Ảnh đầu trang (Hero)
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload video MP4 hoặc ảnh nền. Nếu có video, video sẽ autoplay. Nếu không, hiển thị ảnh.
                </p>

                {/* Video */}
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Video Hero (MP4, tối đa 50MB)</label>
                  {siteSettings.hero_video_url && (
                    <div className="mb-3 p-3 bg-secondary rounded-lg">
                      <video src={siteSettings.hero_video_url} className="w-full max-h-40 rounded-lg object-cover" controls muted />
                      <span className="text-xs text-muted-foreground mt-1 block">Video hiện tại</span>
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" className="relative" disabled={uploadingRoomImage}>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingRoomImage ? 'Đang tải...' : 'Upload video'}
                      <input
                        type="file"
                        accept="video/mp4,video/webm"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 50 * 1024 * 1024) {
                            toast({ title: 'Video quá lớn (tối đa 50MB)', variant: 'destructive' });
                            return;
                          }
                          setUploadingRoomImage(true);
                          try {
                            const path = `hero-video-${Date.now()}.mp4`;
                            const { error: upErr } = await supabase.storage.from('site-assets').upload(path, file, { upsert: true });
                            if (upErr) { toast({ title: 'Lỗi upload', description: upErr.message, variant: 'destructive' }); setUploadingRoomImage(false); return; }
                            const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(path);
                            const err = await updateSetting('hero_video_url', urlData.publicUrl);
                            if (err) toast({ title: 'Lỗi lưu', variant: 'destructive' });
                            else toast({ title: 'Đã cập nhật video hero ✓' });
                          } catch (err: any) { toast({ title: 'Lỗi', description: err.message, variant: 'destructive' }); }
                          setUploadingRoomImage(false);
                        }}
                      />
                    </Button>
                    {siteSettings.hero_video_url && (
                      <Button variant="outline" onClick={async () => { await updateSetting('hero_video_url', ''); toast({ title: 'Đã xóa video ✓' }); }}>
                        <Trash2 className="h-4 w-4 mr-2" /> Xóa video
                      </Button>
                    )}
                  </div>
                </div>

                {/* Hero Image (fallback) */}
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Ảnh nền Hero (fallback khi không có video)</label>
                  {siteSettings.hero_image_url && (
                    <div className="mb-3 p-3 bg-secondary rounded-lg">
                      <img src={siteSettings.hero_image_url} alt="Hero" className="w-full max-h-40 object-cover rounded-lg" />
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" className="relative" disabled={uploadingRoomImage}>
                      <Upload className="h-4 w-4 mr-2" /> Upload ảnh
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          setUploadingRoomImage(true);
                          try {
                            const compressed = await compressImage(file, { maxWidth: 1920, quality: 0.75 });
                            const path = `hero-image-${Date.now()}.jpg`;
                            const { error: upErr } = await supabase.storage.from('site-assets').upload(path, compressed, { upsert: true });
                            if (upErr) { toast({ title: 'Lỗi upload', variant: 'destructive' }); setUploadingRoomImage(false); return; }
                            const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(path);
                            const err = await updateSetting('hero_image_url', urlData.publicUrl);
                            if (err) toast({ title: 'Lỗi lưu', variant: 'destructive' });
                            else toast({ title: 'Đã cập nhật ảnh hero ✓' });
                          } catch (err: any) { toast({ title: 'Lỗi', description: err.message, variant: 'destructive' }); }
                          setUploadingRoomImage(false);
                        }}
                      />
                    </Button>
                    {siteSettings.hero_image_url && (
                      <Button variant="outline" onClick={async () => { await updateSetting('hero_image_url', ''); toast({ title: 'Đã xóa ảnh ✓' }); }}>
                        <Trash2 className="h-4 w-4 mr-2" /> Xóa ảnh
                      </Button>
                    )}
                  </div>
                </div>

                {/* Hero Text */}
                <div className="space-y-3 border-t border-border pt-4">
                  <h4 className="text-sm font-semibold">Nội dung Hero (để trống = mặc định)</h4>
                  <div>
                    <label className="text-xs text-muted-foreground">Tiêu đề chính</label>
                    <Input
                      placeholder="Tuấn Đạt Luxury"
                      defaultValue={siteSettings.hero_title}
                      onBlur={async (e) => {
                        await updateSetting('hero_title', e.target.value);
                        toast({ title: 'Đã lưu tiêu đề ✓' });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Phụ đề / Slogan</label>
                    <Input
                      placeholder="Trải nghiệm nghỉ dưỡng đẳng cấp..."
                      defaultValue={siteSettings.hero_subtitle}
                      onBlur={async (e) => {
                        await updateSetting('hero_subtitle', e.target.value);
                        toast({ title: 'Đã lưu phụ đề ✓' });
                      }}
                    />
                  </div>
                </div>
              </div>
              {/* About Us Image */}
              <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
                <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  Ảnh "Về chúng tôi"
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload ảnh giới thiệu khách sạn hiển thị trong section "Về chúng tôi" trên trang chủ.
                </p>
                {siteSettings.about_image_url && (
                  <div className="mb-4 p-3 bg-secondary rounded-lg">
                    <img src={siteSettings.about_image_url} alt="About" className="w-full max-h-60 object-cover rounded-lg" />
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" className="relative" disabled={uploadingRoomImage}>
                    <Upload className="h-4 w-4 mr-2" /> Upload ảnh
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        setUploadingRoomImage(true);
                        try {
                          const compressed = await compressImage(file, { maxWidth: 1200, quality: 0.75 });
                          const path = `about-image-${Date.now()}.jpg`;
                          const { error: upErr } = await supabase.storage.from('site-assets').upload(path, compressed, { upsert: true });
                          if (upErr) { toast({ title: 'Lỗi upload', variant: 'destructive' }); setUploadingRoomImage(false); return; }
                          const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(path);
                          const err = await updateSetting('about_image_url', urlData.publicUrl);
                          if (err) toast({ title: 'Lỗi lưu', variant: 'destructive' });
                          else toast({ title: 'Đã cập nhật ảnh Về chúng tôi ✓' });
                        } catch (err: any) { toast({ title: 'Lỗi', description: err.message, variant: 'destructive' }); }
                        setUploadingRoomImage(false);
                      }}
                    />
                  </Button>
                  {siteSettings.about_image_url && (
                    <Button variant="outline" onClick={async () => { await updateSetting('about_image_url', ''); toast({ title: 'Đã xóa ảnh ✓' }); }}>
                      <Trash2 className="h-4 w-4 mr-2" /> Xóa ảnh
                    </Button>
                  )}
                </div>
              </div>
              {/* Header Logo Management */}
              <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
                <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  Logo thanh công cụ
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload ảnh logo hiển thị trên thanh header. Nên dùng ảnh PNG trong suốt, kích thước tối ưu 200×50px.
                </p>
                {siteSettings.header_logo_url && (
                  <div className="mb-4 p-4 bg-secondary rounded-lg flex items-center gap-4">
                    <img src={siteSettings.header_logo_url} alt="Current logo" className="h-12 w-auto object-contain" />
                    <span className="text-xs text-muted-foreground">Logo hiện tại</span>
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" className="relative" disabled={uploadingRoomImage}>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingRoomImage ? 'Đang tải...' : 'Upload logo'}
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingRoomImage(true);
                        try {
                          const compressed = await compressImage(file, { maxWidth: 400, quality: 0.8 });
                          const path = `header-logo-${Date.now()}.jpg`;
                          const { error: upErr } = await supabase.storage.from('site-assets').upload(path, compressed, { upsert: true });
                          if (upErr) {
                            toast({ title: 'Lỗi upload', description: upErr.message, variant: 'destructive' });
                            setUploadingRoomImage(false);
                            return;
                          }
                          const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(path);
                          const err = await updateSetting('header_logo_url', urlData.publicUrl);
                          if (err) { toast({ title: 'Lỗi lưu', variant: 'destructive' }); return; }
                          toast({ title: 'Đã cập nhật logo ✓' });
                        } catch (err: any) {
                          toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
                        }
                        setUploadingRoomImage(false);
                      }}
                    />
                  </Button>
                  {siteSettings.header_logo_url && (
                    <Button variant="outline" onClick={async () => {
                      const err = await updateSetting('header_logo_url', '');
                      if (!err) toast({ title: 'Đã xóa logo, hiển thị tên mặc định ✓' });
                    }}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa logo
                    </Button>
                  )}
                </div>
              </div>

              {/* Chatbot Avatar */}
              <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
                <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  💬 Ảnh đại diện Chatbot Linh
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload ảnh đại diện cho lễ tân Linh trong chatbot. Nên dùng ảnh vuông, kích thước tối ưu 200×200px.
                </p>
                {siteSettings.chatbot_avatar_url && (
                  <div className="mb-4 p-4 bg-secondary rounded-lg flex items-center gap-4">
                    <img src={siteSettings.chatbot_avatar_url} alt="Chatbot avatar" className="h-16 w-16 rounded-full object-cover" />
                    <span className="text-xs text-muted-foreground">Avatar hiện tại</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" className="relative">
                    📷 Chọn ảnh
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingRoomImage(true);
                        try {
                          const compressed = await compressImage(file, { maxWidth: 400, quality: 0.8 });
                          const path = `chatbot-avatar-${Date.now()}.jpg`;
                          const { error: upErr } = await supabase.storage.from('site-assets').upload(path, compressed, { upsert: true });
                          if (upErr) {
                            toast({ title: 'Lỗi upload: ' + upErr.message, variant: 'destructive' });
                            setUploadingRoomImage(false);
                            return;
                          }
                          const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(path);
                          const err = await updateSetting('chatbot_avatar_url', urlData.publicUrl);
                          if (err) { toast({ title: 'Lỗi lưu', variant: 'destructive' }); return; }
                          toast({ title: 'Đã cập nhật avatar chatbot ✓' });
                        } catch (err: any) {
                          toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
                        }
                        setUploadingRoomImage(false);
                      }}
                    />
                  </Button>
                  {siteSettings.chatbot_avatar_url && (
                    <Button variant="outline" onClick={async () => {
                      const err = await updateSetting('chatbot_avatar_url', '');
                      if (!err) toast({ title: 'Đã xóa avatar, hiển thị emoji mặc định ✓' });
                    }}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa avatar
                    </Button>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
                <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Quản lý bản đồ
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Dán mã nhúng Google Maps (iframe) vào ô bên dưới. Bản đồ sẽ hiển thị trên trang chủ và liên hệ.
                </p>
                <Textarea
                  value={mapEmbedCode}
                  onChange={e => setMapEmbedCode(e.target.value)}
                  placeholder='<iframe src="https://www.google.com/maps/embed?..." width="600" height="450" ...></iframe>'
                  rows={5}
                  className="font-mono text-xs"
                />
                <div className="flex gap-2 mt-4 flex-wrap">
                  <Button variant="gold" onClick={saveMapEmbed} disabled={mapSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {mapSaving ? 'Đang lưu...' : 'Lưu bản đồ'}
                  </Button>
                  <Button variant="outline" onClick={() => setMapPreview(!mapPreview)}>
                    <Eye className="h-4 w-4 mr-2" />
                    {mapPreview ? 'Ẩn xem trước' : 'Xem trước'}
                  </Button>
                </div>
              </div>

              {mapPreview && (
                <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
                  <h4 className="font-display text-base font-semibold mb-3">Xem trước bản đồ</h4>
                  {mapEmbedCode ? (
                    <div
                      className="rounded-lg overflow-hidden border border-border w-full aspect-video [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
                      dangerouslySetInnerHTML={{ __html: mapEmbedCode }}
                    />
                  ) : (
                    <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                      Chưa có mã nhúng bản đồ
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MEMBERS */}
          {tab === 'members' && <AdminMembers />}

          {/* BLOG */}
          {tab === 'blog' && <AdminBlog />}

          {/* COMBOS */}
          {tab === 'combos' && <AdminCombo />}

          {/* TRASH */}
          {tab === 'trash' && (
            <div className="space-y-4">
              <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
                <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <Archive className="h-5 w-5 text-muted-foreground" />
                  Thùng rác ({trashItems.length})
                </h3>
                {trashItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Thùng rác trống</p>
                ) : (
                  <div className="space-y-3">
                    {trashItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-secondary rounded-lg gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{item.type === 'booking' ? '🏨 Đặt phòng' : item.type}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.data.guest_name} · {item.data.booking_code} · {item.data.guest_phone}
                          </p>
                          <p className="text-xs text-muted-foreground">Xóa lúc: {format(new Date(item.deletedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button variant="outline" size="sm" onClick={() => restoreFromTrash(idx)}>
                            <RotateCcw className="h-3.5 w-3.5 mr-1" />Khôi phục
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => permanentDelete(idx)}>
                            <Trash2 className="h-3.5 w-3.5 mr-1" />Xóa hẳn
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
