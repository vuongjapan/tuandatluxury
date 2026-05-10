import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useMenuItems } from '@/hooks/useMenuItems';

const BUDGETS = [
  { key: 'low', label: 'Dưới 200k', min: 0, max: 200000 },
  { key: 'mid', label: '200k–500k', min: 200000, max: 500000 },
  { key: 'high', label: '500k–1tr', min: 500000, max: 1000000 },
  { key: 'lux', label: 'Trên 1tr', min: 1000000, max: 99000000 },
];
const TASTES = ['Hải sản', 'Lẩu', 'Nướng', 'Chay'];
const fmt = (n: number) => n.toLocaleString('vi-VN') + 'đ';

export default function RestaurantBudgetModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [people, setPeople] = useState(4);
  const [budget, setBudget] = useState('mid');
  const [tastes, setTastes] = useState<string[]>(['Hải sản']);
  const [showResult, setShowResult] = useState(false);
  const { allItems, loading } = useMenuItems();

  const range = BUDGETS.find((b) => b.key === budget)!;
  const perPerson = (range.min + range.max) / 2;
  const targetTotal = perPerson * people;

  const suggestions = useMemo(() => {
    if (!allItems.length) return [];
    const tasteLower = tastes.map((t) => t.toLowerCase());
    const matched = allItems.filter((i) => {
      const text = (i.name_vi + ' ' + (i.description_vi || '') + ' ' + i.category).toLowerCase();
      return tasteLower.length === 0 || tasteLower.some((t) => text.includes(t));
    });
    const pool = (matched.length ? matched : allItems).filter(
      (i) => i.price_vnd > 0 && i.price_vnd <= range.max
    );
    // Greedy pick to fit budget
    const sorted = [...pool].sort((a, b) => b.price_vnd - a.price_vnd);
    const picked: typeof sorted = [];
    let total = 0;
    for (const it of sorted) {
      if (total + it.price_vnd <= targetTotal * 1.1) {
        picked.push(it);
        total += it.price_vnd;
      }
      if (picked.length >= 6) break;
    }
    return picked;
  }, [allItems, tastes, range, targetTotal]);

  const total = suggestions.reduce((s, i) => s + i.price_vnd, 0);

  const toggle = (t: string) =>
    setTastes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const reset = () => { setShowResult(false); };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">💰 Tư vấn menu theo ngân sách</DialogTitle>
        </DialogHeader>
        {!showResult ? (
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Số người</Label>
              <Input type="number" min={1} value={people} onChange={(e) => setPeople(Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs">Ngân sách / người</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {BUDGETS.map((b) => (
                  <label key={b.key} className={`p-3 rounded-lg border cursor-pointer text-sm text-center ${budget === b.key ? 'border-primary bg-primary/5 font-semibold' : 'border-border'}`}>
                    <input type="radio" className="hidden" checked={budget === b.key} onChange={() => setBudget(b.key)} />
                    {b.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Sở thích</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {TASTES.map((t) => (
                  <label key={t} className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer text-sm hover:bg-secondary">
                    <input type="checkbox" checked={tastes.includes(t)} onChange={() => toggle(t)} />
                    {t}
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={() => setShowResult(true)} disabled={loading} className="w-full font-bold py-5">
              Xem gợi ý menu →
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Cho <b>{people} người</b> · Ngân sách <b>{range.label}/người</b> (≈ {fmt(targetTotal)})
            </p>
            {suggestions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Chưa có gợi ý phù hợp. Vui lòng liên hệ nhà hàng.</p>
            ) : (
              <div className="space-y-2">
                {suggestions.map((it) => (
                  <div key={it.id} className="flex justify-between items-center p-2 border-b border-border text-sm">
                    <span>{it.name_vi}</span>
                    <span className="font-semibold text-primary">{fmt(it.price_vnd)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center p-3 bg-secondary rounded-lg font-bold">
                  <span>Tổng tạm tính:</span>
                  <span className="text-primary">{fmt(total)}</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setShowResult(false)}>← Sửa</Button>
              <Button onClick={() => { reset(); onClose(); }}>Đóng</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
