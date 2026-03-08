import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Phone, Globe, User, LogOut, Crown, Shield } from 'lucide-react';
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
  { key: 'nav.about', href: '/#about' },
  { key: 'nav.services', href: '/#services' },
  { key: 'nav.dining', href: '/dining' },
  { key: 'nav.gallery', href: '/#gallery' },
  { key: 'nav.offers', href: '/#offers' },
  { key: 'nav.contact', href: '/#contact' }];


  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          {settings.header_logo_url ? (
            <img src={settings.header_logo_url} alt="Tuấn Đạt Luxury" className="h-10 w-auto object-contain" />
          ) : (
            <>
              <span className="font-display text-xl font-bold text-gold-gradient">Tuấn Đạt</span>
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">Luxury</span>
            </>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden xl:flex items-center gap-1">
          {navItems.map((item) =>
          <a
            key={item.key}
            href={item.href}
            className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors rounded-md hover:bg-secondary">
            
              {t(item.key)}
            </a>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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

          {/* Hotline */}
          


          

          {/* Auth */}
          {!loading && user && (
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
                  <DropdownMenuItem onClick={() => {signOut();}}>
                    <LogOut className="h-4 w-4 mr-2" /> Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          )}

          {/* Mobile toggle */}
          <Button variant="ghost" size="icon" className="xl:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
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
            

          
          </nav>
        </div>
      }
    </header>);

};

export default Header;