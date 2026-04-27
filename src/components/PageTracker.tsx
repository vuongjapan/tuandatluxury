import { useEffect, useRef } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { trackPageView } from '@/hooks/usePageTracking';

function detectPageType(pathname: string): {
  type: 'home' | 'room_detail' | 'booking' | 'food_order' | 'dining' | 'offers' | 'blog' | 'other';
  roomId?: string;
} {
  if (pathname === '/') return { type: 'home' };
  const room = matchPath('/room/:id', pathname);
  if (room) return { type: 'room_detail', roomId: room.params.id };
  if (pathname.startsWith('/booking')) return { type: 'booking' };
  if (pathname.startsWith('/food-order')) return { type: 'food_order' };
  if (pathname.startsWith('/dining') || pathname.startsWith('/cuisine') || pathname.startsWith('/seafood')) return { type: 'dining' };
  if (pathname.startsWith('/uu-dai') || pathname.startsWith('/khuyen-mai') || pathname.startsWith('/promotions') || pathname.startsWith('/offers')) return { type: 'offers' };
  if (pathname.startsWith('/blog')) return { type: 'blog' };
  return { type: 'other' };
}

const PageTracker = () => {
  const { pathname } = useLocation();
  const lastTracked = useRef<string>('');

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    const { type, roomId } = detectPageType(pathname);
    trackPageView({ page_type: type, room_id: roomId || null }, pathname);
  }, [pathname]);

  return null;
};

export default PageTracker;
