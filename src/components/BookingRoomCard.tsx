import { useState } from 'react';
import { Minus, Plus, Users, Maximize2, BedDouble, Eye, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRoomAmenities } from '@/hooks/useRoomAmenities';
import { useRooms } from '@/hooks/useRooms';
import { optimizeImageUrl } from '@/lib/optimizeImage';
import type { Room } from '@/data/rooms';
import PriceCalendar from '@/components/PriceCalendar';
import ExpandableList from '@/components/ExpandableList';

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

const BookingRoomCard = ({ room, quantity, onQuantityChange, nightlyPrice }: BookingRoomCardProps) => {
  const { language } = useLanguage();
  const { roomFeatures, benefits, highlights } = useRoomAmenities();
  const { getRoomPrice, getAvailability, isSpecialDate } = useRooms();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const maxGuests = ROOM_GUEST_LIMITS[room.id] || room.capacity;
  const imgSrc = optimizeImageUrl(room.image, { width: 400, quality: 70 });

  const featureItems = roomFeatures.map(f => (
    <span key={f.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-secondary px-2 py-1 rounded">
      {f.icon} {language === 'vi' ? f.name_vi : f.name_en || f.name_vi}
    </span>
  ));

  const benefitItems = benefits.map(b => (
    <span key={b.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-secondary px-2 py-1 rounded">
      {b.icon} {language === 'vi' ? b.name_vi : b.name_en || b.name_vi}
    </span>
  ));

  return (
    <div className={`bg-card rounded-xl border-2 overflow-hidden transition-all ${quantity > 0 ? 'border-primary shadow-lg' : 'border-border'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-44 shrink-0 relative">
          <img
            src={imgSrc}
            alt={room.name[language]}
            className="w-full h-32 sm:h-full object-cover"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
          />
          <div className="absolute top-2 left-2 bg-foreground/70 text-background px-2 py-0.5 rounded text-[10px] font-semibold backdrop-blur-sm">
            {room.totalRooms} phòng
          </div>
        </div>

        <div className="flex-1 p-3 sm:p-4 space-y-2.5">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">{room.name[language]}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{room.description[language]}</p>
          </div>

          {/* Specs */}
          <div className="flex flex-wrap gap-1.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
              <Maximize2 className="h-3 w-3" /> {room.size}m²
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
              <BedDouble className="h-3 w-3" /> {room.bedType}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
              <Eye className="h-3 w-3" /> {room.viewType}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
              <Users className="h-3 w-3" /> Tối đa {maxGuests} người
            </span>
          </div>

          {room.hasBalcony && (
            <div className="flex items-center gap-1 text-xs text-primary font-medium">
              <Waves className="h-3 w-3" /> Có ban công riêng
            </div>
          )}

          {highlights.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {highlights.slice(0, 3).map(h => (
                <span key={h.id} className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {h.icon} {language === 'vi' ? h.name_vi : h.name_en || h.name_vi}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Amenities - collapsible */}
      <div className="px-3 sm:px-4 pb-2 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {featureItems.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Trang thiết bị</h4>
              <ExpandableList items={featureItems} defaultCount={4} mobileCount={3} />
            </div>
          )}
          {benefitItems.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Ưu đãi</h4>
              <ExpandableList items={benefitItems} defaultCount={4} mobileCount={3} />
            </div>
          )}
        </div>
      </div>

      {/* Calendar */}
      <div className="px-3 sm:px-4 pb-2">
        <PriceCalendar
          room={room}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          getRoomPrice={getRoomPrice}
          getAvailability={getAvailability}
          isSpecialDate={isSpecialDate}
        />
      </div>

      {/* Quantity controls */}
      <div className="px-3 sm:px-4 pb-3 flex items-center justify-between gap-3 pt-2 border-t border-border">
        <span className="text-sm font-medium text-foreground">Chọn số phòng:</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onQuantityChange(Math.max(0, quantity - 1))}>
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center font-bold text-lg">{quantity}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onQuantityChange(quantity + 1)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingRoomCard;
