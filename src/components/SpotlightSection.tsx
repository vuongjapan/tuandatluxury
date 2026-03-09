import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const spotlights = [
  {
    titleVi: 'Phòng nghỉ đẳng cấp',
    titleEn: 'Exceptional Rooms',
    descVi: '6 tầng với hơn 19 phòng nghỉ thiết kế hiện đại, đầy đủ điều hòa, TV, minibar, ban công. View biển và khu nghỉ dưỡng FLC 5 sao.',
    descEn: '6 floors with 19+ modern rooms equipped with AC, TV, minibar, balcony. Sea view and FLC 5-star resort grounds.',
    icon: '🏨',
    href: '/#rooms',
  },
  {
    titleVi: 'Nhà hàng & Rooftop Bar',
    titleEn: 'Restaurant & Rooftop Bar',
    descVi: '2 nhà hàng (tầng 1 & 2) phục vụ hải sản tươi sống Sầm Sơn, món Việt và quốc tế. Bar-Coffee sân thượng tầng 6 ngắm biển.',
    descEn: '2 restaurants (floors 1 & 2) serving fresh Sầm Sơn seafood, Vietnamese & international cuisine. Rooftop bar on floor 6 with sea views.',
    icon: '🍽️',
    href: '/dining',
  },
  {
    titleVi: 'Hồ bơi vô cực & Biển',
    titleEn: 'Infinity Pool & Beach',
    descVi: 'Bể bơi vô cực miễn phí view biển trong khuôn viên FLC. Bãi biển Sầm Sơn chỉ cách 50m, đưa đón xe điện miễn phí.',
    descEn: 'Free infinity pool with sea view inside FLC resort. Sầm Sơn beach just 50m away, free electric shuttle.',
    icon: '🏖️',
    href: '/#services',
  },
  {
    titleVi: 'Karaoke & Giải trí',
    titleEn: 'Karaoke & Entertainment',
    descVi: 'Hệ thống karaoke miễn phí với sân khấu ánh sáng. Xe đạp đôi miễn phí dạo quanh khu FLC, phòng xông hơi, gym.',
    descEn: 'Free karaoke with stage lighting. Free tandem bikes to explore FLC resort, sauna, gym.',
    icon: '🎤',
    href: '/#services',
  },
  {
    titleVi: 'Tham quan FLC 5 sao',
    titleEn: 'FLC 5-Star Resort Access',
    descVi: 'Miễn phí vé tham quan toàn bộ khu nghỉ dưỡng FLC Sầm Sơn 5 sao: công viên, sân golf, khu vui chơi cho trẻ em.',
    descEn: 'Free access to the entire FLC Sầm Sơn 5-star resort: parks, golf course, kids playground.',
    icon: '⛳',
    href: '/#about',
  },
  {
    titleVi: 'Điểm tham quan lân cận',
    titleEn: 'Nearby Attractions',
    descVi: 'Gần Quảng trường biển, công viên nước, đền Độc Cước, hòn Trống Mái, chợ Cột Đỏ — chỉ vài phút di chuyển.',
    descEn: 'Near Sea Square, water park, Độc Cước Temple, Trống Mái rock, Cột Đỏ market — just minutes away.',
    icon: '🗺️',
    href: '/#contact',
  },
];

const SpotlightSection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  return (
    <section className="py-16 sm:py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-primary font-display text-sm tracking-[0.25em] uppercase mb-2">
            {isVi ? 'Điểm nhấn' : 'In The Spotlight'}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            {isVi ? 'Trải nghiệm đặc biệt' : 'Special Experiences'}
          </h2>
          <div className="w-20 h-[2px] bg-primary mx-auto" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {spotlights.map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              onClick={(e) => {
                if (item.href.startsWith('/') && !item.href.startsWith('/#')) {
                  e.preventDefault();
                  navigate(item.href);
                }
              }}
              className="group bg-card rounded-xl p-6 text-center border border-border shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <span className="text-4xl sm:text-5xl block mb-4 group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </span>
              <h3 className="font-display text-base sm:text-lg font-semibold text-foreground mb-2">
                {isVi ? item.titleVi : item.titleEn}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isVi ? item.descVi : item.descEn}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpotlightSection;
