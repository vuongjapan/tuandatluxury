import { useEffect, useRef } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { trackPageView, type PageType } from '@/hooks/usePageTracking';
import { initVisitorTracking, trackVisitorPage } from '@/lib/visitorTracking';


interface Detected {
  type: PageType;
  label: string;
  roomId?: string;
}

const LABELS: Partial<Record<PageType, string>> = {
  home: 'Trang chủ',
  rooms_list: 'Danh sách phòng',
  room_detail: 'Chi tiết phòng',
  booking_step1: 'Đặt phòng - Bước 1',
  booking_step2: 'Đặt phòng - Bước 2 (Dịch vụ)',
  booking_step3: 'Đặt phòng - Bước 3 (Xác nhận)',
  booking_step4: 'Đặt phòng - Bước 4',
  booking_done: 'Đặt phòng thành công',
  about: 'Giới thiệu',
  food_order: 'Đặt món ăn',
  services: 'Dịch vụ',
  promotions: 'Khuyến mãi',
  explore: 'Khám phá',
  lookup: 'Tra cứu đơn',
  account: 'Trang cá nhân',
  invoice: 'Xem hóa đơn',
  dining: 'Ẩm thực',
  blog: 'Blog',
  reviews: 'Đánh giá',
  live: 'Livestream',
  transport: 'Đặt xe',
  other: 'Trang khác',
};

function detectPageType(pathname: string, search: string): Detected {
  if (pathname === '/' || pathname === '') return { type: 'home', label: LABELS.home! };

  const room = matchPath('/room/:id', pathname);
  if (room) return { type: 'room_detail', label: LABELS.room_detail!, roomId: room.params.id || undefined };

  if (pathname.startsWith('/booking')) {
    // Allow ?step=N to override step
    const sp = new URLSearchParams(search);
    const step = parseInt(sp.get('step') || '1', 10);
    const t = (`booking_step${Math.min(Math.max(step, 1), 4)}`) as PageType;
    return { type: t, label: LABELS[t] || 'Đặt phòng' };
  }

  if (pathname.startsWith('/invoice')) return { type: 'invoice', label: LABELS.invoice! };
  if (pathname.startsWith('/account')) return { type: 'account', label: LABELS.account! };
  if (pathname.startsWith('/tra-cuu') || pathname.startsWith('/lookup')) return { type: 'lookup', label: LABELS.lookup! };
  if (pathname.startsWith('/food-order') || pathname.startsWith('/food-invoice')) return { type: 'food_order', label: LABELS.food_order! };
  if (pathname.startsWith('/services')) return { type: 'services', label: LABELS.services! };
  if (pathname.startsWith('/dining') || pathname.startsWith('/cuisine') || pathname.startsWith('/seafood')) return { type: 'dining', label: LABELS.dining! };
  if (pathname.startsWith('/uu-dai') || pathname.startsWith('/khuyen-mai') || pathname.startsWith('/promotions') || pathname.startsWith('/offers') || pathname.startsWith('/apply')) return { type: 'promotions', label: LABELS.promotions! };
  if (pathname.startsWith('/discovery') || pathname.startsWith('/kham-pha')) return { type: 'explore', label: LABELS.explore! };
  if (pathname.startsWith('/about') || pathname.startsWith('/gioi-thieu')) return { type: 'about', label: LABELS.about! };
  if (pathname.startsWith('/blog')) return { type: 'blog', label: LABELS.blog! };
  if (pathname.startsWith('/reviews') || pathname.startsWith('/danh-gia')) return { type: 'reviews', label: LABELS.reviews! };
  if (pathname.startsWith('/live')) return { type: 'live', label: LABELS.live! };
  if (pathname.startsWith('/transport') || pathname.startsWith('/dat-xe')) return { type: 'transport', label: LABELS.transport! };

  return { type: 'other', label: LABELS.other! };
}

const PageTracker = () => {
  const { pathname, search } = useLocation();
  const lastTracked = useRef<string>('');
  const initedRef = useRef(false);

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    if (!initedRef.current) {
      initedRef.current = true;
      initVisitorTracking();
    }
    const key = `${pathname}${search}`;
    if (lastTracked.current === key) return;
    lastTracked.current = key;

    const { type, label, roomId } = detectPageType(pathname, search);
    trackPageView({ page_type: type, page_label: label, room_id: roomId || null }, pathname);
    trackVisitorPage(pathname, label);
  }, [pathname, search]);

  return null;
};

export default PageTracker;

