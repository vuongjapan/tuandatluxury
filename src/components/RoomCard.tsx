import { useNavigate } from 'react-router-dom';
import { Users, Maximize2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Room } from '@/data/rooms';
import { AMENITY_ICONS } from '@/data/rooms';
import { optimizeImageUrl } from '@/lib/optimizeImage';

interface RoomCardProps {
  room: Room;
  index: number;
}

const RoomCard = ({ room, index }: RoomCardProps) => {
  const { language, t, formatPrice } = useLanguage();
  const navigate = useNavigate();
  const imgSrc = optimizeImageUrl(room.image, { width: 640, quality: 70 });

  return (
    <div className="group bg-card rounded-2xl border border-border shadow-card hover:shadow-luxury transition-all duration-500 overflow-hidden flex flex-col md:flex-row hover-lift">
      {/* Image with zoom */}
      <div className="relative w-full md:w-96 shrink-0 overflow-hidden">
        <div className="aspect-video md:aspect-auto md:h-full">
        <img
          src={imgSrc}
          alt={room.name[language]}
          className="w-full h-full object-cover img-zoom"
          loading={index < 2 ? "eager" : "lazy"}
          decoding="async"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
        />
        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {/* Price badge on image */}
        <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm shadow-gold backdrop-blur-sm">
          {formatPrice(room.priceVND)}
          <span className="text-[10px] font-normal opacity-80 block">{t('room.per_night')}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 sm:p-6 md:p-8 flex flex-col justify-between">
        <div>
          <h3 className="font-display text-2xl sm:text-3xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
            {room.name[language]}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-5">
            {room.description[language]}
          </p>

          {/* Amenities */}
          <div className="flex flex-wrap gap-2 mb-5">
            {room.amenities.slice(0, 5).map((a) => {
              const amenity = AMENITY_ICONS[a];
              const label = amenity ? amenity.label[language] || amenity.label['vi'] : a;
              return (
                <span key={a} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/80 px-3 py-1.5 rounded-full border border-border/50 font-medium">
                  {label}
                </span>
              );
            })}
          </div>

          {/* Capacity & Size */}
          <div className="flex gap-5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary/70" /> {room.capacity} {t('room.capacity')}
            </span>
            <span className="flex items-center gap-1.5">
              <Maximize2 className="h-4 w-4 text-primary/70" /> {room.size}m²
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end mt-5 pt-5 border-t border-border/50 gap-3">
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
    </div>
  );
};

export default RoomCard;
