import { useParams, useNavigate } from 'react-router-dom';
import { Users, Maximize2, ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, BedDouble, Eye, Waves, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import PriceCalendar from '@/components/PriceCalendar';
import ExpandableList from '@/components/ExpandableList';
import { useRooms } from '@/hooks/useRooms';
import { useRoomAmenities } from '@/hooks/useRoomAmenities';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { optimizeImageUrl } from '@/lib/optimizeImage';

const BATHROOM_ITEMS_VI = ['Vòi sen', 'Máy sấy tóc', 'Khăn & dép', 'Đồ vệ sinh miễn phí'];
const BATHROOM_ITEMS_EN = ['Shower', 'Hair dryer', 'Towels & slippers', 'Free toiletries'];

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { rooms, getRoomPrice, getAvailability, isSpecialDate } = useRooms();
  const { roomFeatures, benefits, highlights } = useRoomAmenities();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const isVi = language === 'vi';

  const room = rooms.find((r) => r.id === id);
  if (!room) return <div className="pt-20 text-center">Room not found</div>;

  const allImages = [room.image, ...(room.images || [])].filter(Boolean);
  const uniqueImages = [...new Set(allImages)];

  const prevImage = () => setCurrentImageIndex(i => i === 0 ? uniqueImages.length - 1 : i - 1);
  const nextImage = () => setCurrentImageIndex(i => i === uniqueImages.length - 1 ? 0 : i + 1);

  const bathroomItems = isVi ? BATHROOM_ITEMS_VI : BATHROOM_ITEMS_EN;

  const featureItems = roomFeatures.map(f => (
    <span key={f.id} className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/60 px-3 py-2 rounded-lg">
      {f.icon} {isVi ? f.name_vi : f.name_en || f.name_vi}
    </span>
  ));

  const benefitItems = benefits.map(b => (
    <span key={b.id} className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/60 px-3 py-2 rounded-lg">
      {b.icon} {isVi ? b.name_vi : b.name_en || b.name_vi}
    </span>
  ));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 lg:pt-28 pb-16">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>{isVi ? 'Quay lại trang chủ' : 'Back'}</span>
          </button>
        </div>

        {/* Hero Gallery - Full width Vinpearl style */}
        <div className="container mx-auto px-4 mb-10">
          <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[16/7] lg:aspect-[21/9]">
            <img
              src={optimizeImageUrl(uniqueImages[currentImageIndex] || '/placeholder.svg', { width: 1200, quality: 80 })}
              alt={room.name[language]}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />

            {/* Room name overlay */}
            <div className="absolute bottom-6 left-6 lg:bottom-10 lg:left-10">
              <h1 className="font-display text-3xl lg:text-5xl font-bold text-background mb-2 drop-shadow-lg">
                {room.name[language]}
              </h1>
              <div className="flex items-center gap-3 text-background/90 text-sm">
                <span className="flex items-center gap-1"><Maximize2 className="h-4 w-4" /> {room.size}m²</span>
                <span className="text-background/40">|</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {room.capacity} {isVi ? 'người' : 'guests'}</span>
                <span className="text-background/40">|</span>
                <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {room.viewType}</span>
              </div>
            </div>

            {/* Image counter */}
            <div className="absolute top-4 right-4 bg-foreground/60 text-background text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
              {currentImageIndex + 1} / {uniqueImages.length}
            </div>

            {/* Navigation arrows */}
            {uniqueImages.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-background/20 hover:bg-background/40 backdrop-blur-sm rounded-full text-background transition-colors">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-background/20 hover:bg-background/40 backdrop-blur-sm rounded-full text-background transition-colors">
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {uniqueImages.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
              {uniqueImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIndex(i)}
                  className={`shrink-0 w-24 h-16 lg:w-28 lg:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    i === currentImageIndex ? 'border-primary ring-2 ring-primary/30' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={optimizeImageUrl(img, { width: 200, quality: 60 })} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left: Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {room.description[language]}
                </p>
              </div>

              {/* Quick specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: <Maximize2 className="h-5 w-5 text-primary" />, label: `${room.size}m²`, sub: isVi ? 'Diện tích' : 'Area' },
                  { icon: <BedDouble className="h-5 w-5 text-primary" />, label: room.bedType, sub: isVi ? 'Loại giường' : 'Bed' },
                  { icon: <Eye className="h-5 w-5 text-primary" />, label: room.viewType, sub: 'View' },
                  { icon: <Users className="h-5 w-5 text-primary" />, label: `${room.capacity} ${isVi ? 'người' : 'guests'}`, sub: isVi ? 'Sức chứa' : 'Capacity' },
                ].map((spec, i) => (
                  <div key={i} className="bg-secondary/50 rounded-xl p-4 text-center space-y-1">
                    <div className="flex justify-center">{spec.icon}</div>
                    <p className="text-sm font-semibold text-foreground">{spec.label}</p>
                    <p className="text-[11px] text-muted-foreground">{spec.sub}</p>
                  </div>
                ))}
              </div>

              {room.hasBalcony && (
                <div className="flex items-center gap-2 text-primary font-medium bg-primary/5 rounded-xl px-4 py-3">
                  <Waves className="h-5 w-5" />
                  <span>{isVi ? 'Có ban công riêng hướng biển' : 'Private sea-view balcony'}</span>
                </div>
              )}

              {/* Highlights */}
              {highlights.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {highlights.map(h => (
                    <span key={h.id} className="inline-flex items-center gap-1.5 text-sm bg-primary/10 text-primary px-4 py-2 rounded-full font-medium">
                      {h.icon} {isVi ? h.name_vi : h.name_en || h.name_vi}
                    </span>
                  ))}
                </div>
              )}

              {/* Room features */}
              {featureItems.length > 0 && (
                <div>
                  <h3 className="font-display text-lg font-semibold mb-3 text-foreground">
                    {isVi ? 'Trang thiết bị trong phòng' : 'Room Equipment'}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <ExpandableList items={featureItems} defaultCount={8} mobileCount={6} />
                  </div>
                </div>
              )}

              {/* Benefits */}
              {benefitItems.length > 0 && (
                <div>
                  <h3 className="font-display text-lg font-semibold mb-3 text-foreground">
                    {isVi ? 'Ưu đãi dành cho khách' : 'Guest Benefits'}
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    <ExpandableList items={benefitItems} defaultCount={6} mobileCount={4} />
                  </div>
                </div>
              )}

              {/* Bathroom */}
              <div>
                <h3 className="font-display text-lg font-semibold mb-3 text-foreground">
                  {isVi ? 'Phòng tắm' : 'Bathroom'}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {bathroomItems.map((item, i) => (
                    <span key={i} className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/60 px-3 py-2 rounded-lg">
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Room availability info */}
              <div className="bg-secondary/30 rounded-xl p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {isVi ? `Tổng cộng ${room.totalRooms} phòng loại này` : `${room.totalRooms} rooms of this type`}
                </p>
              </div>
            </div>

            {/* Right: Pricing + CTA (sticky) */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-5">
                {/* Price message */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-sm text-primary font-medium text-center">
                    {isVi ? 'Giá thay đổi theo ngày – chọn ngày để xem giá chính xác' : 'Prices vary by date – select a date to see exact pricing'}
                  </p>
                </div>

                {/* Calendar */}
                <PriceCalendar
                  room={room}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  getRoomPrice={getRoomPrice}
                  getAvailability={getAvailability}
                  isSpecialDate={isSpecialDate}
                />

                {/* CTA buttons */}
                <div className="space-y-3">
                  <Button
                    variant="gold"
                    className="w-full text-sm font-bold py-6 rounded-xl gap-2"
                    onClick={() => navigate(`/booking?room=${room.id}`)}
                  >
                    {isVi ? 'Đặt Ngay' : 'Book Now'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  {/* OTA links */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Booking.com', url: 'https://www.booking.com/hotel/vn/tuan-dat-luxury-flc-sam-son-sam-son.vi.html' },
                      { name: 'Agoda', url: 'https://www.agoda.com/vi-vn/tuan-dat-luxury-hotel-flc/hotel/thanh-hoa-sam-son-beach-vn.html' },
                      { name: 'Traveloka', url: 'https://www.traveloka.com/vi-vn/hotel/vietnam/tuan-dat-luxury-hotel-flc-9000000987051' },
                      { name: 'Trip.com', url: 'https://vn.trip.com/hotels/sam-son-hotel-detail-79078975/tuan-dat-luxury-hotel-flc/' },
                    ].map(ota => (
                      <a
                        key={ota.name}
                        href={ota.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary bg-secondary/50 hover:bg-secondary rounded-lg py-2.5 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" /> {ota.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default RoomDetail;
