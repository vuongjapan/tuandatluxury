import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Crown, Star } from 'lucide-react';

interface Member {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string;
  booking_count: number;
  tier: 'normal' | 'vip' | 'super_vip';
  total_spent: number;
  last_booking: string | null;
  registered: boolean;
  registered_at: string | null;
}

const TIER_LABELS: Record<string, string> = {
  normal: 'Thành viên',
  vip: 'VIP',
  super_vip: 'Siêu VIP',
};

const TIER_COLORS: Record<string, string> = {
  normal: 'bg-muted text-muted-foreground',
  vip: 'bg-primary/20 text-primary',
  super_vip: 'bg-amber-100 text-amber-800',
};

const TIER_ICONS: Record<string, any> = {
  normal: Users,
  vip: Star,
  super_vip: Crown,
};

function getTier(count: number): string {
  if (count >= 10) return 'super_vip';
  if (count >= 3) return 'vip';
  return 'normal';
}

const AdminMembers = () => {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');

  const fetchMembers = async () => {
    setLoading(true);
    try {
      // Get all registered profiles (with email from profiles table)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, email, created_at');

      // Get all bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('guest_email, guest_name, guest_phone, total_price_vnd, status, created_at')
        .order('created_at', { ascending: false });

      // Build booking stats by email
      const emailStats = new Map<string, {
        name: string;
        phone: string;
        bookingCount: number;
        totalSpent: number;
        lastBooking: string | null;
      }>();

      (bookings || []).forEach(b => {
        if (!b.guest_email) return;
        const existing = emailStats.get(b.guest_email);
        const isConfirmed = b.status === 'confirmed';
        if (existing) {
          if (isConfirmed) existing.bookingCount++;
          existing.totalSpent += b.total_price_vnd || 0;
          if (!existing.lastBooking) existing.lastBooking = b.created_at;
        } else {
          emailStats.set(b.guest_email, {
            name: b.guest_name,
            phone: b.guest_phone,
            bookingCount: isConfirmed ? 1 : 0,
            totalSpent: b.total_price_vnd || 0,
            lastBooking: b.created_at,
          });
        }
      });

      // Build member list: start with registered profiles
      const memberMap = new Map<string, Member>();

      (profiles || []).forEach(p => {
        const email = p.email || '';
        if (!email) return;
        const stats = emailStats.get(email);
        const bookingCount = stats?.bookingCount || 0;
        memberMap.set(email, {
          user_id: p.user_id,
          full_name: p.full_name || stats?.name || null,
          phone: p.phone || stats?.phone || null,
          email,
          booking_count: bookingCount,
          tier: getTier(bookingCount) as any,
          total_spent: stats?.totalSpent || 0,
          last_booking: stats?.lastBooking || null,
          registered: true,
          registered_at: p.created_at,
        });
      });

      // Add non-registered guests from bookings
      emailStats.forEach((stats, email) => {
        if (!memberMap.has(email)) {
          memberMap.set(email, {
            user_id: email,
            full_name: stats.name,
            phone: stats.phone,
            email,
            booking_count: stats.bookingCount,
            tier: getTier(stats.bookingCount) as any,
            total_spent: stats.totalSpent,
            last_booking: stats.lastBooking,
            registered: false,
            registered_at: null,
          });
        }
      });

      const memberList = Array.from(memberMap.values());
      memberList.sort((a, b) => {
        // Registered first, then by total spent
        if (a.registered !== b.registered) return a.registered ? -1 : 1;
        return b.total_spent - a.total_spent;
      });
      setMembers(memberList);
    } catch (err: any) {
      toast({ title: 'Lỗi tải danh sách thành viên', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, []);

  const filteredMembers = members.filter(m => {
    const matchSearch = !search ||
      (m.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.phone || '').includes(search);
    const matchTier = filterTier === 'all' || m.tier === filterTier;
    return matchSearch && matchTier;
  });

  const stats = {
    total: members.length,
    registered: members.filter(m => m.registered).length,
    normal: members.filter(m => m.tier === 'normal').length,
    vip: members.filter(m => m.tier === 'vip').length,
    super_vip: members.filter(m => m.tier === 'super_vip').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Tổng khách hàng', value: stats.total, icon: Users, color: 'text-blue-600' },
          { label: 'Đã đăng ký', value: stats.registered, icon: Users, color: 'text-green-600' },
          { label: 'Thành viên', value: stats.normal, icon: Users, color: 'text-muted-foreground' },
          { label: 'VIP', value: stats.vip, icon: Star, color: 'text-primary' },
          { label: 'Siêu VIP', value: stats.super_vip, icon: Crown, color: 'text-amber-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, email, SĐT..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'normal', 'vip', 'super_vip'].map(tier => (
              <Button
                key={tier}
                variant={filterTier === tier ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterTier(tier)}
              >
                {tier === 'all' ? 'Tất cả' : TIER_LABELS[tier]}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Member list */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">Không tìm thấy khách hàng nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-secondary">
                <tr>
                  {['Khách hàng', 'Email', 'SĐT', 'Trạng thái', 'Số đặt phòng', 'Tổng chi tiêu', 'Hạng', 'Lần đặt cuối'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMembers.map(m => {
                  const TierIcon = TIER_ICONS[m.tier];
                  return (
                    <tr key={m.email} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{m.full_name || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.phone || '—'}</td>
                      <td className="px-4 py-3">
                        {m.registered ? (
                          <Badge className="bg-green-100 text-green-700 text-xs">✓ Đã đăng ký</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Khách vãng lai</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold">{m.booking_count}</td>
                      <td className="px-4 py-3 font-semibold text-primary">{m.total_spent.toLocaleString('vi')}₫</td>
                      <td className="px-4 py-3">
                        <Badge className={`${TIER_COLORS[m.tier]} text-xs`}>
                          <TierIcon className="h-3 w-3 mr-1" />
                          {TIER_LABELS[m.tier]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {m.last_booking ? new Date(m.last_booking).toLocaleDateString('vi') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        💡 Hạng thành viên tự động xác định: Thường (0-2 đặt phòng), VIP (3-9), Siêu VIP (10+).
        Giảm giá tự động: Thường 5%, VIP 10%, Siêu VIP 15%.
      </p>
    </div>
  );
};

export default AdminMembers;
