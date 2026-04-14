import { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFlashSales } from '@/hooks/usePromotionSystem';
import { useNavigate } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import logoImg from '@/assets/logo-tuan-dat.jpg';

const POPUP_DISMISS_KEY = 'promo_popup_dismissed';
const POPUP_DELAY = 2000; // Show after 2s

const PromoBannerPopup = () => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const navigate = useNavigate();
  const { flashSales } = useFlashSales();
  const { settings } = useSiteSettings();
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const dismissed = sessionStorage.getItem(POPUP_DISMISS_KEY);
    if (dismissed) return;
    const timer = setTimeout(() => setVisible(true), POPUP_DELAY);
    return () => clearTimeout(timer);
  }, []);

  // Countdown
  useEffect(() => {
    if (flashSales.length === 0) return;
    const sale = flashSales[0];
    const update = () => {
      const diff = Math.max(0, new Date(sale.end_time).getTime() - Date.now());
      if (diff <= 0) return;
      setCountdown({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [flashSales]);

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem(POPUP_DISMISS_KEY, '1');
  };

  const handleClick = () => {
    handleDismiss();
    navigate('/promotions');
  };

  const activeSale = flashSales[0];
  if (!visible || !activeSale) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-foreground/60 backdrop-blur-sm animate-fade-in"
        onClick={handleDismiss}
      />

      {/* Popup */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative bg-gradient-to-b from-amber-50 to-white rounded-2xl shadow-2xl max-w-sm w-full pointer-events-auto overflow-hidden animate-scale-in"
          style={{ animation: 'scale-in 0.3s ease-out' }}
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 z-10 bg-foreground/60 hover:bg-foreground/80 text-background rounded-full p-1.5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header with logo */}
          <div className="pt-6 pb-3 px-6 text-center">
            <img
              src={settings.header_logo_url || logoImg}
              alt="Tuấn Đạt Luxury"
              className="h-12 mx-auto mb-3 object-contain"
            />
          </div>

          {/* Sale banner image area */}
          <div className="px-5 pb-4">
            <div className="bg-gradient-to-br from-primary/10 via-amber-100/50 to-primary/5 rounded-xl p-5 text-center space-y-3">
              <h3 className="text-lg font-bold text-foreground">
                {isVi ? activeSale.title_vi : activeSale.title_en}
              </h3>
              {(activeSale.description_vi || activeSale.description_en) && (
                <p className="text-sm text-muted-foreground">
                  {isVi ? activeSale.description_vi : activeSale.description_en}
                </p>
              )}

              {/* Countdown */}
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">
                  {isVi ? 'Bắt đầu sau' : 'Starts in'}
                </p>
                <div className="flex items-center justify-center gap-2">
                  {[
                    { val: countdown.h, label: isVi ? 'Giờ' : 'Hrs' },
                    { val: countdown.m, label: isVi ? 'Phút' : 'Min' },
                    { val: countdown.s, label: isVi ? 'Giây' : 'Sec' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex flex-col items-center">
                        <span className="text-2xl font-bold text-primary tabular-nums">
                          {String(item.val).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{item.label}</span>
                      </div>
                      {i < 2 && <span className="text-xl font-bold text-primary/50 -mt-4">:</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="px-5 pb-5">
            <button
              onClick={handleClick}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-lg transition-colors tracking-wide uppercase"
            >
              {isVi ? 'Xem ưu đãi' : 'View Offers'}
            </button>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              {isVi ? 'Ưu đãi độc quyền tại website' : 'Exclusive website offer'}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
      `}</style>
    </>
  );
};

export default PromoBannerPopup;
