import { useState, useEffect } from 'react';
import { X, Percent, Zap, Tag } from 'lucide-react';
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

  useEffect(() => {
    const d = sessionStorage.getItem(DISMISS_KEY);
    if (d) setDismissed(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(DISMISS_KEY, '1');
  };

  const hasPromos = discounts.length > 0 || codes.length > 0 || flashSales.length > 0;
  if (!hasPromos || dismissed) return null;

  const activeGlobal = discounts[0];
  const activeFlash = flashSales[0];
  const activeCode = codes[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-primary text-primary-foreground overflow-hidden print:hidden"
      >
        <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide text-sm flex-1">
            {activeFlash && (
              <button onClick={() => navigate('/promotions')} className="flex items-center gap-1.5 shrink-0 hover:underline">
                <Zap className="h-4 w-4" />
                <span className="font-medium">⚡ Flash Sale</span>
              </button>
            )}
            {activeGlobal && (
              <button onClick={() => navigate('/promotions')} className="flex items-center gap-1.5 shrink-0 hover:underline">
                <Percent className="h-4 w-4" />
                <span>{isVi ? `Giảm ${activeGlobal.discount_percent}% toàn hệ thống` : `${activeGlobal.discount_percent}% off sitewide`}</span>
              </button>
            )}
            {activeCode && (
              <button onClick={() => navigate('/promotions')} className="flex items-center gap-1.5 shrink-0 hover:underline">
                <Tag className="h-4 w-4" />
                <span>{isVi ? `Mã ${activeCode.code}` : `Code: ${activeCode.code}`}</span>
              </button>
            )}
          </div>
          <button onClick={handleDismiss} className="shrink-0 p-1 hover:bg-primary-foreground/20 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ActivePromoBanner;
