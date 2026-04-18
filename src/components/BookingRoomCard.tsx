import { useState, memo } from 'react';
import { Minus, Plus, Users, Maximize2, BedDouble, Eye, Waves, Eye as EyeIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRoomAmenities } from '@/hooks/useRoomAmenities';
import { useRooms } from '@/hooks/useRooms';
import { useRoomPopupSettings } from '@/hooks/useRoomPopupSettings';
import type { Room } from '@/data/rooms';
import PriceCalendar from '@/components/PriceCalendar';
import SmartImage from '@/components/SmartImage';
import RoomDetailPopup from '@/components/RoomDetailPopup';

const ROOM_GUEST_LIMITS: Record<string, number> = {
  standard: 2,
  deluxe: 4,
  family: 4,
};

interface BookingRoomCardProps {
  room: Room;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  nightlyPrice: string;
}

/**
 * Compact luxury booking card.
 * Layout (top → bottom):
 *  1. Title header (name + badges)
 *  2. Single hero image
 *  3. Quick specs row
 *  4. Accordion: Giá hôm nay / Tiện nghi & Ưu đãi
 *  5. "Xem chi tiết" + quantity controls
 */
const BookingRoomCard = memo(function BookingRoomCard({ room, quantity, onQuantityChange }: BookingRoomCardProps) {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const { roomFeatures, benefits, highlights } = useRoomAmenities();
  const { getRoomPrice, getAvailability, isSpecialDate } = useRooms();
  const { byRoomId } = useRoomPopupSettings();
  const popup = byRoomId.get(room.id);

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [popupOpen, setPopupOpen] = useState(false);

  const maxGuests = ROOM_GUEST_LIMITS[room.id] || room.capacity;
  const badgeText = isVi ? popup?.badge_vi : popup?.badge_en;

  return (
    <>
      <div
        className={`bg-card rounded-2xl border-2 overflow-hidden transition-all ${
          quantity > 0 ? 'border-primary shadow-lg' : 'border-border hover:border-primary/40'
        }`}
      >
        {/* 1. Title header — đặt LÊN ĐẦU */}
        <header className="px-4 sm:px-5 pt-4 pb-3">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground tracking-tight uppercase">
              {room.name[language]}
            </h3>
            {badgeText && (
              <Badge className="bg-primary text-primary-foreground border-0 text-[10px] uppercase tracking-wider">
                {badgeText}
              </Badge>
            )}
            {!badgeText && room.hasBalcony && (
              <Badge variant="outline" className="border-primary/40 text-primary gap-1 text-[10px]">
                <Waves className="h-3 w-3" /> {isVi ? 'Sea view' : 'Sea view'}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{room.description[language]}</p>
        </header>

        {/* 2. Single hero image */}
        <div className="relative mx-4 sm:mx-5 rounded-xl overflow-hidden">
          <div className="aspect-[16/10]">
            <SmartImage
              src={room.image}
              alt={room.name[language]}
              wrapperClassName="w-full h-full"
              className="object-cover"
              eager
            />
          </div>
          <div className="absolute top-2 left-2 bg-foreground/70 text-background px-2.5 py-1 rounded-md text-[10px] font-semibold backdrop-blur-sm">
            {room.totalRooms} {isVi ? 'phòng' : 'rooms'}
          </div>
        </div>

        {/* 3. Quick specs */}
        <div className="px-4 sm:px-5 pt-3 flex flex-wrap gap-1.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
            <Maximize2 className="h-3 w-3 text-primary" /> {room.size}m²
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
            <BedDouble className="h-3 w-3 text-primary" /> {room.bedType}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
            <Eye className="h-3 w-3 text-primary" /> {room.viewType}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
            <Users className="h-3 w-3 text-primary" /> {isVi ? `Tối đa ${maxGuests}` : `Max ${maxGuests}`}
          </span>
        </div>

        {/* Top highlights (max 3) */}
        {highlights.length > 0 && (
          <div className="px-4 sm:px-5 pt-2 flex flex-wrap gap-1">
            {highlights.slice(0, 3).map((h) => (
              <span
                key={h.id}
                className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium"
              >
                <Sparkles className="h-2.5 w-2.5" />
                {isVi ? h.name_vi : h.name_en || h.name_vi}
              </span>
            ))}
          </div>
        )}

        {/* 4. Accordion — chỉ mở khi cần */}
        <div className="px-4 sm:px-5 pt-2">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="price" className="border-b">
              <AccordionTrigger className="text-sm font-semibold py-3">
                {isVi ? '📅 Giá hôm nay' : '📅 Today\'s price'}
              </AccordionTrigger>
              <AccordionContent>
                <PriceCalendar
                  room={room}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  getRoomPrice={getRoomPrice}
                  getAvailability={getAvailability}
                  isSpecialDate={isSpecialDate}
                />
              </AccordionContent>
            </AccordionItem>

            {(roomFeatures.length > 0 || benefits.length > 0) && (
              <AccordionItem value="amenities" className="border-b-0">
                <AccordionTrigger className="text-sm font-semibold py-3">
                  {isVi ? '🛎️ Tiện nghi & Ưu đãi' : '🛎️ Amenities & Benefits'}
                </AccordionTrigger>
                <AccordionContent>
                  {roomFeatures.length > 0 && (
                    <>
                      <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        {isVi ? 'Trang thiết bị' : 'Equipment'}
                      </h4>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {roomFeatures.slice(0, 6).map((f) => (
                          <span
                            key={f.id}
                            className="text-[11px] bg-secondary px-2 py-0.5 rounded flex items-center gap-1"
                          >
                            {f.icon} {isVi ? f.name_vi : f.name_en || f.name_vi}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                  {benefits.length > 0 && (
                    <>
                      <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        {isVi ? 'Ưu đãi' : 'Benefits'}
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {benefits.slice(0, 4).map((b) => (
                          <span
                            key={b.id}
                            className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1"
                          >
                            {b.icon} {isVi ? b.name_vi : b.name_en || b.name_vi}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>

        {/* 5. Footer: Xem chi tiết + Quantity */}
        <div className="px-4 sm:px-5 py-3 mt-2 border-t border-border bg-secondary/20 flex items-center justify-between gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setPopupOpen(true)}
          >
            <EyeIcon className="h-3.5 w-3.5" />
            {isVi ? 'Xem chi tiết' : 'View details'}
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground hidden sm:inline">
              {isVi ? 'Số phòng:' : 'Rooms:'}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
              aria-label="Giảm"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-bold text-lg">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onQuantityChange(quantity + 1)}
              aria-label="Tăng"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <RoomDetailPopup room={room} open={popupOpen} onOpenChange={setPopupOpen} />
    </>
  );
});

export default BookingRoomCard;
