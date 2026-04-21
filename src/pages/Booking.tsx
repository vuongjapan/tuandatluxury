import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { CalendarIcon, Users, UtensilsCrossed, AlertTriangle, Gift, Building2, Heart, Zap, Percent, Brain, ShoppingBag, UserPlus, ChevronLeft, ChevronRight, Check, Search, Minus, Plus, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ComboSelector, { ComboSelection } from '@/components/ComboSelector';
import PersonalMealPlanSelector, { PersonalMealSelection } from '@/components/PersonalMealPlanSelector';
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
import { useMandatoryComboDates } from '@/hooks/useMandatoryComboDates';
import { useDiscountConfig, useUserBookingCount, getVipDiscountPercent } from '@/hooks/useDiscountConfig';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { vi, enUS, ja, zhCN } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';

const BOOKING_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-booking`;

const localeMap = { vi, en: enUS, ja, zh: zhCN };

const ROOM_GUEST_LIMITS: Record<string, number> = {
  standard: 2,
  deluxe: 4,
  family: 4,
};
const EXTRA_PERSON_SURCHARGE_PERCENT = 0.3;

interface RoomCartItem {
  roomId: string;
  quantity: number;
}

const Booking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language, t, formatPrice } = useLanguage();
  const { toast } = useToast();
  const { rooms, getRoomPrice, isDateAvailable, hasComboRequiredDays, getAvailability, isSpecialDate } = useRooms();
  const { items: diningItems, loading: diningLoading } = useDining();
  const { user, isAdmin } = useAuth();
  const { config: discountConfig } = useDiscountConfig();
  const { totalBookings: userBookingCount } = useUserBookingCount(user?.email);
  const { flashSales } = useFlashSales();
  const { discounts: globalDiscounts } = useGlobalDiscounts();
  const { rules: smartRules } = useSmartPricing();
  const { settings } = useSiteSettings();
  const { getMatchingRange } = useMandatoryComboDates();
  const webDiscountPercent = parseInt(settings.web_discount_percent || '0', 10);

  const preselectedRoom = searchParams.get('room') || '';
  const preCheckin = searchParams.get('checkin');
  const preCheckout = searchParams.get('checkout');

  const [roomCart, setRoomCart] = useState<RoomCartItem[]>(() => {
    if (preselectedRoom) return [{ roomId: preselectedRoom, quantity: 1 }];
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
  const [personalMealSelections, setPersonalMealSelections] = useState<PersonalMealSelection[]>([]);
  const [comboNotes, setComboNotes] = useState('');
  const [individualFoods, setIndividualFoods] = useState<FoodItem[]>([]);
  const [foodSelectorOpen, setFoodSelectorOpen] = useState(false);
  const [appliedDiscountCodes, setAppliedDiscountCodes] = useState<DiscountCode[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [specialServices, setSpecialServices] = useState<string[]>([]);
  const [decorationNotes, setDecorationNotes] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [searchDone, setSearchDone] = useState(!!preselectedRoom);
  

  useEffect(() => {
    if (user) {
      if (!name) setName(user.fullName);
      if (!email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
    }
  }, [user]);

  // Derived values
  const selectedRooms = useMemo(() => {
    return roomCart.filter(item => item.quantity > 0).map(item => ({
      ...item,
      room: rooms.find(r => r.id === item.roomId),
    })).filter(item => item.room);
  }, [roomCart, rooms]);

  const totalRoomQuantity = useMemo(() => selectedRooms.reduce((s, r) => s + r.quantity, 0), [selectedRooms]);
  const hasRooms = totalRoomQuantity > 0;
  const primaryRoom = selectedRooms[0]?.room || rooms[0];
  const primaryRoomId = primaryRoom?.id || '';

  const nightCount = checkIn && checkOut ? Math.max(differenceInDays(checkOut, checkIn), 1) : 0;
  const calendarLocale = localeMap[language] || vi;
  const guestCount = parseInt(guests) || 2;

  const standardCapacity = useMemo(() => {
    return selectedRooms.reduce((sum, item) => {
      const limit = ROOM_GUEST_LIMITS[item.roomId] || item.room!.capacity || 2;
      return sum + limit * item.quantity;
    }, 0);
  }, [selectedRooms]);

  const extraPersonCount = useMemo(() => Math.max(0, guestCount - standardCapacity), [guestCount, standardCapacity]);

  const isGroupPromo = false;
  const isCouplePromo = false;

  const comboRequired = useMemo(() => {
    if (!checkIn || !checkOut) return false;
    return selectedRooms.some(item => hasComboRequiredDays(item.roomId, checkIn!, checkOut!));
  }, [checkIn, checkOut, selectedRooms, hasComboRequiredDays]);

  // Holiday/admin-mandated combo requirement based on check-in date
  const mandatoryComboRange = useMemo(() => getMatchingRange(checkIn), [checkIn, getMatchingRange]);
  const isComboMandatory = !!mandatoryComboRange;

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

  const personalMealTotal = useMemo(() => personalMealSelections.reduce((sum, s) => sum + s.price * s.quantity, 0), [personalMealSelections]);
  const comboTotal = useMemo(() => comboSelections.reduce((sum, s) => sum + s.pricePerPerson * s.quantity, 0) + personalMealTotal, [comboSelections, personalMealTotal]);
  const individualFoodTotal = useMemo(() => individualFoods.reduce((sum, f) => sum + f.price * f.quantity, 0), [individualFoods]);

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

  // Old promo system removed — only the new VIP / discount-config system is used.
  const promoDiscountPercent = 0;

  // VIP discount: applies to ROOM ONLY, based on the user's confirmed booking history.
  const memberDiscountPercent = useMemo(
    () => (user ? getVipDiscountPercent(discountConfig, userBookingCount) : 0),
    [user, discountConfig, userBookingCount]
  );
  const memberDiscountAmount = useMemo(
    () => (memberDiscountPercent > 0 ? Math.round(roomTotal * memberDiscountPercent / 100) : 0),
    [memberDiscountPercent, roomTotal]
  );

  // Sum of all applied discount codes (multi-voucher support).
  const discountCodeAmount = useMemo(() => {
    if (appliedDiscountCodes.length === 0) return 0;
    let total = 0;
    for (const c of appliedDiscountCodes) {
      let base = roomTotal + comboTotal + individualFoodTotal;
      if (c.applies_to === 'room') base = roomTotal;
      else if (c.applies_to === 'food') base = comboTotal + individualFoodTotal;
      const amt = c.discount_type === 'percent'
        ? Math.round(base * c.discount_value / 100)
        : Math.min(c.discount_value, base);
      total += amt;
    }
    // Cap at the original subtotal so we never go negative.
    return Math.min(total, roomTotal + comboTotal + individualFoodTotal);
  }, [appliedDiscountCodes, roomTotal, comboTotal, individualFoodTotal]);

  const webDiscountAmount = useMemo(() => {
    if (webDiscountPercent <= 0 || roomTotal <= 0) return 0;
    return Math.round(roomTotal * webDiscountPercent / 100);
  }, [webDiscountPercent, roomTotal]);

  const totalDiscountPercent = memberDiscountPercent + promoDiscountPercent;
  const originalPrice = roomTotal + extraPersonSurcharge + comboTotal + individualFoodTotal;
  const percentDiscount = Math.round(originalPrice * totalDiscountPercent / 100);
  const allAutoDiscounts = flashSaleDiscount + globalDiscountAmount + smartPricingAmount + webDiscountAmount;
  const discountAmount = percentDiscount + discountCodeAmount + allAutoDiscounts;
  const computedTotal = Math.max(0, originalPrice - discountAmount);

  // Admin manual price override (only when admin is logged in)
  const [adminOverridePrice, setAdminOverridePrice] = useState<number | null>(null);
  const totalPrice = isAdmin && adminOverridePrice !== null && adminOverridePrice >= 0 ? adminOverridePrice : computedTotal;

  const appliedPromotions = useMemo(() => {
    const list: { name: string; amount: number; badge?: string }[] = [];
    if (webDiscountAmount > 0) list.push({ name: `🌐 Giảm giá đặt qua web (-${webDiscountPercent}%)`, amount: webDiscountAmount, badge: 'Web' });
    if (flashSaleDiscount > 0 && activeFlashSaleItem) list.push({ name: `⚡ Flash Sale: ${(activeFlashSaleItem as any).saleName}`, amount: flashSaleDiscount, badge: 'Flash Sale' });
    if (globalDiscountAmount > 0 && activeGlobalDiscount) list.push({ name: `🎉 ${activeGlobalDiscount.title_vi} (-${activeGlobalDiscount.discount_percent}%)`, amount: globalDiscountAmount, badge: 'Giảm giá chung' });
    if (smartPricingAmount > 0 && activeSmartRule) list.push({ name: `🧠 ${activeSmartRule.title_vi} (-${activeSmartRule.discount_percent}%)`, amount: smartPricingAmount, badge: activeSmartRule.badge_text_vi || 'Smart Price' });
    return list;
  }, [webDiscountAmount, webDiscountPercent, flashSaleDiscount, globalDiscountAmount, smartPricingAmount, activeFlashSaleItem, activeGlobalDiscount, activeSmartRule]);

  const totalComboServings = comboSelections.reduce((s, c) => s + c.quantity, 0);
  const hasSelectedCombo = comboSelections.length > 0;
  const comboServingsMatch = totalComboServings === guestCount;
  const comboServingsError = hasSelectedCombo && !comboServingsMatch;
  // Either room policy OR holiday range can require combo
  const comboValidationError = (comboRequired || isComboMandatory) && !hasSelectedCombo;
  const multiComboNeedsNotes = false; // disabled: combo notes not required

  // Shake animation trigger when user tries to advance without combo on mandatory days
  const [comboShake, setComboShake] = useState(false);

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
      if (!hasRooms) { toast({ title: 'Vui lòng chọn ít nhất 1 phòng', variant: 'destructive' }); return; }
      if (comboServingsError) { toast({ title: `Tổng số suất combo (${totalComboServings}) phải bằng số người lớn (${guestCount})`, variant: 'destructive' }); return; }
      if (multiComboNeedsNotes) { toast({ title: 'Vui lòng nhập ghi chú yêu cầu ăn uống khi chọn nhiều loại combo', variant: 'destructive' }); return; }
      toast({ title: 'Vui lòng điền đầy đủ thông tin', variant: 'destructive' }); return;
    }
    setSubmitting(true);
    try {
      const combosPayload = comboSelections.map(c => ({
        combo_package_id: c.packageId, combo_menu_id: c.menuId,
        combo_package_name: c.packageName, combo_menu_name: c.menuName,
        combo_name: `${c.packageName} – ${c.menuName}`,
        price_vnd: c.pricePerPerson, quantity: c.quantity,
      }));
      const foodItemsPayload = individualFoods.map(f => ({
        menu_item_id: f.id.includes('__') ? f.id.split('__')[0] : f.id,
        name: f.priceLabel ? `${f.name} (${f.priceLabel})` : f.name,
        price_vnd: f.price, quantity: f.quantity,
      }));
      const personalMealNote = personalMealSelections.length > 0
        ? '🍽️ SUẤT ĂN THEO SỐ NGƯỜI:\n' + personalMealSelections.map(m =>
            `• ${m.name} (${m.guest_count} người) ×${m.quantity} = ${(m.price * m.quantity).toLocaleString('vi-VN')}đ`
            + (m.items.length ? `\n  └ ${m.items.join(', ')}` : '')
          ).join('\n')
        : '';
      const mergedComboNotes = [comboNotes, personalMealNote].filter(Boolean).join('\n\n');
      const serviceLabels = specialServices.map(id => availableServices.find(s => s.id === id)?.label || id).join(', ');
      const roomDetails = selectedRooms.map(sr => ({ room_id: sr.roomId, room_name: sr.room!.name[language], quantity: sr.quantity }));
      const roomBreakdown = roomTotals.map(rt => ({
        room_id: rt.roomId, room_name: rt.room.name[language],
        quantity: rt.quantity, subtotal: rt.subtotal, average_nightly_rate: rt.totalPerRoom,
      }));

      const resp = await fetch(BOOKING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          room_id: primaryRoomId, guest_name: name, guest_email: email, guest_phone: phone,
          guest_notes: [notes, specialRequests].filter(Boolean).join('\n---\n'),
          check_in: format(checkIn!, 'yyyy-MM-dd'), check_out: format(checkOut!, 'yyyy-MM-dd'),
          guests_count: guestCount, total_price_vnd: totalPrice, original_price_vnd: originalPrice,
          room_subtotal: roomTotal, room_quantity: totalRoomQuantity, language,
          combos: combosPayload.length > 0 ? combosPayload : undefined,
          combo_total: comboTotal > 0 ? comboTotal : undefined,
          combo_notes: mergedComboNotes || undefined,
          food_items: foodItemsPayload.length > 0 ? foodItemsPayload : undefined,
          individual_food_total: individualFoodTotal > 0 ? individualFoodTotal : undefined,
          extra_person_count: extraPersonCount > 0 ? extraPersonCount : undefined,
          extra_person_surcharge: extraPersonSurcharge > 0 ? extraPersonSurcharge : undefined,
          promotion_name: appliedPromotions.map(p => p.name).join(' | ') || undefined,
          member_discount_percent: memberDiscountPercent > 0 ? memberDiscountPercent : undefined,
          member_discount_amount: memberDiscountAmount > 0 ? memberDiscountAmount : undefined,
          discount_code: appliedDiscountCodes.length > 0 ? appliedDiscountCodes.map(c => c.code).join(',') : undefined,
          discount_code_amount: discountCodeAmount > 0 ? discountCodeAmount : undefined,
          discount_code_type: appliedDiscountCodes.length === 1 ? appliedDiscountCodes[0].discount_type : (appliedDiscountCodes.length > 1 ? 'mixed' : undefined),
          discount_code_value: appliedDiscountCodes.length === 1 ? appliedDiscountCodes[0].discount_value : undefined,
          company_name: companyName || undefined,
          group_size: groupSize ? parseInt(groupSize) : undefined,
          special_services: serviceLabels || undefined,
          decoration_notes: decorationNotes || undefined,
          room_details: roomDetails, room_breakdown: roomBreakdown,
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

  const isVi = language === 'vi';

  const STEPS = [
    { num: 1, label: isVi ? 'Chọn phòng' : 'Select Room', icon: '🏨' },
    { num: 2, label: isVi ? 'Dịch vụ' : 'Services', icon: '🍽️' },
    { num: 3, label: isVi ? 'Yêu cầu' : 'Requests', icon: '📝' },
    { num: 4, label: isVi ? 'Thông tin' : 'Info', icon: '👤' },
    { num: 5, label: isVi ? 'Xác nhận' : 'Confirm', icon: '✅' },
  ];

  const canGoStep2 = hasRooms && !!checkIn && !!checkOut && nightCount > 0 && allNightsAvailable;
  const canGoStep3 = canGoStep2;
  const canGoStep4 = canGoStep3;
  const canGoStep5 = canGoStep4 && !!name && !!phone;

  const nextStep = () => {
    if (currentStep === 1 && !canGoStep2) {
      if (!checkIn || !checkOut) { toast({ title: isVi ? 'Vui lòng chọn ngày nhận & trả phòng' : 'Please select check-in & check-out dates', variant: 'destructive' }); return; }
      if (!hasRooms) { toast({ title: isVi ? 'Vui lòng chọn ít nhất 1 phòng' : 'Please select at least 1 room', variant: 'destructive' }); return; }
      return;
    }
    if (currentStep === 2) {
      // Block when holiday/admin-mandated combo not selected
      if (comboValidationError) {
        toast({
          title: isVi ? '⚠️ Vui lòng chọn ít nhất 1 combo ăn uống để tiếp tục' : '⚠️ Please select at least 1 combo to continue',
          variant: 'destructive',
        });
        // Scroll to combo section + trigger shake
        const el = document.getElementById('combo-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setComboShake(true);
        setTimeout(() => setComboShake(false), 2000);
        return;
      }
      if (comboServingsError) { toast({ title: `Tổng suất combo (${totalComboServings}) phải bằng số người lớn (${guestCount})`, variant: 'destructive' }); return; }
      if (multiComboNeedsNotes) { toast({ title: 'Vui lòng nhập ghi chú ăn uống', variant: 'destructive' }); return; }
    }
    if (currentStep === 4 && !canGoStep5) {
      toast({ title: isVi ? 'Vui lòng điền họ tên và số điện thoại' : 'Please fill in name and phone', variant: 'destructive' }); return;
    }
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };
  const prevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const handleSearchRooms = () => {
    if (!checkIn || !checkOut) {
      toast({ title: isVi ? 'Vui lòng chọn ngày nhận và trả phòng' : 'Please select dates', variant: 'destructive' });
      return;
    }
    setSearchDone(true);
  };

  if (!rooms.length) return null;

  const maxGuestsTotal = standardCapacity + 6;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <div className="pt-24 lg:pt-28 pb-8">
        <div className="container mx-auto px-4 max-w-5xl">

          {/* Progress bar — Vinpearl/FLC style */}
          <div className="mb-8">
            {/* Bar with fill */}
            <div className="relative h-1.5 bg-secondary rounded-full overflow-hidden mb-4">
              <div
                className="absolute inset-y-0 left-0 bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
            {/* Step pills */}
            <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto">
              {STEPS.map((step) => {
                const done = step.num < currentStep;
                const active = step.num === currentStep;
                return (
                  <button
                    key={step.num}
                    onClick={() => { if (step.num <= currentStep) setCurrentStep(step.num); }}
                    className={cn(
                      "flex flex-col items-center gap-1 shrink-0 min-w-0 flex-1 px-1 py-1.5 rounded-lg text-xs font-medium transition-all",
                      active && 'text-primary',
                      done && 'text-primary/70 cursor-pointer hover:text-primary',
                      !active && !done && 'text-muted-foreground'
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                      active && 'bg-primary text-primary-foreground shadow-md scale-110',
                      done && 'bg-primary/20 text-primary',
                      !active && !done && 'bg-secondary text-muted-foreground'
                    )}>
                      {done ? <Check className="h-4 w-4" /> : step.num}
                    </div>
                    <span className="hidden sm:block text-[11px] truncate w-full text-center">{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* VIP banner (signed-in users with active discount) */}
          {user && memberDiscountPercent > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-6 bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
              <p className="text-sm text-foreground">
                🏅 {isVi
                  ? `Ưu đãi VIP: -${memberDiscountPercent}% tiền phòng (đã đặt ${userBookingCount} lần)`
                  : `VIP discount: -${memberDiscountPercent}% on room (${userBookingCount} bookings)`}
              </p>
            </motion.div>
          )}
          {!user && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-center">
              <p className="text-sm text-amber-900 dark:text-amber-200">
                ⭐ {isVi ? 'Đăng nhập để nhận ưu đãi thành viên VIP' : 'Sign in for VIP member discounts'}{' '}
                <button onClick={() => navigate('/member')} className="underline font-semibold">
                  {isVi ? 'Đăng nhập' : 'Sign in'}
                </button>
              </p>
            </motion.div>
          )}


          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              <AnimatePresence mode="wait">
                {/* ===== STEP 1: Date + Guests + Rooms ===== */}
                {currentStep === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    {/* Search bar */}
                    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                      <h2 className="font-display text-xl font-semibold flex items-center gap-2">📅 {isVi ? 'Chọn ngày & số khách' : 'Select Dates & Guests'}</h2>
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
                              <Calendar mode="single" selected={checkIn} onSelect={(d) => { setCheckIn(d); setSearchDone(false); }} locale={calendarLocale} initialFocus className="p-3 pointer-events-auto" disabled={(d) => d < new Date()} />
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
                              <Calendar mode="single" selected={checkOut} onSelect={(d) => { setCheckOut(d); setSearchDone(false); }} locale={calendarLocale} initialFocus className="p-3 pointer-events-auto" disabled={(d) => d < (checkIn || new Date())} />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{t('search.guests')}</label>
                          <Select value={guests} onValueChange={setGuests}>
                            <SelectTrigger>
                              <div className="flex items-center gap-2"><Users className="h-4 w-4" /><SelectValue /></div>
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                                <SelectItem key={n} value={String(n)}>{n} {isVi ? 'người' : 'guests'}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button variant="gold" className="w-full gap-2" onClick={handleSearchRooms} disabled={!checkIn || !checkOut}>
                        <Search className="h-4 w-4" /> {isVi ? 'Tìm phòng' : 'Search Rooms'}
                      </Button>
                    </div>

                    {/* Extra person surcharge */}
                    {extraPersonCount > 0 && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-3 flex items-start gap-2">
                        <UserPlus className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-semibold text-amber-800 dark:text-amber-300">{isVi ? `Phụ thu thêm ${extraPersonCount} người` : `Surcharge for ${extraPersonCount} extra guests`}</p>
                          <p className="text-xs text-amber-700 dark:text-amber-400">30% = <strong>{formatPrice(extraPersonSurcharge)}</strong></p>
                        </div>
                      </div>
                    )}

                    {/* Flash Sale banner */}
                    {activeFlashSaleItem && (
                      <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-300 dark:border-orange-700 rounded-xl p-4 flex items-center gap-3">
                        <Zap className="h-6 w-6 text-orange-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">⚡ {(activeFlashSaleItem as any).saleName}</p>
                          <p className="text-xs text-muted-foreground">
                            <span className="line-through">{formatPrice(activeFlashSaleItem.original_price)}</span>{' → '}
                            <span className="font-bold text-primary">{formatPrice(activeFlashSaleItem.sale_price)}</span>/đêm
                          </p>
                        </div>
                        <Badge className="bg-orange-500 text-white shrink-0">-{Math.round((1 - activeFlashSaleItem.sale_price / activeFlashSaleItem.original_price) * 100)}%</Badge>
                      </div>
                    )}

                    {/* Room list - only after search */}
                    {searchDone && (
                      <div className="space-y-4">
                        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                          🏨 {isVi ? 'Chọn phòng' : 'Select Rooms'}
                        </h2>
                        <p className="text-xs text-muted-foreground">{isVi ? 'Chọn số lượng phòng mong muốn' : 'Select the number of rooms you want'}</p>

                        {rooms.map(room => {
                          const cartItem = roomCart.find(c => c.roomId === room.id);
                          const qty = cartItem?.quantity || 0;
                          return (
                            <div key={room.id}>
                              <BookingRoomCard
                                room={room}
                                quantity={qty}
                                onQuantityChange={(newQty) => updateRoomQuantity(room.id, newQty)}
                                nightlyPrice={formatPrice(room.priceVND)}
                              />
                            </div>
                          );
                        })}

                        {!hasRooms && (
                          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-300 text-center">
                            ⚠️ {isVi ? 'Vui lòng chọn ít nhất 1 phòng để tiếp tục' : 'Please select at least 1 room'}
                          </div>
                        )}
                      </div>
                    )}

                    {!searchDone && (
                      <div className="bg-secondary/50 rounded-xl p-8 text-center">
                        <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">{isVi ? 'Chọn ngày và nhấn "Tìm phòng" để xem phòng trống' : 'Select dates and click "Search Rooms" to see availability'}</p>
                      </div>
                    )}

                    {/* Group/Corporate promo form */}
                    {isGroupPromo && (
                      <div className="bg-card rounded-xl border-2 border-primary/30 p-6 space-y-4">
                        <div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /><h2 className="font-display text-xl font-semibold">{isVi ? 'Thông tin đoàn / công ty' : 'Group Info'}</h2></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{isVi ? 'Tên công ty *' : 'Company *'}</label>
                            <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Công ty ABC" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{isVi ? 'Số lượng người *' : 'Group Size *'}</label>
                            <Input type="number" value={groupSize} onChange={e => setGroupSize(e.target.value)} placeholder="20" min="1" />
                          </div>
                        </div>
                      </div>
                    )}

                    {isCouplePromo && (
                      <div className="bg-card rounded-xl border-2 border-pink-300 p-6 space-y-4">
                        <div className="flex items-center gap-2"><Heart className="h-5 w-5 text-pink-500" /><h2 className="font-display text-xl font-semibold">{isVi ? 'Ưu đãi cặp đôi / gia đình' : 'Couple/Family'}</h2></div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Yêu cầu trang trí</label>
                          <Textarea value={decorationNotes} onChange={e => setDecorationNotes(e.target.value)} rows={2} placeholder="VD: Hoa, nến, bóng bay..." />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ===== STEP 2: Services ===== */}
                {currentStep === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <h2 className="font-display text-2xl font-bold text-center">🍽️ {isVi ? 'Thêm dịch vụ' : 'Add Services'}</h2>

                    {/* SECTION 1: Personal meal plans — always visible regardless of guest count */}
                    <PersonalMealPlanSelector
                      guestCount={guestCount}
                      selections={personalMealSelections}
                      onChange={setPersonalMealSelections}
                    />

                    {/* SECTION 2: Combo 225k–550k — only when guestCount >= 6 OR mandatory holiday */}
                    {(guestCount >= 6 || isComboMandatory) && (
                      <ComboSelector
                        sectionId="combo-section"
                        required={comboRequired}
                        mandatory={isComboMandatory}
                        mandatoryLabel={mandatoryComboRange?.label}
                        mandatoryNote={mandatoryComboRange?.note || undefined}
                        shake={comboShake}
                        selections={comboSelections}
                        onSelectionsChange={setComboSelections}
                        guestCount={guestCount}
                        comboNotes={comboNotes}
                        onComboNotesChange={setComboNotes}
                        onOpenFoodOrder={() => setFoodSelectorOpen(true)}
                      />
                    )}

                    <IndividualFoodSelector
                      open={foodSelectorOpen}
                      onClose={() => setFoodSelectorOpen(false)}
                      items={individualFoods}
                      onItemsChange={setIndividualFoods}
                    />

                    {/* Service checkboxes */}
                    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                      <h3 className="font-display text-lg font-semibold flex items-center gap-2">🛎️ {isVi ? 'Dịch vụ bổ sung' : 'Additional Services'}</h3>
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

                    <Button variant="outline" size="sm" className="w-full" onClick={() => setFoodSelectorOpen(true)}>
                      <ShoppingBag className="h-4 w-4 mr-1" /> {isVi ? 'Đặt món ăn riêng' : 'Order Individual Dishes'}
                    </Button>
                  </motion.div>
                )}

                {/* ===== STEP 3: Special Requests ===== */}
                {currentStep === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <h2 className="font-display text-2xl font-bold text-center">📝 {isVi ? 'Yêu cầu đặc biệt' : 'Special Requests'}</h2>
                    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                      <p className="text-sm text-muted-foreground">{isVi ? 'Không bắt buộc – nhập yêu cầu riêng của bạn (giờ check-in sớm, tầng cao, phòng liền kề, v.v.)' : 'Optional – enter any special requests'}</p>
                      <Textarea
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        rows={5}
                        placeholder={isVi ? 'VD: Check-in sớm 12h, phòng tầng cao, cần nôi em bé...' : 'E.g. Early check-in, high floor, baby crib...'}
                      />
                    </div>
                  </motion.div>
                )}

                {/* ===== STEP 4: Guest Info ===== */}
                {currentStep === 4 && (
                  <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <h2 className="font-display text-2xl font-bold text-center">👤 {isVi ? 'Thông tin khách hàng' : 'Guest Information'}</h2>
                    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{t('booking.full_name')} *</label>
                          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={isVi ? 'Họ và tên' : 'Full name'} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{t('booking.phone')} *</label>
                          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0xxx xxx xxx" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{t('booking.email')}</label>
                          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{isVi ? 'Quốc gia' : 'Country'}</label>
                          <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder={isVi ? 'Việt Nam' : 'Vietnam'} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{isVi ? 'Địa chỉ' : 'Address'}</label>
                          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={isVi ? 'Địa chỉ (không bắt buộc)' : 'Address (optional)'} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{isVi ? 'Ngày sinh' : 'Date of birth'} <span className="text-muted-foreground/60 normal-case">({isVi ? 'không bắt buộc' : 'optional'})</span></label>
                          <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{isVi ? 'CCCD / Hộ chiếu' : 'ID / Passport'} <span className="text-muted-foreground/60 normal-case">({isVi ? 'không bắt buộc' : 'optional'})</span></label>
                          <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder={isVi ? 'Số căn cước hoặc hộ chiếu' : 'ID or passport number'} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{isVi ? 'Yêu cầu đặc biệt' : 'Special requests'}</label>
                        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={isVi ? 'Ví dụ: phòng tầng cao, giường extra, dị ứng...' : 'E.g. high floor, extra bed, allergies...'} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ===== STEP 5: Confirm & Pay ===== */}
                {currentStep === 5 && (
                  <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <h2 className="font-display text-2xl font-bold text-center">✅ {isVi ? 'Xác nhận đặt phòng' : 'Confirm Booking'}</h2>

                    {/* Room summary */}
                    <div className="bg-card rounded-xl border border-border p-5 space-y-3">
                      <h3 className="font-semibold flex items-center gap-2">🏨 {isVi ? 'Phòng' : 'Rooms'}</h3>
                      {selectedRooms.map(sr => (
                        <div key={sr.roomId} className="flex items-center gap-3 bg-secondary/30 rounded-lg p-3">
                          <img src={sr.room!.image} alt="" className="w-16 h-12 object-cover rounded-lg" />
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{sr.room!.name[language]}</p>
                            <p className="text-xs text-muted-foreground">×{sr.quantity} {isVi ? 'phòng' : 'rooms'} · {nightCount} {isVi ? 'đêm' : 'nights'}</p>
                          </div>
                          {roomTotals.find(rt => rt.roomId === sr.roomId) && (
                            <span className="font-bold text-primary">{formatPrice(roomTotals.find(rt => rt.roomId === sr.roomId)!.subtotal)}</span>
                          )}
                        </div>
                      ))}
                      <div className="flex justify-between text-sm pt-2 border-t border-border">
                        <span>{isVi ? 'Check-in' : 'Check-in'}</span>
                        <span className="font-medium">{checkIn ? format(checkIn, 'dd/MM/yyyy') : '—'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{isVi ? 'Check-out' : 'Check-out'}</span>
                        <span className="font-medium">{checkOut ? format(checkOut, 'dd/MM/yyyy') : '—'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{isVi ? 'Số khách' : 'Guests'}</span>
                        <span className="font-medium">{guestCount} {isVi ? 'người' : 'guests'}</span>
                      </div>
                    </div>

                    {/* Combo summary */}
                    {comboSelections.length > 0 && (
                      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
                        <h3 className="font-semibold flex items-center gap-2">🍽️ Combo</h3>
                        {comboSelections.map((c, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{c.packageName} – {c.menuName} ×{c.quantity}</span>
                              <span className="font-medium">{formatPrice(c.pricePerPerson * c.quantity)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground pl-2">{c.dishes.slice(0, 5).join(', ')}...</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Personal meal plans summary */}
                    {personalMealSelections.length > 0 && (
                      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
                        <h3 className="font-semibold flex items-center gap-2">👥 {isVi ? 'Suất ăn theo số người' : 'Meal plans by group'}</h3>
                        {personalMealSelections.map((m, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{m.name} ({m.guest_count} {isVi ? 'người' : 'guests'}) ×{m.quantity}</span>
                              <span className="font-medium">{formatPrice(m.price * m.quantity)}</span>
                            </div>
                            {m.items.length > 0 && (
                              <p className="text-xs text-muted-foreground pl-2 line-clamp-2">{m.items.join(', ')}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Individual food */}
                    {individualFoods.length > 0 && (
                      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
                        <h3 className="font-semibold flex items-center gap-2">🍤 {isVi ? 'Món ăn riêng' : 'Individual Dishes'}</h3>
                        {individualFoods.map(f => (
                          <div key={f.id} className="flex justify-between text-sm">
                            <span>{f.name}{f.priceLabel ? ` (${f.priceLabel})` : ''} ×{f.quantity}</span>
                            <span className="font-medium">{formatPrice(f.price * f.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Services */}
                    {specialServices.length > 0 && (
                      <div className="bg-card rounded-xl border border-border p-5 space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">🛎️ {isVi ? 'Dịch vụ' : 'Services'}</h3>
                        {specialServices.map(id => (
                          <p key={id} className="text-sm text-muted-foreground">✓ {availableServices.find(s => s.id === id)?.[isVi ? 'label' : 'labelEn']}</p>
                        ))}
                      </div>
                    )}

                    {/* Guest info summary */}
                    <div className="bg-card rounded-xl border border-border p-5 space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">👤 {isVi ? 'Thông tin khách' : 'Guest Info'}</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">{isVi ? 'Họ tên' : 'Name'}</span><span className="font-medium">{name}</span>
                        <span className="text-muted-foreground">{isVi ? 'SĐT' : 'Phone'}</span><span className="font-medium">{phone}</span>
                        {email && <><span className="text-muted-foreground">Email</span><span className="font-medium">{email}</span></>}
                        {country && <><span className="text-muted-foreground">{isVi ? 'Quốc gia' : 'Country'}</span><span className="font-medium">{country}</span></>}
                      </div>
                      {(specialRequests || notes) && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground">{specialRequests || notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Price breakdown */}
                    <div className="bg-card rounded-xl border-2 border-primary/30 p-5 space-y-3">
                      <h3 className="font-semibold flex items-center gap-2">💰 {isVi ? 'Chi tiết thanh toán' : 'Payment Details'}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>🏨 {isVi ? 'Tiền phòng' : 'Room'}</span><span className="font-medium">{formatPrice(roomTotal)}</span></div>
                        {extraPersonSurcharge > 0 && <div className="flex justify-between"><span>👤 {isVi ? 'Phụ thu' : 'Surcharge'}</span><span>+{formatPrice(extraPersonSurcharge)}</span></div>}
                        {comboTotal > 0 && <div className="flex justify-between"><span>🍽️ Combo</span><span>{formatPrice(comboTotal)}</span></div>}
                        {individualFoodTotal > 0 && <div className="flex justify-between"><span>🍤 {isVi ? 'Món riêng' : 'Dishes'}</span><span>{formatPrice(individualFoodTotal)}</span></div>}
                        <div className="flex justify-between border-t border-border pt-2"><span className="font-medium">{isVi ? 'Tổng trước giảm' : 'Subtotal'}</span><span className="font-medium">{formatPrice(originalPrice)}</span></div>
                        {discountAmount > 0 && (
                          <>
                            {appliedPromotions.map((p, i) => (
                              <div key={i} className="flex justify-between text-primary"><span>{p.name}</span><span>-{formatPrice(p.amount)}</span></div>
                            ))}
                            {memberDiscountPercent > 0 && <div className="flex justify-between text-primary"><span>⭐ Thành viên ({memberDiscountPercent}%)</span><span>-{formatPrice(Math.round(originalPrice * memberDiscountPercent / 100))}</span></div>}
                            {promoDiscountPercent > 0 && <div className="flex justify-between text-primary"><span>🎉 Ưu đãi ({promoDiscountPercent}%)</span><span>-{formatPrice(Math.round(originalPrice * promoDiscountPercent / 100))}</span></div>}
                            {discountCodeAmount > 0 && appliedDiscountCodes.length > 0 && (
                              <div className="flex justify-between text-primary">
                                <span>🎟️ {appliedDiscountCodes.length === 1 ? `Mã ${appliedDiscountCodes[0].code}` : `${appliedDiscountCodes.length} ${isVi ? 'mã' : 'codes'}: ${appliedDiscountCodes.map(c => c.code).join(', ')}`}</span>
                                <span>-{formatPrice(discountCodeAmount)}</span>
                              </div>
                            )}
                          </>
                        )}
                        <div className="flex justify-between border-t-2 border-primary/30 pt-3 text-lg">
                          <span className="font-bold">{isVi ? 'Tổng thanh toán' : 'Total'}</span>
                          <span className="font-bold text-primary">{formatPrice(totalPrice)}</span>
                        </div>
                        {isAdmin && (
                          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                              🛡️ Admin: Ghi đè giá tổng (giá web: {formatPrice(computedTotal)})
                            </div>
                            <div className="flex gap-2">
                              <Input type="number" min={0} placeholder="Nhập giá tuỳ chỉnh (VNĐ)"
                                value={adminOverridePrice ?? ''}
                                onChange={(e) => setAdminOverridePrice(e.target.value === '' ? null : Math.max(0, parseInt(e.target.value) || 0))}
                                className="h-8 text-sm" />
                              {adminOverridePrice !== null && (
                                <Button size="sm" variant="outline" className="h-8" onClick={() => setAdminOverridePrice(null)}>Bỏ</Button>
                              )}
                            </div>
                          </div>
                        )}
                        {totalPrice > 0 && (
                          <div className="flex justify-between text-sm bg-primary/5 rounded-lg px-3 py-2">
                            <span>💳 {isVi ? 'Đặt cọc 50%' : 'Deposit 50%'}</span>
                            <span className="font-bold text-primary">{formatPrice(Math.round(totalPrice * 0.5))}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Multi-voucher input */}
                    {originalPrice > 0 && (
                      <div className="bg-card rounded-xl border border-border p-5">
                        <h4 className="font-semibold text-sm mb-2">
                          🎟️ {isVi ? 'Mã giảm giá (có thể nhập nhiều mã)' : 'Discount Codes (multiple allowed)'}
                        </h4>
                        <DiscountCodeInput
                          orderType="room"
                          orderAmount={originalPrice}
                          appliedCodes={appliedDiscountCodes}
                          onAdd={(d) => setAppliedDiscountCodes(prev => [...prev, d])}
                          onRemoveCode={(code) => setAppliedDiscountCodes(prev => prev.filter(c => c.code !== code))}
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sidebar summary */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <div className="bg-card rounded-xl border border-border p-5 sticky top-24 space-y-4">
                <h2 className="font-display text-lg font-semibold">{t('booking.summary')}</h2>

                {selectedRooms.length > 0 ? (
                  <div className="space-y-2">
                    {selectedRooms.map(sr => (
                      <div key={sr.roomId} className="flex items-center gap-3">
                        <img src={sr.room!.image} alt="" className="w-14 h-10 object-cover rounded-lg shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{sr.room!.name[language]}</p>
                          <p className="text-xs text-muted-foreground">×{sr.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">{isVi ? 'Chưa chọn phòng' : 'No rooms'}</p>
                )}

                <div className="space-y-1 text-sm">
                  {checkIn && <div className="flex justify-between"><span className="text-muted-foreground">Check-in</span><span className="font-medium">{format(checkIn, 'dd/MM/yyyy')}</span></div>}
                  {checkOut && <div className="flex justify-between"><span className="text-muted-foreground">Check-out</span><span className="font-medium">{format(checkOut, 'dd/MM/yyyy')}</span></div>}
                  {nightCount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{isVi ? 'Số đêm' : 'Nights'}</span><span className="font-medium">{nightCount}</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">{isVi ? 'Khách' : 'Guests'}</span><span className="font-medium">{guestCount}</span></div>
                </div>

                {roomTotals.length > 0 && (
                  <div className="border-t border-border pt-2 space-y-1">
                    {roomTotals.map(rt => (
                      <div key={rt.roomId} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{rt.room.name[language]} ×{rt.quantity}</span>
                        <span className="font-medium">{formatPrice(rt.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {comboTotal > 0 && (
                  <div className="flex justify-between text-xs border-t border-border pt-2">
                    <span className="text-muted-foreground">🍽️ Combo</span>
                    <span className="font-medium">{formatPrice(comboTotal)}</span>
                  </div>
                )}
                {individualFoodTotal > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">🍤 Món riêng</span>
                    <span className="font-medium">{formatPrice(individualFoodTotal)}</span>
                  </div>
                )}

                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-primary border-t border-border pt-2">
                    <span>{isVi ? 'Giảm giá' : 'Discount'}</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="font-display text-base font-semibold">{t('booking.total')}</span>
                    <span className="text-xl font-bold text-primary">{totalPrice > 0 ? formatPrice(totalPrice) : '—'}</span>
                  </div>
                  {totalPrice > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Đặt cọc 50%</span>
                      <span className="font-semibold">{formatPrice(Math.round(totalPrice * 0.5))}</span>
                    </div>
                  )}
                </div>

                {/* Validation warnings */}
                {!allNightsAvailable && nightCount > 0 && <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-2 text-xs text-destructive">Một số đêm đang đóng bán.</div>}
                {comboValidationError && <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-300 rounded-lg p-2 text-xs text-purple-700">⚠️ Chọn combo ăn uống.</div>}
                {comboServingsError && <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-2 text-xs text-destructive">⚠️ Suất combo ({totalComboServings}) ≠ số khách ({guestCount}).</div>}
              </div>
            </motion.div>
          </div>

          {/* Step navigation buttons */}
          <div className="flex items-center justify-between mt-8">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 1} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> {isVi ? 'Quay lại' : 'Back'}
            </Button>
            {currentStep < 5 ? (
              <Button variant="gold" onClick={nextStep} className="gap-2">
                {isVi ? 'Tiếp tục' : 'Continue'} <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="gold" onClick={handleSubmit} disabled={submitting || !canSubmit} className="gap-2 px-8">
                {submitting ? (isVi ? 'Đang xử lý...' : 'Processing...') : (isVi ? '🎉 Đặt phòng ngay' : '🎉 Book Now')}
              </Button>
            )}
          </div>
        </div>
      </div>
      <Footer />
      <FloatingButtons />

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)] print:hidden">
        <div className="container mx-auto px-4 max-w-5xl py-3 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{STEPS[currentStep - 1]?.label} ({currentStep}/5)</p>
            <p className="text-xl sm:text-2xl font-bold text-primary tabular-nums">{totalPrice > 0 ? formatPrice(totalPrice) : '—'}</p>
            {totalPrice > 0 && discountAmount > 0 && <p className="text-[11px] text-muted-foreground line-through">{formatPrice(originalPrice)}</p>}
          </div>
          {currentStep < 5 ? (
            <Button variant="gold" className="px-8 py-6 text-sm font-bold rounded-lg shrink-0" onClick={nextStep}>
              {isVi ? 'Tiếp tục' : 'Continue'} →
            </Button>
          ) : (
            <Button variant="gold" className="px-8 py-6 text-sm font-bold rounded-lg shrink-0" onClick={handleSubmit} disabled={submitting || !canSubmit}>
              {submitting ? '...' : (isVi ? 'Đặt phòng' : 'Book Now')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;
