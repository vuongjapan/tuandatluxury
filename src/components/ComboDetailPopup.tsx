import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ComboPackage, ComboMenu, ComboMenuDish } from '@/hooks/useComboPackages';
import { CheckCircle2, Utensils } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  pkg: ComboPackage | null;
  menus: ComboMenu[];
  getDishesByMenu: (menuId: string) => ComboMenuDish[];
  onSelect?: (pkgId: string) => void;
}

const ComboDetailPopup = ({ open, onClose, pkg, menus, getDishesByMenu, onSelect }: Props) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  if (!pkg) return null;

  const sorted = [...menus].sort((a, b) => a.menu_number - b.menu_number);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            🍽 {pkg.name}
            <span className="text-sm font-semibold text-primary tabular-nums">
              {pkg.price_per_person.toLocaleString('vi-VN')}đ/{isVi ? 'suất' : 'pax'}
            </span>
          </DialogTitle>
        </DialogHeader>

        {pkg.image_url && (
          <img
            src={pkg.image_url}
            alt={pkg.name}
            className="w-full max-h-56 object-cover rounded-lg"
            loading="lazy"
          />
        )}

        {(isVi ? pkg.description_vi : pkg.description_en || pkg.description_vi) && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isVi ? pkg.description_vi : pkg.description_en || pkg.description_vi}
          </p>
        )}

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {isVi
              ? `${sorted.length} thực đơn — ${pkg.dishes_per_menu} món / thực đơn`
              : `${sorted.length} menus — ${pkg.dishes_per_menu} dishes per menu`}
          </p>

          {sorted.map((m) => {
            const dishes = getDishesByMenu(m.id);
            return (
              <div key={m.id} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Utensils className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-sm">
                    {isVi
                      ? `Thực đơn ${m.menu_number} — ${m.name_vi}`
                      : `Menu ${m.menu_number} — ${m.name_en || m.name_vi}`}
                  </h4>
                </div>
                {m.image_url && (
                  <img
                    src={m.image_url}
                    alt={m.name_vi}
                    className="w-full max-h-40 object-cover rounded mb-2"
                    loading="lazy"
                  />
                )}
                {dishes.length > 0 ? (
                  <ul className="space-y-1">
                    {dishes.map((d) => (
                      <li
                        key={d.id}
                        className="text-sm text-foreground/90 flex items-start gap-2"
                      >
                        <span className="text-primary mt-0.5">•</span>
                        <span>{isVi ? d.name_vi : d.name_en || d.name_vi}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    {isVi ? 'Chưa cập nhật món' : 'No dishes yet'}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            {isVi ? 'Đóng' : 'Close'}
          </Button>
          {onSelect && (
            <Button
              onClick={() => {
                onSelect(pkg.id);
                onClose();
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              {isVi ? 'Chọn combo này' : 'Select this combo'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComboDetailPopup;
