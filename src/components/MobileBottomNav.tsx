import { Home, Calendar, MessageSquare, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Bottom tab bar for logged-in members on mobile.
 * Hidden on admin/auth pages and on desktop (lg+).
 */
const MobileBottomNav = () => {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading || !user) return null;
  if (pathname.startsWith('/admin') || pathname.startsWith('/member') || pathname.startsWith('/reset-password')) return null;

  const items = [
    { icon: Home, label: 'Trang chủ', to: '/' },
    { icon: Calendar, label: 'Đặt phòng', to: '/account#bookings' },
    { icon: MessageSquare, label: 'Chat', to: '/account#messages' },
    { icon: User, label: 'Tôi', to: '/account#profile' },
  ];

  const isActive = (to: string) => {
    const base = to.split('#')[0];
    if (base === '/') return pathname === '/';
    return pathname.startsWith(base);
  };

  return (
    <>
      {/* Spacer so content isn't covered */}
      <div className="lg:hidden h-16" aria-hidden />
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border">
        <div className="grid grid-cols-4 h-16">
          {items.map((it) => {
            const active = isActive(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <it.icon className={`h-5 w-5 ${active ? 'fill-primary/10' : ''}`} />
                <span>{it.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
