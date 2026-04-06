import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Tag, Users, DollarSign, BarChart3, Trophy, Percent } from 'lucide-react';

interface BookingStats {
  discount_code: string | null;
  discount_code_amount: number;
  promotion_name: string | null;
  promotion_discount_amount: number;
  member_discount_amount: number;
  total_price_vnd: number;
  original_price_vnd: number;
  created_at: string;
  room_id: string;
}

interface FoodStats {
  discount_code: string | null;
  discount_amount: number;
  total_amount: number;
  original_amount: number;
  created_at: string;
}

interface CodeInfo {
  code: string;
  title_vi: string;
  discount_type: string;
  discount_value: number;
  applies_to: string;
  used_count: number;
  max_uses: number;
  is_active: boolean;
}

interface FlashSaleInfo {
  id: string;
  title_vi: string;
  is_active: boolean;
  items: { item_name_vi: string; quantity_sold: number; quantity_limit: number; original_price: number; sale_price: number }[];
}

const AdminPromotionStats = () => {
  const [bookings, setBookings] = useState<BookingStats[]>([]);
  const [foodOrders, setFoodOrders] = useState<FoodStats[]>([]);
  const [codes, setCodes] = useState<CodeInfo[]>([]);
  const [flashSales, setFlashSales] = useState<FlashSaleInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    const [{ data: b }, { data: f }, { data: c }, { data: fs }] = await Promise.all([
      supabase.from('bookings').select('discount_code, discount_code_amount, promotion_name, promotion_discount_amount, member_discount_amount, total_price_vnd, original_price_vnd, created_at, room_id'),
      supabase.from('food_orders').select('discount_code, discount_amount, total_amount, original_amount, created_at'),
      supabase.from('discount_codes' as any).select('code, title_vi, discount_type, discount_value, applies_to, used_count, max_uses, is_active'),
      supabase.from('flash_sales' as any).select('id, title_vi, is_active'),
    ]);
    
    setBookings((b as any[]) || []);
    setFoodOrders((f as any[]) || []);
    setCodes((c as any as CodeInfo[]) || []);
    
    // Fetch flash sale items
    const sales = (fs as any[]) || [];
    if (sales.length > 0) {
      const { data: items } = await supabase.from('flash_sale_items' as any).select('flash_sale_id, item_name_vi, quantity_sold, quantity_limit, original_price, sale_price');
      const salesWithItems = sales.map(s => ({
        ...s,
        items: ((items as any[]) || []).filter((i: any) => i.flash_sale_id === s.id),
      }));
      setFlashSales(salesWithItems);
    } else {
      setFlashSales([]);
    }
    
    setLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);

  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const bookingsWithCode = bookings.filter(b => b.discount_code).length;
    const bookingsWithPromo = bookings.filter(b => b.promotion_name).length;
    
    const totalCodeDiscount = bookings.reduce((s, b) => s + (b.discount_code_amount || 0), 0);
    const totalPromoDiscount = bookings.reduce((s, b) => s + (b.promotion_discount_amount || 0), 0);
    const totalMemberDiscount = bookings.reduce((s, b) => s + (b.member_discount_amount || 0), 0);
    const totalFoodDiscount = foodOrders.reduce((s, f) => s + (f.discount_amount || 0), 0);
    
    const totalRevenue = bookings.reduce((s, b) => s + (b.total_price_vnd || 0), 0);
    const totalOriginal = bookings.reduce((s, b) => s + (b.original_price_vnd || 0), 0);
    const totalSavings = totalCodeDiscount + totalPromoDiscount + totalMemberDiscount + totalFoodDiscount;

    // Code usage ranking
    const codeUsage: Record<string, { count: number; totalDiscount: number }> = {};
    bookings.forEach(b => {
      if (b.discount_code) {
        if (!codeUsage[b.discount_code]) codeUsage[b.discount_code] = { count: 0, totalDiscount: 0 };
        codeUsage[b.discount_code].count++;
        codeUsage[b.discount_code].totalDiscount += b.discount_code_amount || 0;
      }
    });
    foodOrders.forEach(f => {
      if (f.discount_code) {
        if (!codeUsage[f.discount_code]) codeUsage[f.discount_code] = { count: 0, totalDiscount: 0 };
        codeUsage[f.discount_code].count++;
        codeUsage[f.discount_code].totalDiscount += f.discount_amount || 0;
      }
    });

    // Promo name ranking
    const promoUsage: Record<string, { count: number; totalDiscount: number }> = {};
    bookings.forEach(b => {
      if (b.promotion_name) {
        if (!promoUsage[b.promotion_name]) promoUsage[b.promotion_name] = { count: 0, totalDiscount: 0 };
        promoUsage[b.promotion_name].count++;
        promoUsage[b.promotion_name].totalDiscount += b.promotion_discount_amount || 0;
      }
    });

    // Flash sale stats
    const flashSaleStats = flashSales.map(fs => ({
      title: fs.title_vi,
      is_active: fs.is_active,
      totalSold: fs.items.reduce((s, i) => s + (i.quantity_sold || 0), 0),
      totalLimit: fs.items.reduce((s, i) => s + (i.quantity_limit || 0), 0),
      totalSaved: fs.items.reduce((s, i) => s + ((i.original_price - i.sale_price) * (i.quantity_sold || 0)), 0),
      items: fs.items,
    }));

    return {
      totalBookings, bookingsWithCode, bookingsWithPromo,
      totalCodeDiscount, totalPromoDiscount, totalMemberDiscount, totalFoodDiscount,
      totalRevenue, totalOriginal, totalSavings,
      codeRanking: Object.entries(codeUsage).sort((a, b) => b[1].count - a[1].count),
      promoRanking: Object.entries(promoUsage).sort((a, b) => b[1].count - a[1].count),
      flashSaleStats,
    };
  }, [bookings, foodOrders, flashSales]);

  const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫';

  if (loading) return <div className="text-center py-8 text-muted-foreground">Đang tải thống kê...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> Thống kê hiệu quả khuyến mại
        </h3>
        <Button variant="outline" size="sm" onClick={fetchStats}>
          <RefreshCw className="h-4 w-4 mr-1" /> Làm mới
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Tổng đặt phòng" value={stats.totalBookings.toString()} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={<Tag className="h-5 w-5" />} label="Dùng mã giảm giá" value={stats.bookingsWithCode.toString()} sub={`${stats.totalBookings ? Math.round(stats.bookingsWithCode / stats.totalBookings * 100) : 0}%`} color="text-green-600" bg="bg-green-50" />
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="Tổng doanh thu" value={fmt(stats.totalRevenue)} color="text-amber-600" bg="bg-amber-50" />
        <StatCard icon={<Percent className="h-5 w-5" />} label="Tổng tiết kiệm cho KH" value={fmt(stats.totalSavings)} color="text-red-600" bg="bg-red-50" />
      </div>

      {/* Discount Breakdown */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h4 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Phân tích giảm giá theo loại</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <BreakdownItem label="Mã giảm giá (Phòng)" value={fmt(stats.totalCodeDiscount)} count={stats.bookingsWithCode} />
          <BreakdownItem label="Khuyến mại chung" value={fmt(stats.totalPromoDiscount)} count={stats.bookingsWithPromo} />
          <BreakdownItem label="Ưu đãi thành viên" value={fmt(stats.totalMemberDiscount)} count={bookings.filter(b => b.member_discount_amount > 0).length} />
          <BreakdownItem label="Mã giảm giá (Đồ ăn)" value={fmt(stats.totalFoodDiscount)} count={foodOrders.filter(f => f.discount_amount && f.discount_amount > 0).length} />
        </div>
      </div>

      {/* Top Discount Codes */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h4 className="font-semibold mb-3 flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500" /> Bảng xếp hạng mã giảm giá</h4>
        {codes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có mã giảm giá nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Mã</th>
                  <th className="py-2 pr-3">Tên</th>
                  <th className="py-2 pr-3">Loại</th>
                  <th className="py-2 pr-3">Giá trị</th>
                  <th className="py-2 pr-3">Áp dụng</th>
                  <th className="py-2 pr-3">Đã dùng / Giới hạn</th>
                  <th className="py-2 pr-3">Tổng giảm (thực tế)</th>
                  <th className="py-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c, i) => {
                  const usage = stats.codeRanking.find(([code]) => code === c.code);
                  return (
                    <tr key={c.code} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{i + 1}</td>
                      <td className="py-2 pr-3 font-mono text-xs bg-muted/50 px-1.5 rounded">{c.code}</td>
                      <td className="py-2 pr-3">{c.title_vi}</td>
                      <td className="py-2 pr-3">{c.discount_type === 'percent' ? '%' : '₫'}</td>
                      <td className="py-2 pr-3 font-medium">{c.discount_type === 'percent' ? `${c.discount_value}%` : fmt(c.discount_value)}</td>
                      <td className="py-2 pr-3">
                        <Badge variant="outline" className="text-xs">
                          {c.applies_to === 'all' ? 'Tất cả' : c.applies_to === 'room' ? 'Phòng' : 'Đồ ăn'}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3">
                        <span className="font-medium">{c.used_count}</span>
                        <span className="text-muted-foreground"> / {c.max_uses}</span>
                        <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                          <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${Math.min(100, (c.used_count / c.max_uses) * 100)}%` }} />
                        </div>
                      </td>
                      <td className="py-2 pr-3 font-medium text-red-600">{usage ? fmt(usage[1].totalDiscount) : '0₫'}</td>
                      <td className="py-2">
                        <Badge variant={c.is_active ? 'default' : 'secondary'} className="text-xs">
                          {c.is_active ? 'Hoạt động' : 'Tắt'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Promotion Usage */}
      {stats.promoRanking.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h4 className="font-semibold mb-3 flex items-center gap-2"><Trophy className="h-4 w-4 text-green-500" /> Khuyến mại hiệu quả nhất</h4>
          <div className="space-y-2">
            {stats.promoRanking.map(([name, data], i) => (
              <div key={name} className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-primary">{i + 1}</span>
                  <span className="font-medium">{name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span><strong>{data.count}</strong> lượt</span>
                  <span className="text-red-600 font-medium">-{fmt(data.totalDiscount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flash Sale Stats */}
      {stats.flashSaleStats.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h4 className="font-semibold mb-3 flex items-center gap-2"><Trophy className="h-4 w-4 text-orange-500" /> Thống kê Flash Sale</h4>
          <div className="space-y-4">
            {stats.flashSaleStats.map((fs, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{fs.title}</span>
                    <Badge variant={fs.is_active ? 'default' : 'secondary'} className="text-xs">
                      {fs.is_active ? 'Đang chạy' : 'Kết thúc'}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{fs.totalSold}/{fs.totalLimit} đã bán</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mb-3">
                  <div className="bg-orange-500 rounded-full h-2 transition-all" style={{ width: `${fs.totalLimit ? (fs.totalSold / fs.totalLimit * 100) : 0}%` }} />
                </div>
                {fs.items.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {fs.items.map((item, j) => (
                      <div key={j} className="flex items-center justify-between text-sm bg-muted/30 rounded px-3 py-1.5">
                        <span>{item.item_name_vi}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground line-through text-xs">{fmt(item.original_price)}</span>
                          <span className="font-medium text-red-600">{fmt(item.sale_price)}</span>
                          <Badge variant="outline" className="text-xs">{item.quantity_sold}/{item.quantity_limit}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {fs.totalSaved > 0 && (
                  <p className="text-sm text-red-600 mt-2 font-medium">Tổng KH tiết kiệm: {fmt(fs.totalSaved)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, color, bg }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string; bg: string }) => (
  <div className={`${bg} rounded-xl p-4 border border-border`}>
    <div className={`${color} mb-2`}>{icon}</div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-lg font-bold">{value}</p>
    {sub && <p className="text-xs text-muted-foreground">{sub} tổng đơn</p>}
  </div>
);

const BreakdownItem = ({ label, value, count }: { label: string; value: string; count: number }) => (
  <div className="bg-muted/30 rounded-lg p-3">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="font-bold text-red-600">{value}</p>
    <p className="text-xs text-muted-foreground">{count} lượt sử dụng</p>
  </div>
);

export default AdminPromotionStats;
