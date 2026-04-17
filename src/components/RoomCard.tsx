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
  const imgSrc = optimizeImageUrl(room.image, { width: 720, quality: 75 });
  const isVi = language === 'vi';

  const featureItems = roomFeatures.map(f => (
    <span key={f.id} className="flex items-center gap-1 text-[11px] text-muted-foreground bg-secondary px-2 py-1 rounded">
      {f.icon} {isVi ? f.name_vi : f.name_en || f.name_vi}
    </span>
  ));

  const benefitItems = benefits.map(b => (
    <span key={b.id} className="flex items-center gap-1 text-[11px] text-muted-foreground bg-secondary px-2 py-1 rounded">
      {b.icon} {isVi ? b.name_vi : b.name_en || b.name_vi}
    </span>
  ));

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-lg transition-shadow">
      {/* Top: 2 columns – Image + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Image (left) */}
        <div className="relative overflow-hidden">
          <div className="aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[280px]">
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
            {room.totalRooms} {isVi ? 'phòng' : 'rooms'}
          </div>
          {room.hasBalcony && (
            <div className="absolute bottom-3 left-3 bg-primary/90 text-primary-foreground px-2.5 py-1 rounded-md text-[11px] font-semibold backdrop-blur-sm flex items-center gap-1">
              <Waves className="h-3 w-3" /> {isVi ? 'Ban công riêng' : 'Private balcony'}
            </div>
          )}
        </div>

        {/* Calendar (right) */}
        <div className="p-3 sm:p-4 bg-secondary/20">
          <PriceCalendar
            room={room}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            getRoomPrice={getRoomPrice}
            getAvailability={getAvailability}
            isSpecialDate={isSpecialDate}
          />
        </div>
      </div>

      {/* Info (compact) */}
      <div className="p-4 sm:p-5 space-y-3 border-t border-border">
        <div>
          <h3 className="font-display text-xl sm:text-2xl font-semibold text-foreground mb-1">
            {room.name[language]}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
            {room.description[language]}
          </p>
        </div>

        {/* Quick specs */}
        <div className="flex flex-wrap gap-1.5">
          <span className="flex items-center gap-1 text-xs bg-secondary px-2.5 py-1 rounded-md">
            <Maximize2 className="h-3 w-3 text-primary" /> {room.size}m²
          </span>
          <span className="flex items-center gap-1 text-xs bg-secondary px-2.5 py-1 rounded-md">
            <BedDouble className="h-3 w-3 text-primary" /> {room.bedType}
          </span>
          <span className="flex items-center gap-1 text-xs bg-secondary px-2.5 py-1 rounded-md">
            <Eye className="h-3 w-3 text-primary" /> {room.viewType}
          </span>
          <span className="flex items-center gap-1 text-xs bg-secondary px-2.5 py-1 rounded-md">
            <Users className="h-3 w-3 text-primary" /> {room.capacity} {isVi ? 'người' : 'guests'}
          </span>
        </div>

        {/* Highlights (compact) */}
        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {highlights.slice(0, 3).map((h) => (
              <span key={h.id} className="flex items-center gap-1 text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {h.icon} {isVi ? h.name_vi : h.name_en || h.name_vi}
              </span>
            ))}
          </div>
        )}

        {/* Amenities – very compact, expandable */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {featureItems.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {isVi ? 'Trang thiết bị' : 'Equipment'}
              </h4>
              <ExpandableList items={featureItems} defaultCount={3} mobileCount={3} />
            </div>
          )}
          {benefitItems.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {isVi ? 'Ưu đãi' : 'Benefits'}
              </h4>
              <ExpandableList items={benefitItems} defaultCount={2} mobileCount={2} />
            </div>
          )}
        </div>

        {/* Price note */}
        <p className="text-[11px] text-muted-foreground italic">
          {isVi ? 'Giá thay đổi theo ngày – chọn ngày để xem giá chính xác' : 'Prices vary by date – select for exact pricing'}
        </p>

        {/* Actions – chỉ giữ "Xem chi tiết" */}
        <div className="flex items-center justify-end pt-2 border-t border-border">
          <Button variant="gold" size="sm" onClick={() => navigate(`/room/${room.id}`)} className="gap-1.5">
            {t('room.view_detail')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
