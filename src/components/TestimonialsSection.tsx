import { motion } from 'framer-motion';
import { Star, Quote, ExternalLink, ThumbsUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Review {
  name: string;
  origin: string;
  rating: number;
  titleVi: string;
  titleEn: string;
  contentVi: string;
  contentEn: string;
  roomVi: string;
  roomEn: string;
  date: string;
  source: string;
  avatar: string;
}

const reviews: Review[] = [
  {
    name: 'Minh Anh',
    origin: 'Hà Nội',
    rating: 9.6,
    titleVi: 'Phòng đẹp, view biển tuyệt vời',
    titleEn: 'Beautiful room, stunning sea view',
    contentVi: 'Phòng rộng rãi, sạch sẽ và view biển rất đẹp. Bể bơi trong khuôn viên FLC rất tuyệt cho trẻ em. Buffet sáng phong phú, nhân viên nhiệt tình. Sẽ quay lại lần sau!',
    contentEn: 'Spacious, clean rooms with beautiful sea views. The FLC pool area is great for kids. Rich breakfast buffet, enthusiastic staff. Will definitely come back!',
    roomVi: 'Phòng Deluxe',
    roomEn: 'Deluxe Room',
    date: '07/2024',
    source: 'Booking.com',
    avatar: 'M',
  },
  {
    name: 'Thanh Hương',
    origin: 'TP. Hồ Chí Minh',
    rating: 10.0,
    titleVi: 'Dịch vụ xuất sắc, đáng từng đồng',
    titleEn: 'Excellent service, worth every penny',
    contentVi: 'Lần đầu đến Sầm Sơn và chọn đúng khách sạn! Nhân viên lễ tân rất nhiệt tình. Đặc biệt ấn tượng với dịch vụ đưa đón bãi biển miễn phí và vé FLC 5 sao tặng kèm.',
    contentEn: 'First time in Sầm Sơn and chose the right hotel! Staff were very helpful. Especially impressed with the free beach shuttle and complimentary FLC 5-star access.',
    roomVi: 'Phòng Standard',
    roomEn: 'Standard Room',
    date: '08/2024',
    source: 'Agoda',
    avatar: 'T',
  },
  {
    name: 'Nguyễn Văn Đức',
    origin: 'Đà Nẵng',
    rating: 9.4,
    titleVi: 'Nghỉ dưỡng gia đình hoàn hảo',
    titleEn: 'Perfect family getaway',
    contentVi: 'Đi gia đình 6 người, đặt 2 phòng liền kề rất tiện. FLC rộng, nhiều hoạt động cho trẻ em. Ăn sáng buffet nhiều món, phù hợp cả người lớn và trẻ nhỏ. Rất hài lòng!',
    contentEn: 'Traveled with 6 family members, 2 adjacent rooms very convenient. FLC resort has many activities for children. Breakfast buffet with many choices. Very satisfied!',
    roomVi: 'Phòng Suite Gia Đình',
    roomEn: 'Family Suite',
    date: '05/2024',
    source: 'Traveloka',
    avatar: 'N',
  },
  {
    name: 'Leong',
    origin: 'Việt Nam',
    rating: 9.2,
    titleVi: 'Kỳ nghỉ tuyệt vời, vị trí hoàn hảo',
    titleEn: 'Wonderful stay, perfect location',
    contentVi: 'Vị trí hoàn hảo, dễ dàng tiếp cận các điểm tham quan. Nhân viên thân thiện và chu đáo. Sự sạch sẽ của phòng không tì vết. Trải nghiệm vượt quá mong đợi.',
    contentEn: 'Perfect location with easy access to attractions. Staff were friendly and attentive. Room cleanliness was impeccable. The overall experience exceeded expectations.',
    roomVi: 'Phòng Hướng Biển',
    roomEn: 'Sea View Room',
    date: '06/2024',
    source: 'Agoda',
    avatar: 'L',
  },
];

const sourceColors: Record<string, string> = {
  'Booking.com': 'bg-blue-100 text-blue-700',
  'Agoda': 'bg-red-100 text-red-700',
  'Traveloka': 'bg-green-100 text-green-700',
};

const TestimonialsSection = () => {
  const { t } = useLanguage();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  return (
    <section className="py-20 sm:py-28 bg-card relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: 'radial-gradient(hsl(43 74% 49%) 1px, transparent 1px)',
        backgroundSize: '32px 32px'
      }} />

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="text-primary font-display text-xs sm:text-sm tracking-[0.35em] uppercase mb-3">
            {isVi ? 'Đánh giá khách hàng' : 'Guest Reviews'}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-5">
            {isVi ? 'Khách hàng nói gì?' : 'What Our Guests Say'}
          </h2>
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-primary/70" />
            <div className="w-2 h-2 rounded-full bg-primary/70" />
            <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-primary/70" />
          </div>

          {/* Overall score */}
          <div className="inline-flex items-center gap-5 bg-secondary rounded-2xl px-7 py-4 border border-border shadow-card">
            <div className="text-center">
              <span className="font-display text-4xl sm:text-5xl font-bold text-primary">9.4</span>
              <p className="text-xs text-muted-foreground tracking-wide">/10</p>
            </div>
            <div className="w-[1px] h-12 bg-border" />
            <div className="text-left">
              <div className="flex items-center gap-0.5 mb-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm font-semibold text-foreground">
                {isVi ? 'Trên cả tuyệt vời' : 'Exceptional'}
              </p>
              <p className="text-xs text-muted-foreground">
                Agoda • Booking.com • Traveloka
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
              <ThumbsUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">
                {isVi ? '96% hài lòng' : '96% satisfied'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-5xl mx-auto mb-10">
          {reviews.map((review, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-background rounded-2xl p-6 border border-border shadow-card hover:shadow-card-hover transition-all duration-300 relative group"
            >
              <Quote className="absolute top-5 right-5 h-7 w-7 text-primary/10 group-hover:text-primary/20 transition-colors" />

              {/* Top: rating + source */}
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-primary text-primary-foreground text-sm font-bold px-2.5 py-0.5 rounded-lg">
                  {review.rating.toFixed(1)}
                </span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: Math.round((review.rating / 10) * 5) }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                  ))}
                </div>
                <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${sourceColors[review.source] || 'bg-muted text-muted-foreground'}`}>
                  {review.source}
                </span>
              </div>

              {/* Title */}
              <h4 className="font-display text-base sm:text-lg font-semibold text-foreground mb-2 leading-snug">
                "{isVi ? review.titleVi : review.titleEn}"
              </h4>

              {/* Content */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                {isVi ? review.contentVi : review.contentEn}
              </p>

              {/* Author */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {review.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{review.name}</p>
                    <p className="text-xs text-muted-foreground">{review.origin}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{isVi ? review.roomVi : review.roomEn}</p>
                  <p className="text-xs text-primary/70 font-medium">{review.date}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA links */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground mb-4">
            {isVi ? 'Xem thêm đánh giá trên các nền tảng đặt phòng' : 'See more reviews on booking platforms'}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {[
              { name: 'Booking.com', url: 'https://www.booking.com/hotel/vn/tuan-dat-luxury-flc-sam-son-sam-son.vi.html' },
              { name: 'Agoda', url: 'https://www.agoda.com/vi-vn/tuan-dat-luxury-hotel-flc/hotel/thanh-hoa-sam-son-beach-vn.html' },
              { name: 'Traveloka', url: 'https://www.traveloka.com/vi-vn/hotel/vietnam/tuan-dat-luxury-hotel-flc-9000000987051' },
            ].map((platform) => (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-background border border-border px-5 py-2.5 rounded-full hover:border-primary hover:text-primary transition-all duration-200 shadow-card hover:shadow-card-hover"
              >
                <ExternalLink className="h-3 w-3" />
                {platform.name}
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
