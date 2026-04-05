import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

interface DiningCategory {
  id: string;
  name_vi: string;
  name_en: string;
  image_url: string | null;
  is_active: boolean;
}

const DiningHomeSection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  const { data: categories = [] } = useQuery({
    queryKey: ['dining-categories-home'],
    queryFn: async () => {
      const { data } = await supabase
        .from('dining_categories')
        .select('id, name_vi, name_en, image_url, is_active')
        .eq('is_active', true)
        .order('sort_order');
      return (data || []) as DiningCategory[];
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section id="dining" className="py-20 sm:py-28 bg-secondary luxury-section">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-primary font-display text-xs sm:text-sm tracking-[0.35em] uppercase mb-3">
            {isVi ? 'Ẩm thực' : 'Cuisine'}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-5">
            {isVi ? 'Trải nghiệm ẩm thực' : 'Culinary Experience'}
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-primary/70" />
            <div className="w-2 h-2 rounded-full bg-primary/70" />
            <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-primary/70" />
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 max-w-5xl mx-auto mb-12">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              viewport={{ once: true }}
              onClick={() => navigate('/dining')}
              className="cursor-pointer group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-luxury hover:-translate-y-2 transition-all duration-500 border border-border"
            >
              {cat.image_url && (
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={cat.image_url}
                    alt={cat.name_vi}
                    className="w-full h-full object-cover img-zoom"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                </div>
              )}
              <div className="p-3 sm:p-4 text-center">
                <h3 className="font-display text-sm sm:text-base font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300">
                  {isVi ? cat.name_vi : (cat.name_en || cat.name_vi)}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button variant="gold" size="lg" onClick={() => navigate('/dining')} className="gap-2 group/btn">
            <UtensilsCrossed className="h-4 w-4" />
            {isVi ? 'Khám phá thực đơn' : 'Explore Menu'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default DiningHomeSection;
