import { useState, memo } from 'react';
import { Minus, Plus, Users, Maximize2, BedDouble, Eye, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRoomAmenities } from '@/hooks/useRoomAmenities';
import { useRooms } from '@/hooks/useRooms';
import type { Room } from '@/data/rooms';
import PriceCalendar from '@/components/PriceCalendar';
import ExpandableList from '@/components/ExpandableList';
import SmartImage from '@/components/SmartImage';

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

const BookingRoomCard = memo(function BookingRoomCard({ room, quantity, onQuantityChange }: BookingRoomCardProps) {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const { roomFeatures, benefits, highlights } = useRoomAmenities();
  const { getRoomPrice, getAvailability, isSpecialDate } = useRooms();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const maxGuests = ROOM_GUEST_LIMITS[room.id] || room.capacity;

  const featureItems = roomFeatures.map(f => (
    <span key={f.id} className="flex items-center gap-1 text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded">
      {f.icon} {isVi ? f.name_vi : f.name_en || f.name_vi}
    </span>
  ));

  const benefitItems = benefits.map(b => (
    <span key={b.id} className="flex items-center gap-1 text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded">
      {b.icon} {isVi ? b.name_vi : b.name_en || b.name_vi}
    </span>
  ));

  return (
    <div className={`bg-card rounded-xl border-2 overflow-hidden transition-all ${quantity > 0 ? 'border-primary shadow-lg' : 'border-border'}`}>
      {/* Top section: Image (split into 2 halves) + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Image column — split into 2 horizontal halves so a long image is easier to scan */}
        <div className="relative grid grid-rows-2 gap-1 bg-muted">
          {/* Upper half */}
          <div className="relative overflow-hidden">
            <SmartImage
              src={room.image}
              alt={`${room.name[language]} – ${isVi ? 'Phần trên' : 'Top'}`}
              wrapperClassName="w-full h-full"
              className="scale-[1.02] object-top"
              eager
            />
            <div className="absolute top-2 left-2 bg-foreground/70 text-background px-2 py-0.5 rounded text-[10px] font-semibold backdrop-blur-sm">
              {room.totalRooms} {isVi ? 'phòng' : 'rooms'}
            </div>
          </div>
          {/* Lower half */}
          <div className="relative overflow-hidden">
            <SmartImage
              src={room.image}
              alt={`${room.name[language]} – ${isVi ? 'Phần dưới' : 'Bottom'}`}
              wrapperClassName="w-full h-full"
              className="scale-[1.02] object-bottom"
            />
            {room.hasBalcony && (
              <div className="absolute bottom-2 left-2 bg-primary/90 text-primary-foreground px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
                <Waves className="h-2.5 w-2.5" /> {isVi ? 'Ban công' : 'Balcony'}
              </div>
            )}
          </div>
        </div>

        {/* Calendar column */}
        <div className="p-3 bg-secondary/20 lg:border-l border-border">
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

      {/* Info compact */}
      <div className="p-3 sm:p-4 space-y-2.5 border-t border-border">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">{room.name[language]}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{room.description[language]}</p>
        </div>

        {/* Specs */}
        <div className="flex flex-wrap gap-1.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
            <Maximize2 className="h-3 w-3" /> {room.size}m²
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
            <BedDouble className="h-3 w-3" /> {room.bedType}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
            <Eye className="h-3 w-3" /> {room.viewType}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
            <Users className="h-3 w-3" /> {isVi ? `Tối đa ${maxGuests}` : `Max ${maxGuests}`}
          </span>
        </div>

        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {highlights.slice(0, 3).map(h => (
              <span key={h.id} className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {h.icon} {isVi ? h.name_vi : h.name_en || h.name_vi}
              </span>
            ))}
          </div>
        )}

        {/* Amenities collapsed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {featureItems.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                {isVi ? 'Trang thiết bị' : 'Equipment'}
              </h4>
              <ExpandableList items={featureItems} defaultCount={3} mobileCount={3} />
            </div>
          )}
          {benefitItems.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                {isVi ? 'Ưu đãi' : 'Benefits'}
              </h4>
              <ExpandableList items={benefitItems} defaultCount={2} mobileCount={2} />
            </div>
          )}
        </div>

        {/* Quantity controls */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
          <span className="text-sm font-medium text-foreground">{isVi ? 'Chọn số phòng:' : 'Rooms:'}</span>
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
    </div>
  );
});

export default BookingRoomCard;
