import { useState, memo } from 'react';
import { Minus, Plus, Users, Maximize2, BedDouble, Eye, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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

// Map view_type enum → badge text + colors (Vinpearl style)
const VIEW_BADGE: Record<string, { vi: string; en: string; bg: string; text: string }> = {
  sea_view:    { vi: '🌊 View biển',       en: '🌊 Sea view',    bg: 'bg-[#E0F4F1]', text: 'text-[#0F5A50]' },
  city_view:   { vi: '🏙️ View thành phố', en: '🏙️ City view',  bg: 'bg-[#EBF0F5]', text: 'text-[#1B3A5C]' },
  pool_view:   { vi: '🏊 View hồ bơi',     en: '🏊 Pool view',   bg: 'bg-[#E3F2FD]', text: 'text-[#0D47A1]' },
  garden_view: { vi: '🌿 View vườn',       en: '🌿 Garden view', bg: 'bg-[#E8F5EC]', text: 'text-[#1A6B3A]' },
};

function normalizeView(view: string): keyof typeof VIEW_BADGE {
  const v = (view || '').toLowerCase();
  if (v.includes('sea') || v.includes('biển')) return 'sea_view';
  if (v.includes('pool') || v.includes('hồ bơi')) return 'pool_view';
  if (v.includes('garden') || v.includes('vườn')) return 'garden_view';
  return 'city_view';
}

interface BookingRoomCardProps {
  room: Room;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  nightlyPrice: string;
}

const BookingRoomCard = memo(function BookingRoomCard({ room, quantity, onQuantityChange }: BookingRoomCardProps) {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const { roomFeatures, benefits, highlights } = useRoomAmenities();
  const { getRoomPrice, getAvailability, isSpecialDate } = useRooms();
  const { byRoomId } = useRoomPopupSettings();
  const popup = byRoomId.get(room.id);

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [popupOpen, setPopupOpen] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  const maxGuests = ROOM_GUEST_LIMITS[room.id] || room.capacity;
  const badgeText = isVi ? popup?.badge_vi : popup?.badge_en;

  // Mini gallery: combine main image + extras
  const gallery = [room.image, ...((room.images || []).filter(u => u && u !== room.image))].slice(0, 6);
  const totalImages = gallery.length;
  const currentImage = gallery[imgIndex] || room.image;

  const viewKey = normalizeView(room.viewType);
  const viewBadge = VIEW_BADGE[viewKey];

  const lowStock = room.totalRooms > 0 && room.totalRooms <= 3;

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIndex(i => (i - 1 + totalImages) % totalImages);
  };
  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIndex(i => (i + 1) % totalImages);
  };

  return (
    <>
      <div
        className={`bg-card rounded-xl border overflow-hidden transition-all shadow-sm hover:shadow-md ${
          quantity > 0 ? 'border-primary border-2' : 'border-[#E8E0D0] hover:border-primary/40'
        }`}
      >
        {/* HERO IMAGE — 16:9 with mini gallery */}
        <div className="relative aspect-[16/9] bg-secondary group">
          <SmartImage
            src={currentImage}
            alt={room.name[language]}
            wrapperClassName="w-full h-full"
            className="object-cover"
            eager
          />

          {/* View badge — top left */}
          <div className={`absolute top-3 left-3 ${viewBadge.bg} ${viewBadge.text} px-2.5 py-1 rounded-md text-xs font-semibold shadow-sm`}>
            {isVi ? viewBadge.vi : viewBadge.en}
          </div>

          {/* Low stock badge — top right */}
          {lowStock && (
            <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground px-2.5 py-1 rounded-md text-xs font-bold shadow-sm animate-pulse">
              {isVi ? `Còn ${room.totalRooms} phòng` : `${room.totalRooms} left`}
            </div>
          )}

          {/* Custom popup badge */}
          {badgeText && !lowStock && (
            <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm">
              {badgeText}
            </div>
          )}

          {/* Gallery nav arrows */}
          {totalImages > 1 && (
            <>
              <button
                onClick={prevImg}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextImg}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              {/* Dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {gallery.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setImgIndex(i); }}
                    className={`h-1.5 rounded-full transition-all ${i === imgIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`}
                    aria-label={`Image ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* CONTENT */}
        <div className="p-4 sm:p-5 space-y-3">
          {/* Title */}
          <div>
            <h3 className="font-display text-xl font-semibold text-foreground tracking-tight uppercase leading-tight">
              {room.name[language]}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{room.description[language]}</p>
          </div>

          {/* Quick specs row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Maximize2 className="h-3.5 w-3.5 text-primary" /> {room.size}m²</span>
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-primary" /> {isVi ? `${maxGuests} khách` : `${maxGuests} guests`}</span>
            <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5 text-primary" /> {room.bedType}</span>
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5 text-primary" /> {isVi ? viewBadge.vi.replace(/^[^\s]+\s/, '') : viewBadge.en.replace(/^[^\s]+\s/, '')}</span>
          </div>

          {/* Top highlights (max 3) */}
          {highlights.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {highlights.slice(0, 3).map((h) => (
                <span
                  key={h.id}
                  className="inline-flex items-center gap-1 text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium"
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  {isVi ? h.name_vi : h.name_en || h.name_vi}
                </span>
              ))}
            </div>
          )}

          {/* Accordion */}
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

        {/* Footer: Xem chi tiết + stepper */}
        <div className="px-4 sm:px-5 py-3 border-t border-border bg-secondary/20 flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setPopupOpen(true)}
            className="text-sm text-primary hover:underline font-medium"
          >
            {isVi ? 'Xem chi tiết →' : 'View details →'}
          </button>

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
