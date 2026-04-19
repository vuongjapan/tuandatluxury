import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Phone, X, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'tdl_exit_popup_shown_v1';
const SHOW_DELAY_MS = 8000; // fallback: show after 8s on mobile (no mouseleave)

const ExitIntentPopup = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isVi = language === 'vi';
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const trigger = () => {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
      sessionStorage.setItem(STORAGE_KEY, '1');
      setOpen(true);
    };

    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) trigger();
    };

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    let timer: number | undefined;

    if (isMobile) {
      timer = window.setTimeout(trigger, SHOW_DELAY_MS);
    } else {
      document.addEventListener('mouseout', onMouseOut);
    }

    return () => {
      document.removeEventListener('mouseout', onMouseOut);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 9) {
      toast({ variant: 'destructive', title: isVi ? 'Số điện thoại chưa hợp lệ' : 'Invalid phone' });
      return;
    }
    setSubmitting(true);
    try {
      // Lightweight lead capture: store in chat_messages as a flagged record
      // (no new table needed; admin can search by 'lead-exit' role)
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.from('chat_messages').insert({
        session_id: `lead-${Date.now()}`,
        role: 'user',
        content: `[EXIT_LEAD] phone=${cleaned} lang=${language} url=${window.location.href}`,
      });
      toast({
        title: isVi ? '✓ Đã nhận yêu cầu' : '✓ Request received',
        description: isVi ? 'Lễ tân sẽ gọi lại trong vòng 15 phút' : 'Reception will call back within 15 minutes',
      });
      setOpen(false);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: isVi ? 'Có lỗi xảy ra' : 'Something went wrong' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-primary/30">
        <div className="relative bg-gradient-to-br from-primary/15 via-card to-card p-6 sm:p-8">
          <button
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl bg-primary/15">
              <Gift className="h-8 w-8 text-primary" />
            </div>
          </div>

          <h2 className="font-display text-xl sm:text-2xl font-bold text-center text-foreground mb-2">
            {isVi ? 'Khoan đã!' : 'Wait!'}
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-1">
            {isVi
              ? 'Để lại số điện thoại để nhận'
              : 'Leave your number to receive'}
          </p>
          <p className="text-center font-semibold text-primary mb-5 flex items-center justify-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            {isVi ? 'ưu đãi đặt trực tiếp đến 15%' : 'up to 15% direct booking discount'}
          </p>

          <div className="space-y-3">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={isVi ? 'Số điện thoại của bạn' : 'Your phone number'}
                className="pl-9 h-11"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            <Button
              variant="gold"
              className="w-full h-11"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? (isVi ? 'Đang gửi...' : 'Sending...')
                : (isVi ? 'Nhận ưu đãi ngay' : 'Get my discount')}
            </Button>
            <button
              onClick={() => { setOpen(false); navigate('/booking'); }}
              className="w-full text-xs text-muted-foreground hover:text-primary transition-colors py-1"
            >
              {isVi ? 'Hoặc đặt phòng ngay →' : 'Or book now →'}
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center mt-4">
            {isVi
              ? 'Cam kết giá tốt nhất khi đặt trực tiếp · Free upgrade nếu còn phòng'
              : 'Best price guaranteed when booking direct · Free upgrade subject to availability'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExitIntentPopup;
