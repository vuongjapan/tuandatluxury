import { useState } from 'react';
import { Star, Quote, Send, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FadeIn from '@/components/FadeIn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReviews, submitReview } from '@/hooks/useReviews';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const reviewSchema = z.object({
  guest_name: z.string().trim().min(1, 'Vui lòng nhập tên').max(100),
  guest_email: z.string().trim().email('Email không hợp lệ').max(255).optional().or(z.literal('')),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  content: z.string().trim().min(10, 'Nội dung tối thiểu 10 ký tự').max(2000),
  room_type: z.string().trim().max(80).optional(),
});

const Stars = ({ value, size = 16 }: { value: number; size?: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} size={size} className={n <= value ? 'fill-primary text-primary' : 'text-muted-foreground/30'} />
    ))}
  </div>
);

const Reviews = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const isVi = t('nav.rooms') === 'Hạng phòng';
  const { reviews, loading, refetch } = useReviews(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [roomType, setRoomType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = reviewSchema.safeParse({
      guest_name: name, guest_email: email, rating, title, content, room_type: roomType,
    });
    if (!parsed.success) {
      toast({ title: isVi ? 'Lỗi' : 'Error', description: parsed.error.errors[0].message, variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await submitReview({
      guest_name: parsed.data.guest_name,
      guest_email: parsed.data.guest_email || undefined,
      rating: parsed.data.rating,
      title: parsed.data.title || undefined,
      content: parsed.data.content,
      room_type: parsed.data.room_type || undefined,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } else {
      setDone(true);
      setName(''); setEmail(''); setRating(5); setTitle(''); setContent(''); setRoomType('');
      toast({ title: isVi ? 'Cảm ơn bạn!' : 'Thank you!', description: isVi ? 'Đánh giá đang chờ duyệt.' : 'Review pending approval.' });
      refetch();
    }
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-12 pb-10 bg-gradient-to-b from-foreground to-foreground/90 text-background">
        <div className="container mx-auto px-4 text-center">
          <FadeIn>
            <p className="text-primary font-display text-xs tracking-[0.4em] uppercase mb-3">
              {isVi ? 'Khách hàng đánh giá' : 'Guest Reviews'}
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-semibold mb-4">
              {isVi ? 'Cảm nhận từ khách hàng' : 'What Our Guests Say'}
            </h1>
            {reviews.length > 0 && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <Stars value={Math.round(avgRating)} size={20} />
                <span className="font-display text-2xl font-bold text-primary">{avgRating.toFixed(1)}</span>
                <span className="text-sm text-background/70">/ 5 · {reviews.length} {isVi ? 'đánh giá' : 'reviews'}</span>
              </div>
            )}
          </FadeIn>
        </div>
      </section>

      {/* Review list */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {loading ? (
            <div className="text-center text-muted-foreground py-12">{isVi ? 'Đang tải...' : 'Loading...'}</div>
          ) : reviews.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              {isVi ? 'Chưa có đánh giá. Hãy là người đầu tiên!' : 'No reviews yet. Be the first!'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {reviews.map((r, i) => (
                <FadeIn key={r.id} delay={i * 60}>
                  <div className="bg-card rounded-xl border border-border p-5 sm:p-6 shadow-card hover:shadow-luxury transition-all h-full flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold">
                          {r.guest_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{r.guest_name}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(r.created_at), 'dd/MM/yyyy', { locale: vi })}</p>
                        </div>
                      </div>
                      <Stars value={r.rating} />
                    </div>
                    {r.title && <h3 className="font-display font-semibold mb-2">{r.title}</h3>}
                    <Quote className="h-5 w-5 text-primary/30 mb-2" />
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">{r.content}</p>
                    {r.room_type && (
                      <p className="text-xs text-primary mt-3 pt-3 border-t border-border">{r.room_type}</p>
                    )}
                  </div>
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Submit form */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4 max-w-2xl">
          <FadeIn>
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-2">
                {isVi ? 'Chia sẻ trải nghiệm của bạn' : 'Share Your Experience'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isVi ? 'Đánh giá sẽ hiển thị sau khi được duyệt' : 'Reviews appear after admin approval'}
              </p>
            </div>

            {done ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-primary" />
                <p className="font-semibold mb-2">{isVi ? 'Cảm ơn bạn đã đánh giá!' : 'Thank you for your review!'}</p>
                <Button variant="outline" size="sm" onClick={() => setDone(false)} className="mt-3">
                  {isVi ? 'Gửi đánh giá khác' : 'Submit another'}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rev-name">{isVi ? 'Họ và tên *' : 'Name *'}</Label>
                    <Input id="rev-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
                  </div>
                  <div>
                    <Label htmlFor="rev-email">Email</Label>
                    <Input id="rev-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
                  </div>
                </div>

                <div>
                  <Label>{isVi ? 'Đánh giá *' : 'Rating *'}</Label>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(n)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star size={32} className={n <= (hoverRating || rating) ? 'fill-primary text-primary' : 'text-muted-foreground/30'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="rev-title">{isVi ? 'Tiêu đề' : 'Title'}</Label>
                  <Input id="rev-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}
                    placeholder={isVi ? 'VD: Phòng đẹp, view biển tuyệt vời' : 'e.g., Beautiful room, great view'} />
                </div>

                <div>
                  <Label htmlFor="rev-room">{isVi ? 'Loại phòng đã ở' : 'Room type'}</Label>
                  <Input id="rev-room" value={roomType} onChange={(e) => setRoomType(e.target.value)} maxLength={80}
                    placeholder={isVi ? 'VD: Phòng Deluxe' : 'e.g., Deluxe Room'} />
                </div>

                <div>
                  <Label htmlFor="rev-content">{isVi ? 'Nội dung đánh giá *' : 'Review *'}</Label>
                  <Textarea id="rev-content" value={content} onChange={(e) => setContent(e.target.value)} rows={5} maxLength={2000} required />
                  <p className="text-xs text-muted-foreground mt-1">{content.length}/2000</p>
                </div>

                <Button type="submit" variant="gold" disabled={submitting} className="w-full gap-2">
                  <Send className="h-4 w-4" />
                  {submitting ? (isVi ? 'Đang gửi...' : 'Sending...') : (isVi ? 'Gửi đánh giá' : 'Submit review')}
                </Button>
              </form>
            )}
          </FadeIn>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Reviews;
