import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onClose: () => void;
  feePercent: number; // 0-100
  pick: (vi: string, en: string) => string;
}

const RoomSelectionHelpPopup = ({ open, onClose, feePercent, pick }: Props) => {
  const suggestions = [
    { adults: 4, options: ['1 Phòng Đôi', '2 Phòng Đơn'] },
    { adults: '4 NL + 3 TE', options: ['1 Phòng Đôi (chỉ tính 4 người lớn)', 'Trẻ em ở chung, không phụ thu'] },
    { adults: 6, options: ['1 Phòng Đôi + 1 Phòng Đơn', '3 Phòng Đơn'] },
    { adults: 8, options: ['2 Phòng Đôi', '1 Phòng Đôi + 2 Phòng Đơn'] },
    { adults: 10, options: ['2 Phòng Đôi + 1 Phòng Đơn', '1 Phòng Đôi + 3 Phòng Đơn'] },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[480px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            🏨 {pick('Hướng dẫn chọn phòng', 'Room selection guide')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Section 1 — Rules */}
          <div className="bg-muted/40 rounded-lg p-3 space-y-1.5">
            <p>🛏 <strong>{pick('Phòng Đơn', 'Single Room')}</strong> → {pick('tối đa 2 người lớn', 'max 2 adults')}</p>
            <p>🛏 <strong>{pick('Phòng Đôi', 'Double Room')}</strong> → {pick('tối đa 4 người lớn', 'max 4 adults')}</p>
            <p className="text-xs text-muted-foreground pt-1">
              👶 {pick(
                'Trẻ em: không tính vào số người khi chọn phòng. Ở chung phòng bố mẹ, miễn phí hoàn toàn.',
                'Children are not counted when selecting rooms. Free of charge when staying with parents.'
              )}
            </p>
          </div>

          {/* Section 2 — Suggestions */}
          <div>
            <h4 className="font-semibold mb-2">{pick('Gợi ý phổ biến', 'Common suggestions')}</h4>
            <p className="text-[11px] text-muted-foreground italic mb-2">
              * {pick('Chỉ tính người lớn, trẻ em ở chung', 'Adults only, children stay together')}
            </p>
            <div className="space-y-2.5">
              {suggestions.map((s, i) => (
                <div key={i} className="border border-border rounded-lg p-2.5">
                  <p className="font-medium text-sm mb-1">👥 {typeof s.adults === 'number' ? `${s.adults} NL` : s.adults}</p>
                  <ul className="space-y-0.5 text-xs text-muted-foreground">
                    {s.options.map((o, j) => (
                      <li key={j}>✔ {o}</li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-muted-foreground/80 italic mt-1">
                    * {pick('Trẻ em ở chung, không cần đặt thêm phòng', 'Children stay together, no extra room needed')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3 — Surcharge */}
          {feePercent > 0 ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-3 text-xs space-y-1">
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                ⚠ {pick(
                  `Khách vượt định mức sẽ tính thêm ${feePercent}%/khách/đêm`,
                  `Extra guests are charged ${feePercent}%/guest/night`
                )}
              </p>
              <p className="text-amber-700 dark:text-amber-400">
                {pick(
                  `Ví dụ: Phòng Đôi (4 người lớn) nhưng ở 5 người lớn → 1 khách vượt → phụ thu thêm ${feePercent}% tiền phòng`,
                  `E.g. Double Room (4 adults) with 5 adults → 1 extra → +${feePercent}% room fee`
                )}
              </p>
            </div>
          ) : (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700 rounded-lg p-3 text-xs">
              ✅ {pick('Hiện không phụ thu thêm', 'No extra surcharge currently')}
            </div>
          )}

          {/* Section 4 — Notes */}
          <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
            <p>👶 {pick('Trẻ em: miễn phí, không tính vào số người đặt phòng', 'Children: free, not counted in room booking')}</p>
            <p>🍳 {pick('Giá đã bao gồm buffet sáng', 'Price includes breakfast buffet')}</p>
            <p>🕐 {pick('Check-in: 14:00 | Check-out: 12:00', 'Check-in: 14:00 | Check-out: 12:00')}</p>
          </div>

          <Button variant="gold" className="w-full" onClick={onClose}>
            {pick('Đã hiểu', 'Got it')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomSelectionHelpPopup;
