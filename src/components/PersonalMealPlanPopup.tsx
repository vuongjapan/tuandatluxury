import { Info, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PersonalMealPlan } from '@/hooks/usePersonalMealPlans';

interface Props {
  open: boolean;
  onClose: () => void;
  plan: PersonalMealPlan | null;
  guestLabel: string;
  onSelect?: (plan: PersonalMealPlan) => void;
}

const PersonalMealPlanPopup = ({ open, onClose, plan, guestLabel, onSelect }: Props) => {
  const { language, formatPrice } = useLanguage();
  const isVi = language === 'vi';

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 font-display text-xl">
            <span>{plan.name}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              <Users className="h-3.5 w-3.5" />
              {guestLabel}
            </span>
            <span className="text-sm font-semibold text-primary">{formatPrice(plan.price)}</span>
          </DialogTitle>
        </DialogHeader>

        {plan.image_url ? (
          <img
            src={plan.image_url}
            alt={plan.name}
            className="w-full max-h-64 rounded-lg object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <Info className="h-4 w-4 text-primary" />
            <span>{isVi ? 'Chưa có ảnh minh hoạ cho suất ăn này.' : 'No preview image for this meal plan yet.'}</span>
          </div>
        )}

        {plan.note && <p className="text-sm leading-relaxed text-muted-foreground">{plan.note}</p>}

        <div className="space-y-2 rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {isVi ? 'Danh sách món đầy đủ' : 'Full dish list'}
          </p>
          <ul className="space-y-1.5 text-sm text-foreground/90">
            {plan.items.map((item, index) => (
              <li key={`${plan.id}-${index}`} className="flex items-start gap-2">
                <span className="mt-0.5 text-primary">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-2">
          <Button variant="outline" onClick={onClose}>
            {isVi ? 'Đóng' : 'Close'}
          </Button>
          {onSelect && (
            <Button
              variant="gold"
              onClick={() => {
                onSelect(plan);
                onClose();
              }}
            >
              {isVi ? 'Chọn suất này' : 'Choose this plan'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PersonalMealPlanPopup;