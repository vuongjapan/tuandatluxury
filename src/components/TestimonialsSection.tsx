import { Star, Quote, ExternalLink } from 'lucide-react';
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
  type: string;
  date: string;
  source: string;
}

const reviews: Review[] = [
  {
    name: 'Leong',
    origin: 'Việt Nam',
    rating: 9.2,
    titleVi: 'Kỳ nghỉ tuyệt vời với giá trị xuất sắc',
    titleEn: 'Wonderful vacation with excellent value',
    contentVi: 'Chúng tôi đã có một kỳ nghỉ tuyệt vời. Vị trí hoàn hảo, dễ dàng tiếp cận các điểm tham quan. Nhân viên khách sạn thân thiện và chu đáo. Sự sạch sẽ của phòng không tì vết. Trải nghiệm tổng thể vượt quá mong đợi.',
    contentEn: 'We had a wonderful vacation. Perfect location with easy access to attractions. Hotel staff were friendly and attentive. Room cleanliness was impeccable. The overall experience exceeded our expectations.',
    roomVi: 'Phòng Bốn Người Hướng Biển',
    roomEn: 'Family Sea View Room',
    type: 'family',
    date: '06/2024',
    source: 'Agoda',
  },
  {
    name: 'Minh Anh',
    origin: 'Hà Nội',
    rating: 9.6,
    titleVi: 'Phòng đẹp, view biển tuyệt vời',
    titleEn: 'Beautiful room, stunning sea view',
    contentVi: 'Phòng rộng rãi, sạch sẽ và view biển rất đẹp. Bể bơi trong khuôn viên FLC rất tuyệt cho trẻ em. Buffet sáng phong phú, nhân viên nhiệt tình. Sẽ quay lại lần sau!',
    contentEn: 'Spacious, clean rooms with beautiful sea views. The FLC pool area is great for kids. Rich breakfast buffet, enthusiastic staff. Will definitely come back!',
    roomVi: 'Phòng Loại Sang',
    roomEn: 'Deluxe Room',
    type: 'family',
    date: '07/2024',
    source: 'Booking.com',
  },
  {
    name: 'Thanh Hương',
    origin: 'TP. Hồ Chí Minh',
    rating: 10.0,
    titleVi: 'Dịch vụ xuất sắc, đáng từng đồng',
    titleEn: 'Excellent service, worth every penny',
    contentVi: 'Lần đầu đến Sầm Sơn và chọn đúng khách sạn. Giá rất hợp lý cho chất lượng nhận được. Nhân viên lễ tân rất nhiệt tình hướng dẫn, phòng thoáng mát. Đặc biệt ấn tượng với dịch vụ đưa đón bãi biển miễn phí.',
    contentEn: 'First time in Sầm Sơn and chose the right hotel. Very reasonable price for the quality. Reception staff were very helpful, rooms are airy. Especially impressed with the free beach shuttle service.',
    roomVi: 'Phòng Standard',
    roomEn: 'Standard Room',
    type: 'couple',
    date: '08/2024',
    source: 'Agoda',
  },
  {
    name: 'Nguyễn Văn Đức',
    origin: 'Đà Nẵng',
    rating: 9.4,
    titleVi: 'Nghỉ dưỡng gia đình hoàn hảo',
    titleEn: 'Perfect family getaway',
    contentVi: 'Đi cả gia đình 6 người, đặt 2 phòng liền kề rất tiện. Khuôn viên FLC rộng, nhiều hoạt động cho trẻ em. Ăn sáng buffet nhiều món, phù hợp cả người lớn và trẻ nhỏ. Rất hài lòng.',
    contentEn: 'Traveled with 6 family members, booked 2 adjacent rooms which was very convenient. FLC grounds are spacious with many activities for children. Breakfast buffet has many dishes suitable for adults and kids. Very satisfied.',
    roomVi: 'Phòng Suite Gia Đình',
    roomEn: 'Family Suite',
    type: 'family',
    date: '05/2024',
    source: 'Traveloka',
  },
];

const TestimonialsSection = () => {
  const { t } = useLanguage();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  const convertToStars = (rating: number) => Math.round((rating / 10) * 5);

  return (
    <section className="py-16 sm:py-24 bg-secondary">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-primary font-display text-sm tracking-[0.25em] uppercase mb-2">
            {isVi ? 'Đánh giá khách hàng' : 'Guest Reviews'}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            {isVi ? 'Khách hàng nói gì?' : 'What Our Guests Say'}
          </h2>
          <div className="w-20 h-[2px] bg-primary mx-auto mb-6" />

          {/* Overall rating badge */}
          <div className="inline-flex items-center gap-3 bg-card rounded-xl px-6 py-3 border border-border shadow-card">
            <span className="text-3xl sm:text-4xl font-bold text-primary">9.4</span>
            <div className="text-left">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className={`h-4 w-4 ${i <= 5 ? 'fill-primary text-primary' : 'text-muted'}`} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isVi ? 'Trên cả tuyệt vời • Agoda, Booking.com' : 'Exceptional • Agoda, Booking.com'}
              </p>
            </div>
          </div>
        </div>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {reviews.map((review, idx) => (
            <div
              key={idx}
              className="bg-card rounded-xl p-6 border border-border shadow-card hover:shadow-card-hover transition-shadow duration-300 relative"
            >
              {/* Quote icon */}
              <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/15" />

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-primary text-primary-foreground text-sm font-bold px-2 py-0.5 rounded">
                  {review.rating.toFixed(1)}
                </span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: convertToStars(review.rating) }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground ml-auto">{review.source}</span>
              </div>

              {/* Title */}
              <h4 className="font-display text-base font-semibold text-foreground mb-2">
                "{isVi ? review.titleVi : review.titleEn}"
              </h4>

              {/* Content */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                {isVi ? review.contentVi : review.contentEn}
              </p>

              {/* Author info */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{review.name}</p>
                    <p className="text-xs text-muted-foreground">{review.origin}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{isVi ? review.roomVi : review.roomEn}</p>
                  <p className="text-xs text-muted-foreground">{review.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA to OTA platforms */}
        <div className="text-center mt-10">
          <p className="text-sm text-muted-foreground mb-4">
            {isVi ? 'Xem thêm đánh giá trên các nền tảng' : 'See more reviews on'}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a
              href="https://www.booking.com/hotel/vn/tuan-dat-luxury-flc-sam-son-sam-son.vi.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-card border border-border px-4 py-2 rounded-full hover:border-primary hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3 w-3" /> Booking.com
            </a>
            <a
              href="https://www.agoda.com/vi-vn/tuan-dat-luxury-hotel-flc/hotel/thanh-hoa-sam-son-beach-vn.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-card border border-border px-4 py-2 rounded-full hover:border-primary hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3 w-3" /> Agoda
            </a>
            <a
              href="https://www.traveloka.com/vi-vn/hotel/vietnam/tuan-dat-luxury-hotel-flc-9000000987051"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-card border border-border px-4 py-2 rounded-full hover:border-primary hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3 w-3" /> Traveloka
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
