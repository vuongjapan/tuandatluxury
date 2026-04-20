import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Phone, Globe, User, LogOut, Shield, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { useAuth, TIER_LABELS, TIER_COLORS } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import ActivePromoBanner from '@/components/ActivePromoBanner';
import PromoBannerPopup from '@/components/PromoBannerPopup';
import logoImg from '@/assets/logo-tuan-dat.jpg';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { language, setLanguage, t, langLabels } = useLanguage();
  const { user, isAdmin, signOut, loading } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const isVi = language === 'vi';

  const scrollToElement = (hash: string) => {
    const el = document.getElementById(hash);
    if (el) {
      const headerEl = document.querySelector('header');
      const headerHeight = headerEl ? headerEl.offsetHeight : 90;
      const top = el.offsetTop - headerHeight - 8;
      window.scrollTo({ top, behavior: 'smooth' });
      return true;
    }
    return false;
  };

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith('/#')) {
      const hash = href.split('#')[1];
      if (window.location.pathname === '/') {
        if (!scrollToElement(hash)) {
          const attempts = [200, 600, 1200];
          attempts.forEach(delay => {
            setTimeout(() => scrollToElement(hash), delay);
          });
        } else {
          setTimeout(() => scrollToElement(hash), 100);
        }
      } else {
        navigate(href);
      }
    } else {
      navigate(href);
    }
  };

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Split nav items: left side & right side of logo
  const leftNavItems = [
    { key: 'nav.overview', href: '/#overview' },
    { key: 'nav.rooms_booking', href: '/#rooms' },
    { key: 'nav.dining', href: '/cuisine' },
  ];

  const rightNavItems = [
    { key: 'nav.services', href: '/services' },
    { key: 'nav.offers', href: '/#offers' },
    { key: 'nav.promotions', href: '/promotions' },
    { labelVi: 'Đấu giá 🔥', labelEn: 'Auction 🔥', href: '/auction' },
    { labelVi: 'Live 🔴', labelEn: 'Live 🔴', href: '/live' },
  ] as any[];

  const moreItems = [
    { labelVi: 'Đặt đồ ăn', labelEn: 'Food Order', href: '/food-order' },
    { labelVi: 'Thư viện ảnh', labelEn: 'Gallery', href: '/#gallery' },
    { labelVi: 'Blog', labelEn: 'Blog', href: '/blog' },
    { labelVi: 'Hải sản khô', labelEn: 'Dried Seafood', href: '/seafood' },
    { labelVi: 'Điều khoản', labelEn: 'Terms', href: '/terms' },
    { labelVi: 'Liên hệ', labelEn: 'Contact', href: '/#contact' },
  ];

  const allMobileItems = [
    ...leftNavItems,
    ...rightNavItems,
    { key: 'nav.food_order', href: '/food-order' },
    { key: 'nav.gallery', href: '/#gallery' },
  ];

  return (
    <>
      <PromoBannerPopup />
      {/* Spacer reserves the height of the fixed header so page content never sits underneath it. */}
      <div aria-hidden className={`${scrolled ? 'h-16' : 'h-20 lg:h-28'}`} />
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Active promotion strip */}
        <ActivePromoBanner />

        {/* Top utility bar */}
        <div className="bg-foreground/95 text-background/70 hidden lg:block">
          <div className="container mx-auto flex items-center justify-between h-8 px-4 text-[11px]">
            <div className="flex items-center gap-3">
              <a href="tel:0983605768" className="flex items-center gap-1 hover:text-background transition-colors">
                <Phone className="h-3 w-3" /> 098.360.5768
              </a>
              <span className="text-background/30">|</span>
              <a href="tel:0369845422" className="hover:text-background transition-colors">036.984.5422</a>
              <span className="text-background/30">|</span>
              <a href="tel:0986617939" className="hover:text-background transition-colors">098.661.7939</a>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-background/50">LK29-20 FLC Sầm Sơn, Thanh Hóa</span>

              {/* Auth quick links */}
              {!loading && user ? (
                <button onClick={() => navigate(isAdmin ? '/admin' : '/')} className="flex items-center gap-1 hover:text-background transition-colors">
                  <User className="h-3 w-3" />
                  <span className="max-w-[100px] truncate">{user.fullName}</span>
                </button>
              ) : !loading ? (
                <button onClick={() => navigate('/member')} className="flex items-center gap-1 hover:text-background transition-colors">
                  <User className="h-3 w-3" />
                  {isVi ? 'Đăng nhập' : 'Sign in'}
                </button>
              ) : null}

              {/* Language */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 hover:text-background transition-colors">
                  <Globe className="h-3 w-3" />
                  <span>{language.toUpperCase()}</span>
                  <ChevronDown className="h-2.5 w-2.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[120px]">
                  {(Object.keys(langLabels) as Language[]).map((lang) => (
                    <DropdownMenuItem
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={lang === language ? 'bg-secondary font-semibold' : ''}
                    >
                      {langLabels[lang]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main navigation - Vinpearl style: logo center, menus split */}
        <div className={`backdrop-blur-md border-b border-border/50 transition-all duration-300 ${
          scrolled ? 'bg-card/98 shadow-md' : 'bg-card/90'
        }`}>
          <div className={`container mx-auto px-4 transition-all duration-300 ${
            scrolled ? 'h-16' : 'h-20 lg:h-24'
          }`}>
            {/* Desktop: 3-column layout */}
            <div className="hidden lg:grid grid-cols-[1fr_auto_1fr] items-center h-full gap-2">
              {/* Left nav */}
              <nav className="flex items-center justify-end gap-0.5">
                {leftNavItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleNavClick(item.href)}
                    className="px-3 xl:px-4 py-2 text-[11px] xl:text-xs font-semibold uppercase tracking-widest text-foreground/70 hover:text-primary transition-colors whitespace-nowrap"
                  >
                    {t(item.key)}
                  </button>
                ))}
              </nav>

              {/* Center logo */}
              <Link to="/" className="flex items-center justify-center px-4 xl:px-8 shrink-0">
                <img
                  src={settings.header_logo_url || logoImg}
                  alt="Tuấn Đạt Luxury Hotel"
                  className={`w-auto object-contain transition-all duration-300 ${
                    scrolled ? 'h-12' : 'h-16 xl:h-20'
                  }`}
                />
              </Link>

              {/* Right nav */}
              <nav className="flex items-center justify-start gap-0.5">
                {rightNavItems.map((item: any) => (
                  <button
                    key={item.key || item.href}
                    onClick={() => handleNavClick(item.href)}
                    className="px-3 xl:px-4 py-2 text-[11px] xl:text-xs font-semibold uppercase tracking-widest text-foreground/70 hover:text-primary transition-colors whitespace-nowrap"
                  >
                    {item.key ? t(item.key) : (isVi ? item.labelVi : item.labelEn)}
                  </button>
                ))}

                {/* More dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="px-3 py-2 text-[11px] xl:text-xs font-semibold uppercase tracking-widest text-foreground/70 hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap">
                    {isVi ? 'Thêm' : 'More'} <ChevronDown className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {moreItems.map(item => (
                      <DropdownMenuItem key={item.href} onClick={() => handleNavClick(item.href)} className="cursor-pointer">
                        {isVi ? item.labelVi : item.labelEn}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Book Now CTA */}
                <Button
                  variant="gold"
                  size="sm"
                  className="ml-2 text-[11px] xl:text-xs uppercase tracking-wider font-bold px-5 rounded-sm"
                  onClick={() => navigate('/booking')}
                >
                  {isVi ? 'Đặt Ngay' : 'Book Now'}
                </Button>
              </nav>
            </div>

            {/* Mobile: logo center + hamburger */}
            <div className="flex lg:hidden items-center justify-between h-full">
              {/* Left: hamburger */}
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>

              {/* Center: logo */}
              <Link to="/" className="absolute left-1/2 -translate-x-1/2">
                <img
                  src={settings.header_logo_url || logoImg}
                  alt="Tuấn Đạt Luxury Hotel"
                  className={`w-auto object-contain transition-all duration-300 ${
                    scrolled ? 'h-10' : 'h-14'
                  }`}
                />
              </Link>

              {/* Right: actions */}
              <div className="flex items-center gap-1">
                <a href="tel:0986617939">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                    <Phone className="h-4 w-4" />
                  </Button>
                </a>

                {/* Language mobile */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Globe className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {(Object.keys(langLabels) as Language[]).map((lang) => (
                      <DropdownMenuItem
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={lang === language ? 'bg-secondary font-semibold' : ''}
                      >
                        {langLabels[lang]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User button for auth */}
                {!loading && user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <User className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-3 py-2">
                        <p className="text-sm font-semibold">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${TIER_COLORS[user.tier]}`}>
                          {TIER_LABELS[user.tier][language]}
                        </span>
                      </div>
                      <DropdownMenuSeparator />
                      {isAdmin && (
                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                          <Shield className="h-4 w-4 mr-2" /> Quản trị
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => signOut()}>
                        <LogOut className="h-4 w-4 mr-2" /> Đăng xuất
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : !loading ? (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/member')}>
                    <User className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-card border-t border-border animate-fade-in">
            <nav className="container mx-auto py-4 px-4 flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
              {allMobileItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.href)}
                  className="px-4 py-3 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-secondary rounded-md transition-colors text-left"
                >
                  {t(item.key)}
                </button>
              ))}
              {moreItems.filter(i => !allMobileItems.some(m => m.href === i.href)).map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className="px-4 py-3 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-secondary rounded-md transition-colors text-left"
                >
                  {isVi ? item.labelVi : item.labelEn}
                </button>
              ))}
              {!loading && !user && (
                <Button
                  variant="outline"
                  className="mt-2 w-full gap-2"
                  onClick={() => { setMobileOpen(false); navigate('/member'); }}
                >
                  <User className="h-4 w-4" /> Đăng nhập / Đăng ký
                </Button>
              )}
              <Button
                variant="gold"
                className="mt-2 w-full text-sm font-bold"
                onClick={() => { setMobileOpen(false); navigate('/booking'); }}
              >
                {isVi ? 'Đặt Ngay' : 'Book Now'}
              </Button>
            </nav>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
