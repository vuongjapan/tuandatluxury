import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import LazyImage from '@/components/LazyImage';

interface MediaItem {
  url: string;
  caption?: string;
}

const FALLBACK_HERO =
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1800&q=85';

const FALLBACK_GALLERY: MediaItem[] = [
  { url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=900&q=80', caption: 'Hải sản tươi' },
  { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80', caption: 'Không gian nhà hàng' },
  { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80', caption: 'Bữa tiệc nhóm' },
  { url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=900&q=80', caption: 'Rooftop Bar' },
];

const RestaurantSection = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  const [heroImage, setHeroImage] = useState<string>(FALLBACK_HERO);
  const [gallery, setGallery] = useState<MediaItem[]>(FALLBACK_GALLERY);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('page_sections')
          .select('slideshow, gallery')
          .eq('section_key', 'home_food')
          .maybeSingle();
        if (!data) return;

        const slideshow = (data.slideshow as any[]) || [];
        if (Array.isArray(slideshow) && slideshow.length > 0) {
          const first = slideshow[0];
          const url = typeof first === 'string' ? first : first?.url;
          if (url) setHeroImage(url);
        }

        const gal = (data.gallery as any[]) || [];
        if (Array.isArray(gal) && gal.length > 0) {
          setGallery(
            gal.slice(0, 4).map((g: any) => ({
              url: typeof g === 'string' ? g : g.url,
              caption: typeof g === 'string' ? '' : g.caption || g.title || '',
            })),
          );
        } else if (Array.isArray(slideshow) && slideshow.length >= 4) {
          setGallery(
            slideshow.slice(0, 4).map((s: any) => ({
              url: typeof s === 'string' ? s : s.url,
              caption: typeof s === 'string' ? '' : s.caption || s.title || '',
            })),
          );
        }
      } catch {
        // keep fallbacks
      }
    })();
  }, []);

  const captions = isVi
    ? ['Hải sản tươi', 'Không gian nhà hàng', 'Bữa tiệc nhóm', 'Rooftop Bar']
    : ['Fresh seafood', 'Restaurant space', 'Group dining', 'Rooftop Bar'];

  const stats = [
    { num: '120+', label: isVi ? 'Món ăn' : 'Dishes' },
    { num: '07:00', label: isVi ? 'Mở cửa' : 'Opens' },
    { num: '200', label: isVi ? 'Chỗ ngồi' : 'Seats' },
  ];

  return (
    <section id="restaurant" className="relative overflow-hidden full-bleed bg-foreground">
      {/* HERO */}
      <div className="relative h-[70vh] min-h-[500px]">
        <LazyImage
          src={heroImage}
          alt={isVi ? 'Ẩm thực Tuấn Đạt' : 'Tuấn Đạt Dining'}
          wrapperClassName="absolute inset-0 w-full h-full"
          className="w-full h-full object-cover"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />

        {/* Text overlay */}
        <div className="absolute inset-0 flex items-center">
          <div className="section-container w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-px bg-[#C9A84C]" />
              <span className="text-[#C9A84C] text-xs sm:text-sm tracking-[4px] uppercase font-medium">
                {isVi ? 'Ẩm Thực' : 'Dining'}
              </span>
            </div>

            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-white leading-tight mb-6 max-w-lg">
              {isVi ? (
                <>
                  Hương Vị
                  <br />
                  <span className="text-[#C9A84C]">Biển Sầm Sơn</span>
                </>
              ) : (
                <>
                  Flavors of
                  <br />
                  <span className="text-[#C9A84C]">Sầm Sơn Sea</span>
                </>
              )}
            </h2>

            <p className="text-white/75 text-base sm:text-lg max-w-md mb-8 leading-relaxed">
              {isVi
                ? 'Hải sản tươi đánh bắt mỗi ngày. 120+ món từ hải sản, thịt, rau, lẩu.'
                : 'Fresh seafood caught daily. 120+ dishes from seafood, meat, vegetables, hotpot.'}
            </p>

            <div className="flex flex-wrap gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/nha-hang')}
                className="bg-[#C9A84C] text-black px-6 sm:px-8 py-3 font-semibold hover:bg-[#B8960C] transition-all tracking-wide"
              >
                {isVi ? 'Xem thực đơn →' : 'View Menu →'}
              </button>
              <button
                onClick={() => navigate('/nha-hang#dat-ban')}
                className="border border-white/60 text-white px-6 sm:px-8 py-3 font-medium hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all tracking-wide"
              >
                {isVi ? 'Đặt bàn ngay' : 'Book a Table'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats box — bottom right */}
        <div className="absolute bottom-0 right-0 bg-[#C9A84C] text-black grid grid-cols-3 w-full sm:w-auto sm:max-w-[420px]">
          {stats.map((s, i) => (
            <div
              key={i}
              className="py-4 sm:py-5 px-3 sm:px-6 text-center border-r border-black/20 last:border-0 min-w-[110px]"
            >
              <div className="text-xl sm:text-2xl font-bold font-display">{s.num}</div>
              <div className="text-[10px] sm:text-xs font-medium tracking-widest uppercase mt-1 opacity-80">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GALLERY 4 ảnh */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        {gallery.slice(0, 4).map((item, i) => (
          <div
            key={i}
            className="relative aspect-square overflow-hidden group cursor-pointer"
            onClick={() => navigate('/nha-hang')}
          >
            <LazyImage
              src={item.url}
              alt={item.caption || captions[i]}
              wrapperClassName="absolute inset-0 w-full h-full"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/55 transition-all duration-300 flex items-end overflow-hidden">
              <div className="p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white font-medium text-sm sm:text-base">
                  {item.caption || captions[i]}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RestaurantSection;
