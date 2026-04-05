import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp, BarChart3, ShoppingCart, Utensils, CalendarDays } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Props {
  bookings: any[];
  rooms: any[];
}

const AdminRevenue = ({ bookings, rooms }: Props) => {
  const [foodOrders, setFoodOrders] = useState<any[]>([]);
  const [serviceBookings, setServiceBookings] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from('food_orders').select('total_amount, payment_status, created_at').order('created_at', { ascending: false }),
      supabase.from('service_bookings').select('total_price_vnd, status, created_at').order('created_at', { ascending: false }),
    ]).then(([{ data: fo }, { data: sb }]) => {
      setFoodOrders(fo || []);
      setServiceBookings(sb || []);
    });
  }, []);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const validBookings = bookings.filter(b => b.status !== 'cancelled');
  const totalRevenue = validBookings.reduce((sum, b) => sum + (b.total_price_vnd || 0), 0);
  const monthRevenue = validBookings
    .filter(b => new Date(b.created_at).getMonth() === thisMonth && new Date(b.created_at).getFullYear() === thisYear)
    .reduce((sum, b) => sum + (b.total_price_vnd || 0), 0);

  const foodRevenue = foodOrders
    .filter(f => f.payment_status === 'PAID')
    .reduce((sum, f) => sum + (f.total_amount || 0), 0);
  const foodRevenueMonth = foodOrders
    .filter(f => f.payment_status === 'PAID' && new Date(f.created_at).getMonth() === thisMonth)
    .reduce((sum, f) => sum + (f.total_amount || 0), 0);

  const serviceRevenue = serviceBookings
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + (s.total_price_vnd || 0), 0);

  const totalAll = totalRevenue + foodRevenue + serviceRevenue;
  const monthAll = monthRevenue + foodRevenueMonth;

  // Monthly breakdown (last 6 months)
  const monthlyBreakdown = useMemo(() => {
    const months: { label: string; room: number; food: number; service: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const label = format(d, 'MM/yyyy');

      const room = validBookings
        .filter(b => { const c = new Date(b.created_at); return c >= start && c <= end; })
        .reduce((s, b) => s + (b.total_price_vnd || 0), 0);

      const food = foodOrders
        .filter(f => f.payment_status === 'PAID')
        .filter(f => { const c = new Date(f.created_at); return c >= start && c <= end; })
        .reduce((s, f) => s + (f.total_amount || 0), 0);

      const service = serviceBookings
        .filter(s => s.status === 'completed')
        .filter(s => { const c = new Date(s.created_at); return c >= start && c <= end; })
        .reduce((s2, s) => s2 + (s.total_price_vnd || 0), 0);

      months.push({ label, room, food, service });
    }
    return months;
  }, [validBookings, foodOrders, serviceBookings]);

  const maxMonthly = Math.max(...monthlyBreakdown.map(m => m.room + m.food + m.service), 1);

  const fmtVND = (n: number) => n.toLocaleString('vi') + '₫';

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Tổng doanh thu', value: totalAll, icon: DollarSign, color: 'text-primary', sub: 'Tất cả nguồn' },
          { label: 'Doanh thu tháng', value: monthAll, icon: TrendingUp, color: 'text-green-600', sub: format(now, 'MM/yyyy') },
          { label: 'Đặt phòng', value: totalRevenue, icon: CalendarDays, color: 'text-blue-600', sub: `${validBookings.length} đơn` },
          { label: 'Đồ ăn & Dịch vụ', value: foodRevenue + serviceRevenue, icon: Utensils, color: 'text-amber-600', sub: `${foodOrders.length} đơn ăn` },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className={`text-lg sm:text-xl font-bold ${s.color}`}>{fmtVND(s.value)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Monthly chart */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-display text-lg font-semibold mb-4">📊 Biểu đồ doanh thu 6 tháng</h3>
        <div className="space-y-3">
          {monthlyBreakdown.map((m, i) => {
            const total = m.room + m.food + m.service;
            const pct = (total / maxMonthly) * 100;
            const roomPct = total > 0 ? (m.room / total) * pct : 0;
            const foodPct = total > 0 ? (m.food / total) * pct : 0;
            const servicePct = total > 0 ? (m.service / total) * pct : 0;
            return (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{m.label}</span>
                  <span className="text-primary font-semibold">{fmtVND(total)}</span>
                </div>
                <div className="h-4 bg-secondary rounded-full overflow-hidden flex">
                  {roomPct > 0 && <div className="h-full bg-blue-500 transition-all" style={{ width: `${roomPct}%` }} title={`Phòng: ${fmtVND(m.room)}`} />}
                  {foodPct > 0 && <div className="h-full bg-amber-500 transition-all" style={{ width: `${foodPct}%` }} title={`Đồ ăn: ${fmtVND(m.food)}`} />}
                  {servicePct > 0 && <div className="h-full bg-green-500 transition-all" style={{ width: `${servicePct}%` }} title={`Dịch vụ: ${fmtVND(m.service)}`} />}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500" /> Đặt phòng</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500" /> Đồ ăn</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500" /> Dịch vụ</span>
        </div>
      </div>

      {/* Revenue by room */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-display text-lg font-semibold mb-4">Doanh thu theo phòng</h3>
        {rooms.map(room => {
          const roomBookings = validBookings.filter(b => b.room_id === room.id);
          const roomRevenue = roomBookings.reduce((sum, b) => sum + (b.total_price_vnd || 0), 0);
          const pct = totalRevenue ? (roomRevenue / totalRevenue) * 100 : 0;
          return (
            <div key={room.id} className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{room.name_vi}</span>
                <span className="text-primary font-semibold">{fmtVND(roomRevenue)}</span>
              </div>
              <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-gold-gradient rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{roomBookings.length} đặt phòng · {pct.toFixed(1)}%</p>
            </div>
          );
        })}
      </div>

      {/* Payment status breakdown */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-display text-lg font-semibold mb-4">Trạng thái thanh toán</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Chưa thanh toán', status: 'PENDING', color: 'text-yellow-600 bg-yellow-50' },
            { label: 'Đặt cọc', status: 'PARTIAL', color: 'text-blue-600 bg-blue-50' },
            { label: 'Đã thanh toán', status: 'PAID', color: 'text-green-600 bg-green-50' },
          ].map(ps => {
            const count = bookings.filter(b => b.payment_status === ps.status).length;
            const amount = bookings.filter(b => b.payment_status === ps.status).reduce((s, b) => s + (b.total_price_vnd || 0), 0);
            return (
              <div key={ps.status} className={`rounded-xl p-4 ${ps.color}`}>
                <p className="text-xs font-medium">{ps.label}</p>
                <p className="text-xl font-bold">{count}</p>
                <p className="text-xs mt-1">{fmtVND(amount)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminRevenue;
