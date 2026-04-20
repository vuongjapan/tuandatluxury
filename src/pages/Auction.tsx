import { useEffect, useState, useMemo } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Flame, Eye, Clock, Gavel, History } from 'lucide-react';
import { toast } from 'sonner';

interface AuctionItem {
  id: string;
  title_vi: string;
  item_type: string;
  image_url: string | null;
  description_vi: string | null;
  list_price: number;
  start_price: number;
  bid_step: number;
  start_time: string;
  end_time: string;
  view_count: number;
  is_active: boolean;
}

interface Bid {
  id: string;
  auction_item_id: string;
  bidder_name: string;
  bidder_phone: string;
  bid_amount: number;
  created_at: string;
}

const fmt = (n: number) => (n || 0).toLocaleString('vi-VN') + '₫';

const Countdown = ({ end }: { end: string }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, new Date(end).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (diff <= 0) return <span className="text-destructive font-bold">Đã kết thúc</span>;
  return (
    <span className="font-mono font-bold text-primary">
      {d > 0 && `${d}n `}{String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
};

const maskPhone = (p: string) => p.length > 4 ? p.slice(0, 3) + '***' + p.slice(-2) : '***';

const AuctionPage = () => {
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<AuctionItem | null>(null);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidderName, setBidderName] = useState('');
  const [bidderPhone, setBidderPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    const [{ data: it }, { data: bd }] = await Promise.all([
      supabase.from('auction_items').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('auction_bids').select('*').order('bid_amount', { ascending: false }),
    ]);
    setItems((it as AuctionItem[]) || []);
    setBids((bd as Bid[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel('auction-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_bids' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_items' }, fetchAll)
      .subscribe();
    const fallback = setInterval(fetchAll, 5000);
    return () => { supabase.removeChannel(ch); clearInterval(fallback); };
  }, []);

  const getHighestBid = (itemId: string) => {
    const itemBids = bids.filter(b => b.auction_item_id === itemId);
    if (itemBids.length === 0) return 0;
    return Math.max(...itemBids.map(b => b.bid_amount));
  };

  const getCurrentPrice = (item: AuctionItem) => {
    const high = getHighestBid(item.id);
    return high > 0 ? high : item.start_price;
  };

  const getBidsForItem = (itemId: string) =>
    bids.filter(b => b.auction_item_id === itemId).sort((a, b) => b.bid_amount - a.bid_amount).slice(0, 10);

  const openBid = (item: AuctionItem) => {
    const min = getCurrentPrice(item) + (getHighestBid(item.id) > 0 ? item.bid_step : 0);
    setSelectedItem(item);
    setBidAmount(String(min));
  };

  const submitBid = async () => {
    if (!selectedItem) return;
    const amount = parseInt(bidAmount.replace(/\D/g, ''), 10);
    if (!amount || amount <= 0) return toast.error('Giá không hợp lệ');
    const current = getCurrentPrice(selectedItem);
    const minRequired = getHighestBid(selectedItem.id) > 0 ? current + selectedItem.bid_step : current;
    if (amount < minRequired) return toast.error(`Giá tối thiểu: ${fmt(minRequired)}`);
    if (!bidderName.trim() || bidderPhone.trim().length < 8) return toast.error('Vui lòng nhập tên và SĐT hợp lệ');

    setSubmitting(true);
    const { error } = await supabase.from('auction_bids').insert({
      auction_item_id: selectedItem.id,
      bidder_name: bidderName.trim(),
      bidder_phone: bidderPhone.trim(),
      bid_amount: amount,
    });
    setSubmitting(false);
    if (error) return toast.error('Đặt giá thất bại: ' + error.message);
    toast.success(`Đặt giá ${fmt(amount)} thành công!`);
    setSelectedItem(null);
    setBidderName(''); setBidderPhone('');
    fetchAll();
  };

  const viewerCount = useMemo(() => Math.floor(Math.random() * 30) + 5, [items.length]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-destructive/10 text-destructive font-semibold text-sm mb-3">
            <Flame className="h-4 w-4" /> ĐẤU GIÁ TRỰC TUYẾN
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Đấu giá phòng & combo</h1>
          <p className="text-muted-foreground text-sm">Trả giá thấp – nhận ưu đãi cao. Realtime cập nhật từng giây.</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <Gavel className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="font-semibold text-lg mb-1">Chưa có sản phẩm đấu giá</p>
            <p className="text-sm text-muted-foreground">Vui lòng quay lại sau!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map(item => {
              const currentPrice = getCurrentPrice(item);
              const hasBid = getHighestBid(item.id) > 0;
              const itemBids = getBidsForItem(item.id);
              return (
                <div key={item.id} className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all flex flex-col">
                  <div className="relative aspect-[4/3] bg-muted">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title_vi} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>
                    )}
                    <Badge className="absolute top-3 left-3 bg-destructive text-white border-0">
                      <Flame className="h-3 w-3 mr-1" /> {item.item_type === 'room' ? 'Phòng' : 'Combo'}
                    </Badge>
                    <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {viewerCount + (item.view_count || 0)}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-display text-lg font-bold mb-2 line-clamp-2">{item.title_vi}</h3>

                    <div className="space-y-1.5 mb-3 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Giá niêm yết:</span>
                        <span className="line-through">{fmt(item.list_price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Giá khởi điểm:</span>
                        <span className="font-medium">{fmt(item.start_price)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-border">
                        <span className="text-muted-foreground">Giá cao nhất:</span>
                        <span className="font-bold text-lg text-primary">{fmt(currentPrice)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Clock className="h-3 w-3" />
                      <Countdown end={item.end_time} />
                    </div>

                    {itemBids.length > 0 && (
                      <div className="text-xs bg-muted/50 rounded-lg p-2 mb-3 max-h-20 overflow-y-auto">
                        <div className="flex items-center gap-1 font-semibold text-muted-foreground mb-1">
                          <History className="h-3 w-3" /> Lịch sử ({itemBids.length})
                        </div>
                        {itemBids.slice(0, 3).map(b => (
                          <div key={b.id} className="flex justify-between">
                            <span>{maskPhone(b.bidder_phone)}</span>
                            <span className="font-semibold">{fmt(b.bid_amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button onClick={() => openBid(item)} className="w-full mt-auto bg-gradient-to-r from-destructive to-destructive/80 hover:opacity-90">
                      <Gavel className="h-4 w-4 mr-2" /> Trả giá ngay
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={!!selectedItem} onOpenChange={(o) => !o && setSelectedItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{selectedItem?.title_vi}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span>Giá hiện tại:</span><span className="font-bold text-primary">{fmt(getCurrentPrice(selectedItem))}</span></div>
                <div className="flex justify-between"><span>Bước giá:</span><span>{fmt(selectedItem.bid_step)}</span></div>
                <div className="flex justify-between"><span>Tối thiểu:</span><span className="font-semibold">{fmt(getCurrentPrice(selectedItem) + (getHighestBid(selectedItem.id) > 0 ? selectedItem.bid_step : 0))}</span></div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Giá của bạn (VNĐ)</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={bidAmount ? parseInt(bidAmount.replace(/\D/g, ''), 10).toLocaleString('vi-VN') : ''}
                  onChange={(e) => setBidAmount(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nhập giá"
                  className="text-lg font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium mb-1 block">Tên</label>
                  <Input value={bidderName} onChange={(e) => setBidderName(e.target.value)} placeholder="Họ tên" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">SĐT</label>
                  <Input value={bidderPhone} onChange={(e) => setBidderPhone(e.target.value)} placeholder="09xx" />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedItem(null)}>Hủy</Button>
            <Button onClick={submitBid} disabled={submitting} className="bg-destructive hover:bg-destructive/90">
              {submitting ? 'Đang gửi...' : 'Đặt giá'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AuctionPage;
