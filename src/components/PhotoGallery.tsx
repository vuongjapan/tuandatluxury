import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { optimizeImageUrl } from '@/lib/optimizeImage';

type GalleryCategory = 'featured' | 'rooms' | 'restaurant' | 'wellness' | 'entertainment';

interface GalleryImage {
  id: string;
  category: GalleryCategory;
  title_vi: string | null;
  title_en: string | null;
  description_vi: string | null;
  description_en: string | null;
  image_url: string;
  sort_order: number;
}

const CATEGORIES: { id: GalleryCategory; vi: string; en: string; ja: string; zh: string; emoji: string }[] = [
  { id: 'featured', vi: 'Nổi bật', en: 'Featured', ja: '注目', zh: '精选', emoji: '⭐' },
  { id: 'rooms', vi: 'Hạng phòng', en: 'Rooms', ja: '客室', zh: '房间', emoji: '🛏️' },
  { id: 'restaurant', vi: 'Nhà hàng & Ẩm thực', en: 'Restaurant & Dining', ja: 'レストラン', zh: '餐厅', emoji: '🍽️' },
  { id: 'wellness', vi: 'Chăm sóc sức khỏe', en: 'Wellness & Spa', ja: 'ウェルネス', zh: '健康', emoji: '💆' },
  { id: 'entertainment', vi: 'Vui chơi giải trí', en: 'Entertainment', ja: 'エンタメ', zh: '娱乐', emoji: '🏖️' },
];

const PhotoGallery = () => {
  const { language, t } = useLanguage();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>('featured');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data } = await supabase
          .from('gallery_images')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        setImages(Array.isArray(data) ? (data as GalleryImage[]) : []);
      } catch (error) {
        console.warn('Failed to fetch gallery images:', error);
        setImages([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchImages();

    const handleFocus = () => {
      void fetchImages();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const filtered = images.filter(img => img.category === activeCategory);

  const getCategoryLabel = (cat: typeof CATEGORIES[0]) => {
    const map: Record<string, string> = { vi: cat.vi, en: cat.en, ja: cat.ja, zh: cat.zh };
    return map[language] || cat.en;
  };

  const getTitle = (img: GalleryImage) => {
    if (language === 'vi') return img.title_vi || img.title_en || '';
    return img.title_en || img.title_vi || '';
  };

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () => setLightboxIndex(i => (i !== null ? (i - 1 + filtered.length) % filtered.length : null));
  const nextImage = () => setLightboxIndex(i => (i !== null ? (i + 1) % filtered.length : null));

  if (loading) {
    return (
      <section id="gallery" className="py-12 sm:py-20 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <div className="space-y-4">
            <div className="animate-pulse h-8 bg-muted rounded w-48 mx-auto" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[4/3] bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (images.length === 0) return null;

  return (
    <section id="gallery" className="py-12 sm:py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">{t('nav.gallery')}</h2>
          <div className="w-20 h-1 bg-gold-gradient mx-auto rounded-full" />
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-6 sm:mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200 ${
                activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border'
              }`}
            >
              <span className="mr-1">{cat.emoji}</span>
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* Gallery grid - no animation for performance */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((img, i) => (
            <div
              key={img.id}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer shadow-card hover:shadow-card-hover transition-shadow duration-300"
              onClick={() => openLightbox(i)}
            >
              <img
                src={optimizeImageUrl(img.image_url, { width: 480, quality: 70 })}
                alt={getTitle(img)}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {getTitle(img) && (
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-primary-foreground text-sm font-medium truncate">{getTitle(img)}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Chưa có ảnh trong danh mục này</p>
        )}
      </div>

      {/* Lightbox - keep animation only here */}
      <AnimatePresence>
        {lightboxIndex !== null && filtered[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button onClick={closeLightbox} className="absolute top-4 right-4 text-primary-foreground/80 hover:text-primary-foreground z-10">
              <X className="h-8 w-8" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 text-primary-foreground/80 hover:text-primary-foreground z-10"
            >
              <ChevronLeft className="h-10 w-10" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 text-primary-foreground/80 hover:text-primary-foreground z-10"
            >
              <ChevronRight className="h-10 w-10" />
            </button>
            <img
              src={optimizeImageUrl(filtered[lightboxIndex].image_url, { width: 1280, quality: 85 })}
              alt={getTitle(filtered[lightboxIndex])}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
            />
            {getTitle(filtered[lightboxIndex]) && (
              <div className="absolute bottom-6 text-center">
                <p className="text-primary-foreground text-lg font-medium">{getTitle(filtered[lightboxIndex])}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default PhotoGallery;
