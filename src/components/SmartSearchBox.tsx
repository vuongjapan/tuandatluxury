import { useState, useCallback, useRef } from 'react';
import { Sparkles, Search, Loader2, Wallet, Heart, Users, Briefcase, Waves, Crown, Baby, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { logSearch } from '@/lib/tracking';
import type { Room } from '@/data/rooms';

export type BudgetTier = 'any' | 'under_500k' | '500k_1m' | '1m_2m' | 'luxury';
export type Vibe = 'sea_view' | 'couple' | 'family' | 'group' | 'luxury' | 'budget' | 'business' | 'relax';

export interface SearchIntent {
  guests?: number;
  nights?: number;
  budget_total?: number;
  budget_tier: BudgetTier;
  vibes: Vibe[];
  explanation: string;
}

interface SmartSearchBoxProps {
  rooms?: Room[];
  onResults?: (filteredIds: string[], intent: SearchIntent) => void;
  compact?: boolean;
  /** Optional CSS selector to scroll to after a successful search (e.g. '#rooms') */
  scrollTargetSelector?: string;
}

const BUDGET_OPTIONS: { tier: BudgetTier; labelVi: string; labelEn: string }[] = [
  { tier: 'under_500k', labelVi: 'Dưới 500k', labelEn: 'Under 500k' },
  { tier: '500k_1m', labelVi: '500k–1tr', labelEn: '500k–1M' },
  { tier: '1m_2m', labelVi: '1–2 triệu', labelEn: '1M–2M' },
  { tier: 'luxury', labelVi: 'Cao cấp', labelEn: 'Luxury' },
];

const VIBE_OPTIONS: { vibe: Vibe; labelVi: string; labelEn: string; Icon: typeof Heart }[] = [
  { vibe: 'couple', labelVi: 'Cặp đôi', labelEn: 'Couple', Icon: Heart },
  { vibe: 'family', labelVi: 'Gia đình', labelEn: 'Family', Icon: Baby },
  { vibe: 'group', labelVi: 'Đoàn đông', labelEn: 'Group', Icon: Users },
  { vibe: 'sea_view', labelVi: 'Gần biển', labelEn: 'Sea view', Icon: Waves },
  { vibe: 'luxury', labelVi: 'Sang trọng', labelEn: 'Luxury', Icon: Crown },
  { vibe: 'business', labelVi: 'Công tác', labelEn: 'Business', Icon: Briefcase },
];

const SUGGESTIONS_VI = [
  '4 người 5 triệu 2 đêm gần biển',
  'Honeymoon cuối tuần phòng đẹp',
  'Gia đình có trẻ nhỏ, ngân sách 2 triệu',
  'Đoàn 20 người công ty',
];
const SUGGESTIONS_EN = [
  '4 guests 5M 2 nights, sea view',
  'Honeymoon weekend, beautiful room',
  'Family with kids, budget 2M',
  '20-person company group',
];

function applyIntentToRooms(rooms: Room[], intent: SearchIntent): Room[] {
  let result = [...rooms];

  if (intent.budget_tier && intent.budget_tier !== 'any') {
    const max = { under_500k: 500_000, '500k_1m': 1_000_000, '1m_2m': 2_000_000, luxury: Infinity }[intent.budget_tier]!;
    const min = intent.budget_tier === 'luxury' ? 2_000_000 : 0;
    result = result.filter((r) => r.priceVND >= min && r.priceVND <= max);
  }

  if (intent.guests && intent.guests > 0) {
    result = result.filter((r) => r.capacity >= intent.guests! - 1);
  }

  if (intent.vibes?.includes('sea_view')) {
    const seaRooms = result.filter((r) => /biển|sea|view/i.test(r.viewType) || r.hasBalcony);
    if (seaRooms.length > 0) result = seaRooms;
  }
  if (intent.vibes?.includes('family') || intent.vibes?.includes('group')) {
    result.sort((a, b) => b.capacity - a.capacity);
  }
  if (intent.vibes?.includes('luxury')) {
    result.sort((a, b) => b.priceVND - a.priceVND);
  }
  if (intent.vibes?.includes('budget')) {
    result.sort((a, b) => a.priceVND - b.priceVND);
  }

  return result;
}

const SmartSearchBox = ({ rooms = [], onResults, compact = false, scrollTargetSelector }: SmartSearchBoxProps) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isVi = language === 'vi';

  const [query, setQuery] = useState('');
  const [budgetTier, setBudgetTier] = useState<BudgetTier>('any');
  const [vibes, setVibes] = useState<Set<Vibe>>(new Set());
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [resultCount, setResultCount] = useState<number | null>(null);
  const [hasFiltered, setHasFiltered] = useState(false);
  const lastIntentRef = useRef<SearchIntent | null>(null);

  const toggleVibe = (v: Vibe) => {
    setVibes((prev) => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  };

  const hasActiveFilters = budgetTier !== 'any' || vibes.size > 0 || query.trim().length > 0;

  const reset = useCallback(() => {
    setQuery('');
    setBudgetTier('any');
    setVibes(new Set());
    setExplanation(null);
    setResultCount(null);
    setHasFiltered(false);
    lastIntentRef.current = null;
    onResults?.([], { budget_tier: 'any', vibes: [], explanation: '' });
  }, [onResults]);

  const runSearch = useCallback(async () => {
    let intent: SearchIntent = {
      budget_tier: budgetTier,
      vibes: Array.from(vibes),
      explanation: '',
    };

    if (query.trim().length >= 3) {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('smart-search', {
          body: { query: query.trim() },
        });
        if (error) throw error;
        if (data?.error === 'rate_limited') {
          toast({ title: isVi ? 'Quá nhiều yêu cầu' : 'Rate limited', description: isVi ? 'Vui lòng thử lại sau giây lát' : 'Please retry in a moment' });
        } else if (data?.error === 'credits_exhausted') {
          toast({ variant: 'destructive', title: isVi ? 'Hết credit AI' : 'AI credits exhausted', description: isVi ? 'Liên hệ admin để nạp thêm' : 'Contact admin to top up' });
        } else if (data?.intent) {
          const ai = data.intent as SearchIntent;
          intent = {
            ...intent,
            ...ai,
            vibes: Array.from(new Set([...(intent.vibes || []), ...(ai.vibes || [])])),
            budget_tier: ai.budget_tier !== 'any' ? ai.budget_tier : intent.budget_tier,
          };
          setExplanation(ai.explanation || null);
        }
      } catch (e) {
        console.error('smart-search invoke error:', e);
        toast({ variant: 'destructive', title: isVi ? 'Lỗi tìm kiếm' : 'Search error' });
      } finally {
        setLoading(false);
      }
    } else {
      setExplanation(null);
    }

    lastIntentRef.current = intent;
    setHasFiltered(true);

    if (rooms.length > 0) {
      const filtered = applyIntentToRooms(rooms, intent);
      setResultCount(filtered.length);
      onResults?.(filtered.length > 0 ? filtered.map((r) => r.id) : [], intent);

      // Log search for analytics (fire-and-forget)
      logSearch({
        keyword: query.trim() || undefined,
        budget: intent.budget_total,
        people_count: intent.guests,
        zone: intent.vibes?.includes('sea_view') ? 'gan_bien' : undefined,
        vibes: intent.vibes,
        result_count: filtered.length,
      });

      if (filtered.length > 0 && scrollTargetSelector) {
        setTimeout(() => {
          const el = document.querySelector(scrollTargetSelector);
          if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top, behavior: 'smooth' });
          }
        }, 150);
      }
    } else {
      onResults?.([], intent);
    }
  }, [query, budgetTier, vibes, rooms, onResults, isVi, toast, scrollTargetSelector]);

  return (
    <div
      className={cn(
        'rounded-2xl border border-primary/20',
        compact ? 'bg-card p-4' : 'bg-gradient-to-br from-card via-card to-primary/5 p-5 sm:p-6 shadow-card',
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-sm sm:text-base font-semibold text-foreground">
            {isVi ? 'Tìm phòng thông minh' : 'Smart Room Finder'}
          </h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {isVi ? 'Mô tả nhu cầu — AI sẽ gợi ý phòng phù hợp' : 'Describe your needs — AI will suggest matching rooms'}
          </p>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={reset} className="h-7 text-[11px] gap-1">
            <X className="h-3 w-3" />
            {isVi ? 'Xoá bộ lọc' : 'Clear'}
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            placeholder={isVi ? 'VD: 4 người 2 đêm gần biển 5 triệu' : 'e.g. 4 guests 2 nights sea view 5M'}
            className="pl-9 h-11 text-sm"
            maxLength={500}
          />
        </div>
        <Button variant="gold" onClick={runSearch} disabled={loading} className="h-11 px-5 gap-1.5">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          <span className="hidden sm:inline">{isVi ? 'Tìm' : 'Find'}</span>
        </Button>
      </div>

      {/* Quick suggestions */}
      {!hasFiltered && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(isVi ? SUGGESTIONS_VI : SUGGESTIONS_EN).map((s) => (
            <button
              key={s}
              onClick={() => { setQuery(s); }}
              className="text-[10px] px-2.5 py-1 rounded-full bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors border border-transparent hover:border-primary/30"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Budget chips */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mr-1">
          <Wallet className="h-3 w-3" /> {isVi ? 'Ngân sách' : 'Budget'}
        </span>
        {BUDGET_OPTIONS.map((b) => (
          <button
            key={b.tier}
            onClick={() => setBudgetTier((prev) => (prev === b.tier ? 'any' : b.tier))}
            className={cn(
              'text-[10px] px-2.5 py-1 rounded-full border transition-colors',
              budgetTier === b.tier
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary/50',
            )}
          >
            {isVi ? b.labelVi : b.labelEn}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mr-1">
          <Heart className="h-3 w-3" /> {isVi ? 'Nhu cầu' : 'Vibe'}
        </span>
        {VIBE_OPTIONS.map(({ vibe, labelVi, labelEn, Icon }) => (
          <button
            key={vibe}
            onClick={() => toggleVibe(vibe)}
            className={cn(
              'inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full border transition-colors',
              vibes.has(vibe)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary/50',
            )}
          >
            <Icon className="h-3 w-3" />
            {isVi ? labelVi : labelEn}
          </button>
        ))}
      </div>

      {/* Result banner */}
      {hasFiltered && resultCount !== null && (
        <div className={cn(
          'mt-3 p-3 rounded-lg border flex items-start gap-2',
          resultCount > 0
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300/50 dark:border-emerald-700/50'
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-300/50 dark:border-amber-700/50',
        )}>
          {resultCount > 0 ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-xs font-semibold',
              resultCount > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300',
            )}>
              {resultCount > 0
                ? (isVi ? `Tìm thấy ${resultCount} phòng phù hợp` : `Found ${resultCount} matching rooms`)
                : (isVi ? 'Không có phòng khớp — hiển thị tất cả phòng' : 'No exact match — showing all rooms')}
            </p>
            {explanation && (
              <p className="text-[11px] text-foreground/70 mt-1 leading-relaxed">{explanation}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartSearchBox;
