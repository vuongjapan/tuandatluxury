import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart3, Eye, UserPlus, BedDouble, ClipboardList, Loader2, RefreshCw,
  TrendingUp, TrendingDown, Smartphone, Monitor, Tablet, Lightbulb, Clock,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

type RangeKey = 'today' | 'yesterday' | '7d' | '30d';

interface PV {
  id: string;
  page_type: string;
  room_id: string | null;
  room_name: string | null;
  visitor_id: string | null;
  session_id: string | null;
  referrer_source: string | null;
  device: string | null;
  viewed_at: string;
  date: string;
}

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'yesterday', label: 'Hôm qua' },
  { key: '7d', label: '7 ngày' },
  { key: '30d', label: '30 ngày' },
];

const PIE_COLORS = ['hsl(var(--primary))', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

function getRange(key: RangeKey): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const now = new Date();
  const today = startOfDay(now);
  if (key === 'today') {
    return { start: today, end: addDays(today, 1), prevStart: addDays(today, -1), prevEnd: today };
  }
  if (key === 'yesterday') {
    const y = addDays(today, -1);
    return { start: y, end: today, prevStart: addDays(y, -1), prevEnd: y };
  }
  if (key === '7d') {
    const start = addDays(today, -6);
    return { start, end: addDays(today, 1), prevStart: addDays(start, -7), prevEnd: start };
  }
  // 30d
  const start = addDays(today, -29);
  return { start, end: addDays(today, 1), prevStart: addDays(start, -30), prevEnd: start };
}

function pct(curr: number, prev: number): { val: number; up: boolean } {
  if (prev === 0) return { val: curr > 0 ? 100 : 0, up: curr >= 0 };
  const v = ((curr - prev) / prev) * 100;
  return { val: Math.round(v), up: v >= 0 };
}

const AdminPageAnalytics = () => {
  const [range, setRange] = useState<RangeKey>('7d');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PV[]>([]);
  const [prevRows, setPrevRows] = useState<PV[]>([]);
  const [bookingsCurr, setBookingsCurr] = useState(0);
  const [bookingsPrev, setBookingsPrev] = useState(0);
  const [roomNames, setRoomNames] = useState<Record<string, string>>({});
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { start, end, prevStart, prevEnd } = getRange(range);
    const [currRes, prevRes, bkCurrRes, bkPrevRes, roomsRes] = await Promise.all([
      supabase.from('page_views').select('*').gte('viewed_at', start.toISOString()).lt('viewed_at', end.toISOString()).order('viewed_at', { ascending: false }).limit(10000),
      supabase.from('page_views').select('*').gte('viewed_at', prevStart.toISOString()).lt('viewed_at', prevEnd.toISOString()).limit(10000),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', start.toISOString()).lt('created_at', end.toISOString()),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', prevStart.toISOString()).lt('created_at', prevEnd.toISOString()),
      supabase.from('rooms').select('id, name_vi').limit(500),
    ]);
    setRows((currRes.data || []) as PV[]);
    setPrevRows((prevRes.data || []) as PV[]);
    setBookingsCurr(bkCurrRes.count || 0);
    setBookingsPrev(bkPrevRes.count || 0);
    const map: Record<string, string> = {};
    (roomsRes.data || []).forEach((r: any) => { map[r.id] = r.name_vi; });
    setRoomNames(map);
    setUpdatedAt(new Date());
    setLoading(false);
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto refresh
  useEffect(() => {
    const intervalMs = range === 'today' ? 60_000 : 5 * 60_000;
    const t = setInterval(fetchData, intervalMs);
    return () => clearInterval(t);
  }, [fetchData, range]);

  const stats = useMemo(() => {
    const totalViews = rows.length;
    const uniqueVisitors = new Set(rows.map(r => r.visitor_id).filter(Boolean)).size;
    const roomViews = rows.filter(r => r.page_type === 'room_detail').length;

    const prevTotal = prevRows.length;
    const prevUnique = new Set(prevRows.map(r => r.visitor_id).filter(Boolean)).size;
    const prevRoomViews = prevRows.filter(r => r.page_type === 'room_detail').length;

    return {
      totalViews, uniqueVisitors, roomViews,
      diffViews: pct(totalViews, prevTotal),
      diffUnique: pct(uniqueVisitors, prevUnique),
      diffRoom: pct(roomViews, prevRoomViews),
      diffBookings: pct(bookingsCurr, bookingsPrev),
    };
  }, [rows, prevRows, bookingsCurr, bookingsPrev]);

  // Daily series
  const dailySeries = useMemo(() => {
    const { start, end } = getRange(range);
    const days: { date: string; label: string; web: number; room: number }[] = [];
    const cursor = new Date(start);
    while (cursor < end) {
      const key = cursor.toISOString().slice(0, 10);
      days.push({
        date: key,
        label: `${cursor.getDate()}/${cursor.getMonth() + 1}`,
        web: 0, room: 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    rows.forEach(r => {
      const key = r.viewed_at.slice(0, 10);
      const day = days.find(d => d.date === key);
      if (day) {
        day.web += 1;
        if (r.page_type === 'room_detail') day.room += 1;
      }
    });
    return days;
  }, [rows, range]);

  // Top rooms
  const topRooms = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    rows.filter(r => r.page_type === 'room_detail' && r.room_id).forEach(r => {
      const id = r.room_id!;
      const name = r.room_name || roomNames[id] || `Phòng ${id.slice(0, 6)}`;
      const prev = map.get(id);
      if (prev) prev.count += 1;
      else map.set(id, { name, count: 1 });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [rows, roomNames]);

  // Referrer pie
  const referrerData = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach(r => {
      const k = r.referrer_source || 'direct';
      map.set(k, (map.get(k) || 0) + 1);
    });
    const total = rows.length || 1;
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value, pct: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value);
  }, [rows]);

  // Device
  const deviceData = useMemo(() => {
    const map = { mobile: 0, desktop: 0, tablet: 0 } as Record<string, number>;
    rows.forEach(r => {
      const d = r.device || 'desktop';
      if (map[d] !== undefined) map[d] += 1;
    });
    return [
      { name: 'Mobile', value: map.mobile, icon: Smartphone },
      { name: 'Desktop', value: map.desktop, icon: Monitor },
      { name: 'Tablet', value: map.tablet, icon: Tablet },
    ];
  }, [rows]);

  // Hourly (only for today/yesterday)
  const hourly = useMemo(() => {
    if (range !== 'today' && range !== 'yesterday') return [];
    const arr = Array.from({ length: 24 }, (_, h) => ({ hour: h, views: 0, unique: new Set<string>(), rooms: 0 }));
    rows.forEach(r => {
      const d = new Date(r.viewed_at);
      const h = d.getHours();
      arr[h].views += 1;
      if (r.visitor_id) arr[h].unique.add(r.visitor_id);
      if (r.page_type === 'room_detail') arr[h].rooms += 1;
    });
    return arr.map(a => ({ hour: a.hour, views: a.views, unique: a.unique.size, rooms: a.rooms }));
  }, [rows, range]);

  const peakHours = useMemo(() => {
    if (!hourly.length) return new Set<number>();
    const top = [...hourly].sort((a, b) => b.views - a.views).slice(0, 3).map(h => h.hour);
    return new Set(top);
  }, [hourly]);

  // Insights
  const insights = useMemo(() => {
    const out: string[] = [];
    if (stats.diffViews.up && stats.diffViews.val >= 10) {
      const mobile = deviceData.find(d => d.name === 'Mobile')?.value || 0;
      const total = rows.length || 1;
      const mobilePct = Math.round((mobile / total) * 100);
      out.push(`📈 Lượt xem tăng ${stats.diffViews.val}% so với kỳ trước — chủ yếu từ ${mobilePct >= 50 ? `mobile (${mobilePct}%)` : `desktop`}. → Gợi ý: ${mobilePct >= 50 ? 'Kiểm tra tốc độ tải trang mobile.' : 'Tối ưu UX desktop để chuyển đổi.'}`);
    } else if (!stats.diffViews.up && Math.abs(stats.diffViews.val) >= 10) {
      out.push(`📉 Lượt xem giảm ${Math.abs(stats.diffViews.val)}% so với kỳ trước. → Gợi ý: Đẩy mạnh quảng bá và chia sẻ link trên Zalo/Facebook.`);
    }
    if (topRooms.length) {
      const top = topRooms[0];
      const ratio = bookingsCurr > 0 ? ((bookingsCurr / top.count) * 100).toFixed(1) : '0';
      out.push(`🏆 Phòng "${top.name}" được xem nhiều nhất (${top.count} lượt). Tỷ lệ chuyển đổi sang đặt phòng ước tính ~${ratio}%. → Gợi ý: ${Number(ratio) < 3 ? 'Cải thiện ảnh, mô tả hoặc giá phòng để tăng đặt.' : 'Duy trì chất lượng nội dung phòng này.'}`);
    }
    if (peakHours.size) {
      const arr = Array.from(peakHours).sort((a, b) => a - b);
      out.push(`⏰ Giờ cao điểm: ${arr.map(h => `${h}:00`).join(', ')}. → Gợi ý: Đặt lịch đăng bài Facebook/Zalo trước giờ vàng 30 phút để tận dụng traffic.`);
    }
    if (range === '7d' || range === '30d') {
      const weekend = rows.filter(r => { const d = new Date(r.viewed_at).getDay(); return d === 0 || d === 6; }).length;
      const weekday = rows.length - weekend;
      const wkAvg = weekend / Math.max(1, range === '7d' ? 2 : 8);
      const wdAvg = weekday / Math.max(1, range === '7d' ? 5 : 22);
      if (wkAvg > wdAvg * 1.3) {
        out.push(`📅 Cuối tuần có lượt xem cao hơn ~${Math.round(((wkAvg - wdAvg) / wdAvg) * 100)}% so với ngày thường. → Gợi ý: Tăng khuyến mãi và đẩy quảng cáo cuối tuần.`);
      }
    }
    if (out.length === 0) out.push('💡 Chưa có đủ dữ liệu để đưa ra gợi ý chi tiết. Hãy quay lại sau khi có thêm lượt truy cập.');
    return out;
  }, [stats, deviceData, topRooms, peakHours, rows, range, bookingsCurr]);

  if (loading && !rows.length) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">Thống kê lượt xem</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Cập nhật: {updatedAt.toLocaleTimeString('vi')}
          </span>
          <button onClick={fetchData} className="text-xs px-2 py-1 rounded border border-border hover:bg-secondary inline-flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Làm mới
          </button>
          <div className="flex gap-1">
            {RANGE_OPTIONS.map(r => (
              <button key={r.key} onClick={() => setRange(r.key)}
                className={`text-xs px-3 py-1 rounded-full border ${range === r.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-secondary'}`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Lượt xem', value: stats.totalViews, icon: Eye, color: 'text-blue-600', diff: stats.diffViews },
          { label: 'Khách unique', value: stats.uniqueVisitors, icon: UserPlus, color: 'text-emerald-600', diff: stats.diffUnique },
          { label: 'Xem phòng', value: stats.roomViews, icon: BedDouble, color: 'text-amber-600', diff: stats.diffRoom },
          { label: 'Đặt phòng', value: bookingsCurr, icon: ClipboardList, color: 'text-primary', diff: stats.diffBookings },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString('vi')}</p>
            <p className={`text-[11px] mt-1 inline-flex items-center gap-1 ${s.diff.up ? 'text-emerald-600' : 'text-red-600'}`}>
              {s.diff.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {s.diff.up ? '+' : ''}{s.diff.val}% so với kỳ trước
            </p>
          </div>
        ))}
      </div>

      {/* Chart 1: Daily line */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-3">Lượt xem theo ngày</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailySeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                formatter={(v: any, n: any) => [v, n === 'web' ? 'Tổng web' : 'Trang phòng']}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => v === 'web' ? 'Tổng web' : 'Trang phòng'} />
              <Line type="monotone" dataKey="web" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="room" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top rooms */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-3">Top phòng được xem</h3>
          {topRooms.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Chưa có lượt xem phòng</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topRooms} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Referrer pie */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-3">Nguồn truy cập</h3>
          {referrerData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Chưa có dữ liệu</p>
          ) : (
            <div className="h-72 flex items-center">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie data={referrerData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90}>
                    {referrerData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1">
                {referrerData.map((r, i) => (
                  <div key={r.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="capitalize flex-1">{r.name}</span>
                    <span className="font-semibold">{r.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Device */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-3">Thiết bị truy cập</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deviceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly table for today/yesterday */}
      {(range === 'today' || range === 'yesterday') && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-3">Lượt xem theo giờ</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 px-2">Giờ</th>
                  <th className="py-2 px-2 text-right">Lượt xem</th>
                  <th className="py-2 px-2 text-right">Khách unique</th>
                  <th className="py-2 px-2 text-right">Xem phòng</th>
                </tr>
              </thead>
              <tbody>
                {hourly.map(h => (
                  <tr key={h.hour} className={`border-b border-border/50 ${peakHours.has(h.hour) ? 'bg-amber-50 dark:bg-amber-950/20' : ''}`}>
                    <td className="py-1.5 px-2 font-mono">{String(h.hour).padStart(2, '0')}:00</td>
                    <td className="py-1.5 px-2 text-right">{h.views}</td>
                    <td className="py-1.5 px-2 text-right">{h.unique}</td>
                    <td className="py-1.5 px-2 text-right">{h.rooms}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="bg-gradient-to-br from-primary/5 to-amber-50 dark:from-primary/10 dark:to-amber-950/20 rounded-xl border border-primary/20 p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" /> Phân tích & Gợi ý nâng cao
        </h3>
        <div className="space-y-2">
          {insights.map((tip, i) => (
            <p key={i} className="text-sm leading-relaxed">{tip}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPageAnalytics;
