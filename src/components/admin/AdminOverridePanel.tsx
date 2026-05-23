import { useState } from 'react';
import { Shield, ChevronDown, ChevronUp, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FoodItem } from '@/components/IndividualFoodSelector';

/* =====================================================================
 * Admin override structure stored on a booking row (admin_overrides JSON)
 * ===================================================================== */
export interface AdminOverrides {
  room_prices?: Record<string, number>;          // roomId → giá/đêm ghi đè
  combo_prices?: Record<string, number>;         // comboPackageId → giá/suất ghi đè
  combo_names?: Record<string, string>;
  menu_names?: Record<string, string>;           // comboMenuId → tên thực đơn ghi đè
  menu_dishes?: Record<string, string[]>;        // comboMenuId → danh sách món
  food_item_prices?: Record<string, number>;     // menuItemId → giá ghi đè
  food_lines?: { name: string; qty: number; price: number; meal: 'lunch' | 'dinner' }[];
  guest?: { name?: string; phone?: string; email?: string; adults?: number; children?: number; check_in?: string; check_out?: string };
  discount?: { type: 'percent' | 'fixed'; value: number; reason?: string };
  deposit?: { type: 'percent' | 'fixed'; value: number };
  total_override?: number | null;
  edited_by_staff?: boolean;
}

interface SelectedRoomLite { roomId: string; name: string; quantity: number; nightlyDefault: number }
interface ComboLineLite { pkgId: string; pkgName: string; menuId?: string; menuName?: string; menuDishes?: string[]; quantity: number; defaultPrice: number; meal: 'lunch' | 'dinner'; date: string }
interface IndividualItemLite { id: string; name: string; quantity: number; defaultPrice: number; date: string }

interface Props {
  step: 1 | 2 | 3 | 4;
  isAdmin: boolean;
  overrides: AdminOverrides;
  onChange: (next: AdminOverrides) => void;

  // Step 1 / 4
  rooms: SelectedRoomLite[];
  nightCount: number;

  // Step 2 / 4
  comboLines: ComboLineLite[];
  individualItems: IndividualItemLite[];

  // Step 4 only (extra context)
  guest?: { name: string; phone: string; email: string; adults: number; children: number; checkIn?: string; checkOut?: string };
  defaultTotal?: number;        // tổng tự động tính
  formatPrice?: (n: number) => string;
}

const fmt = (n: number) => n.toLocaleString('vi-VN') + 'đ';

export default function AdminOverridePanel(props: Props) {
  const { step, isAdmin, overrides, onChange } = props;
  const [open, setOpen] = useState(true);
  if (!isAdmin) return null;

  const patch = (p: Partial<AdminOverrides>) => onChange({ ...overrides, ...p, edited_by_staff: true });
  const patchMap = <K extends keyof AdminOverrides>(key: K, k: string, v: any) => {
    const current = (overrides[key] as any) || {};
    if (v === null || v === undefined || v === '') {
      const { [k]: _, ...rest } = current;
      patch({ [key]: rest } as any);
    } else {
      patch({ [key]: { ...current, [k]: v } } as any);
    }
  };
  const formatPrice = props.formatPrice || fmt;

  return (
    <div className="border-2 border-dashed border-amber-400 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-amber-100/60 dark:hover:bg-amber-900/20 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-300">
          <Shield className="h-4 w-4" />
          Chỉnh sửa Admin – chỉ nhân viên thấy (Bước {step})
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-amber-700" /> : <ChevronDown className="h-4 w-4 text-amber-700" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-4 text-sm">

          {/* =================== STEP 1 & 4 — GIÁ PHÒNG =================== */}
          {(step === 1 || step === 4) && props.rooms.length > 0 && (
            <Section title="A. Giá phòng (ghi đè giá/đêm)">
              {props.rooms.map(r => {
                const ov = overrides.room_prices?.[r.roomId];
                const nightly = ov ?? r.nightlyDefault;
                const lineTotal = nightly * r.quantity * Math.max(props.nightCount, 1);
                return (
                  <div key={r.roomId} className="grid grid-cols-1 md:grid-cols-[1fr_120px_140px_1fr] gap-2 items-center bg-background/60 rounded-lg p-2">
                    <div className="text-xs">
                      <p className="font-medium truncate">{r.name}</p>
                      <p className="text-muted-foreground">×{r.quantity} · {props.nightCount} đêm · gốc: {formatPrice(r.nightlyDefault)}</p>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Giá/đêm"
                      value={ov ?? ''}
                      onChange={(e) => patchMap('room_prices', r.roomId, e.target.value === '' ? null : Math.max(0, parseInt(e.target.value) || 0))}
                      className="h-8 text-xs"
                    />
                    {step === 4 ? (
                      <span className="text-xs text-muted-foreground">SL: {r.quantity}</span>
                    ) : <span />}
                    <span className="text-xs font-semibold text-right text-primary">= {formatPrice(lineTotal)}</span>
                  </div>
                );
              })}
              <p className="text-[11px] text-muted-foreground">Để trống → dùng giá hệ thống. Ghi đè áp dụng cho mọi đêm.</p>
            </Section>
          )}

          {/* =================== STEP 2 & 4 — COMBO / MÓN =================== */}
          {(step === 2 || step === 4) && (
            <>
              {props.comboLines.length > 0 && (
                <Section title="B1. Combo theo bàn (ghi đè giá/tên/món)">
                  {props.comboLines.map((c, i) => {
                    const priceOv = overrides.combo_prices?.[c.pkgId];
                    const nameOv = overrides.combo_names?.[c.pkgId];
                    const menuNameOv = c.menuId ? overrides.menu_names?.[c.menuId] : undefined;
                    const dishesOv = c.menuId ? overrides.menu_dishes?.[c.menuId] : undefined;
                    const price = priceOv ?? c.defaultPrice;
                    return (
                      <div key={`${c.pkgId}-${c.menuId}-${c.date}-${i}`} className="bg-background/60 rounded-lg p-2 space-y-2">
                        <div className="text-[11px] text-muted-foreground">{c.date} · {c.meal === 'lunch' ? 'Trưa' : 'Tối'} · ×{c.quantity}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Input className="h-8 text-xs" placeholder={`Tên combo (gốc: ${c.pkgName})`}
                            value={nameOv ?? ''} onChange={(e) => patchMap('combo_names', c.pkgId, e.target.value || null)} />
                          <Input className="h-8 text-xs" type="number" min={0} placeholder={`Giá/suất (gốc: ${formatPrice(c.defaultPrice)})`}
                            value={priceOv ?? ''} onChange={(e) => patchMap('combo_prices', c.pkgId, e.target.value === '' ? null : Math.max(0, parseInt(e.target.value) || 0))} />
                        </div>
                        {c.menuId && (
                          <>
                            <Input className="h-8 text-xs" placeholder={`Tên thực đơn (gốc: ${c.menuName || ''})`}
                              value={menuNameOv ?? ''} onChange={(e) => patchMap('menu_names', c.menuId!, e.target.value || null)} />
                            <Textarea className="text-xs min-h-[60px]" placeholder={`Danh sách món, mỗi dòng 1 món (gốc: ${(c.menuDishes || []).join(', ')})`}
                              value={(dishesOv || []).join('\n')}
                              onChange={(e) => {
                                const lines = e.target.value.split('\n').map(s => s.trim()).filter(Boolean);
                                patchMap('menu_dishes', c.menuId!, lines.length === 0 ? null : lines);
                              }} />
                          </>
                        )}
                        <p className="text-[11px] text-right text-primary font-semibold">= {formatPrice(price * c.quantity)}</p>
                      </div>
                    );
                  })}
                </Section>
              )}

              {props.individualItems.length > 0 && (
                <Section title="B2. Món riêng (ghi đè giá từng món)">
                  {props.individualItems.map(it => {
                    const ov = overrides.food_item_prices?.[it.id];
                    const price = ov ?? it.defaultPrice;
                    return (
                      <div key={`${it.id}-${it.date}`} className="grid grid-cols-1 md:grid-cols-[1fr_120px_120px] gap-2 items-center bg-background/60 rounded-lg p-2">
                        <div className="text-xs">
                          <p className="font-medium truncate">{it.name}</p>
                          <p className="text-muted-foreground">×{it.quantity} · {it.date} · gốc: {formatPrice(it.defaultPrice)}</p>
                        </div>
                        <Input type="number" min={0} className="h-8 text-xs" placeholder="Giá/món"
                          value={ov ?? ''}
                          onChange={(e) => patchMap('food_item_prices', it.id, e.target.value === '' ? null : Math.max(0, parseInt(e.target.value) || 0))} />
                        <span className="text-xs font-semibold text-right text-primary">= {formatPrice(price * it.quantity)}</span>
                      </div>
                    );
                  })}
                </Section>
              )}

              {/* Dòng món tự thêm — Step 4 chính */}
              {step === 4 && (
                <Section title="B3. Dòng món/combo tự thêm">
                  {(overrides.food_lines || []).map((line, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_70px_110px_110px_40px] gap-2 items-center bg-background/60 rounded-lg p-2">
                      <Input className="h-8 text-xs" placeholder="Tên món/combo"
                        value={line.name}
                        onChange={(e) => {
                          const next = [...(overrides.food_lines || [])];
                          next[idx] = { ...line, name: e.target.value };
                          patch({ food_lines: next });
                        }} />
                      <Input className="h-8 text-xs" type="number" min={0} placeholder="SL"
                        value={line.qty}
                        onChange={(e) => {
                          const next = [...(overrides.food_lines || [])];
                          next[idx] = { ...line, qty: Math.max(0, parseInt(e.target.value) || 0) };
                          patch({ food_lines: next });
                        }} />
                      <Input className="h-8 text-xs" type="number" min={0} placeholder="Giá/suất"
                        value={line.price}
                        onChange={(e) => {
                          const next = [...(overrides.food_lines || [])];
                          next[idx] = { ...line, price: Math.max(0, parseInt(e.target.value) || 0) };
                          patch({ food_lines: next });
                        }} />
                      <Select value={line.meal} onValueChange={(v) => {
                        const next = [...(overrides.food_lines || [])];
                        next[idx] = { ...line, meal: v as any };
                        patch({ food_lines: next });
                      }}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lunch">Bữa trưa</SelectItem>
                          <SelectItem value="dinner">Bữa tối</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        onClick={() => {
                          const next = [...(overrides.food_lines || [])];
                          next.splice(idx, 1);
                          patch({ food_lines: next });
                        }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" className="gap-2"
                    onClick={() => patch({ food_lines: [...(overrides.food_lines || []), { name: '', qty: 1, price: 0, meal: 'dinner' }] })}>
                    <Plus className="h-3.5 w-3.5" /> Thêm dòng món ăn
                  </Button>
                </Section>
              )}
            </>
          )}

          {/* =================== STEP 4 ONLY — KHÁCH / GIẢM / CỌC / TỔNG =================== */}
          {step === 4 && (
            <>
              <Section title="C. Thông tin khách (ghi đè)">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input className="h-8 text-xs" placeholder={`Họ tên (gốc: ${props.guest?.name || ''})`}
                    value={overrides.guest?.name ?? ''}
                    onChange={(e) => patch({ guest: { ...overrides.guest, name: e.target.value || undefined } })} />
                  <Input className="h-8 text-xs" placeholder={`SĐT (gốc: ${props.guest?.phone || ''})`}
                    value={overrides.guest?.phone ?? ''}
                    onChange={(e) => patch({ guest: { ...overrides.guest, phone: e.target.value || undefined } })} />
                  <Input className="h-8 text-xs" placeholder={`Email (gốc: ${props.guest?.email || ''})`}
                    value={overrides.guest?.email ?? ''}
                    onChange={(e) => patch({ guest: { ...overrides.guest, email: e.target.value || undefined } })} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input className="h-8 text-xs" type="number" min={0} placeholder={`NL (gốc: ${props.guest?.adults ?? ''})`}
                      value={overrides.guest?.adults ?? ''}
                      onChange={(e) => patch({ guest: { ...overrides.guest, adults: e.target.value === '' ? undefined : parseInt(e.target.value) || 0 } })} />
                    <Input className="h-8 text-xs" type="number" min={0} placeholder={`TE (gốc: ${props.guest?.children ?? ''})`}
                      value={overrides.guest?.children ?? ''}
                      onChange={(e) => patch({ guest: { ...overrides.guest, children: e.target.value === '' ? undefined : parseInt(e.target.value) || 0 } })} />
                  </div>
                  <Input className="h-8 text-xs" type="date" placeholder={`Check-in (gốc: ${props.guest?.checkIn || ''})`}
                    value={overrides.guest?.check_in ?? ''}
                    onChange={(e) => patch({ guest: { ...overrides.guest, check_in: e.target.value || undefined } })} />
                  <Input className="h-8 text-xs" type="date" placeholder={`Check-out (gốc: ${props.guest?.checkOut || ''})`}
                    value={overrides.guest?.check_out ?? ''}
                    onChange={(e) => patch({ guest: { ...overrides.guest, check_out: e.target.value || undefined } })} />
                </div>
              </Section>

              <Section title="D. Giảm giá Admin">
                <div className="grid grid-cols-1 md:grid-cols-[140px_120px_1fr] gap-2">
                  <Select
                    value={overrides.discount?.type || 'percent'}
                    onValueChange={(v) => patch({ discount: { type: v as any, value: overrides.discount?.value || 0, reason: overrides.discount?.reason } })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">% giảm</SelectItem>
                      <SelectItem value="fixed">Tiền giảm</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input className="h-8 text-xs" type="number" min={0} placeholder="Giá trị"
                    value={overrides.discount?.value ?? ''}
                    onChange={(e) => patch({ discount: { type: overrides.discount?.type || 'percent', value: Math.max(0, parseInt(e.target.value) || 0), reason: overrides.discount?.reason } })} />
                  <Input className="h-8 text-xs" placeholder="Lý do (hiện trong hóa đơn)"
                    value={overrides.discount?.reason ?? ''}
                    onChange={(e) => patch({ discount: { type: overrides.discount?.type || 'percent', value: overrides.discount?.value || 0, reason: e.target.value || undefined } })} />
                </div>
              </Section>

              <Section title="E. Tiền cọc (mặc định 50%)">
                <div className="grid grid-cols-2 gap-2 max-w-sm">
                  <Select
                    value={overrides.deposit?.type || 'percent'}
                    onValueChange={(v) => patch({ deposit: { type: v as any, value: overrides.deposit?.value ?? 50 } })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">% cọc</SelectItem>
                      <SelectItem value="fixed">Số tiền cọc</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input className="h-8 text-xs" type="number" min={0} placeholder="Giá trị"
                    value={overrides.deposit?.value ?? ''}
                    onChange={(e) => patch({ deposit: { type: overrides.deposit?.type || 'percent', value: Math.max(0, parseInt(e.target.value) || 0) } })} />
                </div>
              </Section>

              <Section title="F. Ghi đè tổng cuối">
                <div className="flex items-center gap-2">
                  <Input className="h-8 text-xs max-w-xs" type="number" min={0}
                    placeholder={`Để trống → dùng tổng tự động (${formatPrice(props.defaultTotal || 0)})`}
                    value={overrides.total_override ?? ''}
                    onChange={(e) => patch({ total_override: e.target.value === '' ? null : Math.max(0, parseInt(e.target.value) || 0) })} />
                  {overrides.total_override != null && (
                    <Button size="sm" variant="outline" className="h-8" onClick={() => patch({ total_override: null })}>Bỏ</Button>
                  )}
                </div>
                {overrides.total_override != null && (
                  <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-100/60 rounded-lg px-2 py-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    Giá do Admin chỉnh: {formatPrice(overrides.total_override)}
                  </div>
                )}
              </Section>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wide">{title}</p>
      {children}
    </div>
  );
}
