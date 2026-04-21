import { useState, useEffect } from 'react';
import { X, Percent, Zap, Tag, ArrowRight, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGlobalDiscounts, useDiscountCodes, useFlashSales } from '@/hooks/usePromotionSystem';
import { useNavigate } from 'react-router-dom';

const DISMISS_KEY = 'promo_banner_dismissed';

const ActivePromoBanner = () => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const navigate = useNavigate();
  const { discounts } = useGlobalDiscounts();
  const { codes } = useDiscountCodes();
  const { flashSales } = useFlashSales();
  const [dismissed, setDismissed] = useState(false);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const d = sessionStorage.getItem(DISMISS_KEY);
    if (d) setDismissed(true);
  }, []);

  // Countdown for flash sale
  useEffect(() => {
    if (flashSales.length === 0) return;
    const sale = flashSales[0];
    const update = () => {
      const diff = Math.max(0, new Date(sale.end_time).getTime() - Date.now());
      if (diff <= 0) { setCountdown(''); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [flashSales]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(DISMISS_KEY, '1');
  };

  const hasPromos = discounts.length > 0 || codes.length > 0 || flashSales.length > 0;
  if (!hasPromos || dismissed) return null;

  const activeFlash = flashSales[0];
  const activeGlobal = discounts[0];
  const activeCode = codes[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-gradient-to-r from-destructive via-destructive/90 to-primary text-destructive-foreground overflow-hidden print:hidden"
      >
        <div className="section-container py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide text-sm flex-1">
            {activeFlash && (
              <button onClick={() => navigate('/promotions')} className="flex items-center gap-2 shrink-0 hover:underline font-medium animate-pulse">
                <Zap className="h-4 w-4" />
                <span>FLASH SALE</span>
                {countdown && (
                  <span className="bg-background/20 px-2 py-0.5 rounded font-mono text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />{countdown}
                  </span>
                )}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
            {activeGlobal && (
              <button onClick={() => navigate('/promotions')} className="flex items-center gap-1.5 shrink-0 hover:underline">
                <Percent className="h-4 w-4" />
                <span className="font-medium">
                  {isVi ? `Giảm ${activeGlobal.discount_percent}% toàn hệ thống` : `${activeGlobal.discount_percent}% off sitewide`}
                </span>
              </button>
            )}
            {activeCode && (
              <button onClick={() => navigate('/promotions')} className="flex items-center gap-1.5 shrink-0 hover:underline">
                <Tag className="h-4 w-4" />
                <span>{isVi ? `Mã: ${activeCode.code}` : `Code: ${activeCode.code}`}</span>
                <span className="bg-background/20 px-1.5 py-0.5 rounded text-xs">
                  {activeCode.discount_type === 'percent' ? `-${activeCode.discount_value}%` : `-${activeCode.discount_value.toLocaleString()}₫`}
                </span>
              </button>
            )}
          </div>
          <button onClick={handleDismiss} className="shrink-0 p-1 hover:bg-background/20 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ActivePromoBanner;
