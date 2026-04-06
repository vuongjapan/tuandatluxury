import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { CalendarIcon, Users, Minus, Plus, UtensilsCrossed, AlertTriangle, Gift, Building2, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import ComboSelector, { ComboSelection } from '@/components/ComboSelector';
import DiscountCodeInput from '@/components/DiscountCodeInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type DiscountCode } from '@/hooks/usePromotionSystem';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import { useRooms } from '@/hooks/useRooms';
import { useDining } from '@/hooks/useDining';
import { usePromotions } from '@/hooks/usePromotions';
import { useAuth, MemberTier } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { vi, enUS, ja, zhCN } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';

const BOOKING_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-booking`;

const localeMap = { vi, en: enUS, ja, zh: zhCN };

const TIER_DISCOUNT: Record<MemberTier, number> = {
  normal: 5,
  vip: 10,
  super_vip: 15,
};

interface SelectedCombo {
  id: string;
  name: string;
  price: number;
  quantity: number;
}


const Booking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language, t, formatPrice } = useLanguage();
  const { toast } = useToast();
  const { rooms, getRoomPrice, isDateAvailable, hasComboRequiredDays } = useRooms();
  const { items: diningItems, loading: diningLoading } = useDining();
  const { promotions } = usePromotions();
  const { user } = useAuth();

  const preselectedRoom = searchParams.get('room') || (rooms[0]?.id ?? '');
  const preCheckin = searchParams.get('checkin');
  const preCheckout = searchParams.get('checkout');
  const promoId = searchParams.get('promo');
  const promoType = searchParams.get('promo_type');

  const [roomId, setRoomId] = useState(preselectedRoom);
  const [checkIn, setCheckIn] = useState<Date | undefined>(preCheckin ? new Date(preCheckin + 'T00:00:00') : undefined);
  const [checkOut, setCheckOut] = useState<Date | undefined>(preCheckout ? new Date(preCheckout + 'T00:00:00') : undefined);
  const [guests, setGuests] = useState(searchParams.get('guests') || '2');
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCombos, setSelectedCombos] = useState<SelectedCombo[]>([]);
  const [comboSelection, setComboSelection] = useState<ComboSelection | null>(null);
  const [appliedDiscountCode, setAppliedDiscountCode] = useState<DiscountCode | null>(null);

  // Promotion-specific fields
  const [companyName, setCompanyName] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [specialServices, setSpecialServices] = useState<string[]>([]);
  const [decorationNotes, setDecorationNotes] = useState('');

  // Auto-fill user info
  useEffect(() => {
    if (user) {
      if (!name) setName(user.fullName);
      if (!email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
    }
  }, [user]);

  const room = rooms.find((r) => r.id === roomId) || rooms[0];
  const nightCount = checkIn && checkOut ? Math.max(differenceInDays(checkOut, checkIn), 1) : 0;
  const calendarLocale = localeMap[language] || vi;

  // Active promotion
  const activePromo = useMemo(() => {
    if (!promoId) return null;
    return promotions.find(p => p.id === promoId && p.is_active) || null;
  }, [promoId, promotions]);

  const isGroupPromo = promoType === 'group' || (activePromo as any)?.promo_type === 'group';
  const isCouplePromo = promoType === 'couple' || (activePromo as any)?.promo_type === 'couple';

  // Filter combo items from dining
  const comboItems = useMemo(() => 
    diningItems.filter(item => item.is_combo && item.is_active),
    [diningItems]
  );

  // Check if combo is required for selected dates
  const comboRequired = useMemo(() => {
    if (!checkIn || !checkOut || !room) return false;
    return hasComboRequiredDays(room.id, checkIn, checkOut);
  }, [checkIn, checkOut, room, hasComboRequiredDays]);

  const allNightsAvailable = useMemo(() => {
    if (!checkIn || !checkOut || nightCount <= 0 || !room) return true;
    const d = new Date(checkIn);
    for (let i = 0; i < nightCount; i++) {
      if (!isDateAvailable(room.id, d)) return false;
      d.setDate(d.getDate() + 1);
    }
    return true;
  }, [checkIn, checkOut, nightCount, room, isDateAvailable]);

  const comboTotal = useMemo(() => {
    const oldTotal = selectedCombos.reduce((sum, c) => sum + c.price * c.quantity, 0);
    const newTotal = comboSelection ? comboSelection.pricePerPerson * comboSelection.quantity : 0;
    return oldTotal + newTotal;
  }, [selectedCombos, comboSelection]);

  const roomTotal = useMemo(() => {
    if (!checkIn || !checkOut || nightCount <= 0 || !room) return 0;
    let total = 0;
    const d = new Date(checkIn);
    for (let i = 0; i < nightCount; i++) {
      total += getRoomPrice(room, d);
      d.setDate(d.getDate() + 1);
    }
    return total * quantity;
  }, [checkIn, checkOut, nightCount, room, getRoomPrice, quantity]);

  // Calculate discounts
  const memberDiscountPercent = user ? TIER_DISCOUNT[user.tier] : 0;

  const promoDiscountPercent = useMemo(() => {
    if (!activePromo) return 0;
    let base = activePromo.discount_percent || 0;
    
    // For group promos, add tier-based discount from group_discount_tiers
    if (isGroupPromo && groupSize) {
      const size = parseInt(groupSize) || 0;
      const tiers = (activePromo as any).group_discount_tiers || [];
      for (const tier of tiers) {
        if (size >= tier.min && size <= tier.max) {
          base += tier.discount;
          break;
        }
      }
    }
    return base;
  }, [activePromo, isGroupPromo, groupSize]);

  // Discount code calculation - respect applies_to setting
  const discountCodeAmount = useMemo(() => {
    if (!appliedDiscountCode) return 0;
    // If code applies to 'room' only, base = roomTotal only
    // If code applies to 'food' only, base = comboTotal only  
    // If code applies to 'all', base = roomTotal + comboTotal
    let base = roomTotal + comboTotal;
    if (appliedDiscountCode.applies_to === 'room') {
      base = roomTotal;
    } else if (appliedDiscountCode.applies_to === 'food') {
      base = comboTotal;
    }
    if (appliedDiscountCode.discount_type === 'percent') {
      return Math.round(base * appliedDiscountCode.discount_value / 100);
    }
    return Math.min(appliedDiscountCode.discount_value, base);
  }, [appliedDiscountCode, roomTotal, comboTotal]);

  const totalDiscountPercent = memberDiscountPercent + promoDiscountPercent;
  const originalPrice = roomTotal + comboTotal;
  const percentDiscount = Math.round(originalPrice * totalDiscountPercent / 100);
  const discountAmount = percentDiscount + discountCodeAmount;
  const totalPrice = originalPrice - discountAmount;

  const hasSelectedCombo = selectedCombos.length > 0 && selectedCombos.some(c => c.quantity > 0) || comboSelection !== null;
  const comboValidationError = comboRequired && !hasSelectedCombo;

  const toggleCombo = (item: typeof comboItems[0]) => {
    setSelectedCombos(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.filter(c => c.id !== item.id);
      }
      return [...prev, { id: item.id, name: item.name_vi, price: item.price_vnd, quantity: 1 }];
    });
  };

  const updateComboQty = (id: string, delta: number) => {
    setSelectedCombos(prev => prev.map(c => 
      c.id === id ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c
    ));
  };

  const availableServices = [
    { id: 'dining', label: 'Ăn uống / Tiệc', labelEn: 'Dining / Banquet' },
    { id: 'transport', label: 'Xe đưa đón', labelEn: 'Transportation' },
    { id: 'event', label: 'Tổ chức sự kiện', labelEn: 'Event Planning' },
    { id: 'decoration', label: 'Trang trí', labelEn: 'Decoration' },
    { id: 'karaoke', label: 'Karaoke / Giải trí', labelEn: 'Karaoke / Entertainment' },
    { id: 'pool', label: 'Tiệc bể bơi', labelEn: 'Pool Party' },
  ];

  const toggleService = (serviceId: string) => {
    setSpecialServices(prev => 
      prev.includes(serviceId) ? prev.filter(s => s !== serviceId) : [...prev, serviceId]
    );
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name || !phone || !checkIn || !checkOut) {
      toast({ title: 'Vui lòng điền đầy đủ thông tin', variant: 'destructive' });
      return;
    }
    if (!allNightsAvailable) {
      toast({ title: 'Một số đêm đã đóng bán, vui lòng chọn ngày khác', variant: 'destructive' });
      return;
    }
    if (comboValidationError) {
      toast({ title: 'Ngày bạn chọn yêu cầu chọn ít nhất 1 combo ăn uống', variant: 'destructive' });
      return;
    }
    if (isGroupPromo && !companyName) {
      toast({ title: 'Vui lòng nhập tên công ty/đoàn', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const combosPayload = selectedCombos.filter(c => c.quantity > 0).map(c => ({
        dining_item_id: c.id,
        combo_name: c.name,
        price_vnd: c.price,
        quantity: c.quantity,
      }));

      // Add new combo selection to payload
      if (comboSelection) {
        combosPayload.push({
          dining_item_id: comboSelection.packageId,
          combo_name: `${comboSelection.packageName} – ${comboSelection.menuName}`,
          price_vnd: comboSelection.pricePerPerson,
          quantity: comboSelection.quantity,
        });
      }

      const serviceLabels = specialServices.map(id => 
        availableServices.find(s => s.id === id)?.label || id
      ).join(', ');

      const resp = await fetch(BOOKING_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          room_id: roomId,
          guest_name: name,
          guest_email: email,
          guest_phone: phone,
          guest_notes: notes,
          check_in: format(checkIn, 'yyyy-MM-dd'),
          check_out: format(checkOut, 'yyyy-MM-dd'),
          guests_count: parseInt(guests),
          total_price_vnd: totalPrice,
          original_price_vnd: originalPrice,
          room_quantity: quantity,
          language,
          combos: combosPayload.length > 0 ? combosPayload : undefined,
          combo_total: comboTotal > 0 ? comboTotal : undefined,
          // Promotion data
          promotion_id: activePromo?.id || undefined,
          promotion_discount_percent: promoDiscountPercent > 0 ? promoDiscountPercent : undefined,
          promotion_discount_amount: promoDiscountPercent > 0 ? Math.round(originalPrice * promoDiscountPercent / 100) : undefined,
          member_discount_percent: memberDiscountPercent > 0 ? memberDiscountPercent : undefined,
          member_discount_amount: memberDiscountPercent > 0 ? Math.round(originalPrice * memberDiscountPercent / 100) : undefined,
          discount_code: appliedDiscountCode?.code || undefined,
          company_name: companyName || undefined,
          group_size: groupSize ? parseInt(groupSize) : undefined,
          special_services: serviceLabels || undefined,
          decoration_notes: decorationNotes || undefined,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Lỗi đặt phòng');
      navigate(`/invoice/${data.booking_code}`);
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!room) return null;

  const isVi = language === 'vi';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl font-bold text-foreground mb-8 text-center"
          >
            {t('booking.title')}
          </motion.h1>

          {/* Active promotion banner */}
          {activePromo && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3"
            >
              <Gift className="h-6 w-6 text-primary shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">
                  {isVi ? `Đang áp dụng: ${activePromo.title_vi}` : `Applied: ${activePromo.title_en}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {promoDiscountPercent > 0 && `Giảm ${promoDiscountPercent}%`}
                  {memberDiscountPercent > 0 && ` + Thành viên ${memberDiscountPercent}%`}
                  {totalDiscountPercent > 0 && ` = Tổng giảm ${totalDiscountPercent}%`}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/booking')}>✕</Button>
            </motion.div>
          )}

          {/* Member discount banner */}
          {!activePromo && user && memberDiscountPercent > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 bg-primary/5 border border-primary/20 rounded-xl p-3 text-center"
            >
              <p className="text-sm text-foreground">
                ⭐ {isVi 
                  ? `Bạn đang được giảm ${memberDiscountPercent}% (Hạng ${user.tier === 'super_vip' ? 'Siêu VIP' : user.tier === 'vip' ? 'VIP' : 'Thành viên'})`
                  : `${memberDiscountPercent}% discount (${user.tier.replace('_',' ').toUpperCase()})`}
              </p>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Room selection */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h2 className="font-display text-xl font-semibold">{t('nav.rooms')}</h2>
                <Select value={roomId} onValueChange={setRoomId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name[language]} - {formatPrice(r.priceVND)}{t('room.per_night')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{t('search.checkin')}</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start", !checkIn && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {checkIn ? format(checkIn, 'dd/MM/yyyy') : t('search.checkin')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} locale={calendarLocale} initialFocus className="p-3 pointer-events-auto" disabled={(d) => d < new Date()} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{t('search.checkout')}</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start", !checkOut && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {checkOut ? format(checkOut, 'dd/MM/yyyy') : t('search.checkout')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} locale={calendarLocale} initialFocus className="p-3 pointer-events-auto" disabled={(d) => d < (checkIn || new Date())} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{t('search.guests')}</label>
                    <Select value={guests} onValueChange={setGuests}>
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" /><SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{t('booking.rooms_count')}</label>
                    <div className="flex items-center gap-2 h-10">
                      <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="flex-1 text-center font-semibold text-lg">{quantity}</span>
                      <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => setQuantity(quantity + 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group/Corporate promo form */}
              {isGroupPromo && (
                <div className="bg-card rounded-xl border-2 border-primary/30 p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h2 className="font-display text-xl font-semibold">{isVi ? 'Thông tin đoàn / công ty' : 'Group / Company Info'}</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{isVi ? 'Tên công ty / đoàn *' : 'Company / Group Name *'}</label>
                      <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder={isVi ? 'Công ty ABC' : 'ABC Company'} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{isVi ? 'Số lượng người *' : 'Group Size *'}</label>
                      <Input type="number" value={groupSize} onChange={e => setGroupSize(e.target.value)} placeholder="20" min="1" />
                    </div>
                  </div>
                  {groupSize && promoDiscountPercent > 0 && (
                    <p className="text-sm text-primary font-medium">
                      🎉 {isVi ? `Đoàn ${groupSize} người → Giảm ${promoDiscountPercent}%` : `Group of ${groupSize} → ${promoDiscountPercent}% off`}
                    </p>
                  )}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">{isVi ? 'Nhu cầu dịch vụ' : 'Service Needs'}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availableServices.map(service => (
                        <label key={service.id} className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm",
                          specialServices.includes(service.id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        )}>
                          <Checkbox 
                            checked={specialServices.includes(service.id)} 
                            onCheckedChange={() => toggleService(service.id)} 
                          />
                          {isVi ? service.label : service.labelEn}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Couple/Family promo form */}
              {isCouplePromo && (
                <div className="bg-card rounded-xl border-2 border-pink-300 p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-pink-500" />
                    <h2 className="font-display text-xl font-semibold">{isVi ? 'Ưu đãi cặp đôi / gia đình' : 'Couple / Family Offer'}</h2>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{isVi ? 'Yêu cầu trang trí' : 'Decoration Requests'}</label>
                    <Textarea value={decorationNotes} onChange={e => setDecorationNotes(e.target.value)} rows={2} placeholder={isVi ? 'VD: Trang trí hoa, nến, bóng bay...' : 'E.g.: Flowers, candles, balloons...'} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">{isVi ? 'Dịch vụ đi kèm' : 'Additional Services'}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availableServices.map(service => (
                        <label key={service.id} className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm",
                          specialServices.includes(service.id) ? "border-pink-400 bg-pink-50 dark:bg-pink-900/20" : "border-border hover:border-pink-300"
                        )}>
                          <Checkbox 
                            checked={specialServices.includes(service.id)} 
                            onCheckedChange={() => toggleService(service.id)} 
                          />
                          {isVi ? service.label : service.labelEn}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Combo ăn uống section */}
              {/* New Combo Selector */}
              <ComboSelector
                required={comboRequired}
                selection={comboSelection}
                onSelect={setComboSelection}
                guestCount={parseInt(guests)}
              />

              {/* Guest info */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h2 className="font-display text-xl font-semibold">{t('booking.guest_info')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{t('booking.full_name')} *</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{t('booking.email')}</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{t('booking.phone')} *</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{t('booking.notes')}</label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                </div>
              </div>
            </motion.div>

            {/* Summary sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-card rounded-xl border border-border p-6 sticky top-24 space-y-4">
                <h2 className="font-display text-xl font-semibold">{t('booking.summary')}</h2>
                <div className="rounded-lg overflow-hidden">
                  <img src={room.image} alt={room.name[language]} className="w-full h-40 object-cover" />
                </div>
                <h3 className="font-display text-lg font-semibold">{room.name[language]}</h3>
                <div className="space-y-2 text-sm">
                  {checkIn && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('search.checkin')}</span>
                      <span className="font-medium">{format(checkIn, 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                  {checkOut && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('search.checkout')}</span>
                      <span className="font-medium">{format(checkOut, 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                  {nightCount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('booking.nights')}</span>
                      <span className="font-medium">{nightCount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('search.guests')}</span>
                    <span className="font-medium">{guests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('booking.rooms_count')}</span>
                    <span className="font-medium">{quantity}</span>
                  </div>
                  {roomTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tiền phòng</span>
                      <span className="font-medium">{formatPrice(roomTotal)}</span>
                    </div>
                  )}
                </div>

                {/* Combos in summary */}
                {(selectedCombos.some(c => c.quantity > 0) || comboSelection) && (
                  <div className="border-t border-border pt-3 space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-1">
                      <UtensilsCrossed className="h-3.5 w-3.5 text-primary" /> Combo ăn uống
                    </h4>
                    {selectedCombos.filter(c => c.quantity > 0).map(c => (
                      <div key={c.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{c.name} ×{c.quantity}</span>
                        <span className="font-medium">{formatPrice(c.price * c.quantity)}</span>
                      </div>
                    ))}
                    {comboSelection && (
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{comboSelection.packageName} – {comboSelection.menuName} ×{comboSelection.quantity}</span>
                          <span className="font-medium">{formatPrice(comboSelection.pricePerPerson * comboSelection.quantity)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{comboSelection.dishes.slice(0, 5).join(', ')}...</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Promotion info in summary */}
                {(isGroupPromo || isCouplePromo) && (
                  <div className="border-t border-border pt-3 space-y-1">
                    {isGroupPromo && companyName && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Công ty:</span>
                        <span className="font-medium">{companyName}</span>
                      </div>
                    )}
                    {groupSize && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Số người:</span>
                        <span className="font-medium">{groupSize}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Discount code input */}
                {originalPrice > 0 && (
                  <div className="border-t border-border pt-3">
                    <h4 className="font-semibold text-sm mb-2">{isVi ? '🎟️ Mã giảm giá' : '🎟️ Discount Code'}</h4>
                    <DiscountCodeInput
                      orderType="room"
                      orderAmount={originalPrice}
                      onApply={setAppliedDiscountCode}
                      onRemove={() => setAppliedDiscountCode(null)}
                      appliedCode={appliedDiscountCode}
                    />
                  </div>
                )}

                {/* Discounts */}
                {(totalDiscountPercent > 0 || discountCodeAmount > 0) && originalPrice > 0 && (
                  <div className="border-t border-border pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Giá gốc</span>
                      <span className="font-medium line-through text-muted-foreground">{formatPrice(originalPrice)}</span>
                    </div>
                    {memberDiscountPercent > 0 && (
                      <div className="flex justify-between text-sm text-primary">
                        <span>Giảm thành viên ({memberDiscountPercent}%)</span>
                        <span>-{formatPrice(Math.round(originalPrice * memberDiscountPercent / 100))}</span>
                      </div>
                    )}
                    {promoDiscountPercent > 0 && (
                      <div className="flex justify-between text-sm text-primary">
                        <span>Giảm ưu đãi ({promoDiscountPercent}%)</span>
                        <span>-{formatPrice(Math.round(originalPrice * promoDiscountPercent / 100))}</span>
                      </div>
                    )}
                    {discountCodeAmount > 0 && appliedDiscountCode && (
                      <div className="flex justify-between text-sm text-primary">
                        <span>Mã {appliedDiscountCode.code}</span>
                        <span>-{formatPrice(discountCodeAmount)}</span>
                      </div>
                    )}
                  </div>
                )}

                {!allNightsAvailable && nightCount > 0 && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
                    Một số đêm trong khoảng ngày đã chọn đang đóng bán. Vui lòng chọn ngày khác.
                  </div>
                )}
                {comboValidationError && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-300 rounded-lg p-3 text-sm text-purple-700 dark:text-purple-300">
                    ⚠️ Vui lòng chọn ít nhất 1 combo ăn uống.
                  </div>
                )}
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="font-display text-lg font-semibold">{t('booking.total')}</span>
                    <span className="text-2xl font-bold text-primary">{totalPrice > 0 ? formatPrice(totalPrice) : '—'}</span>
                  </div>
                  {totalPrice > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Đặt cọc 50%</span>
                      <span className="font-semibold">{formatPrice(Math.round(totalPrice * 0.5))}</span>
                    </div>
                  )}
                </div>
                <Button variant="hero" className="w-full" onClick={handleSubmit} disabled={submitting || !allNightsAvailable || comboValidationError}>
                  {submitting ? t('booking.processing') : t('booking.confirm')}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default Booking;
