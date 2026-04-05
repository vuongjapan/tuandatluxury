import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UtensilsCrossed, ArrowRight, Star, Clock, Users } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDining } from '@/hooks/useDining';

const setMenus = [
  {
    price: '225.000',
    image: '/images/menu-225k.jpg',
    titleVi: 'Set Menu 225K',
    titleEn: 'Set Menu 225K',
    descVi: '4 thực đơn đa dạng, 10 món/set. Phù hợp nhóm nhỏ và gia đình.',
    descEn: '4 diverse menus, 10 dishes/set. Perfect for small groups and families.',
    dishes: ['Tôm chiên', 'Mực xào', 'Cá thu sốt cà chua', 'Nem hải sản', 'Nộm sứa thập cẩm', 'Rau muống xào tỏi', 'Canh ngao chua ngọt', 'Cơm trắng', 'Cà muối', 'Hoa quả tráng miệng'],
  },
  {
    price: '275.000',
    image: '/images/menu-275k.jpg',
    titleVi: 'Set Menu 275K',
    titleEn: 'Set Menu 275K',
    descVi: '4 thực đơn phong phú, 11 món/set. Thêm hàu nướng mỡ hành đặc biệt.',
    descEn: '4 rich menus, 11 dishes/set. Includes special grilled oyster with scallion oil.',
    dishes: ['Tôm hấp bia', 'Mực xào', 'Cá thu sốt cà chua', 'Nem hải sản', 'Hàu nướng mỡ hành', 'Nộm sứa thập cẩm', 'Canh ngao chua ngọt', 'Rau muống xào tỏi', 'Cơm trắng', 'Cà muối', 'Hoa quả'],
  },
  {
    price: '375.000',
    image: '/images/menu-375k.jpg',
    titleVi: 'Set Menu 375K',
    titleEn: 'Set Menu 375K',
    descVi: '4 thực đơn cao cấp, 11 món/set. Cá vược hấp xì dầu & móng tay rang me.',
    descEn: '4 premium menus, 11 dishes/set. Steamed sea bass & razor clams with tamarind.',
    dishes: ['Cá vược hấp xì dầu', 'Mực xào', 'Móng tay rang me', 'Thịt rang', 'Hàu nướng mỡ hành', 'Tôm chiên xù', 'Canh ngao chua ngọt', 'Rau muống xào', 'Cơm trắng', 'Cà muối', 'Hoa quả'],
  },
  {
    price: '550.000',
    image: '/images/menu-550k.jpg',
    titleVi: 'Set Menu 550K',
    titleEn: 'Set Menu 550K',
    descVi: '2 thực đơn VIP, 12 món/set. Súp hải sản, ghẹ hấp sả, tôm nướng.',
    descEn: '2 VIP menus, 12 dishes/set. Seafood soup, steamed crab, grilled shrimp.',
    dishes: ['Súp hải sản', 'Ghẹ hấp sả', 'Cá vược hấp xì dầu', 'Tôm nướng', 'Mực xào thập cẩm', 'Hàu nướng mỡ hành', 'Chả mực rán', 'Canh ngao chua ngọt', 'Rau salat', 'Cơm trắng', 'Cà muối', 'Hoa quả'],
  },
];

const reviews = [
  {
    name: 'Nguyễn Thị Mai',
    rating: 5,
    textVi: 'Hải sản ở đây tươi ngon lắm, đặc biệt là hàu nướng mỡ hành và tôm hấp bia. Set menu 275K rất xứng đáng, phục vụ nhanh và chu đáo.',
    textEn: 'The seafood here is very fresh, especially the grilled oysters and beer-steamed shrimp. The 275K set menu is great value with fast service.',
    avatar: '👩',
  },
  {
    name: 'Trần Văn Hùng',
    rating: 5,
    textVi: 'Đi đoàn 20 người, gọi set menu 375K. Ai cũng khen ngon, đồ ăn ra đều và nóng hổi. Sẽ quay lại lần sau!',
    textEn: 'Went with a group of 20, ordered the 375K set menu. Everyone loved it, food came consistently hot. Will definitely return!',
    avatar: '👨',
  },
  {
    name: 'Phạm Lan Anh',
    rating: 5,
    textVi: 'Set VIP 550K xứng đáng từng đồng! Súp hải sản thơm ngon, ghẹ hấp sả tươi rói. View nhà hàng đẹp, phục vụ tận tình.',
    textEn: 'The 550K VIP set is worth every penny! Fragrant seafood soup, fresh steamed crab. Beautiful restaurant view, attentive service.',
    avatar: '👩‍💼',
  },
];

const Cuisine = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isVi = t('nav.rooms') === 'Hạng phòng';
  const { categories } = useDining();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Banner */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20 bg-foreground text-background overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <p className="text-primary font-display text-xs tracking-[0.4em] uppercase mb-3">
            {isVi ? 'Trải nghiệm ẩm thực' : 'Culinary Experience'}
          </p>
          <h1 className="font-display text-3xl sm:text-5xl font-bold mb-4">
            {isVi ? 'Ẩm thực đẳng cấp biển Sầm Sơn' : 'Premium Sầm Sơn Seafood Cuisine'}
          </h1>
          <p className="text-background/70 max-w-2xl mx-auto text-sm sm:text-base">
            {isVi
              ? 'Hải sản tươi sống đánh bắt trong ngày, chế biến bởi đầu bếp giàu kinh nghiệm. Đặc sản hàu nướng mỡ hành, tôm hấp bia, ghẹ hấp sả — hương vị biển Sầm Sơn chính hiệu.'
              : 'Fresh seafood caught daily, prepared by experienced chefs. Signature grilled oysters, beer-steamed shrimp, lemongrass crab — authentic Sầm Sơn flavors.'}
          </p>
        </div>
      </section>

      {/* Set Menu Section - Marketing style */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-primary font-display text-xs tracking-[0.3em] uppercase mb-2">SET MENU</p>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-foreground mb-3">
              {isVi ? 'Thực đơn đoàn — Giá cực hấp dẫn' : 'Group Set Menus — Amazing Prices'}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">
              {isVi
                ? 'Phù hợp cho gia đình, nhóm bạn bè và đoàn khách. Phục vụ từ 10:00 – 21:00. Giá chưa bao gồm VAT.'
                : 'Perfect for families, friend groups and tour groups. Served 10:00 – 21:00. Prices exclude VAT.'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {setMenus.map((menu, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-all duration-300 group"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={menu.image}
                    alt={isVi ? menu.titleVi : menu.titleEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold text-lg shadow-lg">
                    {menu.price}₫/suất
                  </div>
                </div>
                <div className="p-5 sm:p-6">
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">
                    {isVi ? menu.titleVi : menu.titleEn}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {isVi ? menu.descVi : menu.descEn}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {menu.dishes.slice(0, 6).map((dish, j) => (
                      <span key={j} className="text-xs bg-secondary text-foreground px-2 py-1 rounded-full">
                        {dish}
                      </span>
                    ))}
                    {menu.dishes.length > 6 && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                        +{menu.dishes.length - 6} {isVi ? 'món nữa' : 'more'}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews / Testimonials - Blog style */}
      <section className="py-16 sm:py-20 bg-secondary">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <p className="text-primary font-display text-xs tracking-[0.3em] uppercase mb-2">REVIEWS</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              {isVi ? 'Khách hàng nói gì?' : 'What Our Guests Say'}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-6 border border-border shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{review.avatar}</span>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{review.name}</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: review.rating }).map((_, j) => (
                        <Star key={j} className="h-3.5 w-3.5 fill-primary text-primary" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "{isVi ? review.textVi : review.textEn}"
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              {
                icon: <UtensilsCrossed className="h-8 w-8 text-primary mx-auto" />,
                titleVi: '🦐 Hải sản tươi sống',
                titleEn: '🦐 Fresh Seafood',
                descVi: 'Tôm, cua, ghẹ, mực, hàu — tất cả đều được đánh bắt trong ngày từ biển Sầm Sơn.',
                descEn: 'Shrimp, crab, squid, oysters — all caught daily from Sầm Sơn sea.',
              },
              {
                icon: <Clock className="h-8 w-8 text-primary mx-auto" />,
                titleVi: '🍳 Buffet sáng miễn phí',
                titleEn: '🍳 Free Breakfast Buffet',
                descVi: 'Buffet sáng đa dạng tại tầng 1 nhà hàng. Món Việt và quốc tế, phục vụ 06:00 – 08:30.',
                descEn: 'Rich breakfast buffet at 1st floor. Vietnamese and international, served 06:00 – 08:30.',
              },
              {
                icon: <Users className="h-8 w-8 text-primary mx-auto" />,
                titleVi: '🍱 Set Menu & Cơm đoàn',
                titleEn: '🍱 Set Menu & Group Dining',
                descVi: 'Thực đơn từ 225K – 550K/suất. Phù hợp gia đình, đoàn khách. Phục vụ 10:00 – 21:00.',
                descEn: 'Menus from 225K – 550K/person. Perfect for families and groups. Served 10:00 – 21:00.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="space-y-3"
              >
                {item.icon}
                <h3 className="font-display text-lg font-bold text-foreground">{isVi ? item.titleVi : item.titleEn}</h3>
                <p className="text-sm text-muted-foreground">{isVi ? item.descVi : item.descEn}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dining Categories from DB */}
      {categories.length > 0 && (
        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
              {isVi ? 'Thực đơn của chúng tôi' : 'Our Menu'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  {cat.image_url && (
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={cat.image_url}
                        alt={isVi ? cat.name_vi : cat.name_en}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                      {isVi ? cat.name_vi : cat.name_en}
                    </h3>
                    {cat.serving_hours && (
                      <p className="text-xs text-muted-foreground mb-2">🕐 {cat.serving_hours}</p>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {isVi ? cat.description_vi : cat.description_en}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
              {isVi ? 'Sẵn sàng thưởng thức?' : 'Ready to Dine?'}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto text-sm">
              {isVi
                ? 'Đặt món trực tuyến hoặc liên hệ trực tiếp để đặt bàn cho đoàn.'
                : 'Order online or contact us directly to book a table for your group.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button variant="gold" size="lg" onClick={() => navigate('/food-order')} className="gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                {isVi ? 'Đặt món ngay' : 'Order Food Now'}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <a href="tel:0983605768">
                <Button variant="outline" size="lg" className="gap-2">
                  📞 098.360.5768
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Cuisine;
