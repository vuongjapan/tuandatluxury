import { useState, useCallback } from 'react';
import { Sparkles, Search, Loader2, Wallet, Heart, Users, Briefcase, Waves, Crown, Baby } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
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
  /** Optional: rooms to filter immediately on home page (without redirect). */
  rooms?: Room[];
  /** Called with the final filtered room ids + intent. */
  onResults?: (filteredIds: string[], intent: SearchIntent) => void;
  /** Compact look (no big background gradient). */
  compact?: boolean;
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

/** Filter rooms based on intent (rule-based, no extra AI calls). */
function applyIntentToRooms(rooms: Room[], intent: SearchIntent): Room[] {
  let result = [...rooms];

  // Budget filter
  if (intent.budget_tier && intent.budget_tier !== 'any') {
    const max = { under_500k: 500_000, '500k_1m': 1_000_000, '1m_2m': 2_000_000, luxury: Infinity }[intent.budget_tier]!;
    const min = intent.budget_tier === 'luxury' ? 2_000_000 : 0;
    result = result.filter((r) => r.priceVND >= min && r.priceVND <= max);
  }

  // Guest filter (allow up to capacity*1.5 for upsell)
  if (intent.guests && intent.guests > 0) {
    result = result.filter((r) => r.capacity >= intent.guests! - 1);
  }

  // Vibe filter
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

  return result.length > 0 ? result : rooms;
}

const SmartSearchBox = ({ rooms = [], onResults, compact = false }: SmartSearchBoxProps) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isVi = language === 'vi';

  const [query, setQuery] = useState('');
  const [budgetTier, setBudgetTier] = useState<BudgetTier>('any');
  const [vibes, setVibes] = useState<Set<Vibe>>(new Set());
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const toggleVibe = (v: Vibe) => {
    setVibes((prev) => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  };

  const runSearch = useCallback(async () => {
    // Build base intent from chips
    let intent: SearchIntent = {
      budget_tier: budgetTier,
      vibes: Array.from(vibes),
      explanation: '',
    };

    // If user typed something, parse via AI for richer intent
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
          // Merge AI intent (AI wins for fields it returned)
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

    // Apply to rooms locally
    if (rooms.length > 0 && onResults) {
      const filtered = applyIntentToRooms(rooms, intent);
      onResults(filtered.map((r) => r.id), intent);
    } else if (onResults) {
      onResults([], intent);
    }
  }, [query, budgetTier, vibes, rooms, onResults, isVi, toast]);

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
        <div className="flex-1">
          <h3 className="font-display text-sm sm:text-base font-semibold text-foreground">
            {isVi ? 'Tìm phòng thông minh' : 'Smart Room Finder'}
          </h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {isVi
              ? 'Mô tả nhu cầu của bạn — AI sẽ gợi ý phòng phù hợp'
              : 'Describe your needs — AI will suggest matching rooms'}
          </p>
        </div>
      </div>

      {/* NL input */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            placeholder={
              isVi
                ? 'VD: 4 người 2 ngày, gần biển, ngân sách 5 triệu'
                : 'e.g. 4 guests 2 nights, sea view, budget 5M'
            }
            className="pl-9 h-11 text-sm"
            maxLength={500}
          />
        </div>
        <Button
          variant="gold"
          onClick={runSearch}
          disabled={loading}
          className="h-11 px-5 gap-1.5"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isVi ? 'Tìm' : 'Find'}
        </Button>
      </div>

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

      {/* Vibe chips */}
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

      {/* AI explanation */}
      {explanation && (
        <div className="mt-3 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-foreground/80 leading-relaxed flex items-start gap-1.5">
            <Sparkles className="h-3 w-3 text-primary mt-0.5 shrink-0" />
            <span>{explanation}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default SmartSearchBox;
