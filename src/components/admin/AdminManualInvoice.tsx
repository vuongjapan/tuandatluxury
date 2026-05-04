import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, FileText, Mail, Loader2, Search, Eye, Send, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const LAST_EMAIL_KEY = 'admin_manual_invoice_last_email';

interface Room { id: string; name_vi: string; price_vnd: number }
interface MenuItem { id: string; name_vi: string; price_vnd: number; category: string }
interface InvoiceItem {
  id: string; // local
  item_type: 'food' | 'combo' | 'custom' | 'service';
  ref_id?: string;
  name: string;
  quantity: number;
  unit_price: number;
}

const fmt = (v: number) => (v || 0).toLocaleString('vi-VN') + '₫';

// Format: TD + YYYYMM + M + 5-digit sequence (per month)
// M = Manual (admin-created), giống flow tự động (A) để webhook nhận diện chung
const generateInvoiceCode = async (): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `TD${year}${month}M`;
  const { data } = await supabase
    .from('manual_invoices')
    .select('invoice_code')
    .like('invoice_code', `${prefix}%`)
    .order('invoice_code', { ascending: false })
    .limit(1);
  let next = 1;
  if (data && data.length > 0) {
    const last = (data[0] as any).invoice_code as string;
    const n = parseInt(last.replace(prefix, ''), 10);
    if (!isNaN(n)) next = n + 1;
  }
  return `${prefix}${String(next).padStart(5, '0')}`;
};

const AdminManualInvoice = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any>(null);

  // form state
  const [code, setCode] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestsCount, setGuestsCount] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [roomId, setRoomId] = useState<string>('');
  const [roomName, setRoomName] = useState('');
  const [roomQty, setRoomQty] = useState(1);
  const [roomPricePerNight, setRoomPricePerNight] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountNote, setDiscountNote] = useState('');
  const [depositAmount, setDepositAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [search, setSearch] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [emailDialog, setEmailDialog] = useState<{ open: boolean; invoiceId: string | null; email: string }>({ open: false, invoiceId: null, email: '' });

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const n = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
    return n;
  }, [checkIn, checkOut]);

  const roomSubtotal = useMemo(() => roomPricePerNight * nights * roomQty, [roomPricePerNight, nights, roomQty]);
  const foodSubtotal = useMemo(() => items.filter(i => i.item_type !== 'custom').reduce((s, i) => s + i.unit_price * i.quantity, 0), [items]);
  const customSubtotal = useMemo(() => items.filter(i => i.item_type === 'custom').reduce((s, i) => s + i.unit_price * i.quantity, 0), [items]);
  const totalAmount = Math.max(0, roomSubtotal + foodSubtotal + customSubtotal - discountAmount);
  const remainingAmount = Math.max(0, totalAmount - depositAmount);

  const loadData = async () => {
    const [{ data: r }, { data: m }, { data: inv }] = await Promise.all([
      supabase.from('rooms').select('id, name_vi, price_vnd').eq('is_active', true).order('price_vnd'),
      supabase.from('menu_items').select('id, name_vi, price_vnd, category').eq('is_active', true).order('sort_order'),
      supabase.from('manual_invoices').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    setRooms(r as any || []);
    setMenuItems(m as any || []);
    setInvoices(inv || []);
  };

  useEffect(() => { loadData(); }, []);

  // Prefill from chatbot session if any
  useEffect(() => {
    const raw = sessionStorage.getItem('chat_to_invoice');
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      if (d.guest_name) setGuestName(d.guest_name);
      if (d.guest_phone) setGuestPhone(d.guest_phone);
      if (d.guest_email) setGuestEmail(d.guest_email);
      if (d.check_in) setCheckIn(d.check_in);
      if (d.check_out) setCheckOut(d.check_out);
      if (d.guests) setGuestsCount(Number(d.guests) || 2);
      if (d.notes) setNotes(d.notes);
      setView('create');
    } catch {}
    sessionStorage.removeItem('chat_to_invoice');
  }, []);

  const resetForm = async () => {
    setCode(await generateInvoiceCode());
    setGuestName(''); setGuestPhone(''); setGuestEmail('');
    setCheckIn(''); setCheckOut(''); setGuestsCount(2); setChildrenCount(0);
    setRoomId(''); setRoomName(''); setRoomQty(1); setRoomPricePerNight(0);
    setDiscountAmount(0); setDiscountNote(''); setDepositAmount(0); setNotes('');
    setItems([]);
  };

  const onPickRoom = (id: string) => {
    setRoomId(id);
    const r = rooms.find(x => x.id === id);
    if (r) {
      setRoomName(r.name_vi);
      setRoomPricePerNight(r.price_vnd);
    }
  };

  const addMenuItem = (mi: MenuItem) => {
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      item_type: 'food',
      ref_id: mi.id,
      name: mi.name_vi,
      quantity: 1,
      unit_price: mi.price_vnd,
    }]);
  };

  const addCustomLine = () => {
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      item_type: 'custom',
      name: '',
      quantity: 1,
      unit_price: 0,
    }]);
  };

  const updateItem = (id: string, patch: Partial<InvoiceItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const saveInvoice = async (): Promise<string | null> => {
    if (!guestName.trim() || !guestPhone.trim()) {
      toast({ title: 'Cần tên và SĐT khách', variant: 'destructive' });
      return null;
    }
    setSubmitting(true);
    const finalCode = code || (await generateInvoiceCode());
    if (!code) setCode(finalCode);
    const { data: inv, error } = await supabase.from('manual_invoices').insert({
      invoice_code: finalCode,
      guest_name: guestName,
      guest_phone: guestPhone,
      guest_email: guestEmail || null,
      check_in: checkIn || null,
      check_out: checkOut || null,
      guests_count: guestsCount,
      children_count: childrenCount,
      room_id: roomId || null,
      room_name: roomName || null,
      room_quantity: roomQty,
      nights,
      room_price_per_night: roomPricePerNight,
      room_subtotal: roomSubtotal,
      food_subtotal: foodSubtotal,
      custom_subtotal: customSubtotal,
      discount_amount: discountAmount,
      discount_note: discountNote || null,
      total_amount: totalAmount,
      deposit_amount: depositAmount,
      remaining_amount: remainingAmount,
      payment_status: depositAmount >= totalAmount ? 'PAID' : (depositAmount > 0 ? 'PARTIAL' : 'PENDING'),
      notes: notes || null,
    }).select().single();

    if (error || !inv) {
      setSubmitting(false);
      toast({ title: 'Lỗi lưu hóa đơn', description: error?.message, variant: 'destructive' });
      return null;
    }

    if (items.length > 0) {
      const itemsPayload = items.map((i, idx) => ({
        invoice_id: inv.id,
        item_type: i.item_type,
        ref_id: i.ref_id || null,
        name: i.name || 'Mục',
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.unit_price * i.quantity,
        sort_order: idx,
      }));
      await supabase.from('manual_invoice_items').insert(itemsPayload);
    }

    setSubmitting(false);
    toast({ title: '✅ Đã tạo hóa đơn ' + finalCode });
    resetForm();
    loadData();
    setView('list');
    return inv.id;
  };

  const openDetail = async (id: string) => {
    setDetailId(id);
    const [{ data: inv }, { data: its }] = await Promise.all([
      supabase.from('manual_invoices').select('*').eq('id', id).single(),
      supabase.from('manual_invoice_items').select('*').eq('invoice_id', id).order('sort_order'),
    ]);
    setDetailData({ ...inv, items: its || [] });
    setView('detail');
  };

  const sendEmail = async (invoiceId: string, recipientOverride?: string) => {
    setSendingEmail(invoiceId);
    try {
      const body: any = { invoice_id: invoiceId };
      if (recipientOverride) body.recipient_email = recipientOverride;
      const { data, error } = await supabase.functions.invoke('send-manual-invoice-email', { body });
      if (error) throw error;
      const sentTo = (data as any)?.sent_to || recipientOverride;
      if (sentTo) localStorage.setItem(LAST_EMAIL_KEY, sentTo);
      await supabase.from('manual_invoices').update({ email_sent_at: new Date().toISOString() }).eq('id', invoiceId);
      toast({ title: '✅ Đã gửi email + PDF', description: sentTo ? `Tới: ${sentTo}` : undefined });
      loadData();
      if (detailData?.id === invoiceId) openDetail(invoiceId);
    } catch (e: any) {
      toast({ title: 'Lỗi gửi email', description: e?.message, variant: 'destructive' });
    } finally {
      setSendingEmail(null);
    }
  };

  const openSendDialog = (invoiceId: string, defaultEmail?: string) => {
    const last = localStorage.getItem(LAST_EMAIL_KEY) || '';
    setEmailDialog({ open: true, invoiceId, email: defaultEmail || last });
  };

  const downloadPdf = async (invoiceId: string, code: string) => {
    setDownloadingPdf(invoiceId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-manual-invoice-pdf', {
        body: { invoice_id: invoiceId },
      });
      if (error) throw error;
      const { pdf_base64, pdf_name } = data as { pdf_base64: string; pdf_name: string };
      const bytes = Uint8Array.from(atob(pdf_base64), c => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf_name || `HoaDon-${code}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast({ title: '✅ Đã tải PDF' });
    } catch (e: any) {
      toast({ title: 'Lỗi tải PDF', description: e?.message, variant: 'destructive' });
    } finally {
      setDownloadingPdf(null);
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm('Xóa hóa đơn này?')) return;
    await supabase.from('manual_invoices').delete().eq('id', id);
    loadData();
    toast({ title: 'Đã xóa' });
  };

  const filteredMenu = useMemo(() => {
    const q = menuSearch.trim().toLowerCase();
    return q ? menuItems.filter(m => m.name_vi.toLowerCase().includes(q)) : menuItems.slice(0, 30);
  }, [menuSearch, menuItems]);

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter(i =>
      i.invoice_code?.toLowerCase().includes(q) ||
      i.guest_name?.toLowerCase().includes(q) ||
      i.guest_phone?.includes(q)
    );
  }, [search, invoices]);

  const emailDialogJsx = (
    <Dialog open={emailDialog.open} onOpenChange={(o) => setEmailDialog(s => ({ ...s, open: o }))}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gửi hóa đơn qua email</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Email người nhận</Label>
          <Input
            type="email"
            value={emailDialog.email}
            onChange={(e) => setEmailDialog(s => ({ ...s, email: e.target.value }))}
            placeholder="khach@email.com"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            📎 Email sẽ kèm file PDF hóa đơn. Địa chỉ này sẽ được nhớ cho lần gửi sau.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEmailDialog(s => ({ ...s, open: false }))}>Hủy</Button>
          <Button
            onClick={async () => {
              if (!emailDialog.email.trim() || !emailDialog.invoiceId) return;
              const id = emailDialog.invoiceId;
              const to = emailDialog.email.trim();
              setEmailDialog({ open: false, invoiceId: null, email: '' });
              await sendEmail(id, to);
            }}
            disabled={!emailDialog.email.trim() || sendingEmail !== null}
          >
            <Send className="h-4 w-4 mr-2" /> Gửi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ====== DETAIL VIEW ======
  if (view === 'detail' && detailData) {
    return (
      <>
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => { setView('list'); setDetailData(null); }}>← Quay lại</Button>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => downloadPdf(detailData.id, detailData.invoice_code)} disabled={downloadingPdf === detailData.id}>
              {downloadingPdf === detailData.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Tải PDF
            </Button>
            <Button onClick={() => openSendDialog(detailData.id, detailData.guest_email)} disabled={sendingEmail === detailData.id}>
              {sendingEmail === detailData.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Gửi email + PDF
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Mã hóa đơn</p>
              <p className="font-display text-xl font-bold">{detailData.invoice_code}</p>
              <p className="text-[10px] text-muted-foreground mt-1">🖊 Thủ công · Webhook tự nhận diện mã M</p>
            </div>
            <Badge variant={detailData.payment_status === 'PAID' ? 'default' : detailData.payment_status === 'DEPOSIT_PAID' ? 'default' : 'secondary'}>
              {detailData.payment_status === 'PAID' ? '✅ Đã thanh toán đủ'
                : detailData.payment_status === 'DEPOSIT_PAID' ? '🟢 Đã nhận cọc'
                : detailData.payment_status === 'PARTIAL' ? '💰 Đặt cọc một phần'
                : '🟠 Chờ thanh toán cọc'}
            </Badge>
          </div>

          {/* Action panel theo trạng thái */}
          {(detailData.payment_status === 'PENDING' || !detailData.payment_status) && detailData.deposit_amount === 0 && (
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg p-3 space-y-2 text-sm">
              <p className="font-medium">🔄 Đang chờ webhook tự động (khách chuyển khoản)</p>
              <p className="text-xs text-muted-foreground">Hoặc xác nhận thủ công nếu khách trả tiền mặt:</p>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const amt = parseInt(prompt('Số tiền đã nhận (VNĐ):', String(Math.round(detailData.total_amount * 0.5))) || '0');
                  if (!amt || amt <= 0) return;
                  const isFull = amt >= detailData.total_amount - 1000;
                  await supabase.from('manual_invoices').update({
                    payment_status: isFull ? 'PAID' : 'DEPOSIT_PAID',
                    deposit_amount: amt,
                    remaining_amount: Math.max(0, detailData.total_amount - amt),
                  }).eq('id', detailData.id);
                  toast({ title: '✅ Đã xác nhận cọc thủ công' });
                  if (detailData.guest_email) {
                    sendEmail(detailData.id, detailData.guest_email);
                  } else {
                    openDetail(detailData.id);
                  }
                }}
              >
                ✅ Xác nhận đã nhận cọc thủ công
              </Button>
            </div>
          )}
          {(detailData.payment_status === 'DEPOSIT_PAID' || detailData.payment_status === 'PAID') && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg p-3 text-sm">
              <p className="font-medium">💰 Đã nhận: {fmt(detailData.deposit_amount)}</p>
              {detailData.email_sent_at && (
                <p className="text-xs text-muted-foreground mt-1">📧 Đã gửi email xác nhận lúc {new Date(detailData.email_sent_at).toLocaleString('vi-VN')}</p>
              )}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Khách:</span> <strong>{detailData.guest_name}</strong></div>
            <div><span className="text-muted-foreground">SĐT:</span> {detailData.guest_phone}</div>
            <div><span className="text-muted-foreground">Email:</span> {detailData.guest_email || '—'}</div>
            <div><span className="text-muted-foreground">Số khách:</span> {detailData.guests_count} NL + {detailData.children_count} TE</div>
            <div><span className="text-muted-foreground">Nhận phòng:</span> {detailData.check_in || '—'}</div>
            <div><span className="text-muted-foreground">Trả phòng:</span> {detailData.check_out || '—'}</div>
          </div>

          {detailData.room_name && (
            <div className="bg-secondary p-3 rounded-lg text-sm">
              <p className="font-semibold">{detailData.room_name} × {detailData.room_quantity} phòng × {detailData.nights} đêm</p>
              <p className="text-muted-foreground">{fmt(detailData.room_price_per_night)} / đêm = <strong>{fmt(detailData.room_subtotal)}</strong></p>
            </div>
          )}

          {detailData.items?.length > 0 && (
            <div className="space-y-1">
              <p className="font-semibold text-sm">Món ăn / Dịch vụ:</p>
              {detailData.items.map((it: any) => (
                <div key={it.id} className="flex justify-between text-sm py-1 border-b border-border/50">
                  <span>{it.name} × {it.quantity}</span>
                  <span className="font-medium">{fmt(it.total_price)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-border pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>Tiền phòng</span><span>{fmt(detailData.room_subtotal)}</span></div>
            <div className="flex justify-between"><span>Tiền ăn / dịch vụ</span><span>{fmt(detailData.food_subtotal + detailData.custom_subtotal)}</span></div>
            {detailData.discount_amount > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Giảm giá {detailData.discount_note ? `(${detailData.discount_note})` : ''}</span>
                <span>-{fmt(detailData.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg text-primary border-t border-border pt-2">
              <span>TỔNG THANH TOÁN</span><span>{fmt(detailData.total_amount)}</span>
            </div>
            <div className="flex justify-between text-sm"><span>Đã đặt cọc</span><span>{fmt(detailData.deposit_amount)}</span></div>
            <div className="flex justify-between font-semibold"><span>Còn lại</span><span>{fmt(detailData.remaining_amount)}</span></div>
          </div>

          {detailData.notes && (
            <div className="bg-muted p-3 rounded text-sm"><strong>Ghi chú:</strong> {detailData.notes}</div>
          )}

          {detailData.email_sent_at && (
            <p className="text-xs text-muted-foreground">📧 Đã gửi email lúc {new Date(detailData.email_sent_at).toLocaleString('vi-VN')}</p>
          )}
        </div>
      </div>
      {emailDialogJsx}
      </>
    );
  }

  // ====== LIST VIEW ======
  if (view === 'list') {
    return (
      <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm mã / tên / SĐT" className="pl-8" />
          </div>
          <Button onClick={() => { resetForm(); setView('create'); }}>
            <Plus className="h-4 w-4 mr-2" /> Tạo hóa đơn mới
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase">
              <tr>
                <th className="text-left p-3">Mã</th>
                <th className="text-left p-3">Khách</th>
                <th className="text-left p-3 hidden sm:table-cell">Phòng</th>
                <th className="text-right p-3">Tổng</th>
                <th className="text-center p-3">TT</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(i => (
                <tr key={i.id} className="border-t border-border hover:bg-secondary/50">
                  <td className="p-3 font-mono text-xs">
                    <div>{i.invoice_code}</div>
                    <span className="text-[9px] text-muted-foreground">🖊 Thủ công</span>
                  </td>
                  <td className="p-3">
                    <p className="font-medium">{i.guest_name}</p>
                    <p className="text-xs text-muted-foreground">{i.guest_phone}</p>
                  </td>
                  <td className="p-3 hidden sm:table-cell text-xs">{i.room_name || '—'}</td>
                  <td className="p-3 text-right font-semibold text-primary">{fmt(i.total_amount)}</td>
                  <td className="p-3 text-center">
                    <Badge variant={i.payment_status === 'PAID' || i.payment_status === 'DEPOSIT_PAID' ? 'default' : 'secondary'} className="text-[10px]">
                      {i.payment_status === 'PAID' ? '✅' : i.payment_status === 'DEPOSIT_PAID' ? '🟢' : i.payment_status === 'PARTIAL' ? '💰' : '⏳'}
                    </Badge>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <Button variant="ghost" size="icon" onClick={() => openDetail(i.id)} title="Xem chi tiết">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => downloadPdf(i.id, i.invoice_code)} disabled={downloadingPdf === i.id} title="Tải PDF">
                      {downloadingPdf === i.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openSendDialog(i.id, i.guest_email)} disabled={sendingEmail === i.id} title="Gửi email + PDF">
                      {sendingEmail === i.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteInvoice(i.id)} title="Xóa">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Chưa có hóa đơn nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {emailDialogJsx}
      </>
    );
  }

  // ====== CREATE VIEW ======
  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setView('list')}>← Quay lại danh sách</Button>
        <p className="text-sm text-muted-foreground">Mã: <strong className="font-mono text-foreground">{code}</strong></p>
      </div>

      {/* Guest info */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
        <h3 className="font-semibold">👤 Thông tin khách</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label>Họ tên *</Label><Input value={guestName} onChange={e => setGuestName(e.target.value)} /></div>
          <div><Label>SĐT *</Label><Input value={guestPhone} onChange={e => setGuestPhone(e.target.value)} /></div>
          <div><Label>Email (để gửi hóa đơn)</Label><Input type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Người lớn</Label><Input type="number" min={1} value={guestsCount} onChange={e => setGuestsCount(parseInt(e.target.value) || 1)} /></div>
            <div><Label>Trẻ em</Label><Input type="number" min={0} value={childrenCount} onChange={e => setChildrenCount(parseInt(e.target.value) || 0)} /></div>
          </div>
          <div><Label>Nhận phòng</Label><Input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} /></div>
          <div><Label>Trả phòng</Label><Input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} /></div>
        </div>
      </div>

      {/* Room */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
        <h3 className="font-semibold">🛏️ Phòng (admin có thể sửa giá)</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Chọn phòng</Label>
            <Select value={roomId} onValueChange={onPickRoom}>
              <SelectTrigger><SelectValue placeholder="-- Chọn phòng --" /></SelectTrigger>
              <SelectContent>
                {rooms.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name_vi} ({fmt(r.price_vnd)})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tên phòng (có thể sửa)</Label>
            <Input value={roomName} onChange={e => setRoomName(e.target.value)} />
          </div>
          <div>
            <Label>Giá / đêm (VNĐ) — admin tự nhập</Label>
            <Input type="number" value={roomPricePerNight} onChange={e => setRoomPricePerNight(parseInt(e.target.value) || 0)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Số phòng</Label><Input type="number" min={1} value={roomQty} onChange={e => setRoomQty(parseInt(e.target.value) || 1)} /></div>
            <div><Label>Số đêm</Label><Input type="number" value={nights} disabled /></div>
          </div>
        </div>
        <p className="text-sm bg-secondary p-2 rounded">
          Tiền phòng: <strong className="text-primary">{fmt(roomSubtotal)}</strong> ({fmt(roomPricePerNight)} × {nights} đêm × {roomQty} phòng)
        </p>
      </div>

      {/* Food / items */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">🍽️ Thực đơn / Dịch vụ</h3>
          <Button size="sm" variant="outline" onClick={addCustomLine}>
            <Plus className="h-3 w-3 mr-1" />Thêm dòng tự do
          </Button>
        </div>

        <div>
          <Label>Tìm món thêm vào hóa đơn</Label>
          <Input value={menuSearch} onChange={e => setMenuSearch(e.target.value)} placeholder="Gõ tên món..." />
          {menuSearch && (
            <div className="mt-2 max-h-40 overflow-y-auto border border-border rounded-lg">
              {filteredMenu.map(mi => (
                <button
                  key={mi.id}
                  onClick={() => { addMenuItem(mi); setMenuSearch(''); }}
                  className="w-full text-left px-3 py-2 hover:bg-secondary text-sm flex justify-between border-b border-border/50 last:border-0"
                >
                  <span>{mi.name_vi}</span>
                  <span className="text-muted-foreground">{fmt(mi.price_vnd)}</span>
                </button>
              ))}
              {filteredMenu.length === 0 && <p className="text-xs text-muted-foreground p-3">Không tìm thấy</p>}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="space-y-2">
            {items.map(it => (
              <div key={it.id} className="grid grid-cols-12 gap-2 items-center bg-secondary p-2 rounded-lg">
                <Input
                  className="col-span-5"
                  value={it.name}
                  onChange={e => updateItem(it.id, { name: e.target.value })}
                  placeholder="Tên mục"
                />
                <Input
                  type="number"
                  className="col-span-2"
                  value={it.quantity}
                  onChange={e => updateItem(it.id, { quantity: parseInt(e.target.value) || 1 })}
                  placeholder="SL"
                />
                <Input
                  type="number"
                  className="col-span-3"
                  value={it.unit_price}
                  onChange={e => updateItem(it.id, { unit_price: parseInt(e.target.value) || 0 })}
                  placeholder="Đơn giá"
                />
                <span className="col-span-1 text-right text-xs font-medium">{fmt(it.unit_price * it.quantity)}</span>
                <Button variant="ghost" size="icon" onClick={() => removeItem(it.id)} className="col-span-1">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <p className="text-sm text-right">
              Tiền ăn / dịch vụ: <strong className="text-primary">{fmt(foodSubtotal + customSubtotal)}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Discount + payment */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
        <h3 className="font-semibold">💰 Giảm giá & Thanh toán</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label>Giảm giá (VNĐ)</Label><Input type="number" value={discountAmount} onChange={e => setDiscountAmount(parseInt(e.target.value) || 0)} /></div>
          <div><Label>Lý do giảm</Label><Input value={discountNote} onChange={e => setDiscountNote(e.target.value)} placeholder="Khách quen, voucher..." /></div>
          <div><Label>Đã đặt cọc (VNĐ)</Label><Input type="number" value={depositAmount} onChange={e => setDepositAmount(parseInt(e.target.value) || 0)} /></div>
          <div className="flex items-end">
            <div className="bg-primary/10 border border-primary/30 p-3 rounded-lg w-full">
              <p className="text-xs text-muted-foreground">Tổng thanh toán</p>
              <p className="text-2xl font-bold text-primary">{fmt(totalAmount)}</p>
              <p className="text-xs">Còn lại: <strong>{fmt(remainingAmount)}</strong></p>
            </div>
          </div>
        </div>
        <div>
          <Label>Ghi chú nội bộ</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        </div>
      </div>

      <div className="flex gap-2 sticky bottom-0 bg-background py-3 border-t border-border">
        <Button onClick={saveInvoice} disabled={submitting} size="lg" className="flex-1">
          {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
          Tạo hóa đơn
        </Button>
        <Button
          variant="outline"
          size="lg"
          disabled={submitting}
          onClick={async () => {
            const id = await saveInvoice();
            if (id) openSendDialog(id, guestEmail);
          }}
        >
          <Send className="h-4 w-4 mr-2" />Tạo + Gửi email
        </Button>
      </div>
      {emailDialogJsx}
    </div>
  );
};

export default AdminManualInvoice;
