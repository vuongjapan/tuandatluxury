import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Maximize2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import PriceCalendar from '@/components/PriceCalendar';
import { rooms, AMENITY_ICONS } from '@/data/rooms';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t, formatPrice } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date>();

  const room = rooms.find((r) => r.id === id);
  if (!room) return <div className="pt-20 text-center">Room not found</div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> {t('nav.rooms')}
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left - Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="rounded-xl overflow-hidden shadow-card-hover">
                <img
                  src={room.image}
                  alt={room.name[language]}
                  className="w-full h-80 md:h-[500px] object-cover"
                />
              </div>
            </motion.div>

            {/* Right - Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h1 className="font-display text-4xl font-bold text-foreground mb-2">
                  {room.name[language]}
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {room.description[language]}
                </p>
              </div>

              {/* Price */}
              <div className="bg-secondary rounded-xl p-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">{formatPrice(room.priceVND)}</span>
                  <span className="text-muted-foreground">{t('room.per_night')}</span>
                </div>
              </div>

              {/* Details */}
              <div className="flex gap-6">
                <div className="flex items-center gap-2 text-foreground">
                  <Users className="h-5 w-5 text-primary" />
                  <span>{room.capacity} {t('room.capacity')}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Maximize2 className="h-5 w-5 text-primary" />
                  <span>{room.size}m²</span>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="font-display text-lg font-semibold mb-3">{t('room.amenities')}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {room.amenities.map((a) => (
                    <span key={a} className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary px-3 py-2 rounded-lg">
                      {AMENITY_ICONS[a]?.label[language] || a}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price Calendar */}
              <PriceCalendar room={room} selectedDate={selectedDate} onSelectDate={setSelectedDate} />

              {/* Book Button */}
              <Button variant="hero" className="w-full" onClick={() => navigate(`/booking?room=${room.id}`)}>
                {t('room.book')}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default RoomDetail;
