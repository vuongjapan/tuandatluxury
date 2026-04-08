import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, BedDouble, CalendarRange, Users, BarChart3,
  LogOut, Menu, X, TrendingUp, Clock, CheckCircle, Eye,
  RefreshCw, ImageIcon, UtensilsCrossed, Gift, Sparkles,
  MapPin, BookOpen, Flame, Settings, Archive, ShoppingCart, Film, Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// Admin sub-components
import AdminBookings from '@/components/admin/AdminBookings';
import AdminRooms from '@/components/admin/AdminRooms';
import AdminGallery from '@/components/admin/AdminGallery';
import AdminRevenue from '@/components/admin/AdminRevenue';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminTrash, { TrashItem, getTrash, saveTrash } from '@/components/admin/AdminTrash';
import AdminDining from '@/components/AdminDining';
import AdminPromotions from '@/components/AdminPromotions';
import AdminServices from '@/components/AdminServices';
import AdminFoodMenu from '@/components/AdminFoodMenu';
import AdminMembers from '@/components/AdminMembers';
import AdminBlog from '@/components/AdminBlog';
import AdminCombo from '@/components/AdminCombo';
import AdminSpecialPrices from '@/components/AdminSpecialPrices';
import AdminCuisineMedia from '@/components/admin/AdminCuisineMedia';
import AdminPromotionSystem from '@/components/admin/AdminPromotionSystem';
import AdminAmenities from '@/components/admin/AdminAmenities';

type Tab = 'dashboard' | 'bookings' | 'rooms' | 'gallery' | 'dining' | 'food-menu' | 'combos' | 'promotions' | 'promotion-system' | 'services' | 'members' | 'revenue' | 'blog' | 'special-prices' | 'cuisine-media' | 'amenities' | 'settings' | 'trash';

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

interface NavSection {
  title: string;
  items: { id: Tab; icon: any; label: string; badge?: number }[];
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser, isAdmin, loading: authLoading, signOut: authSignOut } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trashItems, setTrashItems] = useState<TrashItem[]>(getTrash());

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!authUser || !isAdmin) navigate('/admin/login');
  }, [authLoading, authUser, isAdmin, navigate]);

  useEffect(() => {
    if (authLoading || !authUser || !isAdmin) return;
    fetchData();
  }, [authLoading, authUser, isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    const trashBookingIds = trashItems.filter(t => t.type === 'booking').map(t => t.data.id);
    const [{ data: b }, { data: r }] = await Promise.all([
      supabase.from('bookings').select('*, rooms(name_vi)').order('created_at', { ascending: false }),
      supabase.from('rooms').select('*').eq('is_active', true).order('price_vnd'),
    ]);
    // Filter out bookings that are in trash
    const filteredBookings = (b || []).filter(booking => !trashBookingIds.includes(booking.id));
    setBookings(filteredBookings);
    setRooms(r || []);
    setLoading(false);
  };

  const handleSignOut = async () => { await authSignOut(); navigate('/admin/login'); };

  const moveBookingToTrash = async (booking: any) => {
    if (!confirm('Chuyển đơn đặt phòng này vào thùng rác?')) return;
    const newTrash = [...trashItems, { type: 'booking' as const, data: booking, deletedAt: new Date().toISOString() }];
    saveTrash(newTrash);
    setTrashItems(newTrash);
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id);
    setBookings(prev => prev.filter(b => b.id !== booking.id));
    toast({ title: 'Đã chuyển vào thùng rác' });
  };

  const handleBackup = async () => {
    const [{ data: b }, { data: r }, { data: g }, { data: mp }, { data: da }, { data: s }, { data: ss }] = await Promise.all([
      supabase.from('bookings').select('*'), supabase.from('rooms').select('*'),
      supabase.from('gallery_images').select('*'), supabase.from('room_monthly_prices').select('*'),
      supabase.from('room_daily_availability').select('*'), supabase.from('services').select('*'),
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
    toast({ title: 'Đã xuất backup ✓' });
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.exportedAt) throw new Error('File không hợp lệ');
        if (!confirm(`Khôi phục từ backup ${data.exportedAt}?`)) return;
        if (data.site_settings?.length) {
          for (const s of data.site_settings) {
            await supabase.from('site_settings').upsert(s as any, { onConflict: 'key' } as any);
          }
        }
        toast({ title: 'Đã khôi phục ✓' });
        fetchData();
      } catch (err: any) {
        toast({ title: 'Lỗi khôi phục', description: err.message, variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Stats
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed' || b.status === 'checked_in').length;
  const monthRevenue = bookings
    .filter(b => b.status !== 'cancelled' && new Date(b.created_at).getMonth() === new Date().getMonth())
    .reduce((sum, b) => sum + (b.total_price_vnd || 0), 0);

  // Sidebar navigation with sections
  const navSections: NavSection[] = [
    {
      title: 'Tổng quan',
      items: [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'revenue', icon: BarChart3, label: 'Doanh thu' },
      ],
    },
    {
      title: 'Đặt phòng',
      items: [
        { id: 'bookings', icon: CalendarRange, label: 'Đơn đặt phòng', badge: pendingCount },
        { id: 'rooms', icon: BedDouble, label: 'Quản lý phòng' },
        { id: 'amenities', icon: Sparkles, label: 'Tiện nghi phòng' },
        { id: 'special-prices', icon: Flame, label: 'Giá đặc biệt' },
      ],
    },
    {
      title: 'Ẩm thực',
      items: [
        { id: 'cuisine-media', icon: Film, label: 'Trang Ẩm thực' },
        { id: 'dining', icon: UtensilsCrossed, label: 'Nhà hàng' },
        { id: 'food-menu', icon: ShoppingCart, label: 'Menu đồ ăn' },
        { id: 'combos', icon: Gift, label: 'Combo ăn uống' },
      ],
    },
    {
      title: 'Khác',
      items: [
        { id: 'promotions', icon: Gift, label: 'Ưu đãi' },
        { id: 'promotion-system', icon: Zap, label: 'Khuyến mại' },
        { id: 'services', icon: Sparkles, label: 'Dịch vụ' },
        { id: 'members', icon: Users, label: 'Khách & Thành viên' },
        { id: 'gallery', icon: ImageIcon, label: 'Thư viện ảnh' },
        { id: 'blog', icon: BookOpen, label: 'Blog' },
      ],
    },
    {
      title: 'Hệ thống',
      items: [
        { id: 'settings', icon: Settings, label: 'Cài đặt website' },
        { id: 'trash', icon: Archive, label: 'Thùng rác', badge: trashItems.length || undefined },
      ],
    },
  ];

  const allNavItems = navSections.flatMap(s => s.items);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary flex relative">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 bg-card border-r border-border flex flex-col transform transition-all duration-300
        ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-16 w-64'}`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className={`overflow-hidden transition-all ${sidebarOpen ? 'w-auto' : 'lg:w-0 lg:hidden'}`}>
            <p className="font-display text-sm font-bold text-foreground whitespace-nowrap">Tuấn Đạt Admin</p>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded hover:bg-secondary shrink-0">
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto">
          {navSections.map((section, si) => (
            <div key={si} className="mb-2">
              <p className={`text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-3 py-1 ${sidebarOpen ? '' : 'lg:hidden'}`}>
                {section.title}
              </p>
              {section.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setTab(item.id); if (window.innerWidth < 1024) setSidebarOpen(false); }}
                  title={item.label}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm
                    ${tab === item.id ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className={`whitespace-nowrap overflow-hidden transition-all flex-1 text-left ${sidebarOpen ? 'opacity-100' : 'lg:opacity-0 lg:w-0 lg:hidden'}`}>
                    {item.label}
                  </span>
                  {item.badge && item.badge > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-destructive text-white shrink-0 ${sidebarOpen ? '' : 'lg:hidden'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-2 border-t border-border space-y-1">
          <a href="/" target="_blank" title="Xem website" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary text-sm">
            <Eye className="h-4 w-4 shrink-0" />
            <span className={`whitespace-nowrap ${sidebarOpen ? '' : 'lg:hidden'}`}>Xem website</span>
          </a>
          <button onClick={handleSignOut} title="Đăng xuất" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 text-sm">
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={`whitespace-nowrap ${sidebarOpen ? '' : 'lg:hidden'}`}>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto min-w-0">
        <div className="p-3 sm:p-6">
          <div className="flex items-center justify-between mb-6 gap-2">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-card border border-border shrink-0">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-display text-lg sm:text-2xl font-bold text-foreground truncate flex-1">
              {allNavItems.find(n => n.id === tab)?.label}
            </h1>
            <Button variant="outline" size="sm" onClick={fetchData} className="shrink-0">
              <RefreshCw className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Làm mới</span>
            </Button>
          </div>

          {/* DASHBOARD */}
          {tab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Tổng đặt phòng', value: bookings.length, icon: CalendarRange, color: 'text-blue-600' },
                  { label: 'Chờ xác nhận', value: pendingCount, icon: Clock, color: 'text-yellow-600' },
                  { label: 'Đang hoạt động', value: confirmedCount, icon: CheckCircle, color: 'text-green-600' },
                  { label: 'Doanh thu tháng', value: monthRevenue.toLocaleString('vi') + '₫', icon: TrendingUp, color: 'text-primary' },
                ].map((stat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <p className={`text-lg sm:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Đơn đặt phòng', tab: 'bookings' as Tab, icon: CalendarRange, count: pendingCount, desc: 'đơn chờ' },
                  { label: 'Quản lý phòng', tab: 'rooms' as Tab, icon: BedDouble, count: rooms.filter(r => r.is_active).length, desc: 'phòng' },
                  { label: 'Doanh thu', tab: 'revenue' as Tab, icon: BarChart3, count: null, desc: 'Xem chi tiết' },
                  { label: 'Cài đặt', tab: 'settings' as Tab, icon: Settings, count: null, desc: 'Website' },
                ].map((action, i) => (
                  <button key={i} onClick={() => setTab(action.tab)}
                    className="bg-card rounded-xl border border-border p-4 text-left hover:border-primary/50 transition-all group">
                    <action.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary mb-2" />
                    <p className="text-sm font-semibold">{action.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {action.count !== null ? `${action.count} ${action.desc}` : action.desc}
                    </p>
                  </button>
                ))}
              </div>

              {/* Recent bookings */}
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-semibold">Đặt phòng gần đây</h2>
                  <Button variant="ghost" size="sm" onClick={() => setTab('bookings')}>Xem tất cả →</Button>
                </div>
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
                  {bookings.length === 0 && <p className="text-center text-muted-foreground py-4 text-sm">Chưa có đặt phòng</p>}
                </div>
              </div>
            </div>
          )}

          {tab === 'bookings' && (
            <AdminBookings bookings={bookings} setBookings={setBookings} onMoveToTrash={moveBookingToTrash} onRefresh={fetchData} />
          )}
          {tab === 'rooms' && <AdminRooms rooms={rooms} onRefresh={fetchData} />}
          {tab === 'gallery' && <AdminGallery />}
          {tab === 'dining' && <AdminDining />}
          {tab === 'promotions' && <AdminPromotions />}
          {tab === 'promotion-system' && <AdminPromotionSystem />}
          {tab === 'services' && <AdminServices />}
          {tab === 'food-menu' && <AdminFoodMenu />}
          {tab === 'members' && <AdminMembers />}
          {tab === 'revenue' && <AdminRevenue bookings={bookings} rooms={rooms} />}
          {tab === 'blog' && <AdminBlog />}
          {tab === 'combos' && <AdminCombo />}
          {tab === 'special-prices' && <AdminSpecialPrices />}
          {tab === 'cuisine-media' && <AdminCuisineMedia />}
          {tab === 'settings' && <AdminSettings onBackup={handleBackup} onRestore={handleRestore} />}
          {tab === 'trash' && <AdminTrash trashItems={trashItems} setTrashItems={setTrashItems} onRefresh={fetchData} />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
