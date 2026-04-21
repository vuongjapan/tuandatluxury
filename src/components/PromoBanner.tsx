import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const PromoBanner = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  const bullets = isVi
    ? [
        'Đặt trực tiếp: rẻ hơn Booking & Agoda',
        '2 đêm: Miễn phí bữa sáng cho 2 khách',
        'Đặt sớm 30 ngày: Giảm thêm 10% giá phòng',
        'Khách thành viên VIP: Ưu tiên phòng đẹp',
      ]
    : [
        'Book direct: cheaper than Booking & Agoda',
        '2 nights: Free breakfast for 2 guests',
        'Book 30 days early: Extra 10% off',
        'VIP members: Priority best rooms',
      ];

  return (
    <section
      className="w-full relative overflow-hidden animate-[promo-fade_0.5s_ease-out_0.3s_both]"
      style={{
        background: 'linear-gradient(90deg, #1B3A5C 0%, #0D2137 100%)',
      }}
    >
      <style>{`@keyframes promo-fade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      <div className="flex flex-col md:flex-row items-stretch min-h-[200px] md:min-h-[140px] md:h-[140px]">
        {/* LEFT - Image (desktop only) */}
        <div className="hidden md:block relative w-1/4 h-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80"
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, #1B3A5C 0%, rgba(27,58,92,0.6) 50%, transparent 100%)',
            }}
          />
        </div>

        {/* MIDDLE - Content */}
        <div className="flex-1 md:w-1/2 flex flex-col justify-center px-4 md:px-8 py-4">
          <h3
            className="font-semibold mb-2 md:mb-3"
            style={{
              color: '#C9A84C',
              fontSize: '15px',
              letterSpacing: '1px',
            }}
          >
            {isVi ? 'Ở CÀNG NHIỀU — ƯU ĐÃI CÀNG CAO' : 'STAY MORE — SAVE MORE'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
            {bullets.map((b, i) => (
              <div key={i} className="flex items-start gap-2 text-white text-[13px] leading-snug">
                <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: '#C9A84C' }} />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT - CTA */}
        <div className="md:w-1/4 flex md:flex-col items-center justify-center gap-3 px-4 py-4 md:py-0">
          <span
            className="inline-block px-3 py-1 rounded-full font-semibold"
            style={{
              background: '#C9A84C',
              color: '#1B3A5C',
              fontSize: '11px',
              letterSpacing: '0.5px',
            }}
          >
            {isVi ? 'ƯU ĐÃI HÈ 2025' : 'SUMMER 2025'}
          </span>
          <button
            onClick={() => navigate('/khuyen-mai')}
            className="border border-white text-white text-sm px-5 py-2 rounded-full hover:bg-white hover:text-[#1B3A5C] transition-colors duration-200"
          >
            {isVi ? 'Xem chi tiết →' : 'View details →'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;
