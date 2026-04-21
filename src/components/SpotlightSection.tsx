import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const spotlights = [
  {
    titleVi: 'Phòng nghỉ đẳng cấp',
    titleEn: 'Exceptional Rooms',
    descVi: '6 tầng với hơn 19 phòng nghỉ thiết kế hiện đại, đầy đủ điều hòa, TV, minibar, ban công view biển.',
    descEn: '6 floors with 19+ modern rooms: AC, TV, minibar, private balcony with sea & resort views.',
    icon: '🏨',
    href: '/#rooms',
    highlight: true,
  },
  {
    titleVi: 'Nhà hàng & Rooftop Bar',
    titleEn: 'Restaurant & Rooftop Bar',
    descVi: '2 nhà hàng (tầng 1 & 2) phục vụ hải sản tươi sống Sầm Sơn. Bar sân thượng tầng 6 ngắm biển.',
    descEn: 'Two restaurants serving fresh Sầm Sơn seafood. Rooftop bar on floor 6 with panoramic views.',
    icon: '🍽️',
    href: '/dining',
  },
  {
    titleVi: 'Hồ bơi vô cực & Bãi biển',
    titleEn: 'Infinity Pool & Beach',
    descVi: 'Bể bơi vô cực miễn phí view biển trong FLC. Bãi biển chỉ cách 50m với xe điện đưa đón.',
    descEn: 'Free infinity pool with sea view. Beach just 50m away with complimentary electric shuttle.',
    icon: '🏖️',
    href: '/#services',
  },
  {
    titleVi: 'Karaoke & Giải trí',
    titleEn: 'Entertainment',
    descVi: 'Karaoke miễn phí với sân khấu ánh sáng, xe đạp đôi, phòng xông hơi, gym trong FLC.',
    descEn: 'Free karaoke with stage lighting, tandem bikes, sauna, and gym access inside FLC resort.',
    icon: '🎤',
    href: '/#services',
  },
  {
    titleVi: 'FLC 5 sao Resort',
    titleEn: 'FLC 5-Star Access',
    descVi: 'Miễn phí tham quan khu nghỉ dưỡng FLC 5 sao: công viên, sân golf, kids playground.',
    descEn: 'Free access to FLC 5-star resort: parks, golf course, kids playground & more.',
    icon: '⛳',
    href: '/#about',
    highlight: true,
  },
  {
    titleVi: 'Điểm đến lân cận',
    titleEn: 'Nearby Attractions',
    descVi: 'Gần Quảng trường biển, công viên nước, đền Độc Cước, hòn Trống Mái chỉ vài phút.',
    descEn: 'Near Sea Square, water park, Độc Cước Temple, Trống Mái rock — minutes away.',
    icon: '🗺️',
    href: '/#contact',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const SpotlightSection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  return (
    <section className="py-20 sm:py-28 bg-secondary relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="section-container">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 sm:mb-18"
        >
          <p className="text-primary font-display text-xs sm:text-sm tracking-[0.35em] uppercase mb-3">
            {isVi ? 'Điểm nhấn' : 'In The Spotlight'}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-5">
            {isVi ? 'Trải nghiệm đặc biệt' : 'Special Experiences'}
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-primary/70" />
            <div className="w-2 h-2 rounded-full bg-primary/70" />
            <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-primary/70" />
          </div>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-6xl mx-auto"
        >
          {spotlights.map((item, idx) => (
            <motion.a
              key={idx}
              variants={cardVariants}
              href={item.href}
              onClick={(e) => {
                if (item.href.startsWith('/') && !item.href.startsWith('/#')) {
                  e.preventDefault();
                  navigate(item.href);
                }
              }}
              className={`
                group relative bg-card rounded-2xl p-6 sm:p-7 text-center
                border shadow-card hover:shadow-card-hover transition-all duration-300
                hover:-translate-y-1 cursor-pointer overflow-hidden
                ${item.highlight
                  ? 'border-primary/30 bg-gradient-to-br from-card to-primary/5'
                  : 'border-border'}
              `}
            >
              {/* Highlight badge */}
              {item.highlight && (
                <div className="absolute top-3 right-3 px-2 py-0.5 bg-primary/15 rounded text-[10px] text-primary font-semibold tracking-wider uppercase">
                  {isVi ? 'Nổi bật' : 'Featured'}
                </div>
              )}

              {/* Icon with animation */}
              <span className="text-4xl sm:text-5xl block mb-4 group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </span>

              {/* Title */}
              <h3 className="font-display text-base sm:text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {isVi ? item.titleVi : item.titleEn}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isVi ? item.descVi : item.descEn}
              </p>

              {/* Hover underline */}
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default SpotlightSection;
