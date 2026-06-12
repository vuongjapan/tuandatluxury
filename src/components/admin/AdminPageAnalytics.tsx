import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart3, Eye, UserPlus, BedDouble, ClipboardList, Loader2, RefreshCw,
  TrendingUp, TrendingDown, Smartphone, Monitor, Tablet, Lightbulb, Clock,
  Globe, Download, Filter, Repeat, Wifi,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

type RangeKey = 'today' | 'yesterday' | '7d' | '30d';
type DomainKey = 'all' | 'com' | 'lovable';

interface PV {
  id: string;
  page_type: string;
  page_label: string | null;
  page_path: string | null;
  domain: string | null;
  full_url: string | null;
  room_id: string | null;
  room_name: string | null;
  visitor_id: string | null;
  session_id: string | null;
  referrer_source: string | null;
  device: string | null;
  viewed_at: string;
  date: string;
}

interface VisitorRow {
  id: string;
  visitor_id: string;
  visit_count: number;
  first_seen: string;
  last_seen: string;
  source_domain: string | null;
  last_path: string | null;
}

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'yesterday', label: 'Hôm qua' },
  { key: '7d', label: '7 ngày' },
  { key: '30d', label: '30 ngày' },
];

const DOMAIN_OPTIONS: { key: DomainKey; label: string; match: (d: string | null) => boolean }[] = [
  { key: 'all', label: 'Tất cả', match: () => true },
  { key: 'com', label: 'tuandatluxury.com', match: (d) => !!d && d.includes('tuandatluxury.com') },
  { key: 'lovable', label: 'lovable.app', match: (d) => !!d && d.includes('lovable.app') },
];

// Page-type display config
const PAGE_TYPE_META: Record<string, { label: string; icon: string; order: number }> = {
  home:           { label: 'Trang chủ',          icon: '🏠', order: 1 },
  rooms_list:     { label: 'Danh sách phòng',    icon: '🏨', order: 2 },
  room_detail:    { label: 'Chi tiết phòng',     icon: '🛏', order: 3 },
  booking_step1:  { label: 'Đặt phòng B1',       icon: '📝', order: 4 },
  booking_step2:  { label: 'Đặt phòng B2',       icon: '📝', order: 5 },
  booking_step3:  { label: 'Đặt phòng B3',       icon: '📝', order: 6 },
  booking_step4:  { label: 'Đặt phòng B4',       icon: '📝', order: 7 },
  booking_done:   { label: 'Đặt thành công',     icon: '✅', order: 8 },
  invoice:        { label: 'Xem hóa đơn',        icon: '🧾', order: 9 },
  account:        { label: 'Trang cá nhân',      icon: '👤', order: 10 },
  lookup:         { label: 'Tra cứu đơn',        icon: '🔍', order: 11 },
  about:          { label: 'Giới thiệu',         icon: 'ℹ️', order: 12 },
  food_order:     { label: 'Đặt món ăn',         icon: '🍽', order: 13 },
  services:       { label: 'Dịch vụ',            icon: '🛎', order: 14 },
  promotions:     { label: 'Khuyến mãi',         icon: '🎁', order: 15 },
  explore:        { label: 'Khám phá',           icon: '🗺', order: 16 },
  dining:         { label: 'Ẩm thực',            icon: '🥘', order: 17 },
  blog:           { label: 'Blog',               icon: '📰', order: 18 },
  reviews:        { label: 'Đánh giá',           icon: '⭐', order: 19 },
  live:           { label: 'Livestream',         icon: '🎥', order: 20 },
  transport:      { label: 'Đặt xe',             icon: '🚗', order: 21 },
  other:          { label: 'Trang khác',         icon: '📄', order: 99 },
  // Legacy values kept for backwards-compat
  booking:        { label: 'Đặt phòng (cũ)',     icon: '📝', order: 7 },
  offers:         { label: 'Khuyến mãi (cũ)',    icon: '🎁', order: 15 },
};

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
  const start = addDays(today, -29);
  return { start, end: addDays(today, 1), prevStart: addDays(start, -30), prevEnd: start };
}

function pct(curr: number, prev: number): { val: number; up: boolean } {
  if (prev === 0) return { val: curr > 0 ? 100 : 0, up: curr >= 0 };
  const v = ((curr - prev) / prev) * 100;
  return { val: Math.round(v), up: v >= 0 };
}

function getMeta(type: string) {
  return PAGE_TYPE_META[type] || { label: type, icon: '📄', order: 99 };
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(r =>
    r.map(c => {
      const s = String(c ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')
  ).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const AdminPageAnalytics = () => {
  const [range, setRange] = useState<RangeKey>('7d');
  const [domain, setDomain] = useState<DomainKey>('all');
  const [loading, setLoading] = useState(true);
  const [allRows, setAllRows] = useState<PV[]>([]);
  const [allPrevRows, setAllPrevRows] = useState<PV[]>([]);
  const [bookingsCurr, setBookingsCurr] = useState(0);
  const [bookingsPrev, setBookingsPrev] = useState(0);
  const [roomNames, setRoomNames] = useState<Record<string, string>>({});
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());
  const [visitorRows, setVisitorRows] = useState<VisitorRow[]>([]);
  const [now, setNow] = useState(Date.now());

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { start, end, prevStart, prevEnd } = getRange(range);
    const [currRes, prevRes, bkCurrRes, bkPrevRes, roomsRes, visitorsRes] = await Promise.all([
      supabase.from('page_views').select('*').gte('viewed_at', start.toISOString()).lt('viewed_at', end.toISOString()).order('viewed_at', { ascending: false }).limit(10000),
      supabase.from('page_views').select('*').gte('viewed_at', prevStart.toISOString()).lt('viewed_at', prevEnd.toISOString()).limit(10000),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', start.toISOString()).lt('created_at', end.toISOString()),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', prevStart.toISOString()).lt('created_at', prevEnd.toISOString()),
      supabase.from('rooms').select('id, name_vi').limit(500),
      supabase.from('visitors').select('id, visitor_id, visit_count, first_seen, last_seen, source_domain, last_path').gte('last_seen', start.toISOString()).lt('last_seen', end.toISOString()).order('last_seen', { ascending: false }).limit(2000),
    ]);
    setAllRows((currRes.data || []) as PV[]);
    setAllPrevRows((prevRes.data || []) as PV[]);
    setBookingsCurr(bkCurrRes.count || 0);
    setBookingsPrev(bkPrevRes.count || 0);
    const map: Record<string, string> = {};
    (roomsRes.data || []).forEach((r: any) => { map[r.id] = r.name_vi; });
    setRoomNames(map);
    setVisitorRows((visitorsRes.data || []) as VisitorRow[]);
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

  // Keep "now" ticking for online indicator
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  // Filter by selected domain
  const domainMatcher = DOMAIN_OPTIONS.find(d => d.key === domain)!.match;
  const rows = useMemo(() => allRows.filter(r => domainMatcher(r.domain)), [allRows, domainMatcher]);
  const prevRows = useMemo(() => allPrevRows.filter(r => domainMatcher(r.domain)), [allPrevRows, domainMatcher]);

  const stats = useMemo(() => {
    const totalViews = rows.length;
    const uniqueVisitors = new Set(rows.map(r => r.visitor_id).filter(Boolean)).size;
    const roomViews = rows.filter(r => r.page_type === 'room_detail').length;

    const prevTotal = prevRows.length;
    const prevUnique = new Set(prevRows.map(r => r.visitor_id).filter(Boolean)).size;
    const prevRoomViews = prevRows.filter(r => r.page_type === 'room_detail').length;

    // Conversion: bookings (current period) / unique visitors
    const conversion = uniqueVisitors > 0 ? (bookingsCurr / uniqueVisitors) * 100 : 0;

    // Avg session duration: max - min viewed_at per session
    const sessions = new Map<string, { min: number; max: number }>();
    rows.forEach(r => {
      if (!r.session_id) return;
      const t = new Date(r.viewed_at).getTime();
      const s = sessions.get(r.session_id);
      if (!s) sessions.set(r.session_id, { min: t, max: t });
      else { s.min = Math.min(s.min, t); s.max = Math.max(s.max, t); }
    });
    const durations = Array.from(sessions.values()).map(s => (s.max - s.min) / 1000);
    const avgDurSec = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

    // Device split
    let mobile = 0, desktop = 0, tablet = 0;
    rows.forEach(r => {
      if (r.device === 'mobile') mobile++;
      else if (r.device === 'tablet') tablet++;
      else desktop++;
    });
    const dt = rows.length || 1;

    return {
      totalViews, uniqueVisitors, roomViews,
      diffViews: pct(totalViews, prevTotal),
      diffUnique: pct(uniqueVisitors, prevUnique),
      diffRoom: pct(roomViews, prevRoomViews),
      diffBookings: pct(bookingsCurr, bookingsPrev),
      conversion,
      avgDurSec,
      mobilePct: Math.round((mobile / dt) * 100),
      desktopPct: Math.round((desktop / dt) * 100),
      tabletPct: Math.round((tablet / dt) * 100),
    };
  }, [rows, prevRows, bookingsCurr, bookingsPrev]);

  // Page-type breakdown
  const pageTypeBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach(r => map.set(r.page_type, (map.get(r.page_type) || 0) + 1));
    const total = rows.length || 1;
    return Array.from(map.entries())
      .map(([type, count]) => ({
        type,
        count,
        pct: Math.round((count / total) * 100),
        ...getMeta(type),
      }))
      .sort((a, b) => b.count - a.count);
  }, [rows]);

  // Funnel
  const funnel = useMemo(() => {
    const homeUniq   = new Set(rows.filter(r => r.page_type === 'home').map(r => r.visitor_id).filter(Boolean)).size;
    const roomUniq   = new Set(rows.filter(r => r.page_type === 'room_detail' || r.page_type === 'rooms_list').map(r => r.visitor_id).filter(Boolean)).size;
    const detailUniq = new Set(rows.filter(r => r.page_type === 'room_detail').map(r => r.visitor_id).filter(Boolean)).size;
    const b1Uniq = new Set(rows.filter(r => r.page_type.startsWith('booking_step') || r.page_type === 'booking').map(r => r.visitor_id).filter(Boolean)).size;
    const doneUniq = new Set(rows.filter(r => r.page_type === 'booking_done').map(r => r.visitor_id).filter(Boolean)).size;
    const top = Math.max(homeUniq, roomUniq, b1Uniq, doneUniq, 1);
    return [
      { stage: 'Trang chủ',           value: homeUniq,   pct: Math.round((homeUniq / top) * 100) },
      { stage: 'Xem phòng',           value: roomUniq,   pct: Math.round((roomUniq / top) * 100) },
      { stage: 'Chi tiết phòng',      value: detailUniq, pct: Math.round((detailUniq / top) * 100) },
      { stage: 'Vào trang đặt phòng', value: b1Uniq,     pct: Math.round((b1Uniq / top) * 100) },
      { stage: 'Đặt thành công',      value: doneUniq,   pct: Math.round((doneUniq / top) * 100) },
    ];
  }, [rows]);

  // Daily series (split by domain)
  const dailySeries = useMemo(() => {
    const { start, end } = getRange(range);
    const days: { date: string; label: string; com: number; lovable: number; total: number }[] = [];
    const cursor = new Date(start);
    while (cursor < end) {
      const key = cursor.toISOString().slice(0, 10);
      days.push({
        date: key,
        label: `${cursor.getDate()}/${cursor.getMonth() + 1}`,
        com: 0, lovable: 0, total: 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    allRows.forEach(r => {
      const key = r.viewed_at.slice(0, 10);
      const day = days.find(d => d.date === key);
      if (!day) return;
      day.total += 1;
      if (r.domain?.includes('tuandatluxury.com')) day.com += 1;
      else if (r.domain?.includes('lovable.app')) day.lovable += 1;
    });
    return days;
  }, [allRows, range]);

  // Domain comparison table
  const domainCompare = useMemo(() => {
    const split = { com: [] as PV[], lovable: [] as PV[], other: [] as PV[] };
    allRows.forEach(r => {
      if (r.domain?.includes('tuandatluxury.com')) split.com.push(r);
      else if (r.domain?.includes('lovable.app')) split.lovable.push(r);
      else split.other.push(r);
    });
    const byPageType = (arr: PV[]) => {
      const m = new Map<string, number>();
      arr.forEach(r => m.set(r.page_type, (m.get(r.page_type) || 0) + 1));
      return m;
    };
    const comByType = byPageType(split.com);
    const lovableByType = byPageType(split.lovable);
    const allTypes = new Set<string>([...comByType.keys(), ...lovableByType.keys()]);
    const rowsOut = Array.from(allTypes)
      .map(t => ({ type: t, com: comByType.get(t) || 0, lovable: lovableByType.get(t) || 0, ...getMeta(t) }))
      .sort((a, b) => (b.com + b.lovable) - (a.com + a.lovable));
    return {
      rows: rowsOut,
      totals: {
        com: split.com.length,
        lovable: split.lovable.length,
        comUnique: new Set(split.com.map(r => r.visitor_id).filter(Boolean)).size,
        lovableUnique: new Set(split.lovable.map(r => r.visitor_id).filter(Boolean)).size,
      },
    };
  }, [allRows]);

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

  // Hourly with per-page-type breakdown
  const hourly = useMemo(() => {
    if (range !== 'today' && range !== 'yesterday') return [];
    const arr = Array.from({ length: 24 }, (_, h) => ({
      hour: h, views: 0, unique: new Set<string>(),
      home: 0, rooms: 0, room: 0, booking: 0, about: 0,
    }));
    rows.forEach(r => {
      const d = new Date(r.viewed_at);
      const h = d.getHours();
      arr[h].views += 1;
      if (r.visitor_id) arr[h].unique.add(r.visitor_id);
      if (r.page_type === 'home') arr[h].home += 1;
      if (r.page_type === 'rooms_list') arr[h].rooms += 1;
      if (r.page_type === 'room_detail') arr[h].room += 1;
      if (r.page_type.startsWith('booking')) arr[h].booking += 1;
      if (r.page_type === 'about') arr[h].about += 1;
    });
    return arr.map(a => ({
      hour: a.hour, views: a.views, unique: a.unique.size,
      home: a.home, rooms: a.rooms, room: a.room, booking: a.booking, about: a.about,
    }));
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
      out.push(`📈 Lượt xem tăng ${stats.diffViews.val}% so với kỳ trước — chủ yếu từ ${stats.mobilePct >= 50 ? `mobile (${stats.mobilePct}%)` : `desktop (${stats.desktopPct}%)`}.`);
    } else if (!stats.diffViews.up && Math.abs(stats.diffViews.val) >= 10) {
      out.push(`📉 Lượt xem giảm ${Math.abs(stats.diffViews.val)}% so với kỳ trước. → Gợi ý: Đẩy mạnh chia sẻ link Zalo/Facebook.`);
    }
    // Funnel drop-off
    const f = funnel;
    if (f[2].value > 0 && f[3].value > 0) {
      const drop = Math.round((1 - f[3].value / f[2].value) * 100);
      if (drop >= 50) out.push(`⚠️ ${drop}% khách rời trang sau khi xem chi tiết phòng — chưa vào đặt phòng. → Gợi ý: Thêm CTA mạnh hoặc ưu đãi cọc thấp.`);
    }
    if (f[3].value > 0 && f[4].value > 0) {
      const drop = Math.round((1 - f[4].value / f[3].value) * 100);
      if (drop >= 50) out.push(`⚠️ ${drop}% khách bỏ giữa các bước đặt phòng. → Gợi ý: Đơn giản hóa form chọn dịch vụ.`);
    }
    if (topRooms.length) {
      const top = topRooms[0];
      out.push(`🏆 Phòng "${top.name}" được xem nhiều nhất (${top.count} lượt).`);
    }
    if (peakHours.size) {
      const arr = Array.from(peakHours).sort((a, b) => a - b);
      out.push(`⏰ Giờ vàng: ${arr.map(h => `${h}:00`).join(', ')}. → Gợi ý: Đăng Facebook/Zalo trước giờ vàng 30 phút.`);
    }
    if (domain === 'all' && domainCompare.totals.com + domainCompare.totals.lovable > 0) {
      const more = domainCompare.totals.com >= domainCompare.totals.lovable ? 'tuandatluxury.com' : 'lovable.app';
      out.push(`🌐 Domain hiệu quả hơn: ${more} (${Math.max(domainCompare.totals.com, domainCompare.totals.lovable)} lượt).`);
    }
    if (out.length === 0) out.push('💡 Chưa có đủ dữ liệu để đưa ra gợi ý chi tiết.');
    return out;
  }, [stats, funnel, topRooms, peakHours, domain, domainCompare]);

  // CSV export
  const exportCsv = () => {
    const lines: (string | number)[][] = [];
    const { start, end } = getRange(range);
    const dateLabel = `${start.toLocaleDateString('vi')}_${addDays(end, -1).toLocaleDateString('vi')}`.replace(/\//g, '-');

    lines.push(['Báo cáo lượt xem', '', '', '']);
    lines.push(['Khoảng thời gian', RANGE_OPTIONS.find(r => r.key === range)!.label, '', '']);
    lines.push(['Domain lọc', DOMAIN_OPTIONS.find(d => d.key === domain)!.label, '', '']);
    lines.push(['Cập nhật lúc', updatedAt.toLocaleString('vi'), '', '']);
    lines.push([]);

    lines.push(['== TỔNG QUAN ==']);
    lines.push(['Tổng lượt xem', stats.totalViews]);
    lines.push(['Khách unique', stats.uniqueVisitors]);
    lines.push(['Xem phòng', stats.roomViews]);
    lines.push(['Đặt phòng', bookingsCurr]);
    lines.push(['Tỷ lệ chuyển đổi (%)', stats.conversion.toFixed(2)]);
    lines.push([]);

    lines.push(['== LƯỢT XEM THEO TRANG ==']);
    lines.push(['Trang', 'Lượt xem', 'Tỷ lệ %']);
    pageTypeBreakdown.forEach(p => lines.push([p.label, p.count, p.pct]));
    lines.push([]);

    lines.push(['== FUNNEL ĐẶT PHÒNG ==']);
    lines.push(['Bước', 'Số người unique']);
    funnel.forEach(f => lines.push([f.stage, f.value]));
    lines.push([]);

    lines.push(['== SO SÁNH 2 DOMAIN ==']);
    lines.push(['Trang', 'tuandatluxury.com', 'lovable.app']);
    domainCompare.rows.forEach(r => lines.push([r.label, r.com, r.lovable]));
    lines.push(['TỔNG', domainCompare.totals.com, domainCompare.totals.lovable]);
    lines.push(['Unique', domainCompare.totals.comUnique, domainCompare.totals.lovableUnique]);
    lines.push([]);

    lines.push(['== TOP PHÒNG ĐƯỢC XEM ==']);
    lines.push(['Phòng', 'Lượt xem']);
    topRooms.forEach(r => lines.push([r.name, r.count]));
    lines.push([]);

    lines.push(['== NGUỒN TRUY CẬP ==']);
    lines.push(['Nguồn', 'Lượt xem', 'Tỷ lệ %']);
    referrerData.forEach(r => lines.push([r.name, r.value, r.pct]));

    if (hourly.length) {
      lines.push([]);
      lines.push(['== LƯỢT XEM THEO GIỜ ==']);
      lines.push(['Giờ', 'Tổng', 'Unique', 'Trang chủ', 'DS phòng', 'Chi tiết', 'Đặt phòng', 'Giới thiệu']);
      hourly.forEach(h => lines.push([
        `${String(h.hour).padStart(2, '0')}:00`,
        h.views, h.unique, h.home, h.rooms, h.room, h.booking, h.about,
      ]));
    }

    downloadCsv(`bao-cao-luot-xem_${dateLabel}.csv`, lines);
  };

  if (loading && !rows.length) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const fmtSec = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, '0')}`;
  };

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
          <button onClick={exportCsv} className="text-xs px-2 py-1 rounded border border-border hover:bg-secondary inline-flex items-center gap-1">
            <Download className="h-3 w-3" /> Export CSV
          </button>
        </div>
      </div>

      {/* Domain + range filters */}
      <div className="bg-card rounded-xl border border-border p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Domain:</span>
          <div className="flex gap-1">
            {DOMAIN_OPTIONS.map(d => (
              <button key={d.key} onClick={() => setDomain(d.key)}
                className={`text-xs px-2.5 py-1 rounded-full border ${domain === d.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-secondary'}`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Thời gian:</span>
          <div className="flex gap-1">
            {RANGE_OPTIONS.map(r => (
              <button key={r.key} onClick={() => setRange(r.key)}
                className={`text-xs px-2.5 py-1 rounded-full border ${range === r.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-secondary'}`}>
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

      {/* Secondary KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">🎯 Tỷ lệ chuyển đổi</p>
          <p className="text-2xl font-bold text-primary">{stats.conversion.toFixed(1)}%</p>
          <p className="text-[11px] text-muted-foreground">đặt phòng / unique</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">⏱ Thời gian TB</p>
          <p className="text-2xl font-bold text-blue-600">{fmtSec(stats.avgDurSec)}</p>
          <p className="text-[11px] text-muted-foreground">phút / phiên</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1"><Smartphone className="h-3 w-3" /> Mobile</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.mobilePct}%</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1"><Monitor className="h-3 w-3" /> Desktop</p>
          <p className="text-2xl font-bold text-amber-600">{stats.desktopPct}%</p>
        </div>
      </div>

      {/* Page-type breakdown bar list */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-3">📍 Lượt xem theo trang</h3>
        {pageTypeBreakdown.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Chưa có dữ liệu</p>
        ) : (
          <div className="space-y-1.5">
            {pageTypeBreakdown.map(p => (
              <div key={p.type} className="grid grid-cols-[200px_1fr_auto] items-center gap-3 text-sm">
                <span className="truncate">{p.icon} {p.label}</span>
                <div className="bg-secondary rounded-full h-2.5 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${p.pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums w-20 text-right">
                  <strong className="text-foreground">{p.count}</strong> · {p.pct}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Funnel */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-3">🎯 Funnel đặt phòng</h3>
        <div className="space-y-2">
          {funnel.map((f, i) => {
            const next = funnel[i + 1];
            const dropPct = next && f.value > 0 ? Math.round((next.value / f.value) * 100) : null;
            return (
              <div key={f.stage}>
                <div className="grid grid-cols-[180px_1fr_auto] items-center gap-3 text-sm">
                  <span className="truncate">{f.stage}</span>
                  <div className="bg-secondary rounded h-7 overflow-hidden relative">
                    <div className="bg-primary h-full" style={{ width: `${f.pct}%` }} />
                    <span className="absolute inset-0 flex items-center px-2 text-xs font-semibold text-foreground">
                      {f.value} người
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">{f.pct}%</span>
                </div>
                {dropPct !== null && (
                  <p className="text-[11px] text-muted-foreground ml-[195px] mt-0.5">↓ {dropPct}% chuyển bước</p>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-primary mt-3 font-semibold">
          Tỷ lệ chuyển đổi cuối cùng: {funnel[0].value > 0 ? Math.round((funnel[4].value / funnel[0].value) * 100) : 0}%
        </p>
      </div>

      {/* Domain comparison */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Globe className="h-4 w-4" /> So sánh 2 Domain
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 px-2">Trang</th>
                <th className="py-2 px-2 text-right">tuandatluxury.com</th>
                <th className="py-2 px-2 text-right">lovable.app</th>
              </tr>
            </thead>
            <tbody>
              {domainCompare.rows.map(r => (
                <tr key={r.type} className="border-b border-border/50">
                  <td className="py-1.5 px-2">{r.icon} {r.label}</td>
                  <td className="py-1.5 px-2 text-right tabular-nums">{r.com}</td>
                  <td className="py-1.5 px-2 text-right tabular-nums">{r.lovable}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-border font-bold bg-secondary/30">
                <td className="py-2 px-2">TỔNG LƯỢT XEM</td>
                <td className="py-2 px-2 text-right tabular-nums">{domainCompare.totals.com}</td>
                <td className="py-2 px-2 text-right tabular-nums">{domainCompare.totals.lovable}</td>
              </tr>
              <tr className="font-semibold">
                <td className="py-1.5 px-2">Khách Unique</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{domainCompare.totals.comUnique}</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{domainCompare.totals.lovableUnique}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily line by domain */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-3">Lượt xem theo ngày — 2 domain</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailySeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="com" name="tuandatluxury.com" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="lovable" name="lovable.app" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
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

      {/* Hourly with per-page breakdown */}
      {(range === 'today' || range === 'yesterday') && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-3">Lượt xem theo giờ — chi tiết</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 px-2">Giờ</th>
                  <th className="py-2 px-2 text-right">Tổng</th>
                  <th className="py-2 px-2 text-right">Unique</th>
                  <th className="py-2 px-2 text-right">🏠 Chủ</th>
                  <th className="py-2 px-2 text-right">🏨 DS phòng</th>
                  <th className="py-2 px-2 text-right">🛏 Chi tiết</th>
                  <th className="py-2 px-2 text-right">📝 Đặt phòng</th>
                  <th className="py-2 px-2 text-right">ℹ️ Giới thiệu</th>
                </tr>
              </thead>
              <tbody>
                {hourly.map(h => (
                  <tr key={h.hour} className={`border-b border-border/50 ${peakHours.has(h.hour) ? 'bg-amber-50 dark:bg-amber-950/20' : ''}`}>
                    <td className="py-1.5 px-2 font-mono">{String(h.hour).padStart(2, '0')}:00</td>
                    <td className="py-1.5 px-2 text-right font-semibold">{h.views}</td>
                    <td className="py-1.5 px-2 text-right">{h.unique}</td>
                    <td className="py-1.5 px-2 text-right">{h.home || '-'}</td>
                    <td className="py-1.5 px-2 text-right">{h.rooms || '-'}</td>
                    <td className="py-1.5 px-2 text-right">{h.room || '-'}</td>
                    <td className="py-1.5 px-2 text-right">{h.booking || '-'}</td>
                    <td className="py-1.5 px-2 text-right">{h.about || '-'}</td>
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
