import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Phone, Globe, User, LogOut, Shield, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { useAuth, TIER_LABELS, TIER_COLORS } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
'@/components/ui/dropdown-menu';

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { language, setLanguage, t, langLabels } = useLanguage();
  const { user, isAdmin, signOut, loading } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();

  const scrollToHash = (href: string) => {
    const hash = href.split('#')[1];
    if (hash && window.location.pathname === '/') {
      const el = document.getElementById(hash);
      if (el) {
        const headerHeight = document.querySelector('header')?.getBoundingClientRect().height || 80;
        const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
        window.scrollTo({ top, behavior: 'smooth' });
        return true;
      }
    }
    return false;
  };

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith('/#')) {
      if (window.location.pathname === '/') {
        scrollToHash(href);
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

  const navItems = [
    { key: 'nav.overview', href: '/#overview' },
    { key: 'nav.rooms_booking', href: '/#rooms' },
    { key: 'nav.services', href: '/services' },
    { key: 'nav.dining', href: '/cuisine' },
    { key: 'nav.food_order', href: '/food-order' },
    { key: 'nav.gallery', href: '/#gallery' },
    { key: 'nav.offers', href: '/#offers' },
  ];

  const moreItems = [
    { labelVi: 'Blog', labelEn: 'Blog', href: '/blog' },
    { labelVi: 'Hải sản khô', labelEn: 'Dried Seafood', href: '/seafood' },
    { labelVi: 'Điều khoản & Quy định', labelEn: 'Terms & Policies', href: '/terms' },
    { labelVi: 'Liên hệ', labelEn: 'Contact', href: '/#contact' },
  ];
  const isVi = language === 'vi';


  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top bar with hotline */}
      <div className="bg-foreground text-background/80 hidden sm:block">
        <div className="container mx-auto flex items-center justify-between h-8 px-4 text-xs">
          <div className="flex items-center gap-4">
            <a href="tel:0983605768" className="flex items-center gap-1 hover:text-primary transition-colors">
              <Phone className="h-3 w-3" /> 098.360.5768
            </a>
            <span className="text-background/40">|</span>
            <a href="tel:0369845422" className="flex items-center gap-1 hover:text-primary transition-colors">036.984.5422</a>
            <span className="text-background/40">|</span>
            <a href="tel:0986617939" className="flex items-center gap-1 hover:text-primary transition-colors">098.661.7939</a>
            <span className="text-background/40">|</span>
            <span>tuandatluxuryflc36hotel@gmail.com</span>
          </div>
          <div className="flex items-center gap-3">
            <span>LK29-20 cạnh cổng FLC Sầm Sơn, Thanh Hóa</span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className={`backdrop-blur-md border-b border-border shadow-sm transition-all duration-300 ${scrolled ? 'bg-card/98 py-0' : 'bg-card/95'}`}>
        <div className={`container mx-auto flex items-center justify-between px-4 transition-all duration-300 ${scrolled ? 'h-14' : 'h-16'}`}>
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            {settings.header_logo_url ?
            <img src={settings.header_logo_url} alt="Tuấn Đạt Luxury" className="h-10 w-auto object-contain" /> :
            <div className="flex flex-col leading-tight">
                <span className="font-display text-lg sm:text-2xl font-bold text-gold-gradient">Tuấn Đạt</span>
                <span className="text-[8px] sm:text-[10px] font-semibold tracking-[0.2em] sm:tracking-[0.25em] uppercase text-muted-foreground">Luxury Hotel</span>
              </div>
            }
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-0.5">
            {navItems.map((item) =>
            <button
              key={item.key}
              onClick={() => handleNavClick(item.href)}
              className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-foreground/70 hover:text-primary transition-colors">
                {t(item.key)}
              </button>
            )}
            {/* More dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-foreground/70 hover:text-primary transition-colors flex items-center gap-1">
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
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
            {/* Hotline on mobile */}
            <a href="tel:0986617939" className="sm:hidden">
              <Button variant="ghost" size="icon" className="text-primary h-8 w-8">
                <Phone className="h-4 w-4" />
              </Button>
            </a>

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 sm:gap-1">
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">{langLabels[language]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(langLabels) as Language[]).map((lang) =>
                <DropdownMenuItem
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={lang === language ? 'bg-secondary font-semibold' : ''}>
                  
                    {langLabels[lang]}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Book Now button - desktop */}
            <Button
              variant="gold"
              size="sm"
              className="hidden sm:flex text-xs uppercase tracking-wider font-semibold"
              onClick={() => navigate('/booking')}>
              
              {t('hero.book_now')}
            </Button>

            {/* Auth */}
            {!loading && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 h-8 px-2 sm:px-3 sm:gap-1.5">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline max-w-[100px] truncate text-xs">{user.fullName}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${TIER_COLORS[user.tier]}`}>
                      {user.tier === 'super_vip' ? '👑' : user.tier === 'vip' ? '⭐' : ''} {TIER_LABELS[user.tier][language]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-foreground">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">Đã đặt: {user.bookingCount} lần</p>
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
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 sm:gap-1.5"
                onClick={() => navigate('/member')}
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Đăng nhập</span>
              </Button>
            ) : null}

            {/* Mobile toggle */}
            <Button variant="ghost" size="icon" className="xl:hidden h-9 w-9 min-w-[36px]" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen &&
      <div className="xl:hidden bg-card border-t border-border animate-fade-in">
          <nav className="container mx-auto py-4 px-4 flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
            {navItems.map((item) =>
            <Link
              key={item.key}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className="px-4 py-3 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-secondary rounded-md transition-colors">
                {t(item.key)}
              </Link>
          )}
            {moreItems.map((item) =>
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setMobileOpen(false)}
            className="px-4 py-3 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-secondary rounded-md transition-colors">
                {isVi ? item.labelVi : item.labelEn}
              </Link>
          )}
            {!loading && !user && (
              <Button
                variant="outline"
                className="mt-2 w-full gap-2"
                onClick={() => {setMobileOpen(false);navigate('/member');}}>
                <User className="h-4 w-4" /> Đăng nhập / Đăng ký
              </Button>
            )}
            <Button
            variant="gold"
            className="mt-2 w-full"
            onClick={() => {setMobileOpen(false);navigate('/booking');}}>
            
              {t('hero.book_now')}
            </Button>
          </nav>
        </div>
      }
    </header>);

};

export default Header;