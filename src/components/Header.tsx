import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Phone, Globe, User, LogOut, Shield } from 'lucide-react';
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

  const navItems = [
  { key: 'nav.overview', href: '/#overview' },
  { key: 'nav.rooms', href: '/#rooms' },
  { key: 'nav.booking', href: '/booking' },
  { key: 'nav.services', href: '/#services' },
  { key: 'nav.dining', href: '/dining' },
  { key: 'nav.gallery', href: '/#gallery' },
  { key: 'nav.offers', href: '/#offers' },
  { key: 'nav.contact', href: '/#contact' }];


  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top bar with hotline */}
      <div className="bg-foreground text-background/80 hidden sm:block">
        <div className="container mx-auto flex items-center justify-between h-8 px-4 text-xs">
          <div className="flex items-center gap-4">
            <a href="tel:0986617939" className="flex items-center gap-1 hover:text-primary transition-colors">098.661.7939-098.360.7568-036.984.5422
              <Phone className="h-3 w-3" /> 098.661.7939
            </a>
            <span className="text-background/40">|</span>
            <span>tuandatluxuryflc36hotel@gmail.com</span>
          </div>
          <div className="flex items-center gap-3">
            <span>LK29-20 cạnh cổng FLC Sầm Sơn, Thanh Hóa</span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            {settings.header_logo_url ?
            <img src={settings.header_logo_url} alt="Tuấn Đạt Luxury" className="h-10 w-auto object-contain" /> :

            <div className="flex items-center gap-2">
                <span className="font-display text-xl sm:text-2xl font-bold text-gold-gradient">Tuấn Đạt</span>
                <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-muted-foreground">Luxury Hotel</span>
              </div>
            }
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-0.5">
            {navItems.map((item) =>
            <a
              key={item.key}
              href={item.href}
              className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-foreground/70 hover:text-primary transition-colors">
              
                {t(item.key)}
              </a>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Hotline on mobile */}
            <a href="tel:0986617939" className="sm:hidden">
              <Button variant="ghost" size="icon" className="text-primary">
                <Phone className="h-4 w-4" />
              </Button>
            </a>

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
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
            {!loading && user &&
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
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
                  {isAdmin &&
                <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="h-4 w-4 mr-2" /> Quản trị
                    </DropdownMenuItem>
                }
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" /> Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }

            {/* Mobile toggle */}
            <Button variant="ghost" size="icon" className="xl:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen &&
      <div className="xl:hidden bg-card border-t border-border animate-fade-in">
          <nav className="container mx-auto py-4 px-4 flex flex-col gap-1">
            {navItems.map((item) =>
          <a
            key={item.key}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className="px-4 py-3 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-secondary rounded-md transition-colors">
            
                {t(item.key)}
              </a>
          )}
            <Button
            variant="gold"
            className="mt-3 w-full"
            onClick={() => {setMobileOpen(false);navigate('/booking');}}>
            
              {t('hero.book_now')}
            </Button>
          </nav>
        </div>
      }
    </header>);

};

export default Header;