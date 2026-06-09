import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, CalendarDays, Utensils, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import * as XLSX from 'xlsx';

interface Props {
  bookings: any[];
  rooms: any[];
  manualInvoices?: any[];
}

const fmtVND = (n: number) => (n || 0).toLocaleString('vi-VN') + '₫';
const fmtNum = (n: number) => (n || 0).toLocaleString('vi-VN');

// Phân bổ doanh thu phòng theo từng đêm trong khoảng check_in..check_out
const enumerateNights = (ci: string, co: string): string[] => {
  if (!ci || !co) return [];
  const out: string[] = [];
  const d = new Date(ci + 'T00:00:00');
  const end = new Date(co + 'T00:00:00');
  while (d < end) {
    out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
};

const AdminRevenue = ({ bookings, rooms, manualInvoices = [] }: Props) => {
  const [foodOrders, setFoodOrders] = useState<any[]>([]);
  const [serviceBookings, setServiceBookings] = useState<any[]>([]);

  // Bảng chi tiết theo tháng
  const today = new Date();
  const [gridMonth, setGridMonth] = useState(today.getMonth() + 1);
  const [gridYear, setGridYear] = useState(today.getFullYear());

  useEffect(() => {
    Promise.all([
      supabase.from('food_orders').select('total_amount, payment_status, created_at').order('created_at', { ascending: false }),
      supabase.from('service_bookings').select('total_price_vnd, status, created_at').order('created_at', { ascending: false }),
    ]).then(([{ data: fo }, { data: sb }]) => {
      setFoodOrders(fo || []);
      setServiceBookings(sb || []);
    });
  }, []);

  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();

  const validBookings = bookings.filter(b => b.status !== 'cancelled');
  const validManual = manualInvoices;

  // === A. 4 cards (gộp cả 2 nguồn) ===
  const onlineRoomRevenue = validBookings.reduce((s, b) => s + (b.total_price_vnd || 0), 0);
  const manualRoomRevenue = validManual.reduce((s, m) => s + (m.total_amount || 0), 0);
  const totalRoomRevenue = onlineRoomRevenue + manualRoomRevenue;

  const monthRoomOnline = validBookings
    .filter(b => { const d = new Date(b.created_at); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; })
    .reduce((s, b) => s + (b.total_price_vnd || 0), 0);
  const monthRoomManual = validManual
    .filter(m => { const d = new Date(m.created_at); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; })
    .reduce((s, m) => s + (m.total_amount || 0), 0);

  const foodRevenue = foodOrders.filter(f => f.payment_status === 'PAID').reduce((s, f) => s + (f.total_amount || 0), 0);
  const foodMonth = foodOrders
    .filter(f => f.payment_status === 'PAID' && new Date(f.created_at).getMonth() === thisMonth && new Date(f.created_at).getFullYear() === thisYear)
    .reduce((s, f) => s + (f.total_amount || 0), 0);
  const serviceRevenue = serviceBookings.filter(s => s.status === 'completed').reduce((s, b) => s + (b.total_price_vnd || 0), 0);

  const totalAll = totalRoomRevenue + foodRevenue + serviceRevenue;
  const monthAll = monthRoomOnline + monthRoomManual + foodMonth;

  // === B. Biểu đồ 6 tháng — tách 3 màu ===
  const monthlyBreakdown = useMemo(() => {
    const months: { label: string; online: number; manual: number; extras: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(today, i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const label = format(d, 'MM/yyyy');
      const online = validBookings
        .filter(b => { const c = new Date(b.created_at); return c >= start && c <= end; })
        .reduce((s, b) => s + (b.total_price_vnd || 0), 0);
      const manual = validManual
        .filter(m => { const c = new Date(m.created_at); return c >= start && c <= end; })
        .reduce((s, m) => s + (m.total_amount || 0), 0);
      const food = foodOrders
        .filter(f => f.payment_status === 'PAID')
        .filter(f => { const c = new Date(f.created_at); return c >= start && c <= end; })
        .reduce((s, f) => s + (f.total_amount || 0), 0);
      const service = serviceBookings
        .filter(s => s.status === 'completed')
        .filter(s => { const c = new Date(s.created_at); return c >= start && c <= end; })
        .reduce((s2, s) => s2 + (s.total_price_vnd || 0), 0);
      months.push({ label, online, manual, extras: food + service });
    }
    return months;
  }, [validBookings, validManual, foodOrders, serviceBookings]);

  const maxMonthly = Math.max(...monthlyBreakdown.map(m => m.online + m.manual + m.extras), 1);

  // === C. Doanh thu theo phòng (loại phòng) ===
  const roomStats = rooms.map(room => {
    const onlineList = validBookings.filter(b => b.room_id === room.id);
    const manualList = validManual.filter(m => m.room_id === room.id);
    const online = onlineList.reduce((s, b) => s + (b.total_price_vnd || 0), 0);
    const manual = manualList.reduce((s, m) => s + (m.total_amount || 0), 0);
    return { room, onlineCount: onlineList.length, manualCount: manualList.length, online, manual, total: online + manual };
  });

  // === D. Bảng chi tiết theo tháng (loại phòng x ngày) ===
  const daysInMonth = new Date(gridYear, gridMonth, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthIso = (d: number) => `${gridYear}-${String(gridMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  // grid[date][roomId] = { online, manual, total }
  const grid = useMemo(() => {
    const g: Record<string, Record<string, { online: number; manual: number; total: number }>> = {};
    monthDays.forEach(d => {
      g[monthIso(d)] = {};
      rooms.forEach(r => { g[monthIso(d)][r.id] = { online: 0, manual: 0, total: 0 }; });
    });
    // online bookings — phân bổ đều theo từng đêm
    validBookings.forEach(b => {
      const nights = enumerateNights(b.check_in, b.check_out);
      if (!nights.length) return;
      const perNight = (b.total_price_vnd || 0) / nights.length;
      nights.forEach(n => {
        if (g[n] && g[n][b.room_id]) {
          g[n][b.room_id].online += perNight;
          g[n][b.room_id].total += perNight;
        }
      });
    });
    // manual invoices
    validManual.forEach(m => {
      const nights = enumerateNights(m.check_in, m.check_out);
      if (!nights.length || !m.room_id) return;
      const perNight = (m.total_amount || 0) / nights.length;
      nights.forEach(n => {
        if (g[n] && g[n][m.room_id]) {
          g[n][m.room_id].manual += perNight;
          g[n][m.room_id].total += perNight;
        }
      });
    });
    return g;
  }, [gridMonth, gridYear, validBookings, validManual, rooms]);

  const rowTotal = (d: number) => rooms.reduce((s, r) => s + (grid[monthIso(d)]?.[r.id]?.total || 0), 0);
  const colTotal = (roomId: string) => monthDays.reduce((s, d) => s + (grid[monthIso(d)]?.[roomId]?.total || 0), 0);
  const gridGrand = monthDays.reduce((s, d) => s + rowTotal(d), 0);

  const WEEKDAY_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const prevGridMonth = () => {
    if (gridMonth === 1) { setGridMonth(12); setGridYear(gridYear - 1); } else setGridMonth(gridMonth - 1);
  };
  const nextGridMonth = () => {
    if (gridMonth === 12) { setGridMonth(1); setGridYear(gridYear + 1); } else setGridMonth(gridMonth + 1);
  };

  // === Xuất Excel (3 sheets) ===
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Bảng theo phòng theo ngày
    const h1 = ['Thứ', 'Ngày', ...rooms.map(r => r.name_vi), 'Tổng ngày'];
    const a1: any[][] = [h1];
    monthDays.forEach(d => {
      const dow = new Date(gridYear, gridMonth - 1, d).getDay();
      const row: any[] = [WEEKDAY_VI[dow], d];
      rooms.forEach(r => row.push(grid[monthIso(d)]?.[r.id]?.total || 0));
      row.push(rowTotal(d));
      a1.push(row);
    });
    const totalRow1: any[] = ['TỔNG', ''];
    rooms.forEach(r => totalRow1.push(colTotal(r.id)));
    totalRow1.push(gridGrand);
    a1.push(totalRow1);
    const ws1 = XLSX.utils.aoa_to_sheet(a1);
    ws1['!cols'] = [{ wch: 6 }, { wch: 6 }, ...rooms.map(() => ({ wch: 20 })), { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Theo ngày');

    // Sheet 2: Tổng hợp theo loại phòng
    const a2: any[][] = [['Loại phòng', 'Đơn online', 'DT online', 'Đơn thủ công', 'DT thủ công', 'Tổng đơn', 'Tổng doanh thu']];
    roomStats.forEach(s => {
      a2.push([s.room.name_vi, s.onlineCount, s.online, s.manualCount, s.manual, s.onlineCount + s.manualCount, s.total]);
    });
    const ws2 = XLSX.utils.aoa_to_sheet(a2);
    ws2['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Theo loại phòng');

    // Sheet 3: Danh sách đơn chi tiết
    const a3: any[][] = [['Nguồn', 'Mã', 'Khách', 'SĐT', 'Loại phòng', 'SL phòng', 'Nhận', 'Trả', 'Tổng tiền', 'Trạng thái', 'Ngày tạo']];
    validBookings.forEach(b => {
      a3.push(['🌐 Online', b.booking_code, b.guest_name, b.guest_phone, b.rooms?.name_vi || b.room_id, b.room_quantity, b.check_in, b.check_out, b.total_price_vnd, b.status, b.created_at?.slice(0, 10)]);
    });
    validManual.forEach(m => {
      a3.push(['✍️ Thủ công', m.invoice_code, m.guest_name, m.guest_phone, m.room_name || m.room_id, m.room_quantity, m.check_in, m.check_out, m.total_amount, m.payment_status, m.created_at?.slice(0, 10)]);
    });
    const ws3 = XLSX.utils.aoa_to_sheet(a3);
    ws3['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 24 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Danh sách đơn');

    XLSX.writeFile(wb, `DoanhThu_Thang${gridMonth}_Nam${gridYear}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* A. 4 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Tổng doanh thu', value: totalAll, icon: DollarSign, color: 'text-primary', sub: `🌐 ${fmtVND(onlineRoomRevenue)} · ✍️ ${fmtVND(manualRoomRevenue)}` },
          { label: 'Doanh thu tháng', value: monthAll, icon: TrendingUp, color: 'text-green-600', sub: `🌐 ${fmtVND(monthRoomOnline)} · ✍️ ${fmtVND(monthRoomManual)}` },
          { label: 'Đặt phòng', value: totalRoomRevenue, icon: CalendarDays, color: 'text-blue-600', sub: `${validBookings.length} online · ${validManual.length} thủ công` },
          { label: 'Đồ ăn & Dịch vụ', value: foodRevenue + serviceRevenue, icon: Utensils, color: 'text-amber-600', sub: `${foodOrders.length} đơn ăn · ${serviceBookings.length} DV` },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className={`text-lg sm:text-xl font-bold ${s.color}`}>{fmtVND(s.value)}</p>
            <p className="text-[10px] text-muted-foreground mt-1 truncate" title={s.sub}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* B. Biểu đồ 6 tháng — 3 màu */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-display text-lg font-semibold mb-4">📊 Biểu đồ doanh thu 6 tháng</h3>
        <div className="space-y-3">
          {monthlyBreakdown.map((m, i) => {
            const total = m.online + m.manual + m.extras;
            const pct = (total / maxMonthly) * 100;
            const oPct = total > 0 ? (m.online / total) * pct : 0;
            const mPct = total > 0 ? (m.manual / total) * pct : 0;
            const ePct = total > 0 ? (m.extras / total) * pct : 0;
            return (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{m.label}</span>
                  <span className="text-primary font-semibold">{fmtVND(total)}</span>
                </div>
                <div className="h-4 bg-secondary rounded-full overflow-hidden flex">
                  {oPct > 0 && <div className="h-full bg-blue-500" style={{ width: `${oPct}%` }} title={`Online: ${fmtVND(m.online)}`} />}
                  {mPct > 0 && <div className="h-full bg-orange-500" style={{ width: `${mPct}%` }} title={`Thủ công: ${fmtVND(m.manual)}`} />}
                  {ePct > 0 && <div className="h-full bg-green-500" style={{ width: `${ePct}%` }} title={`Đồ ăn & DV: ${fmtVND(m.extras)}`} />}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500" /> 🌐 Đặt phòng online</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500" /> ✍️ Đặt phòng thủ công</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500" /> 🍽 Đồ ăn & Dịch vụ</span>
        </div>
      </div>

      {/* C. Bảng doanh thu theo loại phòng */}
      <div className="bg-card rounded-xl border border-border p-5 overflow-x-auto">
        <h3 className="font-display text-lg font-semibold mb-4">Doanh thu theo loại phòng</h3>
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left py-2">Loại phòng</th>
              <th className="text-right py-2">🌐 Đơn</th>
              <th className="text-right py-2">🌐 Doanh thu</th>
              <th className="text-right py-2">✍️ Đơn</th>
              <th className="text-right py-2">✍️ Doanh thu</th>
              <th className="text-right py-2 font-semibold">Tổng cộng</th>
            </tr>
          </thead>
          <tbody>
            {roomStats.map(s => (
              <tr key={s.room.id} className="border-b border-border/50 hover:bg-secondary/40">
                <td className="py-2 font-medium">{s.room.name_vi}</td>
                <td className="py-2 text-right">{s.onlineCount}</td>
                <td className="py-2 text-right text-blue-600">{fmtVND(s.online)}</td>
                <td className="py-2 text-right">{s.manualCount}</td>
                <td className="py-2 text-right text-orange-600">{fmtVND(s.manual)}</td>
                <td className="py-2 text-right font-semibold text-primary">{fmtVND(s.total)}</td>
              </tr>
            ))}
            <tr className="bg-secondary font-bold">
              <td className="py-2">TỔNG</td>
              <td className="py-2 text-right">{roomStats.reduce((s, r) => s + r.onlineCount, 0)}</td>
              <td className="py-2 text-right text-blue-600">{fmtVND(roomStats.reduce((s, r) => s + r.online, 0))}</td>
              <td className="py-2 text-right">{roomStats.reduce((s, r) => s + r.manualCount, 0)}</td>
              <td className="py-2 text-right text-orange-600">{fmtVND(roomStats.reduce((s, r) => s + r.manual, 0))}</td>
              <td className="py-2 text-right text-primary">{fmtVND(roomStats.reduce((s, r) => s + r.total, 0))}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* D. Bảng Excel theo tháng */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-display text-lg font-semibold">📊 Bảng doanh thu chi tiết</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={prevGridMonth}><ChevronLeft className="h-4 w-4" /></Button>
            <select value={gridMonth} onChange={e => setGridMonth(parseInt(e.target.value))} className="px-2 py-1 rounded border border-border bg-background text-sm">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>Tháng {m}</option>)}
            </select>
            <select value={gridYear} onChange={e => setGridYear(parseInt(e.target.value))} className="px-2 py-1 rounded border border-border bg-background text-sm">
              {Array.from({ length: 5 }, (_, i) => today.getFullYear() - 1 + i).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <Button variant="outline" size="sm" onClick={nextGridMonth}><ChevronRight className="h-4 w-4" /></Button>
            <Button size="sm" onClick={exportExcel}><Download className="h-4 w-4 mr-1" /> Xuất Excel</Button>
          </div>
        </div>

        <div className="overflow-auto border border-border rounded-lg max-h-[70vh]">
          <table className="text-xs border-collapse w-full">
            <thead className="sticky top-0 z-10 bg-[#4472C4] text-white">
              <tr>
                <th className="border border-white/30 px-2 py-1.5 min-w-[44px]">Thứ</th>
                <th className="border border-white/30 px-2 py-1.5 min-w-[44px]">Ngày</th>
                {rooms.map(r => (
                  <th key={r.id} className="border border-white/30 px-2 py-1.5 min-w-[140px] font-semibold">{r.name_vi}</th>
                ))}
                <th className="border border-white/30 px-2 py-1.5 min-w-[110px] bg-[#C00000]">Tổng ngày</th>
              </tr>
            </thead>
            <tbody>
              {monthDays.map(d => {
                const dow = new Date(gridYear, gridMonth - 1, d).getDay();
                const isWeekend = dow === 0 || dow === 5 || dow === 6;
                const rowBg = isWeekend ? 'bg-yellow-50' : 'bg-white';
                return (
                  <tr key={d} className={rowBg}>
                    <td className={`${rowBg} border border-border px-2 py-1 text-center font-medium`}>{WEEKDAY_VI[dow]}</td>
                    <td className={`${rowBg} border border-border px-2 py-1 text-center font-medium`}>{d}</td>
                    {rooms.map(r => {
                      const cell = grid[monthIso(d)]?.[r.id];
                      const amount = Math.round(cell?.total || 0);
                      const hasOnline = (cell?.online || 0) > 0;
                      const hasManual = (cell?.manual || 0) > 0;
                      const bg = amount > 0 ? 'bg-[#DCE6F1]' : '';
                      return (
                        <td key={r.id} className={`border border-border px-2 py-1 text-right ${bg}`}
                            title={`🌐 ${fmtVND(cell?.online || 0)} · ✍️ ${fmtVND(cell?.manual || 0)}`}>
                          {amount > 0 ? (
                            <span>
                              {fmtNum(amount)}
                              {hasOnline && hasManual && <span className="ml-1 text-[9px] text-muted-foreground">🌐✍️</span>}
                              {hasOnline && !hasManual && <span className="ml-1 text-[9px] text-blue-600">🌐</span>}
                              {!hasOnline && hasManual && <span className="ml-1 text-[9px] text-orange-600">✍️</span>}
                            </span>
                          ) : ''}
                        </td>
                      );
                    })}
                    <td className="border border-border px-2 py-1 text-right font-semibold bg-[#FCE4D6]">
                      {fmtNum(Math.round(rowTotal(d)))}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-700 text-white font-bold">
                <td colSpan={2} className="border border-gray-600 px-2 py-1.5 text-center">TỔNG DOANH THU</td>
                {rooms.map(r => (
                  <td key={r.id} className="border border-gray-600 px-2 py-1.5 text-right">{fmtNum(Math.round(colTotal(r.id)))}</td>
                ))}
                <td className="border border-gray-600 px-2 py-1.5 text-right bg-[#C00000]">{fmtNum(Math.round(gridGrand))}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          💡 Doanh thu mỗi đêm = tổng đơn ÷ số đêm. Hover ô để xem chi tiết online vs thủ công. 🌐 = chỉ online · ✍️ = chỉ thủ công · 🌐✍️ = cả hai.
        </p>
      </div>
    </div>
  );
};

export default AdminRevenue;
