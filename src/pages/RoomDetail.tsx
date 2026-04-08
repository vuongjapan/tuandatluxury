import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Maximize2, ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, BedDouble, Eye, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import PriceCalendar from '@/components/PriceCalendar';
import { useRooms } from '@/hooks/useRooms';
import { useRoomAmenities } from '@/hooks/useRoomAmenities';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useState } from 'react';

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

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t, formatPrice } = useLanguage();
  const { rooms, getRoomPrice, getAvailability, isSpecialDate } = useRooms();
  const { roomFeatures, benefits, highlights } = useRoomAmenities();
  const { settings } = useSiteSettings();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const room = rooms.find((r) => r.id === id);
  if (!room) return <div className="pt-20 text-center">Room not found</div>;

  const specs = ROOM_SPECS[room.id] || ROOM_SPECS.standard;
  const allImages = [room.image, ...(room.images || [])].filter(Boolean);
  const uniqueImages = [...new Set(allImages)];

  const prevImage = () => setCurrentImageIndex(i => i === 0 ? uniqueImages.length - 1 : i - 1);
  const nextImage = () => setCurrentImageIndex(i => i === uniqueImages.length - 1 ? 0 : i + 1);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> {t('nav.rooms')}
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <div className="relative rounded-xl overflow-hidden shadow-card-hover">
                <img src={uniqueImages[currentImageIndex] || '/placeholder.svg'} alt={room.name[language]}
                  className="w-full aspect-video object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                {uniqueImages.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {uniqueImages.map((_, i) => (
                        <button key={i} onClick={() => setCurrentImageIndex(i)}
                          className={`w-2 h-2 rounded-full transition-all ${i === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {uniqueImages.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {uniqueImages.map((img, i) => (
                    <button key={i} onClick={() => setCurrentImageIndex(i)}
                      className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === currentImageIndex ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="space-y-6">
              <div>
                <h1 className="font-display text-4xl font-bold text-foreground mb-2">{room.name[language]}</h1>
                <p className="text-muted-foreground text-lg leading-relaxed">{room.description[language]}</p>
              </div>

              <div className="bg-secondary rounded-xl p-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">{formatPrice(room.priceVND)}</span>
                  <span className="text-muted-foreground">{t('room.per_night')}</span>
                </div>
              </div>

              {/* Room specs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 text-foreground bg-secondary px-3 py-2 rounded-lg">
                  <Maximize2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm">{specs.area}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground bg-secondary px-3 py-2 rounded-lg">
                  <BedDouble className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm">{specs.beds}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground bg-secondary px-3 py-2 rounded-lg">
                  <Eye className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm">{specs.view}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground bg-secondary px-3 py-2 rounded-lg">
                  <Users className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm">{room.capacity} {t('room.capacity')}</span>
                </div>
              </div>

              {/* Highlights (default visible) */}
              {highlights.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {highlights.map(h => (
                    <span key={h.id} className="inline-flex items-center gap-1.5 text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
                      {h.icon} {language === 'vi' ? h.name_vi : h.name_en || h.name_vi}
                    </span>
                  ))}
                </div>
              )}

              {/* Expandable details */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-center gap-2 text-sm text-primary font-medium py-2 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
              >
                {showDetails ? 'Thu gọn' : '🔍 Xem chi tiết phòng'}
                <ChevronDown className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
              </button>

              {showDetails && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                  {/* Room features */}
                  {roomFeatures.length > 0 && (
                    <div>
                      <h3 className="font-display text-sm font-semibold mb-2">🧰 Trang thiết bị trong phòng</h3>
                      <div className="grid grid-cols-2 gap-1.5">
                        {roomFeatures.map(f => (
                          <span key={f.id} className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary px-3 py-2 rounded-lg">
                            {f.icon} {language === 'vi' ? f.name_vi : f.name_en || f.name_vi}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Benefits */}
                  {benefits.length > 0 && (
                    <div>
                      <h3 className="font-display text-sm font-semibold mb-2">🎁 Ưu đãi dành cho khách</h3>
                      <div className="grid grid-cols-1 gap-1">
                        {benefits.map(b => (
                          <span key={b.id} className="flex items-center gap-2 text-sm text-muted-foreground px-2 py-1">
                            {b.icon} {language === 'vi' ? b.name_vi : b.name_en || b.name_vi}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bathroom */}
                  <div>
                    <h3 className="font-display text-sm font-semibold mb-2">🚿 Phòng tắm</h3>
                    <div className="grid grid-cols-2 gap-1.5">
                      {specs.bathroom.map((item, i) => (
                        <span key={i} className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary px-3 py-2 rounded-lg">
                          ✓ {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              <PriceCalendar room={room} selectedDate={selectedDate} onSelectDate={setSelectedDate} getRoomPrice={getRoomPrice} getAvailability={getAvailability} isSpecialDate={isSpecialDate} />

              <Button variant="hero" className="w-full" onClick={() => navigate(`/booking?room=${room.id}`)}>
                {t('room.book')}
              </Button>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="flex-1 gap-2" asChild>
                  <a href="https://www.booking.com/hotel/vn/tuan-dat-luxury-flc-sam-son-sam-son.vi.html" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" /> Booking.com
                  </a>
                </Button>
                <Button variant="outline" className="flex-1 gap-2" asChild>
                  <a href="https://www.agoda.com/vi-vn/tuan-dat-luxury-hotel-flc/hotel/thanh-hoa-sam-son-beach-vn.html?cid=1844104&ds=eOSBCifZS4w0QBRo" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" /> Agoda
                  </a>
                </Button>
                <Button variant="outline" className="flex-1 gap-2" asChild>
                  <a href="https://www.traveloka.com/vi-vn/hotel/vietnam/tuan-dat-luxury-hotel-flc-9000000987051" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" /> Traveloka
                  </a>
                </Button>
                <Button variant="outline" className="flex-1 gap-2" asChild>
                  <a href="https://vn.trip.com/hotels/sam-son-hotel-detail-79078975/tuan-dat-luxury-hotel-flc/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" /> Trip.com
                  </a>
                </Button>
              </div>
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
