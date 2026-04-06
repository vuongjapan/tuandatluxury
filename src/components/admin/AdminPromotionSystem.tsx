import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, Zap, Tag, Percent, Brain, RefreshCw, Eye, EyeOff, Link2, Image, BarChart3 } from 'lucide-react';
import PromotionItemSelector from './PromotionItemSelector';
import AdminPromotionStats from './AdminPromotionStats';

interface RoomOption { id: string; name_vi: string; price_vnd: number; image_url: string | null; }
interface FoodOption { id: string; name_vi: string; price_vnd: number; image_url: string | null; category?: string; }

const AdminPromotionSystem = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState('flash-sales');

  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [flashItems, setFlashItems] = useState<any[]>([]);
  const [selectedSale, setSelectedSale] = useState<string | null>(null);
  const [codes, setCodes] = useState<any[]>([]);
  const [globals, setGlobals] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Product options for flash sale item selection
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [menuItems, setMenuItems] = useState<FoodOption[]>([]);
  const [diningItems, setDiningItems] = useState<FoodOption[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: fs }, { data: dc }, { data: gd }, { data: sp }, { data: rm }, { data: mi }, { data: di }] = await Promise.all([
      supabase.from('flash_sales' as any).select('*').order('sort_order'),
      supabase.from('discount_codes' as any).select('*').order('created_at', { ascending: false }),
      supabase.from('global_discounts' as any).select('*').order('created_at', { ascending: false }),
      supabase.from('smart_pricing_rules' as any).select('*').order('sort_order'),
      supabase.from('rooms').select('id, name_vi, price_vnd, image_url').eq('is_active', true).order('price_vnd'),
      supabase.from('menu_items').select('id, name_vi, price_vnd, image_url, category').eq('is_active', true).order('sort_order'),
      supabase.from('dining_items').select('id, name_vi, price_vnd, image_url').eq('is_active', true).order('sort_order'),
    ]);
    setFlashSales((fs as any[]) || []);
    setCodes((dc as any[]) || []);
    setGlobals((gd as any[]) || []);
    setRules((sp as any[]) || []);
    setRooms((rm as RoomOption[]) || []);
    setMenuItems((mi as FoodOption[]) || []);
    setDiningItems((di as FoodOption[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const fetchFlashItems = async (saleId: string) => {
    const { data } = await supabase.from('flash_sale_items' as any).select('*').eq('flash_sale_id', saleId).order('sort_order');
    setFlashItems((data as any[]) || []);
    setSelectedSale(saleId);
  };

  // Flash Sale CRUD
  const addFlashSale = async () => {
    const now = new Date();
    const end = new Date(now.getTime() + 24 * 3600000);
    await supabase.from('flash_sales' as any).insert({
      title_vi: 'Flash Sale mới',
      title_en: 'New Flash Sale',
      start_time: now.toISOString(),
      end_time: end.toISOString(),
      is_active: false,
    } as any);
    fetchAll();
    toast({ title: 'Đã tạo Flash Sale' });
  };

  const updateFlashSale = async (id: string, updates: any) => {
    await supabase.from('flash_sales' as any).update(updates).eq('id', id);
    fetchAll();
  };

  const deleteFlashSale = async (id: string) => {
    if (!confirm('Xóa Flash Sale này?')) return;
    await supabase.from('flash_sale_items' as any).delete().eq('flash_sale_id', id);
    await supabase.from('flash_sales' as any).delete().eq('id', id);
    if (selectedSale === id) { setSelectedSale(null); setFlashItems([]); }
    fetchAll();
    toast({ title: 'Đã xóa' });
  };

  // Flash Sale Items - enhanced with product selection
  const addFlashItemWithProduct = async (type: 'room' | 'food' | 'combo', productId: string) => {
    if (!selectedSale) return;

    let name_vi = '', name_en = '', originalPrice = 0, imageUrl: string | null = null;

    if (type === 'room') {
      const room = rooms.find(r => r.id === productId);
      if (!room) return;
      name_vi = room.name_vi;
      name_en = room.name_vi;
      originalPrice = room.price_vnd;
      imageUrl = room.image_url;
    } else if (type === 'food') {
      const item = menuItems.find(m => m.id === productId) || diningItems.find(d => d.id === productId);
      if (!item) return;
      name_vi = item.name_vi;
      name_en = item.name_vi;
      originalPrice = item.price_vnd;
      imageUrl = item.image_url;
    } else {
      const item = diningItems.find(d => d.id === productId);
      if (!item) return;
      name_vi = item.name_vi;
      name_en = item.name_vi;
      originalPrice = item.price_vnd;
      imageUrl = item.image_url;
    }

    await supabase.from('flash_sale_items' as any).insert({
      flash_sale_id: selectedSale,
      item_type: type,
      item_id: productId,
      item_name_vi: name_vi,
      item_name_en: name_en,
      original_price: originalPrice,
      sale_price: Math.round(originalPrice * 0.8),
      quantity_limit: 10,
      image_url: imageUrl,
    } as any);
    fetchFlashItems(selectedSale);
    toast({ title: `Đã thêm: ${name_vi}` });
  };

  const updateFlashItem = async (id: string, updates: any) => {
    await supabase.from('flash_sale_items' as any).update(updates).eq('id', id);
  };

  const deleteFlashItem = async (id: string) => {
    await supabase.from('flash_sale_items' as any).delete().eq('id', id);
    if (selectedSale) fetchFlashItems(selectedSale);
  };

  // Discount Codes
  const addCode = async () => {
    const code = 'TUANDAT' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const end = new Date(Date.now() + 30 * 86400000);
    await supabase.from('discount_codes' as any).insert({
      code,
      title_vi: 'Mã giảm giá mới',
      title_en: 'New discount code',
      discount_type: 'percent',
      discount_value: 10,
      end_date: end.toISOString(),
      is_active: false,
    } as any);
    fetchAll();
    toast({ title: 'Đã tạo mã: ' + code });
  };

  const updateCode = async (id: string, updates: any) => {
    await supabase.from('discount_codes' as any).update(updates).eq('id', id);
  };

  const deleteCode = async (id: string) => {
    if (!confirm('Xóa mã giảm giá?')) return;
    await supabase.from('discount_codes' as any).delete().eq('id', id);
    fetchAll();
    toast({ title: 'Đã xóa' });
  };

  // Global Discounts
  const addGlobal = async () => {
    const end = new Date(Date.now() + 30 * 86400000);
    await supabase.from('global_discounts' as any).insert({
      title_vi: 'Giảm giá toàn hệ thống',
      title_en: 'System-wide discount',
      discount_percent: 5,
      end_date: end.toISOString(),
      is_active: false,
    } as any);
    fetchAll();
    toast({ title: 'Đã tạo' });
  };

  const updateGlobal = async (id: string, updates: any) => {
    await supabase.from('global_discounts' as any).update(updates).eq('id', id);
  };

  const deleteGlobal = async (id: string) => {
    if (!confirm('Xóa?')) return;
    await supabase.from('global_discounts' as any).delete().eq('id', id);
    fetchAll();
  };

  // Smart Pricing
  const addRule = async () => {
    await supabase.from('smart_pricing_rules' as any).insert({
      rule_type: 'early_bird',
      title_vi: 'Quy tắc mới',
      title_en: 'New rule',
      discount_percent: 10,
      is_active: false,
    } as any);
    fetchAll();
    toast({ title: 'Đã tạo' });
  };

  const updateRule = async (id: string, updates: any) => {
    await supabase.from('smart_pricing_rules' as any).update(updates).eq('id', id);
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Xóa?')) return;
    await supabase.from('smart_pricing_rules' as any).delete().eq('id', id);
    fetchAll();
  };

  const formatVND = (n: number) => n?.toLocaleString('vi-VN') + '₫';

  if (loading) return <div className="p-8 text-center"><RefreshCw className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Quản lý Khuyến mại</h2>
        <Button variant="outline" size="sm" onClick={fetchAll}><RefreshCw className="h-4 w-4 mr-1" /> Làm mới</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="flash-sales" className="gap-1.5"><Zap className="h-4 w-4" /> Flash Sale</TabsTrigger>
          <TabsTrigger value="codes" className="gap-1.5"><Tag className="h-4 w-4" /> Mã giảm giá</TabsTrigger>
          <TabsTrigger value="global" className="gap-1.5"><Percent className="h-4 w-4" /> Giảm giá chung</TabsTrigger>
          <TabsTrigger value="smart" className="gap-1.5"><Brain className="h-4 w-4" /> Smart Pricing</TabsTrigger>
          <TabsTrigger value="stats" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Thống kê</TabsTrigger>
        </TabsList>

        {/* FLASH SALES */}
        <TabsContent value="flash-sales" className="space-y-4">
          <Button onClick={addFlashSale} className="gap-1.5"><Plus className="h-4 w-4" /> Tạo Flash Sale</Button>

          {flashSales.map(sale => (
            <div key={sale.id} className={`border rounded-lg p-4 space-y-3 ${selectedSale === sale.id ? 'border-primary ring-1 ring-primary/20' : 'border-border'}`}>
              <div className="flex items-center gap-3 flex-wrap">
                <Switch checked={sale.is_active} onCheckedChange={v => updateFlashSale(sale.id, { is_active: v })} />
                <Input value={sale.title_vi} className="flex-1 min-w-[200px]"
                  onChange={e => setFlashSales(p => p.map(s => s.id === sale.id ? {...s, title_vi: e.target.value} : s))}
                  onBlur={e => updateFlashSale(sale.id, { title_vi: e.target.value })}
                />
                <Badge variant={sale.is_active ? 'default' : 'secondary'}>{sale.is_active ? 'Đang chạy' : 'Tắt'}</Badge>
                <Button variant="outline" size="sm" onClick={() => selectedSale === sale.id ? (setSelectedSale(null), setFlashItems([])) : fetchFlashItems(sale.id)}>
                  {selectedSale === sale.id ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {selectedSale === sale.id ? 'Ẩn' : 'Sản phẩm'}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => deleteFlashSale(sale.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Bắt đầu</label>
                  <Input type="datetime-local" value={sale.start_time?.slice(0, 16) || ''}
                    onChange={e => updateFlashSale(sale.id, { start_time: new Date(e.target.value).toISOString() })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Kết thúc</label>
                  <Input type="datetime-local" value={sale.end_time?.slice(0, 16) || ''}
                    onChange={e => updateFlashSale(sale.id, { end_time: new Date(e.target.value).toISOString() })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Mô tả (VI)</label>
                <Input value={sale.description_vi || ''} placeholder="VD: Flash Sale cuối tuần - giảm sốc!"
                  onChange={e => setFlashSales(p => p.map(s => s.id === sale.id ? {...s, description_vi: e.target.value} : s))}
                  onBlur={e => updateFlashSale(sale.id, { description_vi: e.target.value })}
                />
              </div>

              {/* Flash Sale Items - Enhanced with product selector */}
              {selectedSale === sale.id && (
                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Link2 className="h-4 w-4" /> Sản phẩm trong Flash Sale ({flashItems.length})
                  </h4>

                  {/* Add product buttons */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <p className="text-xs font-medium text-muted-foreground">Thêm sản phẩm:</p>
                    
                    {/* Add Room */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Phòng nghỉ ({rooms.length} loại)</p>
                      <div className="flex flex-wrap gap-2">
                        {rooms.map(r => {
                          const already = flashItems.some(fi => fi.item_id === r.id && fi.item_type === 'room');
                          return (
                            <Button key={r.id} size="sm" variant={already ? 'secondary' : 'outline'} disabled={already}
                              onClick={() => addFlashItemWithProduct('room', r.id)} className="gap-1 text-xs">
                              <Plus className="h-3 w-3" />
                              {r.name_vi} ({formatVND(r.price_vnd)})
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Add Food - menu_items */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Đồ ăn lẻ (Set menu, món ăn...)</p>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {menuItems.filter(m => m.price_vnd > 0).slice(0, 20).map(m => {
                          const already = flashItems.some(fi => fi.item_id === m.id);
                          return (
                            <Button key={m.id} size="sm" variant={already ? 'secondary' : 'outline'} disabled={already}
                              onClick={() => addFlashItemWithProduct('food', m.id)} className="gap-1 text-xs">
                              <Plus className="h-3 w-3" />
                              {m.name_vi} ({formatVND(m.price_vnd)})
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Add Combo - dining_items */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Combo / Ẩm thực</p>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {diningItems.filter(d => d.price_vnd > 0).map(d => {
                          const already = flashItems.some(fi => fi.item_id === d.id);
                          return (
                            <Button key={d.id} size="sm" variant={already ? 'secondary' : 'outline'} disabled={already}
                              onClick={() => addFlashItemWithProduct('combo', d.id)} className="gap-1 text-xs">
                              <Plus className="h-3 w-3" />
                              {d.name_vi} ({formatVND(d.price_vnd)})
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Current items list */}
                  {flashItems.length === 0 && (
                    <p className="text-sm text-muted-foreground italic text-center py-4">Chưa có sản phẩm. Chọn phòng hoặc đồ ăn ở trên để thêm.</p>
                  )}

                  {flashItems.map(item => {
                    const percent = item.original_price > 0 ? Math.round(((item.original_price - item.sale_price) / item.original_price) * 100) : 0;
                    return (
                      <div key={item.id} className="border rounded-lg p-3 space-y-2 bg-card">
                        <div className="flex items-center gap-3">
                          {item.image_url && (
                            <img src={item.image_url} alt="" className="w-12 h-12 rounded object-cover shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-[10px]">
                                {item.item_type === 'room' ? 'Phòng' : item.item_type === 'combo' ? 'Combo' : 'Đồ ăn'}
                              </Badge>
                              <span className="font-semibold text-sm truncate">{item.item_name_vi}</span>
                              {percent > 0 && <Badge className="bg-destructive text-destructive-foreground text-[10px]">-{percent}%</Badge>}
                            </div>
                            <Input value={item.item_name_vi} className="text-sm h-8"
                              onChange={e => setFlashItems(p => p.map(i => i.id === item.id ? {...i, item_name_vi: e.target.value} : i))}
                              onBlur={e => updateFlashItem(item.id, { item_name_vi: e.target.value })}
                            />
                          </div>
                          <Button variant="destructive" size="icon" className="h-8 w-8 shrink-0" onClick={() => deleteFlashItem(item.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground">Giá gốc</label>
                            <Input type="number" value={item.original_price} className="h-8 text-sm"
                              onChange={e => setFlashItems(p => p.map(i => i.id === item.id ? {...i, original_price: +e.target.value} : i))}
                              onBlur={e => updateFlashItem(item.id, { original_price: +e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Giá Flash Sale</label>
                            <Input type="number" value={item.sale_price} className="h-8 text-sm text-destructive font-bold"
                              onChange={e => setFlashItems(p => p.map(i => i.id === item.id ? {...i, sale_price: +e.target.value} : i))}
                              onBlur={e => updateFlashItem(item.id, { sale_price: +e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Số lượng</label>
                            <Input type="number" value={item.quantity_limit} className="h-8 text-sm"
                              onChange={e => setFlashItems(p => p.map(i => i.id === item.id ? {...i, quantity_limit: +e.target.value} : i))}
                              onBlur={e => updateFlashItem(item.id, { quantity_limit: +e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Đã bán</label>
                            <Input type="number" value={item.quantity_sold} className="h-8 text-sm" disabled />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-muted-foreground">Link ảnh</label>
                          <Input value={item.image_url || ''} placeholder="https://..." className="h-8 text-sm"
                            onChange={e => setFlashItems(p => p.map(i => i.id === item.id ? {...i, image_url: e.target.value} : i))}
                            onBlur={e => updateFlashItem(item.id, { image_url: e.target.value || null })}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </TabsContent>

        {/* DISCOUNT CODES */}
        <TabsContent value="codes" className="space-y-4">
          <Button onClick={addCode} className="gap-1.5"><Plus className="h-4 w-4" /> Tạo mã giảm giá</Button>

          {codes.map(code => (
            <div key={code.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Switch checked={code.is_active}
                  onCheckedChange={v => { updateCode(code.id, { is_active: v }); setCodes(p => p.map(c => c.id === code.id ? {...c, is_active: v} : c)); }}
                />
                <Input value={code.code} className="font-mono font-bold w-48"
                  onChange={e => setCodes(p => p.map(c => c.id === code.id ? {...c, code: e.target.value.toUpperCase()} : c))}
                  onBlur={e => updateCode(code.id, { code: e.target.value.toUpperCase() })}
                />
                <Badge variant={code.is_active ? 'default' : 'secondary'}>{code.is_active ? 'Đang chạy' : 'Tắt'}</Badge>
                <span className="text-xs text-muted-foreground">Đã dùng: {code.used_count}/{code.max_uses}</span>
                <Button variant="destructive" size="sm" className="ml-auto" onClick={() => deleteCode(code.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Tên (VI)</label>
                  <Input value={code.title_vi}
                    onChange={e => setCodes(p => p.map(c => c.id === code.id ? {...c, title_vi: e.target.value} : c))}
                    onBlur={e => updateCode(code.id, { title_vi: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Loại giảm</label>
                  <Select value={code.discount_type} onValueChange={v => { updateCode(code.id, { discount_type: v }); setCodes(p => p.map(c => c.id === code.id ? {...c, discount_type: v} : c)); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Phần trăm (%)</SelectItem>
                      <SelectItem value="fixed">Số tiền (₫)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{code.discount_type === 'percent' ? '% giảm' : 'Số tiền giảm'}</label>
                  <Input type="number" value={code.discount_value}
                    onChange={e => setCodes(p => p.map(c => c.id === code.id ? {...c, discount_value: +e.target.value} : c))}
                    onBlur={e => updateCode(code.id, { discount_value: +e.target.value })}
                  />
                </div>
                <div className="col-span-2 sm:col-span-4">
                  <label className="text-xs text-muted-foreground mb-1 block">Áp dụng chi tiết cho</label>
                  <PromotionItemSelector
                    appliesTo={code.applies_to}
                    appliesToItems={Array.isArray(code.applies_to_items) ? code.applies_to_items : []}
                    rooms={rooms}
                    menuItems={menuItems}
                    diningItems={diningItems}
                    onChangeAppliesTo={v => { updateCode(code.id, { applies_to: v }); setCodes(p => p.map(c => c.id === code.id ? {...c, applies_to: v} : c)); }}
                    onChangeItems={items => { updateCode(code.id, { applies_to_items: items }); setCodes(p => p.map(c => c.id === code.id ? {...c, applies_to_items: items} : c)); }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Đơn tối thiểu (₫)</label>
                  <Input type="number" value={code.min_order_amount}
                    onChange={e => setCodes(p => p.map(c => c.id === code.id ? {...c, min_order_amount: +e.target.value} : c))}
                    onBlur={e => updateCode(code.id, { min_order_amount: +e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Giới hạn lượt</label>
                  <Input type="number" value={code.max_uses}
                    onChange={e => setCodes(p => p.map(c => c.id === code.id ? {...c, max_uses: +e.target.value} : c))}
                    onBlur={e => updateCode(code.id, { max_uses: +e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Bắt đầu</label>
                  <Input type="datetime-local" value={code.start_date?.slice(0, 16) || ''}
                    onChange={e => updateCode(code.id, { start_date: new Date(e.target.value).toISOString() })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Kết thúc</label>
                  <Input type="datetime-local" value={code.end_date?.slice(0, 16) || ''}
                    onChange={e => updateCode(code.id, { end_date: new Date(e.target.value).toISOString() })}
                  />
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* GLOBAL DISCOUNTS */}
        <TabsContent value="global" className="space-y-4">
          <Button onClick={addGlobal} className="gap-1.5"><Plus className="h-4 w-4" /> Tạo giảm giá chung</Button>

          {globals.map(g => (
            <div key={g.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Switch checked={g.is_active}
                  onCheckedChange={v => { updateGlobal(g.id, { is_active: v }); setGlobals(p => p.map(x => x.id === g.id ? {...x, is_active: v} : x)); }}
                />
                <Input value={g.title_vi} className="flex-1"
                  onChange={e => setGlobals(p => p.map(x => x.id === g.id ? {...x, title_vi: e.target.value} : x))}
                  onBlur={e => updateGlobal(g.id, { title_vi: e.target.value })}
                />
                <Badge variant={g.is_active ? 'default' : 'secondary'}>{g.is_active ? 'Đang chạy' : 'Tắt'}</Badge>
                <Button variant="destructive" size="sm" onClick={() => deleteGlobal(g.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">% Giảm</label>
                  <Input type="number" value={g.discount_percent}
                    onChange={e => setGlobals(p => p.map(x => x.id === g.id ? {...x, discount_percent: +e.target.value} : x))}
                    onBlur={e => updateGlobal(g.id, { discount_percent: +e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Giới hạn max %</label>
                  <Input type="number" value={g.max_total_discount}
                    onChange={e => setGlobals(p => p.map(x => x.id === g.id ? {...x, max_total_discount: +e.target.value} : x))}
                    onBlur={e => updateGlobal(g.id, { max_total_discount: +e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Bắt đầu</label>
                  <Input type="datetime-local" value={g.start_date?.slice(0, 16) || ''}
                    onChange={e => updateGlobal(g.id, { start_date: new Date(e.target.value).toISOString() })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Kết thúc</label>
                  <Input type="datetime-local" value={g.end_date?.slice(0, 16) || ''}
                    onChange={e => updateGlobal(g.id, { end_date: new Date(e.target.value).toISOString() })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Áp dụng chi tiết cho</label>
                <PromotionItemSelector
                  appliesTo={g.applies_to}
                  appliesToItems={Array.isArray(g.applies_to_items) ? g.applies_to_items : []}
                  rooms={rooms}
                  menuItems={menuItems}
                  diningItems={diningItems}
                  onChangeAppliesTo={v => { updateGlobal(g.id, { applies_to: v }); setGlobals(p => p.map(x => x.id === g.id ? {...x, applies_to: v} : x)); }}
                  onChangeItems={items => { updateGlobal(g.id, { applies_to_items: items }); setGlobals(p => p.map(x => x.id === g.id ? {...x, applies_to_items: items} : x)); }}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={g.allow_stacking}
                  onCheckedChange={v => { updateGlobal(g.id, { allow_stacking: v }); setGlobals(p => p.map(x => x.id === g.id ? {...x, allow_stacking: v} : x)); }}
                />
                <span className="text-sm text-muted-foreground">Cho phép cộng dồn với khuyến mại khác</span>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* SMART PRICING */}
        <TabsContent value="smart" className="space-y-4">
          <Button onClick={addRule} className="gap-1.5"><Plus className="h-4 w-4" /> Tạo quy tắc</Button>

          {rules.map(rule => (
            <div key={rule.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Switch checked={rule.is_active}
                  onCheckedChange={v => { updateRule(rule.id, { is_active: v }); setRules(p => p.map(r => r.id === rule.id ? {...r, is_active: v} : r)); }}
                />
                <Select value={rule.rule_type} onValueChange={v => { updateRule(rule.id, { rule_type: v }); setRules(p => p.map(r => r.id === rule.id ? {...r, rule_type: v} : r)); }}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="early_bird">Đặt sớm</SelectItem>
                    <SelectItem value="day_of_week">Theo ngày</SelectItem>
                    <SelectItem value="occupancy">Theo phòng trống</SelectItem>
                  </SelectContent>
                </Select>
                <Input value={rule.title_vi} className="flex-1"
                  onChange={e => setRules(p => p.map(r => r.id === rule.id ? {...r, title_vi: e.target.value} : r))}
                  onBlur={e => updateRule(rule.id, { title_vi: e.target.value })}
                />
                <Badge variant={rule.is_active ? 'default' : 'secondary'}>{rule.is_active ? 'Đang chạy' : 'Tắt'}</Badge>
                <Button variant="destructive" size="sm" onClick={() => deleteRule(rule.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">% Giảm</label>
                  <Input type="number" value={rule.discount_percent}
                    onChange={e => setRules(p => p.map(r => r.id === rule.id ? {...r, discount_percent: +e.target.value} : r))}
                    onBlur={e => updateRule(rule.id, { discount_percent: +e.target.value })}
                  />
                </div>
                {rule.rule_type === 'early_bird' && (
                  <div>
                    <label className="text-xs text-muted-foreground">Đặt trước (ngày)</label>
                    <Input type="number" value={rule.min_days_advance || ''}
                      onChange={e => setRules(p => p.map(r => r.id === rule.id ? {...r, min_days_advance: +e.target.value} : r))}
                      onBlur={e => updateRule(rule.id, { min_days_advance: +e.target.value })}
                    />
                  </div>
                )}
                {rule.rule_type === 'day_of_week' && (
                  <div>
                    <label className="text-xs text-muted-foreground">Thứ (0=CN..6=T7)</label>
                    <Input type="number" min={0} max={6} value={rule.day_of_week ?? ''}
                      onChange={e => setRules(p => p.map(r => r.id === rule.id ? {...r, day_of_week: +e.target.value} : r))}
                      onBlur={e => updateRule(rule.id, { day_of_week: +e.target.value })}
                    />
                  </div>
                )}
                {rule.rule_type === 'occupancy' && (
                  <div>
                    <label className="text-xs text-muted-foreground">Ngưỡng % trống</label>
                    <Input type="number" value={rule.occupancy_threshold || ''}
                      onChange={e => setRules(p => p.map(r => r.id === rule.id ? {...r, occupancy_threshold: +e.target.value} : r))}
                      onBlur={e => updateRule(rule.id, { occupancy_threshold: +e.target.value })}
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs text-muted-foreground">Badge (VI)</label>
                  <Input value={rule.badge_text_vi || ''} placeholder="VD: Đặt sớm -20%"
                    onChange={e => setRules(p => p.map(r => r.id === rule.id ? {...r, badge_text_vi: e.target.value} : r))}
                    onBlur={e => updateRule(rule.id, { badge_text_vi: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Áp dụng chi tiết cho</label>
                <PromotionItemSelector
                  appliesTo={rule.applies_to}
                  appliesToItems={Array.isArray(rule.applies_to_items) ? rule.applies_to_items : []}
                  rooms={rooms}
                  menuItems={menuItems}
                  diningItems={diningItems}
                  onChangeAppliesTo={v => { updateRule(rule.id, { applies_to: v }); setRules(p => p.map(r => r.id === rule.id ? {...r, applies_to: v} : r)); }}
                  onChangeItems={items => { updateRule(rule.id, { applies_to_items: items }); setRules(p => p.map(r => r.id === rule.id ? {...r, applies_to_items: items} : r)); }}
                />
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPromotionSystem;
