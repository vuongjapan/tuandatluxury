import { ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const Seafood = () => {
  const { t } = useLanguage();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  const products = [
    { nameVi: 'Mực khô', nameEn: 'Dried Squid', descVi: 'Mực một nắng Sầm Sơn, thơm ngon, bảo quản lâu', descEn: 'Sun-dried Sầm Sơn squid, flavorful and long-lasting', emoji: '🦑' },
    { nameVi: 'Tôm khô', nameEn: 'Dried Shrimp', descVi: 'Tôm khô tự nhiên, giàu canxi, phù hợp làm quà', descEn: 'Natural dried shrimp, calcium-rich, perfect gift', emoji: '🦐' },
    { nameVi: 'Cá khô', nameEn: 'Dried Fish', descVi: 'Cá chỉ vàng, cá thu khô — đặc sản biển Thanh Hóa', descEn: 'Golden threadfin, dried mackerel — Thanh Hóa sea specialties', emoji: '🐟' },
    { nameVi: 'Ruốc biển', nameEn: 'Shrimp Paste', descVi: 'Ruốc tôm đặc biệt, vị đậm đà, chế biến thủ công', descEn: 'Special shrimp paste, rich flavor, handmade', emoji: '🫙' },
    { nameVi: 'Nước mắm', nameEn: 'Fish Sauce', descVi: 'Nước mắm truyền thống Sầm Sơn, thơm tự nhiên', descEn: 'Traditional Sầm Sơn fish sauce, naturally fragrant', emoji: '🍶' },
    { nameVi: 'Combo quà biếu', nameEn: 'Gift Combo', descVi: 'Set quà đặc sản Sầm Sơn đóng gói đẹp, tiện lợi', descEn: 'Beautifully packaged Sầm Sơn specialty gift set', emoji: '🎁' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-20 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <p className="text-primary font-display text-xs tracking-[0.4em] uppercase mb-3">
            Giang Nguyên Seafood
          </p>
          <h1 className="font-display text-3xl sm:text-5xl font-bold mb-4">
            {isVi ? 'Hải sản khô Sầm Sơn' : 'Sầm Sơn Dried Seafood'}
          </h1>
          <p className="text-background/70 max-w-2xl mx-auto">
            {isVi
              ? 'Giang Nguyên Seafood – đặc sản Sầm Sơn, chất lượng cao, đóng gói tiện lợi, phù hợp làm quà biếu.'
              : 'Giang Nguyên Seafood – Sầm Sơn specialty, high quality, conveniently packaged, perfect for gifts.'}
          </p>
        </div>
      </section>

      {/* Products */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-center"
              >
                <span className="text-5xl block mb-4">{p.emoji}</span>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {isVi ? p.nameVi : p.nameEn}
                </h3>
                <p className="text-sm text-muted-foreground">{isVi ? p.descVi : p.descEn}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-16 space-y-4">
            <p className="text-muted-foreground">
              {isVi
                ? 'Liên hệ đặt hàng hoặc ghé shop trực tiếp để mua hải sản khô Sầm Sơn chính hãng.'
                : 'Contact to order or visit the shop directly for authentic Sầm Sơn dried seafood.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="tel:0983605768">
                <Button variant="gold" size="lg">
                  📞 {isVi ? 'Gọi đặt hàng' : 'Call to Order'}: 098.360.5768
                </Button>
              </a>
              <Button variant="outline" size="lg" className="gap-2" asChild>
                <a href="https://www.facebook.com/KhachSanTuanDatLuxuryFLC" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  {isVi ? 'Xem trên Facebook' : 'View on Facebook'}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Seafood;
