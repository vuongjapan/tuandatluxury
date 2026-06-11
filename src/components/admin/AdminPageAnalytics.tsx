import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Eye, Users, Activity, Repeat, Layers, Clock, Smartphone, Globe,
  RefreshCw, Download, Search, ChevronRight, X, Monitor, Tablet,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend,
} from 'recharts';
import * as XLSX from 'xlsx';

type RangeKey = 'today' | 'yesterday' | '7d' | '30d' | 'month';
type DomainTab = 'all' | 'com' | 'lovable';

interface VT {
  id: string;
  visitor_id: string;
  session_id: string;
  source_domain: string;
  first_seen: string;
  last_seen: string;
  visit_count: number;
  pages_this_session: Array<{ page: string; time_spent: number; timestamp: string }>;
  country: string | null;
  country_code: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  screen_resolution: string | null;
  referrer: string | null;
  referrer_source: string | null;
  created_at: string;
}

const GOLD = '#C9A84C';
const BLUE = '#3B82F6';
const YELLOW = '#EAB308';

const RANGE_LABEL: Record<RangeKey, string> = {
  today: 'Hôm nay', yesterday: 'Hôm qua', '7d': '7 ngày', '30d': '30 ngày', month: 'Tháng này',
};

function getRange(range: RangeKey): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  const from = new Date(now);
  switch (range) {
    case 'today': from.setHours(0, 0, 0, 0); break;
    case 'yesterday':
      from.setDate(now.getDate() - 1); from.setHours(0, 0, 0, 0);
      to.setHours(0, 0, 0, 0);
      break;
    case '7d': from.setDate(now.getDate() - 7); break;
    case '30d': from.setDate(now.getDate() - 30); break;
    case 'month': from.setDate(1); from.setHours(0, 0, 0, 0); break;
  }
  return { from, to };
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

function CountUp({ value, duration = 800 }: { value: number; duration?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setV(Math.round(from + (value - from) * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{fmt(v)}</>;
}

function countryFlag(code: string | null): string {
  if (!code || code.length !== 2) return '🌐';
  const cc = code.toUpperCase();
  return String.fromCodePoint(...[...cc].map(c => 127397 + c.charCodeAt(0)));
}

function classifyDomain(host: string | null): DomainTab {
  if (!host) return 'com';
  if (host.includes('lovable.app')) return 'lovable';
  return 'com';
}

const domainColor: Record<DomainTab, string> = { all: GOLD, com: BLUE, lovable: YELLOW };
const domainBadge: Record<DomainTab, { label: string; emoji: string }> = {
  all: { label: 'Tất cả', emoji: '🌐' },
  com: { label: 'tuandatluxury.com', emoji: '🔵' },
  lovable: { label: 'tuandatluxury.lovable.app', emoji: '🟡' },
};

const AdminPageAnalytics = () => {
  const [range, setRange] = useState<RangeKey>('7d');
  const [domain, setDomain] = useState<DomainTab>('all');
  const [rows, setRows] = useState<VT[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [search, setSearch] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  // For comparison vs previous period
  const [prevTotals, setPrevTotals] = useState<{ views: number; uniques: number } | null>(null);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    const { from, to } = getRange(range);
    const { data } = await supabase
      .from('visitor_tracking')
      .select('*')
      .gte('first_seen', from.toISOString())
      .lte('first_seen', to.toISOString())
      .order('last_seen', { ascending: false })
      .limit(5000);
    setRows((data || []) as any);

    // previous period for comparison
    const span = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - span);
    const { data: prev } = await supabase
      .from('visitor_tracking')
      .select('visitor_id, pages_this_session, source_domain')
      .gte('first_seen', prevFrom.toISOString())
      .lt('first_seen', from.toISOString())
      .limit(5000);
    const prevRows = (prev || []) as any[];
    const prevViews = prevRows.reduce((s, r) => s + (r.pages_this_session?.length || 0), 0);
    const prevUniques = new Set(prevRows.map(r => r.visitor_id)).size;
    setPrevTotals({ views: prevViews, uniques: prevUniques });

    setLastUpdated(new Date());
    setLoading(false);
    setRefreshing(false);
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime subscription for online users
  useEffect(() => {
    const channel = supabase
      .channel('visitor-tracking-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitor_tracking' }, () => {
        // Lightweight refresh of last_seen — refetch list
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  // Auto refresh every 30s
  useEffect(() => {
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  // Filter by domain tab
  const filtered = useMemo(() => {
    if (domain === 'all') return rows;
    return rows.filter(r => classifyDomain(r.source_domain) === domain);
  }, [rows, domain]);

  // Aggregate stats
  const stats = useMemo(() => {
    const views = filtered.reduce((s, r) => s + (r.pages_this_session?.length || 0), 0);
    const uniqueVisitors = new Set(filtered.map(r => r.visitor_id)).size;
    const now = Date.now();
    const onlineNow = filtered.filter(r => now - new Date(r.last_seen).getTime() < 5 * 60_000).length;

    // returning vs new
    const visitorMap = new Map<string, VT[]>();
    filtered.forEach(r => {
      const a = visitorMap.get(r.visitor_id) || [];
      a.push(r);
      visitorMap.set(r.visitor_id, a);
    });
    let returning = 0, newOnes = 0;
    visitorMap.forEach((arr) => {
      const maxVc = Math.max(...arr.map(r => r.visit_count || 1));
      if (maxVc > 1) returning++; else newOnes++;
    });

    const avgVisits = uniqueVisitors > 0
      ? (filtered.reduce((s, r) => s + (r.visit_count || 1), 0) / uniqueVisitors)
      : 0;

    // Avg session duration from pages_this_session sum
    const totalSeconds = filtered.reduce((s, r) => {
      const last = r.pages_this_session?.[r.pages_this_session.length - 1];
      const dur = (new Date(r.last_seen).getTime() - new Date(r.first_seen).getTime()) / 1000;
      return s + Math.max(0, Math.min(dur, 60 * 60));
    }, 0);
    const avgDuration = filtered.length > 0 ? totalSeconds / filtered.length : 0;

    const mobile = filtered.filter(r => r.device_type === 'mobile').length;
    const desktop = filtered.filter(r => r.device_type === 'desktop').length;
    const tablet = filtered.filter(r => r.device_type === 'tablet').length;
    const deviceTotal = mobile + desktop + tablet || 1;

    const countries = new Set(filtered.map(r => r.country_code).filter(Boolean)).size;

    return {
      views, uniqueVisitors, onlineNow, returning, newOnes,
      avgVisits, avgDuration, mobile, desktop, tablet, deviceTotal, countries,
    };
  }, [filtered]);

  const pct = (cur: number, prev: number) => {
    if (!prev) return cur > 0 ? 100 : 0;
    return Math.round(((cur - prev) / prev) * 1000) / 10;
  };

  // Per-domain breakdown for the comparison panel
  const byDomain = useMemo(() => {
    const out: Record<DomainTab, { rows: VT[]; views: number; uniques: number; online: number; avgDur: number }> = {
      all: { rows: [], views: 0, uniques: 0, online: 0, avgDur: 0 },
      com: { rows: [], views: 0, uniques: 0, online: 0, avgDur: 0 },
      lovable: { rows: [], views: 0, uniques: 0, online: 0, avgDur: 0 },
    };
    const now = Date.now();
    rows.forEach(r => {
      const k = classifyDomain(r.source_domain);
      out[k].rows.push(r);
    });
    (['com', 'lovable'] as DomainTab[]).forEach(k => {
      const arr = out[k].rows;
      out[k].views = arr.reduce((s, r) => s + (r.pages_this_session?.length || 0), 0);
      out[k].uniques = new Set(arr.map(r => r.visitor_id)).size;
      out[k].online = arr.filter(r => now - new Date(r.last_seen).getTime() < 5 * 60_000).length;
      const totalSec = arr.reduce((s, r) => {
        const dur = (new Date(r.last_seen).getTime() - new Date(r.first_seen).getTime()) / 1000;
        return s + Math.max(0, Math.min(dur, 3600));
      }, 0);
      out[k].avgDur = arr.length ? totalSec / arr.length : 0;
    });
    return out;
  }, [rows]);

  // Overlap (visitors in both domains)
  const overlap = useMemo(() => {
    const com = new Set(byDomain.com.rows.map(r => r.visitor_id));
    const lv = new Set(byDomain.lovable.rows.map(r => r.visitor_id));
    let both = 0, onlyCom = 0, onlyLv = 0;
    com.forEach(v => { if (lv.has(v)) both++; else onlyCom++; });
    lv.forEach(v => { if (!com.has(v)) onlyLv++; });
    return { both, onlyCom, onlyLv };
  }, [byDomain]);

  // Daily chart data
  const dailyData = useMemo(() => {
    const map = new Map<string, { date: string; views: number; uniques: Set<string>; com: number; lovable: number }>();
    filtered.forEach(r => {
      const d = new Date(r.first_seen).toISOString().slice(0, 10);
      const e = map.get(d) || { date: d, views: 0, uniques: new Set(), com: 0, lovable: 0 };
      e.views += r.pages_this_session?.length || 0;
      e.uniques.add(r.visitor_id);
      if (classifyDomain(r.source_domain) === 'com') e.com += r.pages_this_session?.length || 0;
      else e.lovable += r.pages_this_session?.length || 0;
      map.set(d, e);
    });
    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(e => ({
        date: e.date.slice(5),
        views: e.views,
        uniques: e.uniques.size,
        com: e.com,
        lovable: e.lovable,
      }));
  }, [filtered]);

  // Countries
  const countriesData = useMemo(() => {
    const m = new Map<string, { name: string; code: string; count: number }>();
    filtered.forEach(r => {
      if (!r.country) return;
      const k = r.country_code || r.country;
      const e = m.get(k) || { name: r.country, code: r.country_code || '', count: 0 };
      e.count += 1;
      m.set(k, e);
    });
    return Array.from(m.values()).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filtered]);

  // Top pages
  const topPages = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach(r => {
      (r.pages_this_session || []).forEach(p => {
        m.set(p.page, (m.get(p.page) || 0) + 1);
      });
    });
    return Array.from(m.entries()).map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filtered]);

  // Traffic sources
  const sourcesData = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach(r => {
      const k = r.referrer_source || 'direct';
      m.set(k, (m.get(k) || 0) + 1);
    });
    const labelMap: Record<string, string> = {
      direct: 'Direct', organic_search: 'Organic Search',
      organic_social: 'Organic Social', referral: 'Referral', internal: 'Internal',
    };
    return Array.from(m.entries()).map(([k, v]) => ({ name: labelMap[k] || k, count: v }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  // Unique visitors aggregated for the table
  const visitorRows = useMemo(() => {
    const m = new Map<string, {
      visitor_id: string; domains: Set<DomainTab>; visit_count: number;
      first_seen: string; last_seen: string; country: string | null; country_code: string | null;
      device_type: string | null; browser: string | null;
    }>();
    filtered.forEach(r => {
      const e = m.get(r.visitor_id) || {
        visitor_id: r.visitor_id,
        domains: new Set<DomainTab>(),
        visit_count: 0,
        first_seen: r.first_seen,
        last_seen: r.last_seen,
        country: r.country,
        country_code: r.country_code,
        device_type: r.device_type,
        browser: r.browser,
      };
      e.domains.add(classifyDomain(r.source_domain));
      e.visit_count = Math.max(e.visit_count, r.visit_count || 1);
      if (r.first_seen < e.first_seen) e.first_seen = r.first_seen;
      if (r.last_seen > e.last_seen) e.last_seen = r.last_seen;
      m.set(r.visitor_id, e);
    });
    let arr = Array.from(m.values());
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(v =>
        v.visitor_id.toLowerCase().includes(q) ||
        (v.country || '').toLowerCase().includes(q) ||
        (v.device_type || '').toLowerCase().includes(q) ||
        (v.browser || '').toLowerCase().includes(q)
      );
    }
    arr.sort((a, b) => b.last_seen.localeCompare(a.last_seen));
    return arr;
  }, [filtered, search]);

  const visitorPaged = visitorRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(visitorRows.length / PAGE_SIZE));

  const onlineList = useMemo(() => {
    const now = Date.now();
    return filtered
      .filter(r => now - new Date(r.last_seen).getTime() < 5 * 60_000)
      .sort((a, b) => b.last_seen.localeCompare(a.last_seen))
      .slice(0, 12);
  }, [filtered]);

  const selectedDetail = useMemo(() => {
    if (!selectedVisitor) return null;
    return rows.filter(r => r.visitor_id === selectedVisitor)
      .sort((a, b) => a.first_seen.localeCompare(b.first_seen));
  }, [selectedVisitor, rows]);

  // Export Excel
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const buildSheet = (arr: VT[]) => arr.map(r => ({
      'Visitor ID': r.visitor_id,
      'Domain': r.source_domain,
      'Session': r.session_id,
      'Lần đầu': new Date(r.first_seen).toLocaleString('vi-VN'),
      'Lần cuối': new Date(r.last_seen).toLocaleString('vi-VN'),
      'Số lần vào': r.visit_count,
      'Quốc gia': r.country || '',
      'Thiết bị': r.device_type || '',
      'Trình duyệt': r.browser || '',
      'Nguồn': r.referrer_source || '',
      'Số trang xem': r.pages_this_session?.length || 0,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(buildSheet(byDomain.com.rows)), 'tuandatluxury.com');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(buildSheet(byDomain.lovable.rows)), 'lovable.app');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
      { Metric: 'Lượt xem', '.com': byDomain.com.views, '.lovable.app': byDomain.lovable.views },
      { Metric: 'Người dùng duy nhất', '.com': byDomain.com.uniques, '.lovable.app': byDomain.lovable.uniques },
      { Metric: 'Đang online', '.com': byDomain.com.online, '.lovable.app': byDomain.lovable.online },
      { Metric: 'TB thời gian (giây)', '.com': Math.round(byDomain.com.avgDur), '.lovable.app': Math.round(byDomain.lovable.avgDur) },
    ]), 'So sánh tổng hợp');
    const com = new Set(byDomain.com.rows.map(r => r.visitor_id));
    const lv = new Set(byDomain.lovable.rows.map(r => r.visitor_id));
    const both = Array.from(com).filter(v => lv.has(v));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      both.map(v => ({ 'Visitor ID': v }))
    ), 'Visitor cả 2 domain');
    XLSX.writeFile(wb, `ThongKeLuotXem_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  const deltaViews = prevTotals ? pct(stats.views, prevTotals.views) : 0;
  const deltaUniques = prevTotals ? pct(stats.uniqueVisitors, prevTotals.uniques) : 0;

  const cards = [
    { icon: Eye, label: 'Lượt xem trang', value: stats.views, delta: deltaViews },
    { icon: Users, label: 'Người dùng duy nhất', value: stats.uniqueVisitors, delta: deltaUniques },
    { icon: Activity, label: 'Đang online', value: stats.onlineNow, delta: 0, live: true },
    { icon: Repeat, label: 'Người quay lại', value: stats.returning, sub: `${stats.newOnes} người mới` },
    { icon: Layers, label: 'TB lần vào / người', value: Math.round(stats.avgVisits * 10) / 10, asFloat: true },
    { icon: Clock, label: 'TB phiên (phút)', value: Math.round(stats.avgDuration / 60 * 10) / 10, asFloat: true },
    { icon: Smartphone, label: 'Mobile', value: Math.round(stats.mobile / stats.deviceTotal * 100), asPct: true, sub: `${100 - Math.round(stats.mobile / stats.deviceTotal * 100)}% desktop` },
    { icon: Globe, label: 'Quốc gia', value: stats.countries },
  ];

  const maxCountry = countriesData[0]?.count || 1;
  const maxPage = topPages[0]?.count || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: GOLD, fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>
          Thống kê lượt xem
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Cập nhật {lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button onClick={fetchData} disabled={refreshing}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border hover:bg-secondary transition-colors disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Cập nhật
          </button>
          <button onClick={exportExcel}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full text-white shadow transition-all hover:scale-105"
            style={{ backgroundColor: GOLD }}>
            <Download className="h-3.5 w-3.5" />
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Domain tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'com', 'lovable'] as DomainTab[]).map(k => (
          <button key={k} onClick={() => setDomain(k)}
            className={`text-sm px-4 py-2 rounded-full border transition-all duration-300 hover:scale-105 ${
              domain === k ? 'text-white shadow-md' : 'bg-card text-foreground'
            }`}
            style={domain === k ? { backgroundColor: domainColor[k], borderColor: domainColor[k] } : {}}>
            {domainBadge[k].emoji} {domainBadge[k].label}
          </button>
        ))}
      </div>

      {/* Time pills */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(RANGE_LABEL) as RangeKey[]).map(k => (
          <button key={k} onClick={() => setRange(k)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              range === k ? 'text-white' : 'bg-card text-foreground hover:bg-secondary'
            }`}
            style={range === k ? { backgroundColor: GOLD, borderColor: GOLD } : {}}>
            {RANGE_LABEL[k]}
          </button>
        ))}
      </div>

      {/* 8 metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c, i) => (
          <div key={i} className="bg-card rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{c.label}</span>
              <div className="relative">
                <c.icon className="h-4 w-4" style={{ color: GOLD }} />
                {c.live && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: GOLD }}>
              {c.asFloat ? c.value : c.asPct ? `${c.value}%` : <CountUp value={c.value} />}
            </p>
            {c.delta !== undefined && c.delta !== 0 && (
              <p className={`text-xs mt-1 ${c.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {c.delta >= 0 ? '↑' : '↓'} {Math.abs(c.delta)}%
              </p>
            )}
            {c.sub && <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>}
          </div>
        ))}
      </div>

      {/* New vs returning */}
      <div className="bg-card rounded-2xl border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Người mới vs Người quay lại</h3>
          <span className="text-xs text-muted-foreground">{RANGE_LABEL[range]}</span>
        </div>
        {(() => {
          const total = stats.newOnes + stats.returning || 1;
          const newPct = Math.round(stats.newOnes / total * 100);
          const retPct = 100 - newPct;
          return (
            <>
              <p className="text-sm mb-3">
                <strong>{fmt(stats.views)}</strong> lượt xem →{' '}
                <strong>{fmt(stats.uniqueVisitors)}</strong> người dùng duy nhất →{' '}
                <strong>{fmt(stats.returning)}</strong> quay lại,{' '}
                <strong>{fmt(stats.newOnes)}</strong> mới
              </p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1"><span>Người mới</span><span>{newPct}%</span></div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full transition-all duration-700" style={{ width: `${newPct}%`, backgroundColor: GOLD }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span>Quay lại</span><span>{retPct}%</span></div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${retPct}%` }} />
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Domain comparison (only when 'all') */}
      {domain === 'all' && (
        <div className="bg-card rounded-2xl border p-5 shadow-sm">
          <h3 className="font-semibold mb-4">So sánh 2 domain</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
            {(['com', 'lovable'] as DomainTab[]).map(k => (
              <div key={k} className="rounded-xl p-4 border-2" style={{ borderColor: domainColor[k] + '40', backgroundColor: domainColor[k] + '08' }}>
                <p className="font-semibold text-sm mb-2">{domainBadge[k].emoji} {domainBadge[k].label}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><Users className="inline h-3 w-3 mr-1" /> {fmt(byDomain[k].uniques)} người</div>
                  <div><Eye className="inline h-3 w-3 mr-1" /> {fmt(byDomain[k].views)} lượt</div>
                  <div><Activity className="inline h-3 w-3 mr-1" /> {fmt(byDomain[k].online)} online</div>
                  <div><Clock className="inline h-3 w-3 mr-1" /> {(byDomain[k].avgDur / 60).toFixed(1)} phút</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-5" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="com" name=".com" fill={BLUE} radius={[4, 4, 0, 0]} />
                <Bar dataKey="lovable" name=".lovable.app" fill={YELLOW} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-lg p-3" style={{ backgroundColor: BLUE + '15' }}>
              <p className="text-xs text-muted-foreground">Chỉ .com</p>
              <p className="text-xl font-bold" style={{ color: BLUE }}>{fmt(overlap.onlyCom)}</p>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: GOLD + '20' }}>
              <p className="text-xs text-muted-foreground">Vào cả 2</p>
              <p className="text-xl font-bold" style={{ color: GOLD }}>{fmt(overlap.both)}</p>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: YELLOW + '20' }}>
              <p className="text-xs text-muted-foreground">Chỉ .lovable.app</p>
              <p className="text-xl font-bold" style={{ color: '#a16207' }}>{fmt(overlap.onlyLv)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Realtime online now */}
      <div className="bg-card rounded-2xl border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {onlineList.length} người đang online
          </h3>
          <span className="text-xs text-muted-foreground">Realtime</span>
        </div>
        {onlineList.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Chưa có ai online</p>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {onlineList.map(r => {
              const dk = classifyDomain(r.source_domain);
              const lastPage = r.pages_this_session?.[r.pages_this_session.length - 1];
              return (
                <div key={r.id} className="flex items-center gap-3 text-xs py-1.5 px-2 rounded hover:bg-secondary/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedVisitor(r.visitor_id)}>
                  <span className="font-mono text-muted-foreground truncate w-24">{r.visitor_id.slice(0, 10)}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] text-white" style={{ backgroundColor: domainColor[dk] }}>
                    {domainBadge[dk].emoji}
                  </span>
                  <span>{countryFlag(r.country_code)}</span>
                  <span className="flex-1 truncate text-muted-foreground">{lastPage?.page || '—'}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Daily line chart */}
      <div className="bg-card rounded-2xl border p-5 shadow-sm">
        <h3 className="font-semibold mb-3">Lượt xem theo ngày</h3>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GOLD} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gUniq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BLUE} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="views" name="Lượt xem" stroke={GOLD} fill="url(#gViews)" strokeWidth={2} />
              <Area type="monotone" dataKey="uniques" name="Người duy nhất" stroke={BLUE} fill="url(#gUniq)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Countries */}
      <div className="bg-card rounded-2xl border p-5 shadow-sm">
        <h3 className="font-semibold mb-3">Top quốc gia</h3>
        {countriesData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Chưa có dữ liệu quốc gia</p>
        ) : (
          <div className="space-y-2">
            {countriesData.map((c, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-lg w-6">{countryFlag(c.code)}</span>
                <span className="w-32 truncate">{c.name}</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-700" style={{ width: `${(c.count / maxCountry) * 100}%`, backgroundColor: GOLD }} />
                </div>
                <span className="text-xs font-semibold w-12 text-right">{c.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Device + Source */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border p-5 shadow-sm">
          <h3 className="font-semibold mb-3">Thiết bị</h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Mobile', value: stats.mobile },
                    { name: 'Desktop', value: stats.desktop },
                    { name: 'Tablet', value: stats.tablet },
                  ]}
                  dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  <Cell fill={GOLD} />
                  <Cell fill={BLUE} />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-2xl border p-5 shadow-sm">
          <h3 className="font-semibold mb-3">Nguồn truy cập</h3>
          <div className="space-y-2">
            {sourcesData.length === 0 && <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>}
            {sourcesData.map((s, i) => {
              const max = sourcesData[0]?.count || 1;
              return (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-32 truncate">{s.name}</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full transition-all duration-700" style={{ width: `${(s.count / max) * 100}%`, backgroundColor: GOLD }} />
                  </div>
                  <span className="text-xs font-semibold w-12 text-right">{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top pages */}
      <div className="bg-card rounded-2xl border p-5 shadow-sm">
        <h3 className="font-semibold mb-3">Top trang được xem</h3>
        {topPages.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Chưa có dữ liệu</p>
        ) : (
          <div className="space-y-2">
            {topPages.map((p, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-8 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                <span className="flex-1 truncate">{p.page}</span>
                <div className="w-24 sm:w-40 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-700" style={{ width: `${(p.count / maxPage) * 100}%`, backgroundColor: GOLD }} />
                </div>
                <span className="text-xs font-semibold w-12 text-right">{p.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visitor table */}
      <div className="bg-card rounded-2xl border p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="font-semibold">Người dùng thực tế ({fmt(visitorRows.length)})</h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm mã, quốc gia, thiết bị..."
              className="text-xs pl-8 pr-3 py-1.5 rounded-full border bg-background w-56" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2 px-2">Mã máy</th>
                <th className="py-2 px-2">Domain</th>
                <th className="py-2 px-2">Lần đầu</th>
                <th className="py-2 px-2 text-center">Số lần</th>
                <th className="py-2 px-2">Quốc gia</th>
                <th className="py-2 px-2">Thiết bị</th>
                <th className="py-2 px-2">Trạng thái</th>
                <th className="py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {visitorPaged.map(v => {
                const now = Date.now();
                const since = now - new Date(v.last_seen).getTime();
                const status = since < 5 * 60_000 ? '🟢 Online' : since < 60 * 60_000 ? '🟡 Gần đây' : '⚫ Offline';
                return (
                  <tr key={v.visitor_id} className="border-b hover:bg-secondary/30 cursor-pointer"
                    onClick={() => setSelectedVisitor(v.visitor_id)}>
                    <td className="py-2 px-2 font-mono truncate max-w-[120px]">{v.visitor_id.slice(0, 14)}</td>
                    <td className="py-2 px-2">
                      <div className="flex gap-1">
                        {Array.from(v.domains).map(d => (
                          <span key={d} className="text-[10px] px-1.5 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: domainColor[d] }}>
                            {domainBadge[d].emoji}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-muted-foreground">{new Date(v.first_seen).toLocaleDateString('vi-VN')}</td>
                    <td className="py-2 px-2 text-center font-semibold" style={{ color: GOLD }}>{v.visit_count}</td>
                    <td className="py-2 px-2">{countryFlag(v.country_code)} {v.country || '—'}</td>
                    <td className="py-2 px-2 capitalize">{v.device_type || '—'}</td>
                    <td className="py-2 px-2 text-xs">{status}</td>
                    <td className="py-2 px-2 text-right"><ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /></td>
                  </tr>
                );
              })}
              {visitorPaged.length === 0 && (
                <tr><td colSpan={8} className="text-center text-muted-foreground py-8">Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-3">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="text-xs px-2 py-1 rounded border disabled:opacity-50">‹</button>
            <span className="text-xs px-3">Trang {page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="text-xs px-2 py-1 rounded border disabled:opacity-50">›</button>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selectedVisitor && selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-2 sm:p-4" onClick={() => setSelectedVisitor(null)}>
          <div className="bg-card rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Mã máy</p>
                <p className="font-mono text-sm break-all">{selectedVisitor}</p>
              </div>
              <button onClick={() => setSelectedVisitor(null)} className="p-1 hover:bg-secondary rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            {(() => {
              const first = selectedDetail[0];
              const domains = new Set(selectedDetail.map(r => classifyDomain(r.source_domain)));
              return (
                <>
                  <div className="flex flex-wrap gap-2 mb-3 text-xs">
                    {Array.from(domains).map(d => (
                      <span key={d} className="px-2 py-1 rounded-full text-white" style={{ backgroundColor: domainColor[d] }}>
                        {domainBadge[d].emoji} {domainBadge[d].label}
                      </span>
                    ))}
                    <span className="px-2 py-1 rounded-full bg-secondary">{countryFlag(first.country_code)} {first.country || '—'}</span>
                    <span className="px-2 py-1 rounded-full bg-secondary capitalize">{first.device_type} · {first.browser}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Lần đầu: {new Date(first.first_seen).toLocaleString('vi-VN')} · Tổng {selectedDetail.length} phiên
                  </p>
                  <div className="space-y-3">
                    {selectedDetail.map((r, i) => (
                      <div key={r.id} className="border rounded-xl p-3">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-semibold">Lần {i + 1}: {new Date(r.first_seen).toLocaleString('vi-VN')}</span>
                          <span className="text-muted-foreground">
                            ({Math.round((new Date(r.last_seen).getTime() - new Date(r.first_seen).getTime()) / 60000)} phút)
                          </span>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {(r.pages_this_session || []).map((p, j) => (
                            <div key={j}>→ {p.page}{p.time_spent ? ` (${p.time_spent}s)` : ''}</div>
                          ))}
                          {(!r.pages_this_session || r.pages_this_session.length === 0) && <div>(không có trang)</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Privacy note */}
      <p className="text-[11px] text-muted-foreground text-center pt-2">
        Website dùng fingerprinting ẩn danh để phân tích lượt truy cập. Không lưu thông tin cá nhân.
      </p>
    </div>
  );
};

export default AdminPageAnalytics;
