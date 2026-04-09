import { useState } from 'react';
import { Minus, Plus, Users, Maximize2, BedDouble, Eye, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRoomAmenities } from '@/hooks/useRoomAmenities';
import { optimizeImageUrl } from '@/lib/optimizeImage';
import type { Room } from '@/data/rooms';
import { motion } from 'framer-motion';

const ROOM_SPECS: Record<string, { area: string; beds: string; view: string; balcony?: boolean; bathroom: string[] }> = {
  standard: {
    area: '30m²',
    beds: '1 giường đôi',
    view: 'View thành phố',
    bathroom: ['Vòi sen', 'Máy sấy tóc', 'Khăn & dép', 'Đồ vệ sinh miễn phí'],
  },
  deluxe: {
    area: '30m²',
    beds: '2 giường đôi',
    view: 'View thành phố',
    bathroom: ['Vòi sen', 'Máy sấy tóc', 'Khăn & dép', 'Đồ vệ sinh miễn phí'],
  },
  family: {
    area: '35m²',
    beds: '2 giường đôi',
    view: 'View biển + thành phố',
    balcony: true,
    bathroom: ['Vòi sen', 'Máy sấy tóc', 'Khăn & dép', 'Đồ vệ sinh miễn phí'],
  },
};

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
  const { language, formatPrice } = useLanguage();
  const { roomFeatures, benefits, highlights } = useRoomAmenities();
  const [showDetails, setShowDetails] = useState(false);
  const specs = ROOM_SPECS[room.id] || ROOM_SPECS.standard;
  const maxGuests = ROOM_GUEST_LIMITS[room.id] || room.capacity;
  const imgSrc = optimizeImageUrl(room.image, { width: 400, quality: 70 });

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="sm:w-40 shrink-0">
          <img
            src={imgSrc}
            alt={room.name[language]}
            className="w-full h-32 sm:h-full object-cover"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">{room.name[language]}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{room.description[language]}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-primary text-lg">{nightlyPrice}</p>
              <p className="text-[10px] text-muted-foreground">/đêm</p>
            </div>
          </div>

          {/* Quick specs */}
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
              <Maximize2 className="h-3 w-3" /> {specs.area}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
              <BedDouble className="h-3 w-3" /> {specs.beds}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
              <Eye className="h-3 w-3" /> {specs.view}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
              <Users className="h-3 w-3" /> Tối đa {maxGuests} người
            </span>
          </div>

          {/* Highlights */}
          {highlights.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {highlights.map(h => (
                <span key={h.id} className="inline-flex items-center gap-1 text-[11px] bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                  {h.icon} {language === 'vi' ? h.name_vi : h.name_en || h.name_vi}
                </span>
              ))}
            </div>
          )}

          {/* Expand details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
          >
            {showDetails ? 'Thu gọn' : '🔍 Xem chi tiết phòng'}
            <ChevronDown className={`h-3 w-3 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
          </button>

          {showDetails && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pt-1">
              {roomFeatures.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold mb-1.5">🧰 Trang thiết bị trong phòng</h4>
                  <div className="grid grid-cols-2 gap-1">
                    {roomFeatures.map(f => (
                      <span key={f.id} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2 py-1.5 rounded-md">
                        {f.icon} {language === 'vi' ? f.name_vi : f.name_en || f.name_vi}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {benefits.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold mb-1.5">🎁 Ưu đãi dành cho khách</h4>
                  <div className="grid grid-cols-1 gap-0.5">
                    {benefits.map(b => (
                      <span key={b.id} className="flex items-center gap-1.5 text-xs text-muted-foreground px-1 py-0.5">
                        {b.icon} {language === 'vi' ? b.name_vi : b.name_en || b.name_vi}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h4 className="text-xs font-semibold mb-1.5">🚿 Phòng tắm</h4>
                <div className="grid grid-cols-2 gap-1">
                  {specs.bathroom.map((item, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2 py-1.5 rounded-md">
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Quantity controls */}
          <div className="flex items-center gap-3 pt-1 border-t border-border">
            <span className="text-sm font-medium text-muted-foreground">Số phòng:</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onQuantityChange(Math.max(0, quantity - 1))}>
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-8 text-center font-bold text-lg">{quantity}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onQuantityChange(quantity + 1)}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingRoomCard;
