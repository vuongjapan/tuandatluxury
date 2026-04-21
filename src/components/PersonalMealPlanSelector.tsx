import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Minus, Check, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePersonalMealPlans, PersonalMealPlan } from '@/hooks/usePersonalMealPlans';

export interface PersonalMealSelection {
  planId: string;
  name: string;
  price: number;
  items: string[];
  guest_count: number;
  quantity: number;
}

interface Props {
  guestCount: number;
  selections: PersonalMealSelection[];
  onChange: (s: PersonalMealSelection[]) => void;
}

const PersonalMealPlanSelector = ({ guestCount, selections, onChange }: Props) => {
  const { language, formatPrice } = useLanguage();
  const isVi = language === 'vi';
  const { plans, loading, getPlansFor, suggestCombination } = usePersonalMealPlans(true);

  const [n, setN] = useState<number>(Math.max(1, guestCount));
  useEffect(() => { setN(Math.max(1, guestCount)); }, [guestCount]);

  const addPlan = (plan: PersonalMealPlan) => {
    const idx = selections.findIndex(s => s.planId === plan.id);
    if (idx >= 0) {
      const updated = [...selections];
      updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
      onChange(updated);
    } else {
      onChange([...selections, {
        planId: plan.id,
        name: plan.name,
        price: plan.price,
        items: plan.items,
        guest_count: plan.guest_count,
        quantity: 1,
      }]);
    }
  };

  const removeAt = (idx: number) => onChange(selections.filter((_, i) => i !== idx));
  const updateQty = (idx: number, delta: number) => {
    const updated = [...selections];
    const q = Math.max(1, updated[idx].quantity + delta);
    updated[idx] = { ...updated[idx], quantity: q };
    onChange(updated);
  };

  const matched = getPlansFor(n);
  const suggestion = matched.length === 0 ? suggestCombination(n) : [];

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <div>
          <h2 className="font-display text-lg sm:text-xl font-semibold">
            {isVi ? 'Suất ăn theo số người' : 'Meals by group size'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isVi ? 'Chọn số người ăn — hệ thống tự gợi ý suất ăn phù hợp' : 'Pick the number of diners — we suggest the right plan'}
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-3 bg-muted/40 rounded-lg p-3">
        <span className="text-sm font-medium">{isVi ? 'Số người ăn:' : 'Diners:'}</span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setN(Math.max(1, n - 1))}>
          <Minus className="h-3 w-3" />
        </Button>
        <span className="font-bold text-lg w-10 text-center tabular-nums">{n}</span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setN(n + 1)}>
          <Plus className="h-3 w-3" />
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          {isVi ? `Đoàn của bạn: ${guestCount} khách` : `Your group: ${guestCount} guests`}
        </span>
      </div>

      {/* Selected list */}
      {selections.length > 0 && (
        <div className="space-y-2">
          {selections.map((sel, idx) => (
            <motion.div
              key={`${sel.planId}-${idx}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/5 border border-primary/40 rounded-lg p-3 flex items-center gap-3"
            >
              <Check className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{sel.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {sel.guest_count} {isVi ? 'người' : 'guests'} · {sel.items.slice(0, 3).join(' • ')}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(idx, -1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="font-bold text-sm w-6 text-center">{sel.quantity}</span>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(idx, 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <span className="text-primary font-bold text-sm shrink-0 w-24 text-right">
                {formatPrice(sel.price * sel.quantity)}
              </span>
              <button onClick={() => removeAt(idx)} className="text-muted-foreground hover:text-destructive shrink-0 text-sm" aria-label="Remove">✕</button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="animate-pulse space-y-2">
          <div className="h-20 bg-muted rounded-lg" />
          <div className="h-20 bg-muted rounded-lg" />
        </div>
      )}

      {/* Matching plans */}
      {!loading && matched.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {matched.map(plan => (
            <motion.div
              key={plan.id}
              whileHover={{ y: -2 }}
              className="rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all overflow-hidden bg-card"
            >
              {plan.image_url && (
                <img src={plan.image_url} alt={plan.name} loading="lazy" className="w-full h-32 object-cover" />
              )}
              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-display font-bold text-foreground text-sm">{plan.name}</h4>
                  <span className="text-primary font-bold text-sm whitespace-nowrap">{formatPrice(plan.price)}</span>
                </div>
                {plan.items.length > 0 && (
                  <ol className="space-y-0.5 text-xs text-muted-foreground">
                    {plan.items.map((d, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-bold text-foreground/40 w-4 shrink-0 text-right">{i + 1}.</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ol>
                )}
                {plan.note && <p className="text-[11px] italic text-muted-foreground">{plan.note}</p>}
                <Button variant="gold" size="sm" className="w-full gap-1" onClick={() => addPlan(plan)}>
                  <Plus className="h-3.5 w-3.5" /> {isVi ? 'Chọn suất này' : 'Pick this plan'}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* No matching plans */}
      {!loading && matched.length === 0 && (
        <div className="bg-muted/40 border border-dashed border-border rounded-lg p-4 text-sm space-y-2">
          {suggestion.length > 0 ? (
            <>
              <p className="font-medium text-foreground">
                💡 {isVi
                  ? `Chưa có suất riêng cho ${n} người. Gợi ý kết hợp:`
                  : `No dedicated plan for ${n}. Suggested combination:`}
              </p>
              <p className="text-muted-foreground">
                {suggestion.join(' + ')} {isVi ? 'người' : 'guests'} ({isVi ? 'chọn từng suất bên dưới' : 'select each plan below'})
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[...new Set(suggestion)].map(g => (
                  <Button key={g} variant="outline" size="sm" className="text-xs h-7" onClick={() => setN(g)}>
                    {isVi ? `Xem suất ${g} người` : `View ${g}-guest plans`}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 text-primary" />
              <span>
                {isVi
                  ? 'Chưa có suất phù hợp — liên hệ nhà hàng để tư vấn: '
                  : 'No matching plan — please call the restaurant: '}
                <a href="tel:0384418811" className="text-primary font-bold hover:underline">038.441.8811</a>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PersonalMealPlanSelector;
