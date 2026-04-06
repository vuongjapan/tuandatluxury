import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ItemOption {
  id: string;
  name: string;
  price: number;
  type: 'room' | 'food' | 'combo';
}

interface Props {
  appliesTo: string; // 'all' | 'room' | 'food'
  appliesToItems: string[]; // specific item IDs, empty = all in category
  rooms: { id: string; name_vi: string; price_vnd: number }[];
  menuItems: { id: string; name_vi: string; price_vnd: number; category?: string }[];
  diningItems: { id: string; name_vi: string; price_vnd: number }[];
  onChangeAppliesTo: (v: string) => void;
  onChangeItems: (items: string[]) => void;
}

const fmt = (n: number) => n?.toLocaleString('vi-VN') + '₫';

const PromotionItemSelector = ({ appliesTo, appliesToItems, rooms, menuItems, diningItems, onChangeAppliesTo, onChangeItems }: Props) => {
  const [expanded, setExpanded] = useState(false);

  const allItems: ItemOption[] = [
    ...rooms.map(r => ({ id: r.id, name: r.name_vi, price: r.price_vnd, type: 'room' as const })),
    ...menuItems.filter(m => m.price_vnd > 0).map(m => ({ id: m.id, name: m.name_vi, price: m.price_vnd, type: 'food' as const })),
    ...diningItems.filter(d => d.price_vnd > 0).map(d => ({ id: d.id, name: d.name_vi, price: d.price_vnd, type: 'combo' as const })),
  ];

  const filteredItems = appliesTo === 'room' ? allItems.filter(i => i.type === 'room')
    : appliesTo === 'food' ? allItems.filter(i => i.type === 'food' || i.type === 'combo')
    : allItems;

  const isAllSelected = appliesToItems.length === 0;

  const toggleItem = (id: string) => {
    if (appliesToItems.includes(id)) {
      onChangeItems(appliesToItems.filter(i => i !== id));
    } else {
      onChangeItems([...appliesToItems, id]);
    }
  };

  const selectAll = () => onChangeItems([]);
  const selectNone = () => onChangeItems(['__none__']);

  const categoryButtons = [
    { value: 'all', label: '🏨🍽️ Tất cả', desc: 'Phòng + Đồ ăn' },
    { value: 'room', label: '🏨 Chỉ phòng', desc: '3 loại phòng' },
    { value: 'food', label: '🍽️ Chỉ đồ ăn', desc: 'Món + Combo' },
  ];

  return (
    <div className="space-y-2">
      {/* Category selection */}
      <div className="flex gap-2 flex-wrap">
        {categoryButtons.map(btn => (
          <Button
            key={btn.value}
            size="sm"
            variant={appliesTo === btn.value ? 'default' : 'outline'}
            onClick={() => { onChangeAppliesTo(btn.value); onChangeItems([]); }}
            className="text-xs gap-1"
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {/* Item detail toggle */}
      <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="text-xs gap-1 text-muted-foreground">
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {isAllSelected 
          ? `Áp dụng cho tất cả (${filteredItems.length} mục)` 
          : `Đã chọn ${appliesToItems.filter(i => i !== '__none__').length} mục cụ thể`}
      </Button>

      {expanded && (
        <div className="bg-muted/30 rounded-lg p-3 space-y-3 border border-border/50">
          <div className="flex gap-2">
            <Button size="sm" variant={isAllSelected ? 'default' : 'outline'} onClick={selectAll} className="text-xs">
              ✅ Chọn tất cả
            </Button>
            <Button size="sm" variant="outline" onClick={selectNone} className="text-xs">
              ❌ Bỏ chọn tất cả
            </Button>
          </div>

          {/* Rooms */}
          {(appliesTo === 'all' || appliesTo === 'room') && rooms.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">🏨 Phòng nghỉ</p>
              <div className="space-y-1">
                {rooms.map(r => {
                  const checked = isAllSelected || appliesToItems.includes(r.id);
                  return (
                    <label key={r.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 rounded p-1">
                      <Checkbox checked={checked} onCheckedChange={() => {
                        if (isAllSelected) {
                          // Switch to specific mode, select all except this
                          const allIds = filteredItems.map(i => i.id).filter(id => id !== r.id);
                          onChangeItems(allIds);
                        } else {
                          toggleItem(r.id);
                        }
                      }} />
                      <span className="flex-1">{r.name_vi}</span>
                      <Badge variant="secondary" className="text-[10px]">{fmt(r.price_vnd)}</Badge>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Food items */}
          {(appliesTo === 'all' || appliesTo === 'food') && menuItems.filter(m => m.price_vnd > 0).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">🍽️ Đồ ăn lẻ</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {menuItems.filter(m => m.price_vnd > 0).map(m => {
                  const checked = isAllSelected || appliesToItems.includes(m.id);
                  return (
                    <label key={m.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 rounded p-1">
                      <Checkbox checked={checked} onCheckedChange={() => {
                        if (isAllSelected) {
                          const allIds = filteredItems.map(i => i.id).filter(id => id !== m.id);
                          onChangeItems(allIds);
                        } else {
                          toggleItem(m.id);
                        }
                      }} />
                      <span className="flex-1">{m.name_vi}</span>
                      <Badge variant="secondary" className="text-[10px]">{fmt(m.price_vnd)}</Badge>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Combo / Dining items */}
          {(appliesTo === 'all' || appliesTo === 'food') && diningItems.filter(d => d.price_vnd > 0).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">🥘 Combo ẩm thực</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {diningItems.filter(d => d.price_vnd > 0).map(d => {
                  const checked = isAllSelected || appliesToItems.includes(d.id);
                  return (
                    <label key={d.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 rounded p-1">
                      <Checkbox checked={checked} onCheckedChange={() => {
                        if (isAllSelected) {
                          const allIds = filteredItems.map(i => i.id).filter(id => id !== d.id);
                          onChangeItems(allIds);
                        } else {
                          toggleItem(d.id);
                        }
                      }} />
                      <span className="flex-1">{d.name_vi}</span>
                      <Badge variant="secondary" className="text-[10px]">{fmt(d.price_vnd)}</Badge>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PromotionItemSelector;
