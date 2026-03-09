import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';
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
    <section id="dining" className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-4xl font-bold text-foreground mb-3">{t('nav.dining')}</h2>
          <div className="w-20 h-1 bg-gold-gradient mx-auto rounded-full" />
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto mb-10">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              viewport={{ once: true }}
              onClick={() => navigate('/dining')}
              className="cursor-pointer group bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 border border-border"
            >
              {cat.image_url && (
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={cat.image_url}
                    alt={cat.name_vi}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                </div>
              )}
              <div className="p-3 text-center">
                <h3 className="font-display text-sm font-semibold text-foreground line-clamp-2">
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
          <Button variant="gold" size="lg" onClick={() => navigate('/dining')}>
            <UtensilsCrossed className="h-4 w-4 mr-2" />
            {isVi ? 'Xem thực đơn' : 'View Menu'}
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default DiningHomeSection;
