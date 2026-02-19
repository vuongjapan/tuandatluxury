import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Phone, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { language, setLanguage, t, langLabels } = useLanguage();
  const navigate = useNavigate();

  const navItems = [
    { key: 'nav.overview', href: '/#overview' },
    { key: 'nav.rooms', href: '/#rooms' },
    { key: 'nav.booking', href: '/booking' },
    { key: 'nav.about', href: '/#about' },
    { key: 'nav.services', href: '/#services' },
    { key: 'nav.dining', href: '/#dining' },
    { key: 'nav.gallery', href: '/#gallery' },
    { key: 'nav.offers', href: '/#offers' },
    { key: 'nav.contact', href: '/#contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="font-display text-xl font-bold text-gold-gradient">Tuấn Đạt</span>
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">Luxury</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden xl:flex items-center gap-1">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors rounded-md hover:bg-secondary"
            >
              {t(item.key)}
            </a>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">{langLabels[language]}</span>
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

          {/* Hotline */}
          <a href="tel:0986617939" className="hidden md:flex items-center gap-1 text-sm font-semibold text-foreground">
            <Phone className="h-4 w-4 text-primary" />
            098.661.7939
          </a>

          {/* CTA */}
          <Button variant="gold" size="sm" onClick={() => navigate('/booking')}>
            {t('hero.book_now')}
          </Button>

          {/* Mobile toggle */}
          <Button variant="ghost" size="icon" className="xl:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="xl:hidden bg-card border-t border-border animate-fade-in">
          <nav className="container mx-auto py-4 px-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-secondary rounded-md transition-colors"
              >
                {t(item.key)}
              </a>
            ))}
            <a href="tel:0986617939" className="px-4 py-3 text-sm font-semibold text-primary flex items-center gap-2">
              <Phone className="h-4 w-4" /> 098.661.7939
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
