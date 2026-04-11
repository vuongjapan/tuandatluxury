import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Maximize2, ArrowRight, BedDouble, Eye, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Room } from '@/data/rooms';
import { useRoomAmenities } from '@/hooks/useRoomAmenities';
import { useRooms } from '@/hooks/useRooms';
import { optimizeImageUrl } from '@/lib/optimizeImage';
import PriceCalendar from '@/components/PriceCalendar';

interface RoomCardProps {
  room: Room;
  index: number;
}

const RoomCard = ({ room, index }: RoomCardProps) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const { roomFeatures, benefits, highlights } = useRoomAmenities();
  const { getRoomPrice, getAvailability, isSpecialDate } = useRooms();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const imgSrc = optimizeImageUrl(room.image, { width: 640, quality: 70 });

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
      {/* Top: Image + Info side by side */}
      <div className="flex flex-col lg:flex-row">
        {/* Image */}
        <div className="relative w-full lg:w-[360px] shrink-0 overflow-hidden">
          <div className="aspect-video lg:aspect-auto lg:h-full">
            <img
              src={imgSrc}
              alt={room.name[language]}
              className="w-full h-full object-cover"
              loading={index < 2 ? 'eager' : 'lazy'}
              decoding="async"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
            />
          </div>
          {/* Room count badge */}
          <div className="absolute top-3 left-3 bg-foreground/70 text-background px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm">
            {room.totalRooms} phòng
          </div>
        </div>

        {/* Room info */}
        <div className="flex-1 p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="font-display text-2xl sm:text-3xl font-semibold text-foreground mb-2">
              {room.name[language]}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {room.description[language]}
            </p>
          </div>

          {/* Quick specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-lg">
              <Maximize2 className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium">{room.size}m²</span>
            </div>
            <div className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-lg">
              <BedDouble className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium">{room.bedType || `${room.capacity} giường`}</span>
            </div>
            <div className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-lg">
              <Eye className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium">{room.viewType || 'View thành phố'}</span>
            </div>
            <div className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-lg">
              <Users className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium">{room.capacity} {t('room.capacity')}</span>
            </div>
          </div>

          {room.hasBalcony && (
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <Waves className="h-4 w-4" /> Có ban công riêng
            </div>
          )}

          {/* Dynamic price message */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5">
            <p className="text-sm text-primary font-medium">
              💰 Giá thay đổi theo ngày – chọn ngày trên lịch để xem giá chính xác
            </p>
          </div>
        </div>
      </div>

      {/* Amenities section */}
      <div className="px-5 sm:px-6 pb-4 space-y-4">
        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {highlights.map((h) => (
              <span key={h.id} className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
                {h.icon} {language === 'vi' ? h.name_vi : h.name_en || h.name_vi}
              </span>
            ))}
          </div>
        )}

        {/* Room features + Benefits grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roomFeatures.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">🧰 Trang thiết bị</h4>
              <div className="grid grid-cols-2 gap-1.5">
                {roomFeatures.map(f => (
                  <span key={f.id} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2.5 py-1.5 rounded-md">
                    {f.icon} {language === 'vi' ? f.name_vi : f.name_en || f.name_vi}
                  </span>
                ))}
              </div>
            </div>
          )}
          {benefits.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">🎁 Ưu đãi dành cho khách</h4>
              <div className="grid grid-cols-1 gap-1">
                {benefits.map(b => (
                  <span key={b.id} className="flex items-center gap-1.5 text-xs text-muted-foreground px-1 py-0.5">
                    {b.icon} {language === 'vi' ? b.name_vi : b.name_en || b.name_vi}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Price calendar */}
      <div className="px-5 sm:px-6 pb-4">
        <PriceCalendar
          room={room}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          getRoomPrice={getRoomPrice}
          getAvailability={getAvailability}
          isSpecialDate={isSpecialDate}
        />
      </div>

      {/* Actions */}
      <div className="px-5 sm:px-6 pb-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
        <Button
          variant="gold-outline"
          size="sm"
          onClick={() => navigate(`/room/${room.id}`)}
          className="gap-1.5"
        >
          {t('room.view_detail')}
        </Button>
        <Button
          variant="gold"
          size="sm"
          onClick={() => navigate(`/booking?room=${room.id}`)}
          className="gap-1.5 group/btn"
        >
          {t('room.book')}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
        </Button>
      </div>
    </div>
  );
};

export default RoomCard;
