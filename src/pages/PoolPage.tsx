import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowLeft, Wine, PartyPopper, Camera, ShoppingBag, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import VenueGallery from '@/components/VenueGallery';
import PoolOrderModal from '@/components/PoolOrderModal';
import PoolRequestModal from '@/components/PoolRequestModal';
import { supabase } from '@/integrations/supabase/client';

export default function PoolPage() {
  const [hero, setHero] = useState<string | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [reqOpen, setReqOpen] = useState(false);

  useEffect(() => {
    document.title = 'Hồ Bơi Vô Cực — Tuấn Đạt Luxury';
    (async () => {
      const { data } = await (supabase as any)
        .from('venue_media')
        .select('url')
        .eq('venue_type', 'pool')
        .eq('media_type', 'image')
        .eq('is_active', true)
        .order('sort_order')
        .limit(1);
      if (data && data[0]) setHero(data[0].url);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative h-[420px] md:h-[520px] mt-20 overflow-hidden bg-secondary">
        {hero && <img src={hero} alt="Hồ bơi vô cực" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70" />
        <div className="relative z-10 h-full flex flex-col items-center justify-end pb-12 text-center px-4">
          <h1 className="font-display text-4xl md:text-6xl font-bold text-white mb-3 drop-shadow-lg">HỒ BƠI VÔ CỰC</h1>
          <p className="text-white/90 text-sm md:text-base">Tầng 6 — View toàn cảnh thành phố & biển</p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <Link to="/services" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Quay lại Dịch vụ
        </Link>

        {/* Quick info */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <Clock className="h-6 w-6 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Giờ mở cửa</p>
              <p className="font-semibold">06:00 – 22:00</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Khách lưu trú</p>
              <p className="font-semibold">Miễn phí</p>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <section className="mb-12">
          <h2 className="font-display text-2xl font-semibold mb-4">Thư viện ảnh</h2>
          <VenueGallery venue="pool" />
        </section>

        {/* Rules */}
        <section className="mb-12">
          <h2 className="font-display text-2xl font-semibold mb-4">Quy định</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              ['✓', 'Mặc đồ bơi phù hợp', 'text-green-600'],
              ['✓', 'Tắm trước khi xuống hồ', 'text-green-600'],
              ['✗', 'Không mang đồ ăn vào hồ', 'text-destructive'],
              ['✗', 'Không chạy quanh hồ', 'text-destructive'],
              ['✗', 'Trẻ em cần có người lớn đi kèm', 'text-destructive'],
            ].map(([sym, txt, cls], i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg">
                <span className={`font-bold text-lg ${cls}`}>{sym}</span>
                <span className="text-sm">{txt}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Services */}
        <section className="mb-12">
          <h2 className="font-display text-2xl font-semibold mb-4">Dịch vụ tại hồ bơi</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <Wine className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Đồ uống & Snack</h3>
              <p className="text-sm text-muted-foreground mb-4">Phục vụ tận ghế tại hồ bơi</p>
              <Button onClick={() => setOrderOpen(true)} className="w-full">Đặt ngay</Button>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <PartyPopper className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Tiệc nhỏ & Sự kiện</h3>
              <p className="text-sm text-muted-foreground mb-4">Sinh nhật, kỷ niệm tại hồ</p>
              <Button variant="outline" onClick={() => setReqOpen(true)} className="w-full">Yêu cầu</Button>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <Camera className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Chụp ảnh chuyên nghiệp</h3>
              <p className="text-sm text-muted-foreground mb-4">Kỷ niệm bên hồ bơi vô cực</p>
              <Button variant="outline" onClick={() => setReqOpen(true)} className="w-full">Liên hệ</Button>
            </div>
          </div>
        </section>

        {/* CTA gọi đồ uống */}
        <section className="mb-12 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
          <ShoppingBag className="h-12 w-12 text-primary mx-auto mb-3" />
          <h3 className="font-display text-2xl font-semibold mb-2">Gọi đồ uống tại hồ bơi</h3>
          <p className="text-sm text-muted-foreground mb-5">Chọn món yêu thích, phục vụ mang đến tận ghế</p>
          <Button size="lg" onClick={() => setOrderOpen(true)}>Xem menu & Gọi phục vụ →</Button>
        </section>

        {/* Special request CTA */}
        <section className="mb-8 bg-card border border-border rounded-2xl p-8 text-center">
          <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
          <h3 className="font-display text-xl font-semibold mb-2">Yêu cầu dịch vụ riêng</h3>
          <p className="text-sm text-muted-foreground mb-5">Tiệc, sinh nhật, massage, chụp ảnh...</p>
          <Button variant="outline" size="lg" onClick={() => setReqOpen(true)}>Gửi yêu cầu →</Button>
        </section>
      </main>

      <Footer />
      <PoolOrderModal open={orderOpen} onClose={() => setOrderOpen(false)} />
      <PoolRequestModal open={reqOpen} onClose={() => setReqOpen(false)} />
    </div>
  );
}
