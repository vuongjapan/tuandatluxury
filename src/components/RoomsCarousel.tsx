import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Wifi, Users, Maximize2, Eye, ArrowRight } from 'lucide-react';
import SmartImage from '@/components/SmartImage';
import RoomDetailPopup from '@/components/RoomDetailPopup';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRoomPopupSettings } from '@/hooks/useRoomPopupSettings';
import type { Room } from '@/data/rooms';

interface RoomsCarouselProps {
  rooms: Room[];
}

const VinpearlRoomCard = memo(function VinpearlRoomCard({ room, index }: { room: Room; index: number }) {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const navigate = useNavigate();
  const { byRoomId } = useRoomPopupSettings();
  const popup = byRoomId.get(room.id);
  const [open, setOpen] = useState(false);

  const badgeText = isVi ? popup?.badge_vi : popup?.badge_en;
  const priceFmt = new Intl.NumberFormat('vi-VN').format(room.priceVND);

  return (
    <>
      <article
        className="group flex-shrink-0 w-[85vw] sm:w-[320px] lg:w-[380px] snap-start bg-card rounded-xl border border-border/60 overflow-hidden hover:shadow-luxury hover:-translate-y-1 transition-all duration-300 flex flex-col"
        style={{ scrollSnapAlign: 'start' }}
      >
        {/* Image */}
        <div className="relative h-[240px] overflow-hidden">
          <SmartImage
            src={room.image}
            alt={room.name[language]}
            wrapperClassName="w-full h-full"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            eager={index < 2}
          />
          {badgeText && (
            <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-[11px] font-semibold px-2.5 py-1 rounded-br-lg uppercase tracking-wider">
              {badgeText}
            </div>
          )}
          <button
            onClick={() => setOpen(true)}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm text-foreground px-3 py-1.5 rounded-full text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-background"
          >
            🔍 {isVi ? 'Xem ảnh' : 'View photos'}
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex-1 flex flex-col">
          <h3 className="font-display text-xl font-medium text-foreground mb-1.5 line-clamp-1">
            {room.name[language]}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3 min-h-[2.6rem]">
            {room.description[language] || `${room.bedType} · ${room.viewType}`}
          </p>

          {/* Mini amenities */}
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-3">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Wifi className="h-3.5 w-3.5" /> WiFi
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> {room.capacity} {isVi ? 'khách' : 'guests'}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Maximize2 className="h-3.5 w-3.5" /> {room.size}m²
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5" /> {room.viewType.split(' ').slice(-2).join(' ')}
            </span>
          </div>

          <div className="border-t border-border/60 my-2" />

          {/* Price + CTA */}
          <div className="flex items-end justify-between gap-2 mt-auto pt-1">
            <div className="flex flex-col">
              <span className="text-[11px] text-muted-foreground">{isVi ? 'Từ' : 'From'}</span>
              <span className="font-display text-[22px] font-bold text-primary leading-tight">
                {priceFmt}đ
                <span className="text-xs font-normal text-muted-foreground ml-0.5">
                  /{isVi ? 'đêm' : 'night'}
                </span>
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(true)}
              className="border-foreground/30 text-foreground hover:bg-foreground hover:text-background transition-colors gap-1"
            >
              {isVi ? 'Chi tiết' : 'Details'}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </article>

      <RoomDetailPopup room={room} open={open} onOpenChange={setOpen} />
    </>
  );
});

const RoomsCarousel = ({ rooms }: RoomsCarouselProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isVi = t('nav.rooms') === 'Hạng phòng';
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [progress, setProgress] = useState(0);

  const updateState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
    setProgress(max > 0 ? (el.scrollLeft / max) * 100 : 0);
  }, []);

  useEffect(() => {
    updateState();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateState, { passive: true });
    window.addEventListener('resize', updateState);
    return () => {
      el.removeEventListener('scroll', updateState);
      window.removeEventListener('resize', updateState);
    };
  }, [updateState, rooms.length]);

  // Drag-to-scroll
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let moved = false;

    const onDown = (e: MouseEvent) => {
      isDown = true;
      moved = false;
      el.style.cursor = 'grabbing';
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };
    const onLeave = () => { isDown = false; el.style.cursor = 'grab'; };
    const onUp = () => { isDown = false; el.style.cursor = 'grab'; };
    const onMove = (e: MouseEvent) => {
      if (!isDown) return;
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.2;
      if (Math.abs(walk) > 5) moved = true;
      if (moved) {
        e.preventDefault();
        el.scrollLeft = scrollLeft - walk;
      }
    };
    const onClickCapture = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };

    el.style.cursor = 'grab';
    el.addEventListener('mousedown', onDown);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('mouseup', onUp);
    el.addEventListener('mousemove', onMove);
    el.addEventListener('click', onClickCapture, true);
    return () => {
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('mouseleave', onLeave);
      el.removeEventListener('mouseup', onUp);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('click', onClickCapture, true);
    };
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 420, behavior: 'smooth' });
  };

  return (
    <section id="rooms" className="py-16 sm:py-24 bg-background">
      <div className="section-container">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <p className="text-primary font-display text-[11px] tracking-[0.35em] uppercase mb-2 font-medium">
              {isVi ? 'Hạng phòng' : 'Accommodation'}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl md:text-[32px] font-semibold text-foreground tracking-tight">
              {isVi ? 'Các hạng phòng' : 'Our Rooms'}
            </h2>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <button
              onClick={() => navigate('/booking')}
              className="hidden sm:inline text-primary text-sm hover:underline underline-offset-4 transition"
            >
              {isVi ? 'Xem tất cả' : 'View all'} →
            </button>
            <div className="flex items-center gap-2">
              <button
                aria-label="Previous"
                onClick={() => scrollBy(-1)}
                disabled={!canPrev}
                className="w-9 h-9 rounded-full border border-border bg-background flex items-center justify-center text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:text-foreground disabled:hover:border-border"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                aria-label="Next"
                onClick={() => scrollBy(1)}
                disabled={!canNext}
                className="w-9 h-9 rounded-full border border-border bg-background flex items-center justify-center text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:text-foreground disabled:hover:border-border"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={scrollerRef}
          className="rooms-carousel flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
          }}
        >
          <style>{`.rooms-carousel::-webkit-scrollbar{display:none}`}</style>
          {rooms.map((room, i) => (
            <VinpearlRoomCard key={room.id} room={room} index={i} />
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-5 h-[2px] w-full bg-border/60 rounded overflow-hidden">
          <div
            className="h-full bg-primary transition-[width] duration-150"
            style={{ width: `${Math.max(8, progress)}%` }}
          />
        </div>

        {/* Mobile "View all" */}
        <div className="text-center mt-8 sm:hidden">
          <Button variant="gold" size="lg" onClick={() => navigate('/booking')} className="gap-2 tracking-wider">
            {isVi ? 'Xem tất cả' : 'View all'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RoomsCarousel;
