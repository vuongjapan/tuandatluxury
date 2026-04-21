import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, ChevronLeft, ChevronRight, ZoomIn, Plus } from 'lucide-react';
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

const CATEGORIES: { id: GalleryCategory; vi: string; en: string; ja: string; zh: string }[] = [
  { id: 'featured', vi: 'Nổi bật', en: 'Featured', ja: '注目', zh: '精选' },
  { id: 'rooms', vi: 'Hạng phòng', en: 'Rooms', ja: '客室', zh: '房间' },
  { id: 'restaurant', vi: 'Nhà hàng & Ẩm thực', en: 'Restaurant & Dining', ja: 'レストラン', zh: '餐厅' },
  { id: 'wellness', vi: 'Chăm sóc sức khỏe', en: 'Wellness & Spa', ja: 'ウェルネス', zh: '健康' },
  { id: 'entertainment', vi: 'Vui chơi giải trí', en: 'Entertainment', ja: 'エンタメ', zh: '娱乐' },
];

const PAGE_SIZE = 8;

const PhotoGallery = () => {
  const { language } = useLanguage();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>('featured');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const isVi = language === 'vi';

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
    const handleFocus = () => void fetchImages();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const filtered = images.filter(img => img.category === activeCategory);
  const visible = filtered.slice(0, visibleCount);

  // Reset visible count when changing category
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [activeCategory]);

  const getCategoryLabel = (cat: typeof CATEGORIES[0]) => {
    const map: Record<string, string> = { vi: cat.vi, en: cat.en, ja: cat.ja, zh: cat.zh };
    return map[language] || cat.en;
  };

  const getTitle = (img: GalleryImage) =>
    isVi ? (img.title_vi || img.title_en || '') : (img.title_en || img.title_vi || '');

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prevImage = useCallback(
    () => setLightboxIndex(i => (i !== null ? (i - 1 + filtered.length) % filtered.length : null)),
    [filtered.length]
  );
  const nextImage = useCallback(
    () => setLightboxIndex(i => (i !== null ? (i + 1) % filtered.length : null)),
    [filtered.length]
  );

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, closeLightbox, prevImage, nextImage]);

  if (loading) {
    return (
      <section id="gallery" className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse h-8 bg-muted rounded w-48 mx-auto mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (images.length === 0) return null;

  return (
    <section id="gallery" className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <p className="font-display text-[11px] sm:text-xs font-medium mb-3" style={{ color: '#C9A84C', letterSpacing: '3px' }}>
            {isVi ? 'THƯ VIỆN' : 'GALLERY'}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-4" style={{ color: '#1B3A5C' }}>
            {isVi ? 'Hình Ảnh Khách Sạn' : 'Hotel Gallery'}
          </h2>
          <div className="mx-auto" style={{ width: 50, height: 2, background: '#C9A84C' }} />
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 sm:mb-10">
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium transition-all duration-200"
                style={{
                  borderRadius: 20,
                  background: active ? '#C9A84C' : 'transparent',
                  color: active ? '#FFFFFF' : '#1B3A5C',
                  border: active ? '0.5px solid #C9A84C' : '0.5px solid #C9A84C',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = '#FAF8F3';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                {getCategoryLabel(cat)}
              </button>
            );
          })}
        </div>

        {/* Equal-column grid — đồng đều trên mọi breakpoint */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
          >
            {visible.map((img, i) => (
              <div
                key={img.id}
                onClick={() => setLightboxIndex(i)}
                className="group relative overflow-hidden cursor-pointer"
              >
                <img
                  src={optimizeImageUrl(img.image_url, { width: 800, quality: 78 })}
                  alt={getTitle(img)}
                  className="w-full block transition-transform duration-500 group-hover:scale-105"
                  style={{ height: 'clamp(220px, 22vw, 280px)', objectFit: 'cover' }}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                />
                {/* Navy overlay on hover */}
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'rgba(27,58,92,0.45)' }}
                >
                  <div className="bg-white/90 rounded-full p-3 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                    <ZoomIn className="h-5 w-5" style={{ color: '#1B3A5C' }} />
                  </div>
                </div>
                {getTitle(img) && (
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white text-sm font-medium truncate drop-shadow">{getTitle(img)}</p>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            {isVi ? 'Chưa có ảnh trong danh mục này' : 'No images in this category'}
          </p>
        )}

        {/* Load more */}
        {visibleCount < filtered.length && (
          <div className="text-center mt-10">
            <button
              onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-200 hover:shadow-md"
              style={{
                borderRadius: 24,
                background: '#C9A84C',
                color: '#FFFFFF',
              }}
            >
              <Plus className="h-4 w-4" />
              {isVi ? 'Tải thêm ảnh' : 'Load more photos'}
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && filtered[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.92)' }}
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white/80 hover:text-white z-10 p-2"
              aria-label="Close"
            >
              <X className="h-7 w-7" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 text-white/80 hover:text-white z-10 p-2"
              aria-label="Previous"
            >
              <ChevronLeft className="h-10 w-10" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 text-white/80 hover:text-white z-10 p-2"
              aria-label="Next"
            >
              <ChevronRight className="h-10 w-10" />
            </button>
            <motion.img
              key={filtered[lightboxIndex].id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              src={optimizeImageUrl(filtered[lightboxIndex].image_url, { width: 1600, quality: 88 })}
              alt={getTitle(filtered[lightboxIndex])}
              className="max-h-[85vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
            />
            <div className="absolute bottom-6 left-0 right-0 text-center">
              {getTitle(filtered[lightboxIndex]) && (
                <p className="text-white text-base font-medium mb-1">{getTitle(filtered[lightboxIndex])}</p>
              )}
              <p className="text-white/60 text-xs">
                {lightboxIndex + 1} / {filtered.length}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default PhotoGallery;
