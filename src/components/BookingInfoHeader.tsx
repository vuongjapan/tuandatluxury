import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hash, Users, BedDouble, Clock, Edit3, Check, X, Loader2, CalendarDays, StickyNote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';

const STORAGE_KEY = 'tdl_food_order_context';

export interface FoodOrderContext {
  bookingCode?: string;
  customerName?: string;
  roomNumber?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  mealTime?: string;
  servingTime?: string;
  kitchenNote?: string;
}

interface Props {
  value: FoodOrderContext;
  onChange: (next: FoodOrderContext) => void;
  /** Compact variant inside modal */
  compact?: boolean;
}

const MEAL_OPTIONS = [
  { key: 'breakfast', vi: 'Bữa sáng', en: 'Breakfast' },
  { key: 'lunch', vi: 'Bữa trưa', en: 'Lunch' },
  { key: 'dinner', vi: 'Bữa tối', en: 'Dinner' },
  { key: 'snack', vi: 'Ăn nhẹ', en: 'Snack' },
];

const formatDate = (s?: string) => {
  if (!s) return '—';
  try {
    const d = new Date(s);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return s;
  }
};

export const useBookingContext = () => {
  const [searchParams] = useSearchParams();
  const [ctx, setCtx] = useState<FoodOrderContext>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // 1. URL param wins
      const codeFromUrl = searchParams.get('code') || searchParams.get('booking');
      // 2. Otherwise localStorage
      let saved: FoodOrderContext = {};
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) saved = JSON.parse(raw);
      } catch {
        // ignore
      }
      const code = codeFromUrl || saved.bookingCode;

      if (code) {
        const { data: res } = await (supabase as any).rpc('lookup_booking_by_code', { p_code: code });
        const data = res?.booking;

        if (data) {
          const roomDetails: any[] = Array.isArray(data.room_details) ? data.room_details : [];
          const roomLabel = roomDetails
            .map((r) => r?.name_vi || r?.name || r?.room_name)
            .filter(Boolean)
            .join(', ');

          const next: FoodOrderContext = {
            ...saved,
            bookingCode: data.booking_code,
            customerName: data.guest_name,
            roomNumber: roomLabel || saved.roomNumber,
            checkIn: data.check_in,
            checkOut: data.check_out,
            adults: data.guests_count,
            children: saved.children ?? 0,
          };
          setCtx(next);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
          setLoading(false);
          return;
        }
      }

      setCtx(saved);
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (next: FoodOrderContext) => {
    setCtx(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
  };

  return { ctx, setCtx: update, loading };
};

const BookingInfoHeader = ({ value, onChange, compact = false }: Props) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<FoodOrderContext>(value);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => setDraft(value), [value]);

  const hasBooking = !!value.bookingCode && !!value.customerName;

  const handleVerify = async () => {
    if (!draft.bookingCode) {
      onChange(draft);
      setEditing(false);
      return;
    }
    setVerifying(true);
    const { data } = await supabase
      .from('bookings')
      .select('booking_code, guest_name, check_in, check_out, guests_count, room_details')
      .eq('booking_code', draft.bookingCode.toUpperCase().trim())
      .maybeSingle();
    setVerifying(false);

    if (data) {
      const roomDetails: any[] = Array.isArray(data.room_details) ? data.room_details : [];
      const roomLabel = roomDetails
        .map((r) => r?.name_vi || r?.name || r?.room_name)
        .filter(Boolean)
        .join(', ');
      onChange({
        ...draft,
        bookingCode: data.booking_code,
        customerName: data.guest_name,
        roomNumber: roomLabel || draft.roomNumber,
        checkIn: data.check_in,
        checkOut: data.check_out,
        adults: data.guests_count,
      });
    } else {
      onChange(draft);
    }
    setEditing(false);
  };

  const Field = ({ icon: Icon, label, children }: any) => (
    <div className="flex items-start gap-2.5 min-w-0">
      <Icon className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        <div className="text-sm text-foreground font-medium truncate">{children}</div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border border-border/60 ${compact ? 'rounded-xl p-4' : 'rounded-2xl p-5 md:p-6'} shadow-sm`}
    >
      {!editing ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center">
                <Hash className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-display text-sm font-semibold text-foreground tracking-wide">
                  {isVi ? 'Thông tin đặt bàn' : 'Order details'}
                </p>
                <p className="text-[10px] text-muted-foreground tracking-wider uppercase">
                  {hasBooking
                    ? (isVi ? 'Đã liên kết phòng' : 'Linked to your stay')
                    : (isVi ? 'Khách lẻ — vui lòng nhập' : 'Walk-in — please fill in')}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs gap-1.5 h-8"
              onClick={() => setEditing(true)}
            >
              <Edit3 className="h-3 w-3" />
              {isVi ? 'Sửa' : 'Edit'}
            </Button>
          </div>

          <div className={`grid gap-4 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'}`}>
            <Field icon={Hash} label={isVi ? 'Mã booking · Khách' : 'Booking · Guest'}>
              <span className="font-mono text-primary">{value.bookingCode || '—'}</span>
              <span className="text-foreground font-normal block text-xs text-muted-foreground truncate">
                {value.customerName || (isVi ? 'Chưa có' : 'Not set')}
                {value.roomNumber ? ` · ${value.roomNumber}` : ''}
              </span>
            </Field>

            <Field icon={CalendarDays} label={isVi ? 'Nhận / Trả phòng' : 'Check-in / out'}>
              <span className="text-xs">
                {formatDate(value.checkIn)} — {formatDate(value.checkOut)}
              </span>
            </Field>

            <Field icon={Users} label={isVi ? 'Số khách' : 'Guests'}>
              <span className="text-xs">
                {(value.adults ?? 0)} {isVi ? 'người lớn' : 'adults'}
                {value.children ? ` · ${value.children} ${isVi ? 'trẻ em' : 'children'}` : ''}
              </span>
            </Field>

            <Field icon={Clock} label={isVi ? 'Bữa · Giờ ăn' : 'Meal · Time'}>
              <span className="text-xs">
                {value.mealTime
                  ? (MEAL_OPTIONS.find((m) => m.key === value.mealTime)?.[isVi ? 'vi' : 'en'] || value.mealTime)
                  : (isVi ? 'Chưa chọn' : 'Not set')}
                {value.servingTime ? ` · ${value.servingTime}` : ''}
              </span>
            </Field>
          </div>

          {value.kitchenNote && (
            <div className="mt-4 pt-4 border-t border-border/50 flex items-start gap-2.5">
              <StickyNote className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {isVi ? 'Ghi chú bếp' : 'Kitchen note'}
                </p>
                <p className="text-sm text-foreground italic">{value.kitchenNote}</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="font-display text-sm font-semibold text-foreground">
              {isVi ? 'Cập nhật thông tin' : 'Update details'}
            </p>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setDraft(value); setEditing(false); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                {isVi ? 'Mã booking (nếu có)' : 'Booking code (optional)'}
              </label>
              <Input
                value={draft.bookingCode || ''}
                onChange={(e) => setDraft({ ...draft, bookingCode: e.target.value.toUpperCase() })}
                placeholder="TDL2026XXXX"
                className="font-mono text-sm h-9"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                {isVi ? 'Tên khách' : 'Guest name'}
              </label>
              <Input
                value={draft.customerName || ''}
                onChange={(e) => setDraft({ ...draft, customerName: e.target.value })}
                placeholder={isVi ? 'Nguyễn Văn A' : 'Full name'}
                className="text-sm h-9"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                {isVi ? 'Số phòng' : 'Room number'}
              </label>
              <Input
                value={draft.roomNumber || ''}
                onChange={(e) => setDraft({ ...draft, roomNumber: e.target.value })}
                placeholder={isVi ? 'VD: 301' : 'e.g. 301'}
                className="text-sm h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                  {isVi ? 'Người lớn' : 'Adults'}
                </label>
                <Input
                  type="number"
                  min={0}
                  value={draft.adults ?? ''}
                  onChange={(e) => setDraft({ ...draft, adults: Number(e.target.value) || 0 })}
                  className="text-sm h-9"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                  {isVi ? 'Trẻ em' : 'Children'}
                </label>
                <Input
                  type="number"
                  min={0}
                  value={draft.children ?? ''}
                  onChange={(e) => setDraft({ ...draft, children: Number(e.target.value) || 0 })}
                  className="text-sm h-9"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                {isVi ? 'Bữa ăn' : 'Meal'}
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {MEAL_OPTIONS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setDraft({ ...draft, mealTime: draft.mealTime === m.key ? undefined : m.key })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      draft.mealTime === m.key
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {isVi ? m.vi : m.en}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                {isVi ? 'Giờ phục vụ' : 'Serving time'}
              </label>
              <Input
                type="time"
                value={draft.servingTime || ''}
                onChange={(e) => setDraft({ ...draft, servingTime: e.target.value })}
                className="text-sm h-9"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
              {isVi ? 'Ghi chú cho bếp' : 'Note to kitchen'}
            </label>
            <Textarea
              value={draft.kitchenNote || ''}
              onChange={(e) => setDraft({ ...draft, kitchenNote: e.target.value })}
              placeholder={isVi ? 'Ít cay, không hành, dị ứng hải sản...' : 'Less spicy, no onion, allergies...'}
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button size="sm" variant="ghost" onClick={() => { setDraft(value); setEditing(false); }}>
              {isVi ? 'Hủy' : 'Cancel'}
            </Button>
            <Button size="sm" variant="gold" className="gap-1.5" onClick={handleVerify} disabled={verifying}>
              {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {isVi ? 'Lưu' : 'Save'}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default BookingInfoHeader;
