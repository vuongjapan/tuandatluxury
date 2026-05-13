/**
 * AdminTranslations — quản lý bản dịch website.
 * - Admin bấm "Dịch toàn bộ website" → collect content + UI strings → batch dịch qua edge function `translate-batch` → upsert vào bảng `translations`.
 * - Khi khách chuyển ngôn ngữ, AutoTranslateRoot đọc trực tiếp từ bảng này.
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Globe, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { UI_STRINGS } from '@/i18n/uiStrings';

type Lang = 'en' | 'ja' | 'zh' | 'ko';
const TARGET_LANGS: Lang[] = ['en', 'ja', 'zh', 'ko'];
const LANG_LABEL: Record<Lang, string> = {
  en: '🇬🇧 English',
  ja: '🇯🇵 Tiếng Nhật',
  zh: '🇨🇳 Tiếng Trung',
  ko: '🇰🇷 Tiếng Hàn',
};

const BATCH_SIZE = 40;

type Item = { key: string; text: string; content_type: string };

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function shortHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return Math.abs(h).toString(36).slice(0, 10);
}

async function collectAll(): Promise<Item[]> {
  const items: Item[] = [];
  const seen = new Set<string>();
  const push = (key: string, text: string | null | undefined, content_type: string) => {
    const t = (text ?? '').toString().trim();
    if (!t) return;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ key, text: t, content_type });
  };

  // Rooms
  const { data: rooms } = await supabase
    .from('rooms' as any)
    .select('id, name_vi, description_vi');
  (rooms || []).forEach((r: any) => {
    push(`room_${r.id}_name`, r.name_vi, 'room');
    push(`room_${r.id}_desc`, r.description_vi, 'room');
  });

  // Menu items
  const { data: menus } = await supabase
    .from('menu_items' as any)
    .select('id, name_vi, description_vi');
  (menus || []).forEach((m: any) => {
    push(`menu_${m.id}_name`, m.name_vi, 'menu');
    push(`menu_${m.id}_desc`, m.description_vi, 'menu');
  });

  // Services
  const { data: services } = await supabase
    .from('services' as any)
    .select('id, name, description');
  (services || []).forEach((s: any) => {
    push(`service_${s.id}_name`, s.name, 'service');
    push(`service_${s.id}_desc`, s.description, 'service');
  });

  // Combos
  const { data: combos } = await supabase
    .from('combo_packages' as any)
    .select('id, name, description_vi');
  (combos || []).forEach((c: any) => {
    push(`combo_${c.id}_name`, c.name, 'combo');
    push(`combo_${c.id}_desc`, c.description_vi, 'combo');
  });

  // Offers
  const { data: offers } = await supabase
    .from('offers' as any)
    .select('id, title, content');
  (offers || []).forEach((o: any) => {
    push(`offer_${o.id}_title`, o.title, 'offer');
    if (o.content && o.content.length < 1500) {
      push(`offer_${o.id}_content`, o.content, 'offer');
    }
  });

  // Attractions
  const { data: attractions } = await supabase
    .from('attractions' as any)
    .select('id, name, description');
  (attractions || []).forEach((a: any) => {
    push(`attraction_${a.id}_name`, a.name, 'attraction');
    push(`attraction_${a.id}_desc`, a.description, 'attraction');
  });

  // Page sections
  const { data: sections } = await supabase
    .from('page_sections' as any)
    .select('id, section_key, description_vi');
  (sections || []).forEach((s: any) => {
    push(`section_${s.section_key}_desc`, s.description_vi, 'page');
  });

  // UI strings (static)
  Object.entries(UI_STRINGS).forEach(([k, v]) => push(`ui_${k}`, v, 'ui'));

  return items;
}

interface StatusRow {
  lang: Lang;
  total: number;
  translated: number;
  lastAt: string | null;
}

const AdminTranslations = () => {
  const [statuses, setStatuses] = useState<StatusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');

  const loadStatus = useCallback(async () => {
    setLoading(true);
    const { count: total } = await supabase
      .from('translations' as any)
      .select('id', { count: 'exact', head: true });

    const rows: StatusRow[] = [];
    for (const lang of TARGET_LANGS) {
      const col = `${lang}_text`;
      const { count } = await supabase
        .from('translations' as any)
        .select('id', { count: 'exact', head: true })
        .not(col, 'is', null);
      const { data: latest } = await supabase
        .from('translations' as any)
        .select('last_translated')
        .not(col, 'is', null)
        .order('last_translated', { ascending: false })
        .limit(1)
        .maybeSingle();
      rows.push({
        lang,
        total: total || 0,
        translated: count || 0,
        lastAt: (latest as any)?.last_translated || null,
      });
    }
    setStatuses(rows);
    setLoading(false);
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const upsertViRows = async (items: Item[]) => {
    const rows = items.map((it) => ({
      translation_key: it.key,
      vi_text: it.text,
      content_type: it.content_type,
    }));
    for (const c of chunk(rows, 200)) {
      const { error } = await supabase
        .from('translations' as any)
        .upsert(c, { onConflict: 'translation_key' });
      if (error) console.error('upsert vi rows', error);
    }
  };

  const translateOnly = async (langs: Lang[], filterType?: string) => {
    setRunning(true);
    setProgress(0);
    setStatusText('Đang thu thập nội dung...');

    try {
      let items = await collectAll();
      if (filterType) items = items.filter((i) => i.content_type === filterType);
      if (items.length === 0) {
        toast.error('Không có nội dung để dịch');
        return;
      }

      setStatusText(`Lưu ${items.length} mục gốc...`);
      await upsertViRows(items);

      const totalSteps = langs.length * Math.ceil(items.length / BATCH_SIZE);
      let done = 0;

      for (const lang of langs) {
        const batches = chunk(items, BATCH_SIZE);
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          setStatusText(`Dịch ${LANG_LABEL[lang]} — batch ${i + 1}/${batches.length}`);

          const { data, error } = await supabase.functions.invoke('translate-batch', {
            body: {
              items: batch.map((b) => ({ key: b.key, text: b.text })),
              targetLang: lang,
            },
          });

          if (error) {
            console.error(error);
            toast.error(`Lỗi dịch ${lang}: ${error.message}`);
          } else {
            const translations: Record<string, string> = (data as any)?.translations || {};
            const col = `${lang}_text`;
            const updates = batch
              .map((b) => ({
                translation_key: b.key,
                vi_text: b.text,
                content_type: b.content_type,
                [col]: translations[b.key] || null,
                last_translated: new Date().toISOString(),
              }))
              .filter((u) => u[col]);

            if (updates.length > 0) {
              const { error: upErr } = await supabase
                .from('translations' as any)
                .upsert(updates, { onConflict: 'translation_key' });
              if (upErr) console.error('upsert tr', upErr);
            }
          }

          done++;
          setProgress(Math.round((done / totalSteps) * 100));
        }
      }

      setStatusText('✅ Hoàn tất!');
      toast.success('Đã dịch xong toàn bộ');
      await loadStatus();
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi');
    } finally {
      setTimeout(() => setRunning(false), 800);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif">Quản lý ngôn ngữ</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Admin nhập tiếng Việt — bấm 1 nút dịch toàn bộ website sang Anh / Nhật / Trung / Hàn.
          Khi khách chuyển ngôn ngữ, website đọc thẳng từ database (không lag, không gọi AI realtime).
        </p>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Trạng thái bản dịch</h3>
        {loading ? (
          <div className="text-sm text-muted-foreground">Đang tải...</div>
        ) : (
          <div className="space-y-2">
            {statuses.map((s) => {
              const pct = s.total ? Math.round((s.translated / s.total) * 100) : 0;
              const ok = pct >= 90;
              return (
                <div key={s.lang} className="flex items-center justify-between border rounded-md p-3">
                  <div className="flex items-center gap-3">
                    {ok ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    )}
                    <div>
                      <div className="font-medium">{LANG_LABEL[s.lang]}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.translated}/{s.total} mục ({pct}%)
                        {s.lastAt && ` · cập nhật ${new Date(s.lastAt).toLocaleString('vi-VN')}`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-2">Dịch toàn bộ website</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Thời gian ước tính: ~1–3 phút tuỳ số lượng nội dung.
        </p>
        <Button
          size="lg"
          disabled={running}
          onClick={() => translateOnly(TARGET_LANGS)}
          className="gap-2"
        >
          <Globe className="w-5 h-5" />
          Dịch toàn bộ website ngay
        </Button>

        <div className="mt-6 border-t pt-6">
          <h4 className="font-medium mb-3">Hoặc dịch từng phần</h4>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={running} onClick={() => translateOnly(TARGET_LANGS, 'room')}>
              Tên & mô tả phòng
            </Button>
            <Button variant="outline" size="sm" disabled={running} onClick={() => translateOnly(TARGET_LANGS, 'menu')}>
              Menu nhà hàng
            </Button>
            <Button variant="outline" size="sm" disabled={running} onClick={() => translateOnly(TARGET_LANGS, 'service')}>
              Dịch vụ
            </Button>
            <Button variant="outline" size="sm" disabled={running} onClick={() => translateOnly(TARGET_LANGS, 'combo')}>
              Combo
            </Button>
            <Button variant="outline" size="sm" disabled={running} onClick={() => translateOnly(TARGET_LANGS, 'offer')}>
              Ưu đãi
            </Button>
            <Button variant="outline" size="sm" disabled={running} onClick={() => translateOnly(TARGET_LANGS, 'ui')}>
              Text UI tĩnh
            </Button>
            <Button variant="outline" size="sm" disabled={running} onClick={() => translateOnly(TARGET_LANGS, 'page')}>
              Section trang
            </Button>
            <Button variant="outline" size="sm" disabled={running} onClick={() => translateOnly(TARGET_LANGS, 'attraction')}>
              Điểm tham quan
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <Button variant="ghost" size="sm" onClick={loadStatus} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Làm mới trạng thái
          </Button>
        </div>
      </Card>

      {running && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-2xl p-8 w-[90vw] max-w-md text-center shadow-2xl">
            <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin text-primary" />
            <h3 className="font-bold text-xl mb-2">Đang dịch website...</h3>
            <p className="text-muted-foreground text-sm mb-6 min-h-[20px]">{statusText}</p>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="bg-primary h-3 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
            <p className="text-xs text-muted-foreground mt-4">
              Vui lòng giữ trang này mở cho tới khi hoàn tất.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTranslations;
export { shortHash };
