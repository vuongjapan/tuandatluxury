import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, FileText, Mail, Loader2, Search, Eye, Send, Download, Mic, MicOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const LAST_EMAIL_KEY = 'admin_manual_invoice_last_email';

interface Room { id: string; name_vi: string; price_vnd: number }
interface MenuItem { id: string; name_vi: string; price_vnd: number; category: string }
interface MealPlan { id: string; name: string; price: number; guest_count: number; items?: string[]; note?: string }
interface ComboPkg { id: string; name: string; price_per_person: number; menu_count: number; dishes_per_menu: number }
interface ComboMenu { id: string; combo_package_id: string; menu_number: number; name_vi: string }
interface ComboDish { id: string; combo_menu_id: string; name_vi: string }
interface InvoiceItem {
  id: string; // local
  item_type: 'food' | 'combo' | 'custom' | 'service';
  ref_id?: string;
  name: string;
  quantity: number;
  unit_price: number;
}
interface RoomLine {
  id: string;
  room_id?: string | null;
  room_name: string;
  room_count: number;
  nights: number;
  price_per_night: number;
}
const newRoomLine = (): RoomLine => ({
  id: crypto.randomUUID(),
  room_name: '',
  room_count: 1,
  nights: 1,
  price_per_night: 0,
});

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
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [comboPkgs, setComboPkgs] = useState<ComboPkg[]>([]);
  const [comboMenus, setComboMenus] = useState<ComboMenu[]>([]);
  const [comboDishes, setComboDishes] = useState<ComboDish[]>([]);
  const [comboGuestCount, setComboGuestCount] = useState<number>(6);
  const [menuSource, setMenuSource] = useState<'meals' | 'menu' | 'combo'>('meals');
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
  const [roomLines, setRoomLines] = useState<RoomLine[]>([newRoomLine()]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountNote, setDiscountNote] = useState('');
  const [depositPercent, setDepositPercent] = useState<number>(50); // 30 | 50 | 70 | 100 | -1 (custom)
  const [depositAmount, setDepositAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [search, setSearch] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [emailDialog, setEmailDialog] = useState<{ open: boolean; invoiceId: string | null; email: string }>({ open: false, invoiceId: null, email: '' });
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceParsing, setVoiceParsing] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const autoNights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const n = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
    return n;
  }, [checkIn, checkOut]);

  // Auto-update nights for ALL roomLines when stay dates change (admin can still override per row)
  useEffect(() => {
    setRoomLines(prev => prev.map(rl => ({ ...rl, nights: autoNights })));
  }, [autoNights]);

  const roomSubtotal = useMemo(
    () => roomLines.reduce((s, rl) => s + (rl.price_per_night || 0) * (rl.nights || 0) * (rl.room_count || 0), 0),
    [roomLines]
  );
  const foodSubtotal = useMemo(() => items.filter(i => i.item_type !== 'custom').reduce((s, i) => s + i.unit_price * i.quantity, 0), [items]);
  const customSubtotal = useMemo(() => items.filter(i => i.item_type === 'custom').reduce((s, i) => s + i.unit_price * i.quantity, 0), [items]);
  const totalAmount = Math.max(0, roomSubtotal + foodSubtotal + customSubtotal - discountAmount);
  const remainingAmount = Math.max(0, totalAmount - depositAmount);

  // Auto-recalc deposit when total or % changes (skip if custom -1)
  useEffect(() => {
    if (depositPercent < 0) return;
    setDepositAmount(Math.round(totalAmount * depositPercent / 100));
  }, [totalAmount, depositPercent]);

  const loadData = async () => {
    const [{ data: r }, { data: m }, { data: inv }, { data: mp }, { data: cp }, { data: cm }, { data: cd }] = await Promise.all([
      supabase.from('rooms').select('id, name_vi, price_vnd').eq('is_active', true).order('price_vnd'),
      supabase.from('menu_items').select('id, name_vi, price_vnd, category').eq('is_active', true).order('sort_order'),
      supabase.from('manual_invoices').select('*').order('created_at', { ascending: false }).limit(100),
      (supabase as any).from('personal_meal_plans').select('id, name, price, guest_count, items, note').eq('is_active', true).order('guest_count').order('sort_order'),
      (supabase as any).from('combo_packages').select('id, name, price_per_person, menu_count, dishes_per_menu').eq('is_active', true).order('sort_order'),
      (supabase as any).from('combo_menus').select('id, combo_package_id, menu_number, name_vi').eq('is_active', true).order('menu_number'),
      (supabase as any).from('combo_menu_dishes').select('id, combo_menu_id, name_vi').order('sort_order'),
    ]);
    setRooms(r as any || []);
    setMenuItems(m as any || []);
    setInvoices(inv || []);
    setMealPlans((mp as any) || []);
    setComboPkgs((cp as any) || []);
    setComboMenus((cm as any) || []);
    setComboDishes((cd as any) || []);
  };

  useEffect(() => { loadData(); }, []);

  // Realtime: subscribe to changes on currently opened invoice
  useEffect(() => {
    if (!detailId) return;
    const ch = supabase
      .channel(`manual-invoice-${detailId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'manual_invoices', filter: `id=eq.${detailId}` }, (payload: any) => {
        const next = payload.new;
        setDetailData((prev: any) => prev ? { ...prev, ...next } : prev);
        // Toast on deposit transition
        if (next.payment_status === 'DEPOSIT_PAID' || next.payment_status === 'PAID') {
          if (next.deposit_paid_at) {
            const tm = new Date(next.deposit_paid_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            toast({ title: `✅ Đã nhận cọc ${next.invoice_code}`, description: `${fmt(next.deposit_amount)} lúc ${tm}` });
          }
        }
        loadData();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [detailId]);

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

  // ===== VOICE INPUT FOR ADMIN =====
  const applyParsed = (p: any) => {
    if (!p) return;
    if (p.guest_name) setGuestName(p.guest_name);
    if (p.guest_phone) setGuestPhone(p.guest_phone);
    if (p.guest_email) setGuestEmail(p.guest_email);
    if (p.check_in) setCheckIn(p.check_in);
    if (p.check_out) setCheckOut(p.check_out);
    if (p.guests_count) setGuestsCount(p.guests_count);
    if (p.children_count != null) setChildrenCount(p.children_count);
    if (p.room_quantity) {
      setRoomQty(p.room_quantity);
      setRoomLines(prev => prev.length ? [{ ...prev[0], room_count: p.room_quantity }, ...prev.slice(1)] : prev);
    }
    if (p.room_price_per_night) {
      setRoomPricePerNight(p.room_price_per_night);
      setRoomLines(prev => prev.length ? [{ ...prev[0], price_per_night: p.room_price_per_night }, ...prev.slice(1)] : prev);
    }
    if (p.discount_amount != null) setDiscountAmount(p.discount_amount);
    if (p.discount_note) setDiscountNote(p.discount_note);
    if (p.deposit_percent != null && [30, 50, 70, 100].includes(p.deposit_percent)) setDepositPercent(p.deposit_percent);
    if (p.notes) setNotes((prev) => prev ? `${prev}\n${p.notes}` : p.notes);
    // Match room by name if possible
    if (p.room_name) {
      const match = rooms.find(r => r.name_vi.toLowerCase().includes(String(p.room_name).toLowerCase()) || String(p.room_name).toLowerCase().includes(r.name_vi.toLowerCase()));
      const finalName = match?.name_vi || p.room_name;
      const finalPrice = p.room_price_per_night || match?.price_vnd || 0;
      if (match) {
        setRoomId(match.id);
        setRoomName(match.name_vi);
        if (!p.room_price_per_night) setRoomPricePerNight(match.price_vnd);
      } else {
        setRoomName(p.room_name);
      }
      setRoomLines(prev => prev.length
        ? [{ ...prev[0], room_id: match?.id || null, room_name: finalName, price_per_night: finalPrice || prev[0].price_per_night }, ...prev.slice(1)]
        : prev);
    }
  };

  const stopVoice = () => {
    try { recognitionRef.current?.stop(); } catch {}
    setVoiceListening(false);
  };

  const startVoice = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast({ title: 'Trình duyệt không hỗ trợ giọng nói', description: 'Dùng Chrome / Edge nha', variant: 'destructive' });
      return;
    }
    const rec = new SR();
    rec.lang = 'vi-VN';
    rec.continuous = true;
    rec.interimResults = true;
    let finalText = '';
    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t + ' ';
        else interim += t;
      }
      setVoiceTranscript((finalText + interim).trim());
    };
    rec.onerror = () => stopVoice();
    rec.onend = async () => {
      setVoiceListening(false);
      const final = finalText.trim();
      if (!final) return;
      setVoiceParsing(true);
      try {
        const { data, error } = await supabase.functions.invoke('parse-invoice-voice', {
          body: { transcript: final },
        });
        if (error) throw error;
        applyParsed((data as any)?.data);
        toast({ title: '✅ Đã điền tự động', description: 'Kiểm tra lại các trường trước khi lưu' });
      } catch (err: any) {
        toast({ title: 'Lỗi nhận diện', description: err?.message, variant: 'destructive' });
      } finally {
        setVoiceParsing(false);
      }
    };
    recognitionRef.current = rec;
    setVoiceTranscript('');
    setVoiceListening(true);
    try { rec.start(); } catch { setVoiceListening(false); }
  };

  const resetForm = async () => {
    setCode(await generateInvoiceCode());
    setGuestName(''); setGuestPhone(''); setGuestEmail('');
    setCheckIn(''); setCheckOut(''); setGuestsCount(2); setChildrenCount(0);
    setRoomId(''); setRoomName(''); setRoomQty(1); setRoomPricePerNight(0);
    setRoomLines([newRoomLine()]);
    setDiscountAmount(0); setDiscountNote(''); setDepositAmount(0); setDepositPercent(50); setNotes('');
    setItems([]);
  };

  const updateRoomLine = (id: string, patch: Partial<RoomLine>) => {
    setRoomLines(prev => prev.map(rl => rl.id === id ? { ...rl, ...patch } : rl));
  };
  const removeRoomLine = (id: string) => {
    setRoomLines(prev => prev.length <= 1 ? prev : prev.filter(rl => rl.id !== id));
  };
  const addRoomLine = () => {
    setRoomLines(prev => [...prev, { ...newRoomLine(), nights: autoNights }]);
  };
  const pickRoomForLine = (lineId: string, roomDbId: string) => {
    const r = rooms.find(x => x.id === roomDbId);
    if (!r) return;
    updateRoomLine(lineId, { room_id: r.id, room_name: r.name_vi, price_per_night: r.price_vnd });
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
      room_id: roomLines[0]?.room_id || roomId || null,
      room_name: roomLines.map(r => r.room_name).filter(Boolean).join(' + ') || roomName || null,
      room_quantity: roomLines.reduce((s, r) => s + (r.room_count || 0), 0) || roomQty,
      nights: roomLines[0]?.nights || autoNights,
      room_price_per_night: roomLines[0]?.price_per_night || roomPricePerNight,
      room_subtotal: roomSubtotal,
      room_lines: roomLines.map(rl => ({
        room_id: rl.room_id || null,
        room_name: rl.room_name,
        room_count: rl.room_count,
        nights: rl.nights,
        price_per_night: rl.price_per_night,
        line_total: (rl.price_per_night || 0) * (rl.nights || 0) * (rl.room_count || 0),
      })),
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

  const sendEmail = async (invoiceId: string, recipientOverride?: string, emailType?: 'pending' | 'confirmed') => {
    setSendingEmail(invoiceId);
    try {
      const body: any = { invoice_id: invoiceId, sent_by: 'admin:manual' };
      if (recipientOverride) body.recipient_email = recipientOverride;
      if (emailType) body.email_type = emailType;
      const { data, error } = await supabase.functions.invoke('send-manual-invoice-email', { body });
      if (error) throw error;
      const sentTo = (data as any)?.sent_to || recipientOverride;
      if (sentTo) localStorage.setItem(LAST_EMAIL_KEY, sentTo);
      toast({ title: `✅ Đã gửi email ${emailType === 'confirmed' ? 'xác nhận' : 'chờ cọc'}`, description: sentTo ? `Tới: ${sentTo}` : undefined });
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
    if (menuSource === 'menu') {
      return q ? menuItems.filter(m => m.name_vi.toLowerCase().includes(q)) : menuItems.slice(0, 30);
    }
    const pool = mealPlans;
    return q ? pool.filter(d => d.name.toLowerCase().includes(q)) : pool;
  }, [menuSearch, menuItems, mealPlans, menuSource]);

  // Group meal plans by guest_count for nicer display
  const mealPlansGrouped = useMemo(() => {
    const groups: Record<number, MealPlan[]> = {};
    filteredMenu.forEach((p: any) => {
      if (menuSource !== 'meals') return;
      const k = p.guest_count || 0;
      (groups[k] ||= []).push(p);
    });
    return Object.entries(groups).sort((a, b) => Number(a[0]) - Number(b[0]));
  }, [filteredMenu, menuSource]);

  const addMealPlan = (mp: MealPlan) => {
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      item_type: 'food',
      ref_id: mp.id,
      name: `${mp.name} (${mp.guest_count} người)`,
      quantity: 1,
      unit_price: mp.price,
    }]);
  };

  const addComboMenu = (pkg: ComboPkg, menu: ComboMenu, qty: number) => {
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      item_type: 'combo',
      ref_id: menu.id,
      name: `${pkg.name} - ${menu.name_vi} (${qty} suất)`,
      quantity: qty,
      unit_price: pkg.price_per_person,
    }]);
  };

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
            <Button
              variant="outline"
              onClick={() => sendEmail(detailData.id, detailData.guest_email, 'pending')}
              disabled={sendingEmail === detailData.id || !detailData.guest_email}
              title={!detailData.guest_email ? 'Khách chưa có email' : ''}
            >
              {sendingEmail === detailData.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
              📧 Gửi email chờ cọc
            </Button>
            <Button
              onClick={async () => {
                const isPaid = detailData.payment_status === 'DEPOSIT_PAID' || detailData.payment_status === 'PAID';
                if (!isPaid && !confirm('Booking chưa xác nhận thanh toán. Vẫn muốn gửi email xác nhận?')) return;
                sendEmail(detailData.id, detailData.guest_email, 'confirmed');
              }}
              disabled={sendingEmail === detailData.id || !detailData.guest_email}
            >
              {sendingEmail === detailData.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              ✅ Gửi email xác nhận
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

          {(() => {
            const lines = Array.isArray(detailData.room_lines) ? detailData.room_lines : [];
            if (lines.length > 0) {
              return (
                <div className="bg-secondary p-3 rounded-lg text-sm space-y-1">
                  <p className="font-semibold">🛏️ Phòng đặt:</p>
                  {lines.map((rl: any, i: number) => (
                    <div key={i} className="flex justify-between border-b border-border/40 last:border-0 pb-1">
                      <span>{rl.room_name} × {rl.room_count}p × {rl.nights}đ <span className="text-muted-foreground">({fmt(rl.price_per_night)}/đêm)</span></span>
                      <strong>{fmt(rl.line_total || (rl.price_per_night * rl.nights * rl.room_count))}</strong>
                    </div>
                  ))}
                </div>
              );
            }
            return detailData.room_name ? (
              <div className="bg-secondary p-3 rounded-lg text-sm">
                <p className="font-semibold">{detailData.room_name} × {detailData.room_quantity} phòng × {detailData.nights} đêm</p>
                <p className="text-muted-foreground">{fmt(detailData.room_price_per_night)} / đêm = <strong>{fmt(detailData.room_subtotal)}</strong></p>
              </div>
            ) : null;
          })()}

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

          {/* Email history log */}
          {Array.isArray(detailData.email_log) && detailData.email_log.length > 0 && (
            <div className="border-t border-border pt-3 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">📜 Lịch sử email</p>
              {[...detailData.email_log].reverse().map((log: any, i: number) => {
                const t = log.sent_at ? new Date(log.sent_at).toLocaleString('vi-VN') : '—';
                const who = log.sent_by || 'unknown';
                const ok = log.success !== false;
                const icon = log.type === 'confirmed' ? '✅' : '📧';
                const label = log.type === 'confirmed' ? 'Email xác nhận' : 'Email chờ cọc';
                return (
                  <div key={i} className={`text-xs px-2 py-1 rounded ${ok ? 'bg-secondary' : 'bg-destructive/10 border border-destructive/40'}`}>
                    <span className="font-medium">{icon} {label}</span>
                    <span className="text-muted-foreground"> · {t} · </span>
                    <span className="text-muted-foreground">{who.startsWith('auto:') ? '🤖 Tự động' : `👤 ${who.replace(/^admin:/, '')}`}</span>
                    {!ok && log.error && <div className="text-destructive mt-0.5">⚠ {log.error}</div>}
                  </div>
                );
              })}
            </div>
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

      {/* Voice input */}
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="font-semibold text-sm flex items-center gap-2">
              🎙️ Tạo nhanh bằng giọng nói
              {voiceParsing && <Loader2 className="h-3 w-3 animate-spin" />}
            </p>
            <p className="text-xs text-muted-foreground">Bấm mic, đọc: "Khách Nguyễn Văn A, sđt 0987654321, phòng Deluxe 2 đêm từ ngày mai, 2 người, cọc 50%"</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant={voiceListening ? 'destructive' : 'default'}
            onClick={voiceListening ? stopVoice : startVoice}
            disabled={voiceParsing}
          >
            {voiceListening ? <><MicOff className="h-4 w-4 mr-1" />Dừng & điền</> : <><Mic className="h-4 w-4 mr-1" />Bắt đầu nói</>}
          </Button>
        </div>
        {(voiceListening || voiceTranscript) && (
          <div className="text-xs bg-background/60 border border-border rounded p-2 italic">
            {voiceTranscript || 'Đang nghe...'}
          </div>
        )}
      </div>

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

      {/* Rooms — multi-line */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-semibold">🛏️ Phòng (nhiều loại / nhiều số phòng)</h3>
          <Button size="sm" variant="outline" onClick={addRoomLine}>
            <Plus className="h-3 w-3 mr-1" />Thêm loại phòng
          </Button>
        </div>

        <div className="space-y-3">
          {roomLines.map((rl, idx) => {
            const lineTotal = (rl.price_per_night || 0) * (rl.nights || 0) * (rl.room_count || 0);
            return (
              <div key={rl.id} className="border border-border rounded-lg p-3 space-y-2 bg-secondary/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Dòng {idx + 1}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRoomLine(rl.id)}
                    disabled={roomLines.length <= 1}
                    title="Xoá dòng"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Chọn nhanh từ danh sách</Label>
                    <Select value={rl.room_id || ''} onValueChange={(v) => pickRoomForLine(rl.id, v)}>
                      <SelectTrigger><SelectValue placeholder="-- Tuỳ chọn --" /></SelectTrigger>
                      <SelectContent>
                        {rooms.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.name_vi} ({fmt(r.price_vnd)})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Tên phòng (sửa tự do)</Label>
                    <Input value={rl.room_name} onChange={e => updateRoomLine(rl.id, { room_name: e.target.value })} placeholder="VD: Deluxe view biển" />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <Label className="text-xs">Số phòng</Label>
                    <Input type="number" min={1} value={rl.room_count} onChange={e => updateRoomLine(rl.id, { room_count: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div>
                    <Label className="text-xs">Số đêm</Label>
                    <Input type="number" min={1} value={rl.nights} onChange={e => updateRoomLine(rl.id, { nights: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Giá / đêm (VNĐ)</Label>
                    <Input type="number" value={rl.price_per_night} onChange={e => updateRoomLine(rl.id, { price_per_night: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <p className="text-xs text-right">
                  Thành tiền: <strong className="text-primary">{fmt(lineTotal)}</strong>
                  <span className="text-muted-foreground"> ({fmt(rl.price_per_night)} × {rl.nights}đ × {rl.room_count}p)</span>
                </p>
              </div>
            );
          })}
        </div>

        <p className="text-sm bg-secondary p-2 rounded text-right">
          Tổng tiền phòng: <strong className="text-primary">{fmt(roomSubtotal)}</strong>
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

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <Label className="m-0">Nguồn:</Label>
            <Button type="button" size="sm" variant={menuSource === 'meals' ? 'default' : 'outline'} onClick={() => setMenuSource('meals')}>
              👥 Suất ăn theo số người
            </Button>
            <Button type="button" size="sm" variant={menuSource === 'menu' ? 'default' : 'outline'} onClick={() => setMenuSource('menu')}>
              📋 Menu cũ
            </Button>
            <Button type="button" size="sm" variant={menuSource === 'combo' ? 'default' : 'outline'} onClick={() => setMenuSource('combo')}>
              🎉 Combo ≥6 khách
            </Button>
          </div>
          {menuSource === 'combo' ? (
            <div className="flex items-center gap-2">
              <Label className="m-0 text-xs">Số suất:</Label>
              <Input type="number" min={6} value={comboGuestCount} onChange={e => setComboGuestCount(Math.max(1, parseInt(e.target.value) || 6))} className="w-24" />
              <span className="text-xs text-muted-foreground">Áp dụng khi chọn thực đơn bên dưới</span>
            </div>
          ) : (
            <Input value={menuSearch} onChange={e => setMenuSearch(e.target.value)} placeholder={menuSource === 'meals' ? 'Gõ tên suất... (để trống xem tất cả)' : 'Gõ tên món... (để trống để xem 30 món đầu)'} />
          )}
          <div className="mt-2 max-h-72 overflow-y-auto border border-border rounded-lg">
            {menuSource === 'meals' ? (
              mealPlans.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3">
                  Chưa có suất ăn nào. Vào Admin → Suất ăn theo số người để thêm.
                </p>
              ) : mealPlansGrouped.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3">Không tìm thấy suất phù hợp</p>
              ) : (
                mealPlansGrouped.map(([gc, list]) => (
                  <div key={gc}>
                    <div className="px-3 py-1 bg-muted/40 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {Number(gc) >= 6 ? `${gc} người (≥6 khách)` : `${gc} người`}
                    </div>
                    {list.map(mp => {
                      const dishes: string[] = Array.isArray(mp.items) ? mp.items as any : [];
                      const preview = dishes.slice(0, 6).join(' • ');
                      const more = dishes.length > 6 ? ` … +${dishes.length - 6} món` : '';
                      return (
                        <button
                          key={mp.id}
                          type="button"
                          onClick={() => { addMealPlan(mp); setMenuSearch(''); }}
                          className="w-full text-left px-3 py-2 hover:bg-secondary border-b border-border/50 last:border-0"
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{mp.name}</div>
                              <div className="text-[11px] text-muted-foreground mt-0.5">
                                {mp.guest_count} người · {dishes.length} món
                              </div>
                              {preview && (
                                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {preview}{more}
                                </div>
                              )}
                              {mp.note && (
                                <div className="text-[11px] text-primary/80 italic mt-0.5">{mp.note}</div>
                              )}
                            </div>
                            <span className="text-sm font-semibold text-primary whitespace-nowrap">{fmt(mp.price)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))
              )
            ) : menuSource === 'combo' ? (
              comboPkgs.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3">
                  Chưa có combo nào. Vào Admin → Combo ăn uống (≥6 khách) để thêm.
                </p>
              ) : (
                comboPkgs.map(pkg => {
                  const menus = comboMenus.filter(m => m.combo_package_id === pkg.id);
                  return (
                    <div key={pkg.id} className="border-b border-border/50 last:border-0">
                      <div className="px-3 py-2 bg-muted/40 flex justify-between items-center">
                        <div>
                          <div className="text-sm font-semibold">{pkg.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {fmt(pkg.price_per_person)}/suất · {menus.length} thực đơn · {pkg.dishes_per_menu} món/thực đơn
                          </div>
                        </div>
                        <span className="text-[11px] text-primary font-medium whitespace-nowrap">
                          × {comboGuestCount} suất = {fmt(pkg.price_per_person * comboGuestCount)}
                        </span>
                      </div>
                      {menus.map(menu => {
                        const dishes = comboDishes.filter(d => d.combo_menu_id === menu.id);
                        const preview = dishes.slice(0, 6).map(d => d.name_vi).join(' • ');
                        const more = dishes.length > 6 ? ` … +${dishes.length - 6} món` : '';
                        return (
                          <button
                            key={menu.id}
                            type="button"
                            onClick={() => addComboMenu(pkg, menu, comboGuestCount)}
                            className="w-full text-left px-3 py-2 hover:bg-secondary border-t border-border/30"
                          >
                            <div className="text-sm font-medium">Thực đơn {menu.menu_number}: {menu.name_vi}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{dishes.length} món</div>
                            {preview && (
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{preview}{more}</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )
            ) : filteredMenu.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3">
                {menuItems.length === 0 ? 'Chưa có món nào trong Menu cũ.' : 'Không tìm thấy món phù hợp'}
              </p>
            ) : (
              <>
                {filteredMenu.map((mi: any) => (
                  <button
                    key={mi.id}
                    type="button"
                    onClick={() => { addMenuItem(mi as MenuItem); setMenuSearch(''); }}
                    className="w-full text-left px-3 py-2 hover:bg-secondary text-sm flex justify-between border-b border-border/50 last:border-0"
                  >
                    <span>{mi.name_vi}</span>
                    <span className="text-muted-foreground">{fmt(mi.price_vnd)}</span>
                  </button>
                ))}
                {!menuSearch && (
                  <p className="text-[11px] text-muted-foreground p-2 text-center bg-muted/30">
                    Hiện 30 món đầu — gõ để tìm thêm
                  </p>
                )}
              </>
            )}
          </div>
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
        </div>

        <div className="space-y-2">
          <Label>% Đặt cọc *</Label>
          <div className="flex flex-wrap gap-2">
            {[30, 50, 70, 100].map(p => (
              <Button
                key={p}
                type="button"
                size="sm"
                variant={depositPercent === p ? 'default' : 'outline'}
                onClick={() => setDepositPercent(p)}
              >
                {p}% {p === 50 && <span className="ml-1 text-[10px] opacity-70">(mặc định)</span>}
              </Button>
            ))}
            <Button
              type="button"
              size="sm"
              variant={depositPercent < 0 ? 'default' : 'outline'}
              onClick={() => setDepositPercent(-1)}
            >
              Tùy chỉnh
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-2">
            <div>
              <Label>Đã đặt cọc (VNĐ) {depositPercent >= 0 && <span className="text-xs text-muted-foreground">— tự tính từ {depositPercent}%</span>}</Label>
              <Input
                type="number"
                value={depositAmount}
                onChange={e => { setDepositPercent(-1); setDepositAmount(parseInt(e.target.value) || 0); }}
              />
            </div>
            <div className="flex items-end">
              <div className="bg-primary/10 border border-primary/30 p-3 rounded-lg w-full">
                <p className="text-xs text-muted-foreground">Tổng thanh toán</p>
                <p className="text-2xl font-bold text-primary">{fmt(totalAmount)}</p>
                <p className="text-xs">Cọc: <strong>{fmt(depositAmount)}</strong> · Còn lại: <strong>{fmt(remainingAmount)}</strong></p>
              </div>
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
