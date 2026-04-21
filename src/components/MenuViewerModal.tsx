import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Phone, Check } from 'lucide-react';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useLanguage } from '@/contexts/LanguageContext';
import PriceDisplay from '@/components/PriceDisplay';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Optional confirm button (e.g. "Pick this set") that closes the modal. */
  onConfirm?: () => void;
  confirmLabel?: string;
  title?: string;
}

const CAT_LABELS: Record<string, string> = {
  breakfast: '🍳 Ăn sáng',
  main: '🍚 Cơm',
  seafood: '🦐 Hải sản',
  shellfish: '🦪 Hàu - Sò',
  hotpot: '🍲 Lẩu',
  fish: '🐟 Cá',
  chicken: '🍗 Gà',
  meat: '🥩 Thịt',
  soup: '🍜 Canh',
  vegetable: '🥬 Rau',
  snack: '🍿 Ăn vặt',
  combo: '🥘 Combo',
  drink: '🥤 Đồ uống',
  drinks: '🥤 Đồ uống',
  dessert: '🍰 Tráng miệng',
  bbq: '🥩 BBQ',
  other: '📦 Khác',
};

const MenuViewerModal = ({ open, onClose, onConfirm, confirmLabel, title }: Props) => {
  const { allItems, loading } = useMenuItems();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach((i) => i.category && set.add(i.category));
    return Array.from(set);
  }, [allItems]);

  const filtered = useMemo(() => {
    let list = allItems;
    if (selectedCat) list = list.filter((i) => i.category === selectedCat);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name_vi.toLowerCase().includes(q) ||
          (i.name_en || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allItems, selectedCat, search]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-4 sm:p-5 border-b border-border shrink-0">
          <DialogTitle className="font-display text-lg sm:text-xl">
            🍽️ {title || (isVi ? 'Thực đơn nhà hàng Tuấn Đạt' : 'Tuấn Đạt restaurant menu')}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {isVi
              ? 'Cập nhật trực tiếp từ nhà hàng · Phục vụ 07:00–21:30'
              : 'Live data from the restaurant · Open 07:00–21:30'}
          </p>
        </DialogHeader>

        {/* Search + filter */}
        <div className="p-3 sm:p-4 border-b border-border space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isVi ? 'Tìm món ăn...' : 'Search dishes...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            <Button
              variant={selectedCat === null ? 'default' : 'outline'}
              size="sm"
              className="text-xs shrink-0"
              onClick={() => setSelectedCat(null)}
            >
              {isVi ? 'Tất cả' : 'All'}
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCat === cat ? 'default' : 'outline'}
                size="sm"
                className="text-xs shrink-0"
                onClick={() => setSelectedCat(cat)}
              >
                {CAT_LABELS[cat] || cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {loading && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {isVi ? 'Đang tải thực đơn...' : 'Loading menu...'}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {isVi ? 'Không có món phù hợp' : 'No matching dishes'}
            </div>
          )}
          {filtered.map((item) => {
            const priceType = (item as any).price_type || 'fixed';
            const hasVariants = item.price_variants && item.price_variants.length > 0;
            return (
              <div
                key={item.id}
                className="flex gap-3 p-2.5 rounded-lg border border-border hover:border-primary/40 transition-colors"
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={isVi ? item.name_vi : item.name_en}
                    loading="lazy"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {isVi ? item.name_vi : item.name_en || item.name_vi}
                      </p>
                      {item.category && (
                        <Badge variant="outline" className="text-[10px] mt-0.5">
                          {CAT_LABELS[item.category] || item.category}
                        </Badge>
                      )}
                    </div>
                    {!hasVariants && (
                      <PriceDisplay
                        price={item.price_vnd}
                        priceType={priceType}
                        className="text-primary font-bold text-sm whitespace-nowrap"
                      />
                    )}
                  </div>
                  {(isVi ? item.description_vi : item.description_en) && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {isVi ? item.description_vi : item.description_en}
                    </p>
                  )}
                  {hasVariants && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {item.price_variants!.map((v) => (
                        <span
                          key={v.id}
                          className="text-[11px] bg-secondary rounded px-2 py-0.5 inline-flex items-center gap-1"
                        >
                          {isVi ? v.label_vi : v.label_en}:{' '}
                          <PriceDisplay
                            price={v.price_vnd}
                            priceType={priceType}
                            className="font-semibold text-primary"
                            compact
                          />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-border bg-secondary/40 shrink-0 flex items-center justify-between gap-3">
          <a
            href="tel:0384418811"
            className="text-xs sm:text-sm text-primary font-semibold inline-flex items-center gap-1.5"
          >
            <Phone className="h-3.5 w-3.5" /> 038.441.8811
          </a>
          {onConfirm ? (
            <Button variant="gold" size="sm" onClick={onConfirm} className="gap-1.5">
              <Check className="h-4 w-4" /> {confirmLabel || (isVi ? 'Xác nhận' : 'Confirm')}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onClose}>
              {isVi ? 'Đóng' : 'Close'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MenuViewerModal;
