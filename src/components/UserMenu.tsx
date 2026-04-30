import { useNavigate } from 'react-router-dom';
import { User, ChevronDown, LogOut, Shield, Calendar, MessageSquare, Gift, Settings as SettingsIcon, Crown } from 'lucide-react';
import { useAuth, TIER_LABELS, TIER_COLORS } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
  avatarUrl?: string | null;
  unreadCount?: number;
  upcomingCount?: number;
  compact?: boolean;
}

export const UserMenu = ({ avatarUrl, unreadCount = 0, upcomingCount = 0, compact = false }: Props) => {
  const { user, isAdmin, signOut } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  if (!user) return null;

  const totalBadge = unreadCount + upcomingCount;
  const firstName = user.fullName?.split(' ').slice(-1)[0] || user.fullName;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`relative flex items-center gap-2 rounded-full border border-border hover:border-primary/50 hover:bg-secondary/60 transition-all ${
            compact ? 'h-9 w-9 justify-center' : 'pl-1 pr-2.5 h-9'
          }`}
          aria-label="Tài khoản"
        >
          <span className="relative">
            <span className="block w-7 h-7 rounded-full bg-gold-gradient overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-primary-foreground" />
              )}
            </span>
            {totalBadge > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                {totalBadge > 9 ? '9+' : totalBadge}
              </span>
            )}
          </span>
          {!compact && (
            <>
              <span className="text-xs font-semibold text-foreground max-w-[80px] truncate">{firstName}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 to-secondary/40 px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gold-gradient flex items-center justify-center shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <User className="h-6 w-6 text-primary-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{user.fullName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
              <span className={`inline-flex items-center gap-1 mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${TIER_COLORS[user.tier]}`}>
                <Crown className="h-2.5 w-2.5" /> {TIER_LABELS[user.tier][language]}
              </span>
            </div>
          </div>
        </div>

        <div className="py-1">
          <Item icon={User} label="Trang cá nhân" onClick={() => navigate('/account#profile')} />
          <Item icon={Calendar} label="Đặt phòng của tôi" badge={upcomingCount} onClick={() => navigate('/account#bookings')} />
          <Item icon={MessageSquare} label="Nhắn tin với KS" badge={unreadCount} highlight={unreadCount > 0} onClick={() => navigate('/account#messages')} />
          <Item icon={Gift} label="Ưu đãi của tôi" onClick={() => navigate('/account#vouchers')} />
        </div>

        <DropdownMenuSeparator />

        <div className="py-1">
          <Item icon={SettingsIcon} label="Cài đặt" onClick={() => navigate('/account#settings')} />
          {isAdmin && <Item icon={Shield} label="Trang quản trị" onClick={() => navigate('/admin')} />}
          <DropdownMenuItem
            onClick={() => signOut()}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" /> Đăng xuất
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Item = ({ icon: Icon, label, badge, onClick, highlight }: any) => (
  <DropdownMenuItem onClick={onClick} className="cursor-pointer">
    <Icon className={`h-4 w-4 mr-2 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
    <span className="flex-1">{label}</span>
    {badge > 0 && (
      <span className={`min-w-[18px] h-4 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center ${
        highlight ? 'bg-red-600 text-white' : 'bg-primary/15 text-primary'
      }`}>
        {badge}
      </span>
    )}
  </DropdownMenuItem>
);
