import { useState, memo } from 'react';
import { Users, Maximize2, BedDouble, Eye, Waves, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SmartImage from '@/components/SmartImage';
import RoomDetailPopup from '@/components/RoomDetailPopup';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRoomAmenities } from '@/hooks/useRoomAmenities';
import { useRoomPopupSettings } from '@/hooks/useRoomPopupSettings';
import type { Room } from '@/data/rooms';

interface RoomCardProps {
  room: Room;
  index: number;
}

/**
 * Compact luxury room card.
 * - 1 ảnh đẹp
 * - Tên ở ĐẦU card
 * - Specs ngắn + 4 highlights
 * - 2 CTA: Xem thêm (mở popup) + Đặt ngay (chuyển booking)
 * - KHÔNG hiển thị calendar trên trang chính.
 */
const RoomCard = memo(function RoomCard({ room, index }: RoomCardProps) {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const { highlights } = useRoomAmenities();
  const { byRoomId } = useRoomPopupSettings();
  const popup = byRoomId.get(room.id);

  const [popupOpen, setPopupOpen] = useState(false);

  const badgeText = isVi ? popup?.badge_vi : popup?.badge_en;

  return (
    <>
      <article className="group bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
        {/* Title FIRST */}
        <header className="px-4 sm:px-5 pt-4 sm:pt-5 pb-2">
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
          <p className="text-xs text-muted-foreground line-clamp-1">
            {room.viewType} • {room.bedType}
          </p>
        </header>

        {/* Single image */}
        <div className="relative mx-4 sm:mx-5 rounded-xl overflow-hidden">
          <div className="aspect-[16/10]">
            <SmartImage
              src={room.image}
              alt={room.name[language]}
              wrapperClassName="w-full h-full"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              eager={index < 2}
            />
          </div>
          <div className="absolute top-2 left-2 bg-foreground/70 text-background px-2.5 py-1 rounded-md text-[10px] font-semibold backdrop-blur-sm">
            {room.totalRooms} {isVi ? 'phòng' : 'rooms'}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 pt-3 flex-1 flex flex-col gap-3">
          {/* Short description */}
          <p className="text-sm text-muted-foreground line-clamp-2">{room.description[language]}</p>

          {/* Quick specs */}
          <div className="flex flex-wrap gap-1.5">
            <span className="flex items-center gap-1 text-xs bg-secondary px-2.5 py-1 rounded-md">
              <Maximize2 className="h-3 w-3 text-primary" /> {room.size}m²
            </span>
            <span className="flex items-center gap-1 text-xs bg-secondary px-2.5 py-1 rounded-md">
              <Users className="h-3 w-3 text-primary" /> {room.capacity}
            </span>
            <span className="flex items-center gap-1 text-xs bg-secondary px-2.5 py-1 rounded-md">
              <BedDouble className="h-3 w-3 text-primary" /> {isVi ? 'Giường lớn' : 'King'}
            </span>
            <span className="flex items-center gap-1 text-xs bg-secondary px-2.5 py-1 rounded-md">
              <Eye className="h-3 w-3 text-primary" /> {room.viewType.split(' ').slice(-2).join(' ')}
            </span>
          </div>

          {/* Top highlights (max 3) */}
          {highlights.length > 0 && (
            <div className="flex flex-wrap gap-1">
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

          {/* CTAs */}
          <div className="flex items-center gap-2 mt-auto pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => setPopupOpen(true)}
            >
              {isVi ? 'Xem thêm' : 'View more'}
            </Button>
            <Button
              variant="gold"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => setPopupOpen(true)}
            >
              {isVi ? 'Đặt ngay' : 'Book Now'}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </article>

      <RoomDetailPopup room={room} open={popupOpen} onOpenChange={setPopupOpen} />
    </>
  );
});

export default RoomCard;
