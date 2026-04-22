import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  Users, Maximize2, BedDouble, Eye, Waves, Wifi, Snowflake, Tv, Wine, Lock, Sun, Bath, Sparkles,
  ChevronLeft, ChevronRight, MessageCircle, ArrowRight,
} from 'lucide-react';
import SmartImage from '@/components/SmartImage';
import PriceCalendar from '@/components/PriceCalendar';
import type { Room } from '@/data/rooms';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRoomAmenities } from '@/hooks/useRoomAmenities';
import { useRooms } from '@/hooks/useRooms';
import { useRoomPopupSettings } from '@/hooks/useRoomPopupSettings';

const AMENITY_ICON_MAP: Record<string, any> = {
  Wifi, Snowflake, Tv, Wine, Lock, Sun, Bath, Waves, Sparkles, BedDouble,
};

interface RoomDetailPopupProps {
  room: Room;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const RoomDetailPopup = ({ room, open, onOpenChange }: RoomDetailPopupProps) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const isVi = language === 'vi';
  const { roomFeatures, benefits, highlights } = useRoomAmenities();
  const { roomImages, getRoomPrice, getAvailability, isSpecialDate } = useRooms();
  const { byRoomId } = useRoomPopupSettings();
  const popup = byRoomId.get(room.id);

  // Build gallery: caption-aware images from DB, falling back to room.image
  const gallery = useMemo(() => {
    const dbImgs = (roomImages || []).filter((i: any) => i.room_id === room.id);
    if (dbImgs.length > 0) {
      return dbImgs.map((i: any) => ({
        url: i.image_url,
        caption: isVi ? (i.caption_vi || i.caption || '') : (i.caption_en || i.caption || ''),
      }));
    }
    return [{ url: room.image, caption: '' }];
  }, [roomImages, room.id, room.image, isVi]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>();

  const next = () => setActiveIdx((i) => (i + 1) % gallery.length);
  const prev = () => setActiveIdx((i) => (i - 1 + gallery.length) % gallery.length);

  const badgeText = isVi ? popup?.badge_vi : popup?.badge_en;
  const ctaPrimary = (isVi ? popup?.cta_primary_vi : popup?.cta_primary_en) || (isVi ? 'Đặt ngay' : 'Book Now');
  const ctaSecondary = (isVi ? popup?.cta_secondary_vi : popup?.cta_secondary_en) || (isVi ? 'Chat tư vấn' : 'Chat with us');
  const popupHighlights = (isVi ? popup?.highlights_vi : popup?.highlights_en) || [];
  const policyText = (isVi ? popup?.policy_vi : popup?.policy_en) || '';
  const pitchText = (isVi ? popup?.short_pitch_vi : popup?.short_pitch_en) || room.description[language];

  const handleBook = () => {
    onOpenChange(false);
    navigate(`/booking?room=${room.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          p-0 gap-0 overflow-hidden
          w-screen h-[100dvh] max-w-none rounded-none border-0
          sm:w-[92vw] sm:h-auto sm:max-h-[92vh] sm:max-w-5xl sm:rounded-2xl sm:border
          flex flex-col bg-card
        "
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 border-b border-border flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="font-display text-lg sm:text-2xl font-semibold text-foreground truncate">
                {room.name[language]}
              </h2>
              {badgeText && (
                <Badge className="bg-primary text-primary-foreground border-0">{badgeText}</Badge>
              )}
              {room.hasBalcony && (
                <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
                  <Waves className="h-3 w-3" /> {isVi ? 'View biển' : 'Sea view'}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{pitchText}</p>
          </div>
        </div>

        {/* Body — scrollable (mobile native momentum) */}
        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
            {/* Gallery */}
            <div className="lg:col-span-3 bg-muted/30">
              <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden">
                <SmartImage
                  src={gallery[activeIdx]?.url}
                  alt={gallery[activeIdx]?.caption || room.name[language]}
                  wrapperClassName="w-full h-full"
                  className="object-cover"
                  eager
                />
                {gallery.length > 1 && (
                  <>
                    <button
                      onClick={prev}
                      aria-label="Previous"
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={next}
                      aria-label="Next"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
                {gallery[activeIdx]?.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="text-xs sm:text-sm text-white font-medium">{gallery[activeIdx].caption}</p>
                  </div>
                )}
              </div>
              {gallery.length > 1 && (
                <div className="flex gap-1.5 p-2 overflow-x-auto">
                  {gallery.map((g, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIdx(i)}
                      className={`relative shrink-0 h-14 w-20 rounded-md overflow-hidden border-2 transition-all ${
                        i === activeIdx ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={g.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="lg:col-span-2 p-4 sm:p-5 space-y-4">
              {/* Quick specs */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-sm bg-secondary/50 rounded-lg px-3 py-2">
                  <Maximize2 className="h-4 w-4 text-primary" /> {room.size}m²
                </div>
                <div className="flex items-center gap-2 text-sm bg-secondary/50 rounded-lg px-3 py-2">
                  <Users className="h-4 w-4 text-primary" /> {room.capacity} {isVi ? 'khách' : 'guests'}
                </div>
                <div className="flex items-center gap-2 text-sm bg-secondary/50 rounded-lg px-3 py-2 col-span-2">
                  <BedDouble className="h-4 w-4 text-primary" /> {room.bedType}
                </div>
                <div className="flex items-center gap-2 text-sm bg-secondary/50 rounded-lg px-3 py-2 col-span-2">
                  <Eye className="h-4 w-4 text-primary" /> {room.viewType}
                </div>
              </div>

              {/* Highlights from popup settings */}
              {popupHighlights.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {popupHighlights.map((h, i) => (
                    <span key={i} className="text-[11px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                      ✦ {h}
                    </span>
                  ))}
                </div>
              )}

              <Accordion type="multiple" defaultValue={['price']} className="w-full">
                <AccordionItem value="price">
                  <AccordionTrigger className="text-sm font-semibold">
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

                <AccordionItem value="amenities">
                  <AccordionTrigger className="text-sm font-semibold">
                    {isVi ? '🛎️ Trang thiết bị' : '🛎️ Amenities'}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-1.5">
                      {roomFeatures.map((f) => (
                        <span key={f.id} className="text-xs bg-secondary px-2.5 py-1 rounded-md flex items-center gap-1">
                          {f.icon} {isVi ? f.name_vi : f.name_en || f.name_vi}
                        </span>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="benefits">
                  <AccordionTrigger className="text-sm font-semibold">
                    {isVi ? '🎁 Ưu đãi' : '🎁 Benefits'}
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-1.5">
                      {benefits.map((b) => (
                        <li key={b.id} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-0.5">{b.icon}</span>
                          <span>{isVi ? b.name_vi : b.name_en || b.name_vi}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                {policyText && (
                  <AccordionItem value="policy">
                    <AccordionTrigger className="text-sm font-semibold">
                      {isVi ? '📋 Chính sách' : '📋 Policy'}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{policyText}</p>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </div>
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="border-t border-border bg-card/95 backdrop-blur p-3 sm:p-4 flex gap-2 shrink-0">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none gap-1.5"
            onClick={() => {
              onOpenChange(false);
              // open chatbot if available
              const btn = document.querySelector<HTMLButtonElement>('[data-chatbot-open]');
              btn?.click();
            }}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">{ctaSecondary}</span>
          </Button>
          <Button variant="gold" className="flex-1 gap-1.5" onClick={handleBook}>
            {ctaPrimary}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomDetailPopup;
