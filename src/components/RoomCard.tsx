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
import ExpandableList from '@/components/ExpandableList';

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

  const featureItems = roomFeatures.map(f => (
    <span key={f.id} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2.5 py-1.5 rounded-md">
      {f.icon} {language === 'vi' ? f.name_vi : f.name_en || f.name_vi}
    </span>
  ));

  const benefitItems = benefits.map(b => (
    <span key={b.id} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2.5 py-1.5 rounded-md">
      {b.icon} {language === 'vi' ? b.name_vi : b.name_en || b.name_vi}
    </span>
  ));

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
      {/* Top: Image + Info */}
      <div className="flex flex-col lg:flex-row">
        <div className="relative w-full lg:w-[340px] shrink-0 overflow-hidden">
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
          <div className="absolute top-3 left-3 bg-foreground/70 text-background px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm">
            {room.totalRooms} phòng
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-5 space-y-3">
          <div>
            <h3 className="font-display text-xl sm:text-2xl font-semibold text-foreground mb-1">
              {room.name[language]}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
              {room.description[language]}
            </p>
          </div>

          {/* Quick specs - always visible */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <span className="flex items-center gap-1.5 text-xs bg-secondary px-2.5 py-1.5 rounded-lg">
              <Maximize2 className="h-3.5 w-3.5 text-primary" /> {room.size}m²
            </span>
            <span className="flex items-center gap-1.5 text-xs bg-secondary px-2.5 py-1.5 rounded-lg">
              <BedDouble className="h-3.5 w-3.5 text-primary" /> {room.bedType}
            </span>
            <span className="flex items-center gap-1.5 text-xs bg-secondary px-2.5 py-1.5 rounded-lg">
              <Eye className="h-3.5 w-3.5 text-primary" /> {room.viewType}
            </span>
            <span className="flex items-center gap-1.5 text-xs bg-secondary px-2.5 py-1.5 rounded-lg">
              <Users className="h-3.5 w-3.5 text-primary" /> {room.capacity} người
            </span>
          </div>

          {room.hasBalcony && (
            <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
              <Waves className="h-3.5 w-3.5" /> Có ban công riêng
            </div>
          )}

          {/* Highlights */}
          {highlights.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {highlights.slice(0, 4).map((h) => (
                <span key={h.id} className="flex items-center gap-1 text-[11px] bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                  {h.icon} {language === 'vi' ? h.name_vi : h.name_en || h.name_vi}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Amenities - collapsible */}
      <div className="px-4 sm:px-5 pb-3 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featureItems.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Trang thiết bị</h4>
              <ExpandableList items={featureItems} defaultCount={6} mobileCount={4} />
            </div>
          )}
          {benefitItems.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ưu đãi</h4>
              <ExpandableList items={benefitItems} defaultCount={6} mobileCount={4} />
            </div>
          )}
        </div>
      </div>

      {/* Price calendar */}
      <div className="px-4 sm:px-5 pb-3">
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
      <div className="px-4 sm:px-5 pb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
        <Button variant="gold-outline" size="sm" onClick={() => navigate(`/room/${room.id}`)} className="gap-1.5">
          {t('room.view_detail')}
        </Button>
        <Button variant="gold" size="sm" onClick={() => navigate(`/booking?room=${room.id}`)} className="gap-1.5 group/btn">
          {t('room.book')}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
        </Button>
      </div>
    </div>
  );
};

export default RoomCard;
