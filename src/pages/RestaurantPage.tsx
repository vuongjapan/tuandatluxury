import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowLeft, Users, Fish, Utensils, Wallet } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import VenueGallery from '@/components/VenueGallery';
import RestaurantReservationModal from '@/components/RestaurantReservationModal';
import RestaurantBudgetModal from '@/components/RestaurantBudgetModal';
import { useMenuItems } from '@/hooks/useMenuItems';
import { supabase } from '@/integrations/supabase/client';

const fmt = (n: number) => n.toLocaleString('vi-VN') + 'đ';

export default function RestaurantPage() {
  const [hero, setHero] = useState<string | null>(null);
  const [resOpen, setResOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const { allItems, categories, loading } = useMenuItems();

  useEffect(() => {
    document.title = 'Nhà Hàng Hải Sản Tuấn Đạt';
    (async () => {
      const { data } = await (supabase as any)
        .from('venue_media')
        .select('url')
        .eq('venue_type', 'restaurant')
        .eq('media_type', 'image')
        .eq('is_active', true)
        .order('sort_order')
        .limit(1);
      if (data && data[0]) setHero(data[0].url);
    })();
  }, []);

  const visible = activeCat ? allItems.filter((i) => i.category === activeCat) : allItems;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative h-[420px] md:h-[520px] mt-20 overflow-hidden bg-secondary">
        {hero && <img src={hero} alt="Nhà hàng hải sản" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70" />
        <div className="relative z-10 h-full flex flex-col items-center justify-end pb-12 text-center px-4">
          <h1 className="font-display text-4xl md:text-6xl font-bold text-white mb-3 drop-shadow-lg">NHÀ HÀNG HẢI SẢN TUẤN ĐẠT</h1>
          <p className="text-white/90 text-sm md:text-base">2 tầng phục vụ · 120+ món hải sản tươi</p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <Link to="/services" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Quay lại Dịch vụ
        </Link>

        <div className="grid grid-cols-3 gap-3 mb-10">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <div><p className="text-xs text-muted-foreground">Giờ mở</p><p className="font-semibold text-sm">07:00 – 21:30</p></div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <Fish className="h-5 w-5 text-primary" />
            <div><p className="text-xs text-muted-foreground">Đặc sản</p><p className="font-semibold text-sm">Hải sản tươi sống</p></div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div><p className="text-xs text-muted-foreground">Sức chứa</p><p className="font-semibold text-sm">200 khách</p></div>
          </div>
        </div>

        <section className="mb-12">
          <h2 className="font-display text-2xl font-semibold mb-4">Không gian nhà hàng</h2>
          <VenueGallery venue="restaurant" />
        </section>

        {/* Menu */}
        <section className="mb-12">
          <h2 className="font-display text-2xl font-semibold mb-4">Thực đơn</h2>
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
            <Button size="sm" variant={!activeCat ? 'default' : 'outline'} onClick={() => setActiveCat(null)}>Tất cả</Button>
            {categories.map((c) => (
              <Button key={c} size="sm" variant={activeCat === c ? 'default' : 'outline'} onClick={() => setActiveCat(c)}>{c}</Button>
            ))}
          </div>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Đang tải thực đơn...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {visible.slice(0, 30).map((it) => (
                <div key={it.id} className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
                  <div className="aspect-[4/3] bg-secondary overflow-hidden">
                    {it.image_url && <img src={it.image_url} alt={it.name_vi} loading="lazy" className="w-full h-full object-cover" />}
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <h4 className="font-semibold text-sm mb-1 line-clamp-1">{it.name_vi}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{it.description_vi}</p>
                    <p className="text-primary font-bold text-sm mt-2">{it.price_vnd > 0 ? fmt(it.price_vnd) : 'Liên hệ'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
            <Utensils className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="font-display text-xl font-semibold mb-2">Đặt bàn trước</h3>
            <p className="text-sm text-muted-foreground mb-4">Giữ chỗ đẹp, không phải chờ đợi</p>
            <Button size="lg" onClick={() => setResOpen(true)} className="w-full">Đặt bàn →</Button>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <Wallet className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="font-display text-xl font-semibold mb-2">Tư vấn menu theo ngân sách</h3>
            <p className="text-sm text-muted-foreground mb-4">Gợi ý món phù hợp số người & chi phí</p>
            <Button size="lg" variant="outline" onClick={() => setBudgetOpen(true)} className="w-full">Tư vấn →</Button>
          </div>
        </section>
      </main>

      <Footer />
      <RestaurantReservationModal open={resOpen} onClose={() => setResOpen(false)} />
      <RestaurantBudgetModal open={budgetOpen} onClose={() => setBudgetOpen(false)} />
    </div>
  );
}
