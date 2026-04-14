import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { CalendarIcon, Users, UtensilsCrossed, AlertTriangle, Gift, Building2, Heart, Zap, Percent, Brain, ShoppingBag, UserPlus, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import ComboSelector, { ComboSelection } from '@/components/ComboSelector';
import IndividualFoodSelector, { FoodItem } from '@/components/IndividualFoodSelector';
import DiscountCodeInput from '@/components/DiscountCodeInput';
import BookingRoomCard from '@/components/BookingRoomCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type DiscountCode, useFlashSales, useGlobalDiscounts, useSmartPricing } from '@/hooks/usePromotionSystem';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import { useRooms } from '@/hooks/useRooms';
import { useSiteSettings } from '@/hooks/useSiteSettings';
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

const ROOM_GUEST_LIMITS: Record<string, number> = {
  standard: 2,
  deluxe: 4,
  family: 4,
};
const EXTRA_PERSON_SURCHARGE_PERCENT = 0.3;

// Multi-room cart type
interface RoomCartItem {
  roomId: string;
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
  const { flashSales } = useFlashSales();
  const { discounts: globalDiscounts } = useGlobalDiscounts();
  const { rules: smartRules } = useSmartPricing();
  const { settings } = useSiteSettings();
  const webDiscountPercent = parseInt(settings.web_discount_percent || '0', 10);

  const preselectedRoom = searchParams.get('room') || '';
  const preCheckin = searchParams.get('checkin');
  const preCheckout = searchParams.get('checkout');
  const promoId = searchParams.get('promo');
  const promoType = searchParams.get('promo_type');

  // Multi-room cart
  const [roomCart, setRoomCart] = useState<RoomCartItem[]>(() => {
    if (preselectedRoom) {
      return [{ roomId: preselectedRoom, quantity: 1 }];
    }
    return [];
  });

  const [checkIn, setCheckIn] = useState<Date | undefined>(preCheckin ? new Date(preCheckin + 'T00:00:00') : undefined);
  const [checkOut, setCheckOut] = useState<Date | undefined>(preCheckout ? new Date(preCheckout + 'T00:00:00') : undefined);
  const [guests, setGuests] = useState(searchParams.get('guests') || '2');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [comboSelections, setComboSelections] = useState<ComboSelection[]>([]);
  const [comboNotes, setComboNotes] = useState('');
  const [individualFoods, setIndividualFoods] = useState<FoodItem[]>([]);
  const [foodSelectorOpen, setFoodSelectorOpen] = useState(false);
  const [appliedDiscountCode, setAppliedDiscountCode] = useState<DiscountCode | null>(null);

  // Promotion-specific fields
  const [companyName, setCompanyName] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [specialServices, setSpecialServices] = useState<string[]>([]);
  const [decorationNotes, setDecorationNotes] = useState('');

  useEffect(() => {
    if (user) {
      if (!name) setName(user.fullName);
      if (!email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
    }
  }, [user]);

  // Derived values from cart
  const selectedRooms = useMemo(() => {
    return roomCart.filter(item => item.quantity > 0).map(item => ({
      ...item,
      room: rooms.find(r => r.id === item.roomId),
    })).filter(item => item.room);
  }, [roomCart, rooms]);

  const totalRoomQuantity = useMemo(() => selectedRooms.reduce((s, r) => s + r.quantity, 0), [selectedRooms]);
  const hasRooms = totalRoomQuantity > 0;

  // Primary room (first selected) for backward compat
  const primaryRoom = selectedRooms[0]?.room || rooms[0];
  const primaryRoomId = primaryRoom?.id || '';

  const nightCount = checkIn && checkOut ? Math.max(differenceInDays(checkOut, checkIn), 1) : 0;
  const calendarLocale = localeMap[language] || vi;
  const guestCount = parseInt(guests) || 2;

  // Standard capacity = sum of all room capacities
  const standardCapacity = useMemo(() => {
    return selectedRooms.reduce((sum, item) => {
      const limit = ROOM_GUEST_LIMITS[item.roomId] || item.room!.capacity || 2;
      return sum + limit * item.quantity;
    }, 0);
  }, [selectedRooms]);

  const extraPersonCount = useMemo(() => Math.max(0, guestCount - standardCapacity), [guestCount, standardCapacity]);

  // Active promotion
  const activePromo = useMemo(() => {
    if (!promoId) return null;
    return promotions.find(p => p.id === promoId && p.is_active) || null;
  }, [promoId, promotions]);

  const isGroupPromo = promoType === 'group' || (activePromo as any)?.promo_type === 'group';
  const isCouplePromo = promoType === 'couple' || (activePromo as any)?.promo_type === 'couple';

  const comboRequired = useMemo(() => {
    if (!checkIn || !checkOut) return false;
    return selectedRooms.some(item => hasComboRequiredDays(item.roomId, checkIn!, checkOut!));
  }, [checkIn, checkOut, selectedRooms, hasComboRequiredDays]);

  const allNightsAvailable = useMemo(() => {
    if (!checkIn || !checkOut || nightCount <= 0) return true;
    for (const item of selectedRooms) {
      const d = new Date(checkIn);
      for (let i = 0; i < nightCount; i++) {
        if (!isDateAvailable(item.roomId, d)) return false;
        d.setDate(d.getDate() + 1);
      }
    }
    return true;
  }, [checkIn, checkOut, nightCount, selectedRooms, isDateAvailable]);

  const comboTotal = useMemo(() => comboSelections.reduce((sum, s) => sum + s.pricePerPerson * s.quantity, 0), [comboSelections]);
  const individualFoodTotal = useMemo(() => individualFoods.reduce((sum, f) => sum + f.price * f.quantity, 0), [individualFoods]);

  // Room total for each room type
  const roomTotals = useMemo(() => {
    if (!checkIn || !checkOut || nightCount <= 0) return [];
    return selectedRooms.map(item => {
      let total = 0;
      const d = new Date(checkIn);
      for (let i = 0; i < nightCount; i++) {
        total += getRoomPrice(item.room!, d);
        d.setDate(d.getDate() + 1);
      }
      return { roomId: item.roomId, room: item.room!, quantity: item.quantity, totalPerRoom: total, subtotal: total * item.quantity };
    });
  }, [checkIn, checkOut, nightCount, selectedRooms, getRoomPrice]);

  const roomTotal = useMemo(() => roomTotals.reduce((s, r) => s + r.subtotal, 0), [roomTotals]);

  // Extra person surcharge = 30% of room price per extra person (averaged)
  const extraPersonSurcharge = useMemo(() => {
    if (extraPersonCount <= 0 || roomTotal <= 0) return 0;
    return Math.round(roomTotal * EXTRA_PERSON_SURCHARGE_PERCENT * extraPersonCount / totalRoomQuantity);
  }, [extraPersonCount, roomTotal, totalRoomQuantity]);

  // === FLASH SALE ===
  const activeFlashSaleItem = useMemo(() => {
    if (flashSales.length === 0 || selectedRooms.length === 0) return null;
    for (const sale of flashSales) {
      for (const sr of selectedRooms) {
        const item = (sale.items || []).find(i => i.item_type === 'room' && i.item_id === sr.roomId && i.quantity_sold < i.quantity_limit);
        if (item) return { ...item, saleName: sale.title_vi };
      }
    }
    return null;
  }, [selectedRooms, flashSales]);

  const flashSaleDiscount = useMemo(() => {
    if (!activeFlashSaleItem || roomTotal <= 0) return 0;
    const originalPerNight = activeFlashSaleItem.original_price;
    const salePerNight = activeFlashSaleItem.sale_price;
    if (originalPerNight <= 0) return 0;
    return (originalPerNight - salePerNight) * nightCount;
  }, [activeFlashSaleItem, roomTotal, nightCount]);

  // === GLOBAL DISCOUNT ===
  const activeGlobalDiscount = useMemo(() => {
    return globalDiscounts.find(gd => {
      if (gd.applies_to === 'food') return false;
      const items = (gd as any).applies_to_items || [];
      if (items.length > 0 && !selectedRooms.some(sr => items.includes(sr.roomId))) return false;
      return true;
    }) || null;
  }, [globalDiscounts, selectedRooms]);

  const globalDiscountAmount = useMemo(() => {
    if (!activeGlobalDiscount || roomTotal <= 0) return 0;
    return Math.round(roomTotal * activeGlobalDiscount.discount_percent / 100);
  }, [activeGlobalDiscount, roomTotal]);

  // === SMART PRICING ===
  const activeSmartRule = useMemo(() => {
    if (!checkIn || smartRules.length === 0) return null;
    const now = new Date();
    const daysAdvance = differenceInDays(checkIn, now);
    const checkInDay = checkIn.getDay();

    for (const rule of smartRules) {
      if (rule.applies_to === 'food') continue;
      const items = (rule as any).applies_to_items || [];
      if (items.length > 0 && !selectedRooms.some(sr => items.includes(sr.roomId))) continue;
      if (rule.rule_type === 'early_bird' && rule.min_days_advance && daysAdvance >= rule.min_days_advance) return rule;
      if (rule.rule_type === 'day_of_week' && rule.day_of_week !== null && checkInDay === rule.day_of_week) return rule;
    }
    return null;
  }, [checkIn, smartRules, selectedRooms]);

  const smartPricingAmount = useMemo(() => {
    if (!activeSmartRule || roomTotal <= 0) return 0;
    return Math.round(roomTotal * activeSmartRule.discount_percent / 100);
  }, [activeSmartRule, roomTotal]);

  // Calculate discounts
  const memberDiscountPercent = user ? TIER_DISCOUNT[user.tier] : 0;

  const promoDiscountPercent = useMemo(() => {
    if (!activePromo) return 0;
    let base = activePromo.discount_percent || 0;
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

  const discountCodeAmount = useMemo(() => {
    if (!appliedDiscountCode) return 0;
    let base = roomTotal + comboTotal + individualFoodTotal;
    if (appliedDiscountCode.applies_to === 'room') base = roomTotal;
    else if (appliedDiscountCode.applies_to === 'food') base = comboTotal + individualFoodTotal;
    if (appliedDiscountCode.discount_type === 'percent') {
      return Math.round(base * appliedDiscountCode.discount_value / 100);
    }
    return Math.min(appliedDiscountCode.discount_value, base);
  }, [appliedDiscountCode, roomTotal, comboTotal, individualFoodTotal]);

  const webDiscountAmount = useMemo(() => {
    if (webDiscountPercent <= 0 || roomTotal <= 0) return 0;
    return Math.round(roomTotal * webDiscountPercent / 100);
  }, [webDiscountPercent, roomTotal]);

  const totalDiscountPercent = memberDiscountPercent + promoDiscountPercent;
  const originalPrice = roomTotal + extraPersonSurcharge + comboTotal + individualFoodTotal;
  const percentDiscount = Math.round(originalPrice * totalDiscountPercent / 100);
  const allAutoDiscounts = flashSaleDiscount + globalDiscountAmount + smartPricingAmount + webDiscountAmount;
  const discountAmount = percentDiscount + discountCodeAmount + allAutoDiscounts;
  const totalPrice = Math.max(0, originalPrice - discountAmount);

  const appliedPromotions = useMemo(() => {
    const list: { name: string; amount: number; badge?: string }[] = [];
    if (webDiscountAmount > 0) {
      list.push({ name: `🌐 Giảm giá đặt qua web (-${webDiscountPercent}%)`, amount: webDiscountAmount, badge: 'Web' });
    }
    if (flashSaleDiscount > 0 && activeFlashSaleItem) {
      list.push({ name: `⚡ Flash Sale: ${(activeFlashSaleItem as any).saleName}`, amount: flashSaleDiscount, badge: 'Flash Sale' });
    }
    if (globalDiscountAmount > 0 && activeGlobalDiscount) {
      list.push({ name: `🎉 ${activeGlobalDiscount.title_vi} (-${activeGlobalDiscount.discount_percent}%)`, amount: globalDiscountAmount, badge: 'Giảm giá chung' });
    }
    if (smartPricingAmount > 0 && activeSmartRule) {
      list.push({ name: `🧠 ${activeSmartRule.title_vi} (-${activeSmartRule.discount_percent}%)`, amount: smartPricingAmount, badge: activeSmartRule.badge_text_vi || 'Smart Price' });
    }
    return list;
  }, [webDiscountAmount, webDiscountPercent, flashSaleDiscount, globalDiscountAmount, smartPricingAmount, activeFlashSaleItem, activeGlobalDiscount, activeSmartRule]);

  // Combo validation
  const totalComboServings = comboSelections.reduce((s, c) => s + c.quantity, 0);
  const hasSelectedCombo = comboSelections.length > 0;
  const comboServingsMatch = totalComboServings === guestCount;
  const comboServingsError = hasSelectedCombo && !comboServingsMatch;
  const comboValidationError = comboRequired && !hasSelectedCombo;
  const multiComboNeedsNotes = comboSelections.length >= 2 && !comboNotes.trim();

  const availableServices = [
    { id: 'dining', label: 'Ăn uống / Tiệc', labelEn: 'Dining / Banquet' },
    { id: 'transport', label: 'Xe đưa đón', labelEn: 'Transportation' },
    { id: 'event', label: 'Tổ chức sự kiện', labelEn: 'Event Planning' },
    { id: 'decoration', label: 'Trang trí', labelEn: 'Decoration' },
    { id: 'karaoke', label: 'Karaoke / Giải trí', labelEn: 'Karaoke / Entertainment' },
    { id: 'pool', label: 'Tiệc bể bơi', labelEn: 'Pool Party' },
  ];

  const toggleService = (serviceId: string) => {
    setSpecialServices(prev => prev.includes(serviceId) ? prev.filter(s => s !== serviceId) : [...prev, serviceId]);
  };

  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const canSubmit = useMemo(() => {
    if (!name || !phone || !checkIn || !checkOut) return false;
    if (!hasRooms) return false;
    if (!allNightsAvailable) return false;
    if (comboValidationError) return false;
    if (comboServingsError) return false;
    if (multiComboNeedsNotes) return false;
    if (isGroupPromo && !companyName) return false;
    return true;
  }, [name, phone, checkIn, checkOut, hasRooms, allNightsAvailable, comboValidationError, comboServingsError, multiComboNeedsNotes, isGroupPromo, companyName]);

  const updateRoomQuantity = (roomId: string, qty: number) => {
    setRoomCart(prev => {
      const existing = prev.find(item => item.roomId === roomId);
      if (existing) {
        if (qty <= 0) return prev.filter(item => item.roomId !== roomId);
        return prev.map(item => item.roomId === roomId ? { ...item, quantity: qty } : item);
      }
      if (qty > 0) return [...prev, { roomId, quantity: qty }];
      return prev;
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      if (!hasRooms) {
        toast({ title: 'Vui lòng chọn ít nhất 1 phòng', variant: 'destructive' });
        return;
      }
      if (comboServingsError) {
        toast({ title: `Tổng số suất combo (${totalComboServings}) phải bằng số người lớn (${guestCount})`, variant: 'destructive' });
        return;
      }
      if (multiComboNeedsNotes) {
        toast({ title: 'Vui lòng nhập ghi chú yêu cầu ăn uống khi chọn nhiều loại combo', variant: 'destructive' });
        return;
      }
      toast({ title: 'Vui lòng điền đầy đủ thông tin', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const combosPayload = comboSelections.map(c => ({
        combo_package_id: c.packageId,
        combo_menu_id: c.menuId,
        combo_package_name: c.packageName,
        combo_menu_name: c.menuName,
        combo_name: `${c.packageName} – ${c.menuName}`,
        price_vnd: c.pricePerPerson,
        quantity: c.quantity,
      }));

      const foodItemsPayload = individualFoods.map(f => ({
        menu_item_id: f.id.includes('__') ? f.id.split('__')[0] : f.id,
        name: f.priceLabel ? `${f.name} (${f.priceLabel})` : f.name,
        price_vnd: f.price,
        quantity: f.quantity,
      }));

      const serviceLabels = specialServices.map(id =>
        availableServices.find(s => s.id === id)?.label || id
      ).join(', ');

      // For multi-room, use primary room as room_id (backward compat)
      // Include room_details for full breakdown
      const roomDetails = selectedRooms.map(sr => ({
        room_id: sr.roomId,
        room_name: sr.room!.name[language],
        quantity: sr.quantity,
      }));

      const roomBreakdown = roomTotals.map(rt => ({
        room_id: rt.roomId,
        room_name: rt.room.name[language],
        quantity: rt.quantity,
        subtotal: rt.subtotal,
        average_nightly_rate: rt.totalPerRoom,
      }));

      const resp = await fetch(BOOKING_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          room_id: primaryRoomId,
          guest_name: name,
          guest_email: email,
          guest_phone: phone,
          guest_notes: notes,
          check_in: format(checkIn!, 'yyyy-MM-dd'),
          check_out: format(checkOut!, 'yyyy-MM-dd'),
          guests_count: guestCount,
          total_price_vnd: totalPrice,
          original_price_vnd: originalPrice,
          room_subtotal: roomTotal,
          room_quantity: totalRoomQuantity,
          language,
          combos: combosPayload.length > 0 ? combosPayload : undefined,
          combo_total: comboTotal > 0 ? comboTotal : undefined,
          combo_notes: comboNotes || undefined,
          food_items: foodItemsPayload.length > 0 ? foodItemsPayload : undefined,
          individual_food_total: individualFoodTotal > 0 ? individualFoodTotal : undefined,
          extra_person_count: extraPersonCount > 0 ? extraPersonCount : undefined,
          extra_person_surcharge: extraPersonSurcharge > 0 ? extraPersonSurcharge : undefined,
          promotion_id: activePromo?.id || undefined,
          promotion_name: [
            activePromo ? (activePromo.title_vi || activePromo.title_en) : null,
            ...appliedPromotions.map(p => p.name),
          ].filter(Boolean).join(' | ') || undefined,
          promotion_discount_percent: promoDiscountPercent > 0 ? promoDiscountPercent : undefined,
          promotion_discount_amount: (promoDiscountPercent > 0 ? Math.round(originalPrice * promoDiscountPercent / 100) : 0) + allAutoDiscounts || undefined,
          member_discount_percent: memberDiscountPercent > 0 ? memberDiscountPercent : undefined,
          member_discount_amount: memberDiscountPercent > 0 ? Math.round(originalPrice * memberDiscountPercent / 100) : undefined,
          discount_code: appliedDiscountCode?.code || undefined,
          discount_code_amount: discountCodeAmount > 0 ? discountCodeAmount : undefined,
          discount_code_type: appliedDiscountCode?.discount_type || undefined,
          discount_code_value: appliedDiscountCode?.discount_value || undefined,
          company_name: companyName || undefined,
          group_size: groupSize ? parseInt(groupSize) : undefined,
          special_services: serviceLabels || undefined,
          decoration_notes: decorationNotes || undefined,
          room_details: roomDetails,
          room_breakdown: roomBreakdown,
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

  if (!rooms.length) return null;

  const isVi = language === 'vi';
  const maxGuestsTotal = standardCapacity + 6;

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
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-6 bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
              <p className="text-sm text-foreground">
                ⭐ {isVi
                  ? `Bạn đang được giảm ${memberDiscountPercent}% (Hạng ${user.tier === 'super_vip' ? 'Siêu VIP' : user.tier === 'vip' ? 'VIP' : 'Thành viên'})`
                  : `${memberDiscountPercent}% discount (${user.tier.replace('_', ' ').toUpperCase()})`}
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
              {/* Flash Sale banner */}
              {activeFlashSaleItem && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-300 dark:border-orange-700 rounded-xl p-4 flex items-center gap-3">
                  <Zap className="h-6 w-6 text-orange-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">⚡ {(activeFlashSaleItem as any).saleName}</p>
                    <p className="text-xs text-muted-foreground">
                      {isVi ? 'Giá Flash Sale: ' : 'Flash Sale Price: '}
                      <span className="line-through">{formatPrice(activeFlashSaleItem.original_price)}</span>
                      {' → '}
                      <span className="font-bold text-primary">{formatPrice(activeFlashSaleItem.sale_price)}</span>
                      /đêm · Còn {activeFlashSaleItem.quantity_limit - activeFlashSaleItem.quantity_sold} suất
                    </p>
                  </div>
                  <Badge className="bg-orange-500 text-white shrink-0">-{Math.round((1 - activeFlashSaleItem.sale_price / activeFlashSaleItem.original_price) * 100)}%</Badge>
                </motion.div>
              )}

              {/* Multi-Room Selection */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                  🏨 {isVi ? 'Chọn phòng' : 'Select Rooms'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isVi ? 'Bạn có thể chọn nhiều loại phòng trong cùng 1 đơn đặt' : 'You can select multiple room types in one booking'}
                </p>
                <div className="space-y-3">
                  {rooms.map(room => {
                    const cartItem = roomCart.find(c => c.roomId === room.id);
                    const qty = cartItem?.quantity || 0;
                    return (
                      <BookingRoomCard
                        key={room.id}
                        room={room}
                        quantity={qty}
                        onQuantityChange={(newQty) => updateRoomQuantity(room.id, newQty)}
                        nightlyPrice={formatPrice(room.priceVND)}
                      />
                    );
                  })}
                </div>

                {!hasRooms && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-300 text-center">
                    ⚠️ {isVi ? 'Vui lòng chọn ít nhất 1 phòng để tiếp tục' : 'Please select at least 1 room to continue'}
                  </div>
                )}
              </div>

              {/* Date & Guests */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h2 className="font-display text-xl font-semibold">📅 {isVi ? 'Ngày & Số khách' : 'Dates & Guests'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        {Array.from({ length: Math.max(maxGuestsTotal, 1) }, (_, i) => i + 1).map((n) => (
                          <SelectItem key={n} value={String(n)}>{n} {isVi ? 'người lớn' : 'adults'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Extra person surcharge notice */}
                {extraPersonCount > 0 && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-3 flex items-start gap-2">
                    <UserPlus className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-amber-800 dark:text-amber-300">
                        {isVi ? `Phụ thu thêm ${extraPersonCount} người` : `Surcharge for ${extraPersonCount} extra guests`}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                        {isVi
                          ? `Tổng sức chứa tiêu chuẩn: ${standardCapacity} người. Phụ thu 30% giá phòng mỗi người vượt = `
                          : `Standard capacity: ${standardCapacity}. 30% surcharge per extra guest = `}
                        <strong>{formatPrice(extraPersonSurcharge)}</strong>
                      </p>
                    </div>
                  </motion.div>
                )}
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
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{isVi ? 'Tên công ty / đoàn *' : 'Company *'}</label>
                      <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Công ty ABC" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{isVi ? 'Số lượng người *' : 'Group Size *'}</label>
                      <Input type="number" value={groupSize} onChange={e => setGroupSize(e.target.value)} placeholder="20" min="1" />
                    </div>
                  </div>
                  {groupSize && promoDiscountPercent > 0 && (
                    <p className="text-sm text-primary font-medium">🎉 Đoàn {groupSize} người → Giảm {promoDiscountPercent}%</p>
                  )}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Nhu cầu dịch vụ</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availableServices.map(service => (
                        <label key={service.id} className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm",
                          specialServices.includes(service.id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        )}>
                          <Checkbox checked={specialServices.includes(service.id)} onCheckedChange={() => toggleService(service.id)} />
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
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Yêu cầu trang trí</label>
                    <Textarea value={decorationNotes} onChange={e => setDecorationNotes(e.target.value)} rows={2} placeholder="VD: Trang trí hoa, nến, bóng bay..." />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Dịch vụ đi kèm</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availableServices.map(service => (
                        <label key={service.id} className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm",
                          specialServices.includes(service.id) ? "border-pink-400 bg-pink-50 dark:bg-pink-900/20" : "border-border hover:border-pink-300"
                        )}>
                          <Checkbox checked={specialServices.includes(service.id)} onCheckedChange={() => toggleService(service.id)} />
                          {isVi ? service.label : service.labelEn}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Combo section */}
              <ComboSelector
                required={comboRequired}
                selections={comboSelections}
                onSelectionsChange={setComboSelections}
                guestCount={guestCount}
                comboNotes={comboNotes}
                onComboNotesChange={setComboNotes}
                onOpenFoodOrder={() => setFoodSelectorOpen(true)}
              />

              <IndividualFoodSelector
                open={foodSelectorOpen}
                onClose={() => setFoodSelectorOpen(false)}
                items={individualFoods}
                onItemsChange={setIndividualFoods}
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

                {/* Room summary */}
                {selectedRooms.length > 0 ? (
                  <div className="space-y-2">
                    {selectedRooms.map(sr => (
                      <div key={sr.roomId} className="flex items-center gap-3">
                        <img src={sr.room!.image} alt="" className="w-16 h-12 object-cover rounded-lg shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{sr.room!.name[language]}</p>
                          <p className="text-xs text-muted-foreground">×{sr.quantity} {isVi ? 'phòng' : 'rooms'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">{isVi ? 'Chưa chọn phòng' : 'No rooms selected'}</p>
                )}

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
                    <span className="font-medium">{guestCount} {isVi ? 'người lớn' : 'adults'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isVi ? 'Tổng phòng' : 'Total rooms'}</span>
                    <span className="font-medium">{totalRoomQuantity}</span>
                  </div>

                  {/* Room price breakdown */}
                  {roomTotals.length > 0 && (
                    <div className="border-t border-border pt-2 space-y-1">
                      <h4 className="font-semibold text-xs">🏨 {isVi ? 'Tiền phòng' : 'Room charges'}</h4>
                      {roomTotals.map(rt => (
                        <div key={rt.roomId} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{rt.room.name[language]} ×{rt.quantity}</span>
                          <span className="font-medium">{formatPrice(rt.subtotal)}</span>
                        </div>
                      ))}
                      {roomTotals.length > 1 && (
                        <div className="flex justify-between text-sm font-medium pt-1">
                          <span className="text-muted-foreground">{isVi ? 'Tổng phòng' : 'Room subtotal'}</span>
                          <span>{formatPrice(roomTotal)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {extraPersonSurcharge > 0 && (
                    <div className="flex justify-between text-amber-700 dark:text-amber-400">
                      <span>👤 Phụ thu +{extraPersonCount} người</span>
                      <span className="font-medium">+{formatPrice(extraPersonSurcharge)}</span>
                    </div>
                  )}
                </div>

                {/* Combo summary */}
                {comboSelections.length > 0 && (
                  <div className="border-t border-border pt-3 space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-1">
                      <UtensilsCrossed className="h-3.5 w-3.5 text-primary" /> Suất ăn (combo)
                    </h4>
                    {comboSelections.map((c, i) => (
                      <div key={i} className="text-sm space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground truncate mr-2">{c.packageName} – {c.menuName} ×{c.quantity}</span>
                          <span className="font-medium shrink-0">{formatPrice(c.pricePerPerson * c.quantity)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground pl-2 line-clamp-1">{c.dishes.slice(0, 4).join(', ')}...</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Individual food summary */}
                <div className="border-t border-border pt-3 space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-1">
                    <ShoppingBag className="h-3.5 w-3.5 text-primary" /> Món ăn riêng
                  </h4>
                  {individualFoods.length > 0 ? (
                    <>
                      {individualFoods.map(f => (
                        <div key={f.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate mr-2">{f.name}{f.priceLabel ? ` (${f.priceLabel})` : ''} ×{f.quantity}</span>
                          <span className="font-medium shrink-0">{formatPrice(f.price * f.quantity)}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Chưa chọn</p>
                  )}
                  <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setFoodSelectorOpen(true)}>
                    <ShoppingBag className="h-3 w-3 mr-1" /> Đặt món riêng
                  </Button>
                </div>

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
                    <h4 className="font-semibold text-sm mb-2">🎟️ Mã giảm giá</h4>
                    <DiscountCodeInput
                      orderType="room"
                      orderAmount={originalPrice}
                      onApply={setAppliedDiscountCode}
                      onRemove={() => setAppliedDiscountCode(null)}
                      appliedCode={appliedDiscountCode}
                    />
                  </div>
                )}

                {/* Auto-applied promotions */}
                {appliedPromotions.length > 0 && (
                  <div className="border-t border-border pt-3 space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-1">🎁 Ưu đãi tự động áp dụng</h4>
                    {appliedPromotions.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-primary/5 rounded-lg px-3 py-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="outline" className="text-xs shrink-0">{p.badge}</Badge>
                          <span className="text-xs truncate">{p.name}</span>
                        </div>
                        <span className="text-primary font-medium shrink-0">-{formatPrice(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Discounts */}
                {(totalDiscountPercent > 0 || discountCodeAmount > 0 || allAutoDiscounts > 0) && originalPrice > 0 && (
                  <div className="border-t border-border pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Giá gốc</span>
                      <span className="font-medium line-through text-muted-foreground">{formatPrice(originalPrice)}</span>
                    </div>
                    {memberDiscountPercent > 0 && (
                      <div className="flex justify-between text-sm text-primary">
                        <span>⭐ Giảm thành viên ({memberDiscountPercent}%)</span>
                        <span>-{formatPrice(Math.round(originalPrice * memberDiscountPercent / 100))}</span>
                      </div>
                    )}
                    {promoDiscountPercent > 0 && (
                      <div className="flex justify-between text-sm text-primary">
                        <span>🎉 Giảm ưu đãi ({promoDiscountPercent}%)</span>
                        <span>-{formatPrice(Math.round(originalPrice * promoDiscountPercent / 100))}</span>
                      </div>
                    )}
                    {flashSaleDiscount > 0 && (
                      <div className="flex justify-between text-sm text-primary">
                        <span>⚡ Flash Sale</span>
                        <span>-{formatPrice(flashSaleDiscount)}</span>
                      </div>
                    )}
                    {globalDiscountAmount > 0 && activeGlobalDiscount && (
                      <div className="flex justify-between text-sm text-primary">
                        <span>🎉 {activeGlobalDiscount.title_vi} ({activeGlobalDiscount.discount_percent}%)</span>
                        <span>-{formatPrice(globalDiscountAmount)}</span>
                      </div>
                    )}
                    {smartPricingAmount > 0 && activeSmartRule && (
                      <div className="flex justify-between text-sm text-primary">
                        <span>🧠 {activeSmartRule.title_vi} ({activeSmartRule.discount_percent}%)</span>
                        <span>-{formatPrice(smartPricingAmount)}</span>
                      </div>
                    )}
                    {discountCodeAmount > 0 && appliedDiscountCode && (
                      <div className="flex justify-between text-sm text-primary">
                        <span>🎟️ Mã {appliedDiscountCode.code} ({appliedDiscountCode.discount_type === 'percent' ? `${appliedDiscountCode.discount_value}%` : formatPrice(appliedDiscountCode.discount_value)}
                          {appliedDiscountCode.applies_to === 'room' ? ' - chỉ phòng' : appliedDiscountCode.applies_to === 'food' ? ' - chỉ đồ ăn' : ''}
                        )</span>
                        <span>-{formatPrice(discountCodeAmount)}</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm font-semibold text-primary border-t border-border pt-2 mt-2">
                        <span>Tổng tiết kiệm</span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                  </div>
                )}

                {!allNightsAvailable && nightCount > 0 && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
                    Một số đêm trong khoảng ngày đã chọn đang đóng bán.
                  </div>
                )}
                {comboValidationError && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-300 rounded-lg p-3 text-sm text-purple-700 dark:text-purple-300">
                    ⚠️ Vui lòng chọn ít nhất 1 combo ăn uống.
                  </div>
                )}
                {comboServingsError && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
                    ⚠️ Tổng suất combo ({totalComboServings}) phải bằng số người lớn ({guestCount}).
                  </div>
                )}
                {multiComboNeedsNotes && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 rounded-lg p-3 text-sm text-amber-700">
                    ⚠️ Vui lòng nhập ghi chú ăn uống khi chọn nhiều loại combo.
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
                <Button variant="hero" className="w-full" onClick={handleSubmit} disabled={submitting || !canSubmit}>
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
