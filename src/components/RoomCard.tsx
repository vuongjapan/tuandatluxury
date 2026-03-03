import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Maximize2, Wifi, Snowflake, Tv, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Room } from '@/data/rooms';

const AMENITY_ICON_MAP: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-4 w-4" />,
  ac: <Snowflake className="h-4 w-4" />,
  tv: <Tv className="h-4 w-4" />,
  ocean_view: <Waves className="h-4 w-4" />,
};

interface RoomCardProps {
  room: Room;
  index: number;
}

const RoomCard = ({ room, index }: RoomCardProps) => {
  const { language, t, formatPrice } = useLanguage();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group bg-card rounded-xl border border-border shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden flex flex-col md:flex-row"
    >
      {/* Image */}
      <div className="relative w-full md:w-80 h-56 md:h-auto shrink-0 overflow-hidden">
        <img
          src={room.image}
          alt={room.name[language]}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
        <div>
          <h3 className="font-display text-2xl font-semibold text-foreground mb-2">
            {room.name[language]}
          </h3>
          <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
            {room.description[language]}
          </p>

          {/* Amenities */}
          <div className="flex flex-wrap gap-3 mb-4">
            {room.amenities.slice(0, 5).map((a) => (
              <span key={a} className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                {AMENITY_ICON_MAP[a] || null}
                {a}
              </span>
            ))}
          </div>

          {/* Capacity & Size */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" /> {room.capacity} {t('room.capacity')}
            </span>
            <span className="flex items-center gap-1">
              <Maximize2 className="h-4 w-4" /> {room.size}m²
            </span>
          </div>
        </div>

        {/* Price & Actions */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
          <div>
            <span className="text-2xl font-bold text-primary">{formatPrice(room.priceVND)}</span>
            <span className="text-sm text-muted-foreground">{t('room.per_night')}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="gold-outline" size="sm" onClick={() => navigate(`/room/${room.id}`)}>
              {t('room.view_detail')}
            </Button>
            <Button variant="gold" size="sm" onClick={() => navigate(`/booking?room=${room.id}`)}>
              {t('room.book')}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RoomCard;
