import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { UserPlus, Repeat, Wifi, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VisitorRow {
  id: string;
  visitor_id: string;
  visit_count: number;
  first_seen: string;
  last_seen: string;
  source_domain: string | null;
  last_path: string | null;
}

const ONLINE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

const AdminVisitors = () => {
  const [rows, setRows] = useState<VisitorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('visitors' as any)
      .select('id, visitor_id, visit_count, first_seen, last_seen, source_domain, last_path')
      .order('last_seen', { ascending: false })
      .limit(500);
    setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = window.setInterval(() => setNow(Date.now()), 15_000);
    const r = window.setInterval(load, 30_000);
    return () => { window.clearInterval(t); window.clearInterval(r); };
  }, []);

  const stats = useMemo(() => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();
    let newToday = 0, returningToday = 0, online = 0;
    rows.forEach(r => {
      const first = new Date(r.first_seen).getTime();
      const last = new Date(r.last_seen).getTime();
      if (first >= todayMs) newToday++;
      else if (last >= todayMs) returningToday++;
      if (now - last <= ONLINE_WINDOW_MS) online++;
    });
    return { newToday, returningToday, online };
  }, [rows, now]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Khách truy cập</h2>
          <p className="text-sm text-muted-foreground mt-1">Nhận biết khách mới và khách quay lại theo dấu vân tay trình duyệt.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<UserPlus className="h-5 w-5" />} label="Khách mới hôm nay" value={stats.newToday} tone="bg-emerald-50 text-emerald-700 border-emerald-200" />
        <StatCard icon={<Repeat className="h-5 w-5" />} label="Khách cũ quay lại hôm nay" value={stats.returningToday} tone="bg-blue-50 text-blue-700 border-blue-200" />
        <StatCard icon={<Wifi className="h-5 w-5" />} label="Đang online" value={stats.online} tone="bg-amber-50 text-amber-700 border-amber-200" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Mã máy</th>
                <th className="text-left px-4 py-3">Mới / Cũ</th>
                <th className="text-right px-4 py-3">Số lần vào</th>
                <th className="text-left px-4 py-3">Lần cuối vào</th>
                <th className="text-left px-4 py-3">Đang online?</th>
                <th className="text-left px-4 py-3">Nguồn</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const isNew = r.visit_count <= 1;
                const isOnline = now - new Date(r.last_seen).getTime() <= ONLINE_WINDOW_MS;
                return (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-2 font-mono text-xs">{r.visitor_id.slice(0, 14)}…</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${isNew ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isNew ? 'Mới' : 'Cũ'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">{r.visit_count}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {format(new Date(r.last_seen), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </td>
                    <td className="px-4 py-2">
                      {isOnline ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Online
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground text-xs">{r.source_domain || '(trực tiếp)'}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && !loading && (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Chưa có dữ liệu khách truy cập.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: string }) => (
  <div className={`border rounded-xl p-5 ${tone}`}>
    <div className="flex items-center gap-2 text-xs font-semibold uppercase opacity-80">{icon}{label}</div>
    <div className="text-3xl font-bold mt-2">{value}</div>
  </div>
);

export default AdminVisitors;
