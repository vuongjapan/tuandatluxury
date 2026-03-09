import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const spotlights = [
  {
    titleVi: 'Phòng nghỉ đẳng cấp',
    titleEn: 'Exceptional Rooms',
    descVi: 'Thiết kế hiện đại, tiện nghi sang trọng với view biển và núi tuyệt đẹp tại FLC Sầm Sơn.',
    descEn: 'Modern design, premium amenities with stunning sea and mountain views at FLC Sầm Sơn.',
    icon: '🏨',
    href: '/#rooms',
  },
  {
    titleVi: 'Ẩm thực tinh hoa',
    titleEn: 'Taste The World',
    descVi: 'Buffet sáng phong phú, đặc sản địa phương và các món ăn quốc tế do đầu bếp chuyên nghiệp chế biến.',
    descEn: 'Rich breakfast buffet, local specialties and international cuisine prepared by professional chefs.',
    icon: '🍽️',
    href: '/dining',
  },
  {
    titleVi: 'Hồ bơi & Biển',
    titleEn: 'Pool & Beach',
    descVi: 'Tận hưởng hồ bơi vô cực trong khuôn viên và bãi biển Sầm Sơn chỉ vài bước chân.',
    descEn: 'Enjoy the infinity pool on-site and Sầm Sơn beach just steps away.',
    icon: '🏖️',
    href: '/#services',
  },
  {
    titleVi: 'Dịch vụ tận tâm',
    titleEn: 'Attentive Service',
    descVi: 'Đội ngũ nhân viên chuyên nghiệp phục vụ 24/7, sẵn sàng đáp ứng mọi yêu cầu của quý khách.',
    descEn: 'Professional staff available 24/7, ready to fulfill every guest request.',
    icon: '🛎️',
    href: '/#services',
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
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
              className="group bg-card rounded-xl p-6 sm:p-8 text-center border border-border shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <span className="text-4xl sm:text-5xl block mb-4 group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </span>
              <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground mb-3">
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
