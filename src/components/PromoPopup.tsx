import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePromoPopups, type PromoPopup as PromoPopupType } from '@/hooks/usePromoPopups';

const STORAGE_PREFIX = 'promo_popup_dismiss_';

const isDismissed = (id: string, hours: number) => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + id);
    if (!raw) return false;
    const ts = Number(raw);
    if (!ts) return false;
    return Date.now() - ts < hours * 3600 * 1000;
  } catch {
    return false;
  }
};

const positionClasses: Record<PromoPopupType['position'], string> = {
  'bottom-left': 'left-3 sm:left-5 bottom-3 sm:bottom-5',
  'bottom-right': 'right-3 sm:right-5 bottom-20 sm:bottom-5',
  'center': 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
};

const PopupCard = ({ popup }: { popup: PromoPopupType }) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isDismissed(popup.id, popup.dismiss_duration_hours)) return;
    const t = setTimeout(() => setVisible(true), Math.max(0, popup.display_delay_seconds * 1000));
    return () => clearTimeout(t);
  }, [popup.id, popup.dismiss_duration_hours, popup.display_delay_seconds]);

  const handleDismiss = () => {
    try { localStorage.setItem(STORAGE_PREFIX + popup.id, String(Date.now())); } catch {}
    setVisible(false);
  };

  const handleClick = () => {
    if (!popup.link_url) return;
    if (/^https?:\/\//i.test(popup.link_url)) {
      window.open(popup.link_url, '_blank', 'noopener,noreferrer');
    } else {
      navigate(popup.link_url);
    }
  };

  if (!visible) return null;

  const isCenter = popup.position === 'center';

  return (
    <>
      {isCenter && (
        <div
          className="fixed inset-0 z-[90] bg-background/60 backdrop-blur-sm animate-fade-in"
          onClick={handleDismiss}
        />
      )}
      <div
        className={`fixed z-[91] ${positionClasses[popup.position]} w-[260px] sm:w-[300px] animate-fade-in`}
        style={{ animation: 'popupSlideIn 0.4s ease-out' }}
      >
        <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border bg-card">
          <button
            onClick={handleDismiss}
            aria-label="Đóng"
            className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-foreground/70 hover:bg-foreground text-background flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            onClick={handleClick}
            className={`block w-full ${popup.link_url ? 'cursor-pointer' : 'cursor-default'}`}
            disabled={!popup.link_url}
          >
            <img
              src={popup.image_url}
              alt={popup.title || 'Khuyến mại'}
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </button>
        </div>
      </div>
      <style>{`
        @keyframes popupSlideIn {
          from { transform: translateY(20px) scale(0.96); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @media (max-width: 640px) {
          @keyframes popupSlideIn {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        }
      `}</style>
    </>
  );
};

const PromoPopup = () => {
  const { activePopups } = usePromoPopups();
  // Show only first popup for now (can be extended)
  const popup = activePopups[0];
  if (!popup) return null;
  return <PopupCard key={popup.id} popup={popup} />;
};

export default PromoPopup;
