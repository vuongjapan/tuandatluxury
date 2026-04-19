import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, TrendingUp, Search, Sparkles, MapPin, Wallet, Loader2 } from 'lucide-react';

interface Stats {
  totalSearches: number;
  totalAiEvents: number;
  topKeywords: { keyword: string; count: number }[];
  topZones: { zone: string; count: number }[];
  topVibes: { vibe: string; count: number }[];
  budgetDist: { range: string; count: number }[];
  recent: { keyword: string; created_at: string; result_count: number }[];
}

const BUDGET_BUCKETS = [
  { label: '< 500k', min: 0, max: 500_000 },
  { label: '500k–1M', min: 500_000, max: 1_000_000 },
  { label: '1M–2M', min: 1_000_000, max: 2_000_000 },
  { label: '2M–5M', min: 2_000_000, max: 5_000_000 },
  { label: '> 5M', min: 5_000_000, max: Infinity },
];

const AdminAnalytics = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
      const [searchRes, aiRes] = await Promise.all([
        supabase.from('search_logs').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(1000),
        supabase.from('ai_logs').select('*').gte('created_at', since).limit(1000),
      ]);
      const searches = searchRes.data || [];
      const aiEvents = aiRes.data || [];

      const kwMap = new Map<string, number>();
      const zoneMap = new Map<string, number>();
      const vibeMap = new Map<string, number>();
      const budgetMap = new Map<string, number>();

      searches.forEach((s: any) => {
        if (s.keyword) kwMap.set(s.keyword, (kwMap.get(s.keyword) || 0) + 1);
        if (s.zone) zoneMap.set(s.zone, (zoneMap.get(s.zone) || 0) + 1);
        (s.vibes || []).forEach((v: string) => vibeMap.set(v, (vibeMap.get(v) || 0) + 1));
        if (s.budget) {
          const b = BUDGET_BUCKETS.find(x => s.budget >= x.min && s.budget < x.max);
          if (b) budgetMap.set(b.label, (budgetMap.get(b.label) || 0) + 1);
        }
      });

      setStats({
        totalSearches: searches.length,
        totalAiEvents: aiEvents.length,
        topKeywords: Array.from(kwMap.entries()).map(([keyword, count]) => ({ keyword, count })).sort((a, b) => b.count - a.count).slice(0, 10),
        topZones: Array.from(zoneMap.entries()).map(([zone, count]) => ({ zone, count })).sort((a, b) => b.count - a.count).slice(0, 8),
        topVibes: Array.from(vibeMap.entries()).map(([vibe, count]) => ({ vibe, count })).sort((a, b) => b.count - a.count).slice(0, 8),
        budgetDist: BUDGET_BUCKETS.map(b => ({ range: b.label, count: budgetMap.get(b.label) || 0 })),
        recent: searches.slice(0, 20).map((s: any) => ({ keyword: s.keyword || '(không có từ khoá)', created_at: s.created_at, result_count: s.result_count || 0 })),
      });
      setLoading(false);
    })();
  }, [days]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!stats) return null;

  const maxKw = Math.max(1, ...stats.topKeywords.map(k => k.count));
  const maxZone = Math.max(1, ...stats.topZones.map(z => z.count));
  const maxBudget = Math.max(1, ...stats.budgetDist.map(b => b.count));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">Analytics — Khách tìm gì</h2>
        </div>
        <div className="flex gap-1">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`text-xs px-3 py-1 rounded-full border ${days === d ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>
              {d} ngày
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Tổng lượt tìm', value: stats.totalSearches, icon: Search, color: 'text-blue-600' },
          { label: 'AI events', value: stats.totalAiEvents, icon: Sparkles, color: 'text-primary' },
          { label: 'Keyword unique', value: stats.topKeywords.length, icon: TrendingUp, color: 'text-emerald-600' },
          { label: 'Zone tracked', value: stats.topZones.length, icon: MapPin, color: 'text-amber-600' },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Search className="h-4 w-4" /> Top từ khoá</h3>
          <div className="space-y-2">
            {stats.topKeywords.length === 0 && <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>}
            {stats.topKeywords.map((k, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="truncate flex-1 mr-2">{k.keyword}</span>
                  <span className="text-muted-foreground">{k.count}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(k.count / maxKw) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Wallet className="h-4 w-4" /> Phân bố ngân sách</h3>
          <div className="space-y-2">
            {stats.budgetDist.map((b, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{b.range}</span>
                  <span className="text-muted-foreground">{b.count}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${(b.count / maxBudget) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><MapPin className="h-4 w-4" /> Khu vực hot</h3>
          <div className="space-y-2">
            {stats.topZones.length === 0 && <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>}
            {stats.topZones.map((z, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{z.zone}</span>
                  <span className="text-muted-foreground">{z.count}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${(z.count / maxZone) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4" /> Vibes</h3>
          <div className="flex flex-wrap gap-2">
            {stats.topVibes.length === 0 && <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>}
            {stats.topVibes.map((v, i) => (
              <span key={i} className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-full">
                {v.vibe} <span className="opacity-60">({v.count})</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-3">Tìm kiếm gần đây</h3>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {stats.recent.length === 0 && <p className="text-sm text-muted-foreground">Chưa có lượt tìm</p>}
          {stats.recent.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0">
              <span className="truncate flex-1 mr-2">{r.keyword}</span>
              <span className="text-muted-foreground shrink-0">{r.result_count} kết quả · {new Date(r.created_at).toLocaleString('vi')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
