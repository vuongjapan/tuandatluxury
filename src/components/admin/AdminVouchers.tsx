import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatPriceFull } from '@/lib/utils';
import { Plus, Download, QrCode, Trash2, Filter, Eye } from 'lucide-react';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface VoucherCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  campaign_name: string;
  start_date: string;
  end_date: string;
  usage_limit: number;
  used_count: number;
  status: string;
  applies_to?: string;
  created_at: string;
}

const SITE_URL = window.location.origin;

const SCOPE_LABELS: Record<string, string> = {
  all: '🏨🍽️ Phòng + Ăn (Tổng đơn)',
  room: '🏨 Chỉ tiền phòng',
  food: '🍽️ Chỉ ăn / dịch vụ',
};

const AdminVouchers = () => {
  const { toast } = useToast();
  const [vouchers, setVouchers] = useState<VoucherCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterScope, setFilterScope] = useState<string>('all');
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchCount, setBatchCount] = useState(10);
  const [batchType, setBatchType] = useState('percent');
  const [batchValue, setBatchValue] = useState(10);
  const [batchCampaign, setBatchCampaign] = useState('');
  const [batchEndDate, setBatchEndDate] = useState('');
  const [batchScope, setBatchScope] = useState<'all' | 'room' | 'food'>('all');
  const [creating, setCreating] = useState(false);
  const [qrDialog, setQrDialog] = useState<{ open: boolean; code: string; dataUrl: string }>({ open: false, code: '', dataUrl: '' });

  const fetchVouchers = async () => {
    setLoading(true);
    const { data } = await supabase.from('voucher_codes').select('*').order('created_at', { ascending: false });
    setVouchers((data as any as VoucherCode[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchVouchers(); }, []);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'TDLUX-';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const generateQRDataUrl = async (code: string): Promise<string> => {
    const url = `${SITE_URL}/apply?code=${code}`;
    return QRCode.toDataURL(url, { width: 200, margin: 1, color: { dark: '#000000', light: '#ffffff' } });
  };

  const handleBatchCreate = async () => {
    if (!batchCampaign || !batchEndDate) {
      toast({ title: 'Vui lòng nhập đầy đủ thông tin', variant: 'destructive' });
      return;
    }
    setCreating(true);
    const codes: any[] = [];
    const existingCodes = new Set(vouchers.map(v => v.code));
    for (let i = 0; i < batchCount; i++) {
      let code: string;
      do { code = generateCode(); } while (existingCodes.has(code));
      existingCodes.add(code);
      codes.push({
        code, discount_type: batchType, discount_value: batchValue,
        campaign_name: batchCampaign, end_date: new Date(batchEndDate).toISOString(),
        usage_limit: 1, used_count: 0, status: 'active',
        applies_to: batchScope,
      });
    }
    const { error } = await supabase.from('voucher_codes').insert(codes as any);
    if (error) {
      toast({ title: 'Lỗi tạo mã', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Đã tạo ${batchCount} mã (${SCOPE_LABELS[batchScope]}) ✓` });
      setShowBatchForm(false);
      fetchVouchers();
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa mã này?')) return;
    await supabase.from('voucher_codes').delete().eq('id', id);
    fetchVouchers();
  };

  const handleShowQR = async (code: string) => {
    const dataUrl = await generateQRDataUrl(code);
    setQrDialog({ open: true, code, dataUrl });
  };

  const handleExportPDF = async () => {
    const activeVouchers = filteredVouchers.filter(v => v.status === 'active');
    if (activeVouchers.length === 0) {
      toast({ title: 'Không có mã active để xuất', variant: 'destructive' });
      return;
    }

    // Generate QR codes for all vouchers
    const qrPromises = activeVouchers.map(async v => {
      const dataUrl = await generateQRDataUrl(v.code);
      return { ...v, qrDataUrl: dataUrl };
    });
    const vouchersWithQR = await Promise.all(qrPromises);

    const html = `
<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>Voucher - Tuấn Đạt Luxury</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', sans-serif; padding: 20px; }
  .page { page-break-after: always; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .voucher {
    border: 2px dashed #b8860b; border-radius: 12px; padding: 20px;
    text-align: center; position: relative;
  }
  .voucher h2 { color: #b8860b; font-size: 14px; margin-bottom: 4px; }
  .voucher .hotel { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 8px; }
  .voucher .label { font-size: 12px; color: #888; margin-bottom: 4px; }
  .voucher .code { font-size: 22px; font-weight: bold; letter-spacing: 3px; color: #b8860b; background: #fff8e1; padding: 8px 16px; border-radius: 8px; margin: 8px 0; display: inline-block; }
  .voucher .value { font-size: 16px; font-weight: bold; color: #d32f2f; }
  .voucher .expiry { font-size: 11px; color: #666; margin-top: 6px; }
  .qr { width: 100px; height: 100px; margin: 8px auto; }
  .qr img { width: 100%; height: 100%; }
  @media print { .no-print { display: none; } }
</style>
</head><body>
<div class="no-print" style="margin-bottom:20px">
  <button onclick="window.print()" style="padding:10px 20px;background:#b8860b;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px">🖨️ In PDF</button>
</div>
${Array.from({ length: Math.ceil(vouchersWithQR.length / 10) }, (_, pageIdx) => {
  const pageVouchers = vouchersWithQR.slice(pageIdx * 10, (pageIdx + 1) * 10);
  return `<div class="page"><div class="grid">${pageVouchers.map(v => `
    <div class="voucher">
      <h2>VOUCHER GIẢM GIÁ</h2>
      <div class="hotel">TUẤN ĐẠT LUXURY HOTEL</div>
      <div class="label">Mã voucher</div>
      <div class="code">${v.code}</div>
      <div class="value">Giảm ${v.discount_type === 'percent' ? v.discount_value + '%' : formatPriceFull(v.discount_value)}</div>
      <div class="qr"><img src="${v.qrDataUrl}" alt="QR ${v.code}" /></div>
      <div class="expiry">HSD: ${new Date(v.end_date).toLocaleDateString('vi-VN')}</div>
      <div class="label" style="margin-top:4px">Quét QR để sử dụng · Chỉ dùng 1 lần</div>
    </div>
  `).join('')}</div></div>`;
}).join('')}
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    toast({ title: 'Đã mở trang in PDF với QR Code ✓' });
  };

  const filteredVouchers = vouchers.filter(v => {
    if (filterStatus !== 'all' && v.status !== filterStatus) return false;
    if (filterScope !== 'all' && (v.applies_to || 'all') !== filterScope) return false;
    return true;
  });

  const getStatusBadge = (v: VoucherCode) => {
    if (v.used_count >= v.usage_limit) return <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Đã dùng</span>;
    if (new Date(v.end_date) < new Date()) return <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">Hết hạn</span>;
    if (v.status === 'active') return <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Active</span>;
    return <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{v.status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Quản lý Voucher</h2>
          <p className="text-sm text-muted-foreground">Tạo mã giảm giá hàng loạt, QR Code, xuất PDF</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5">
            <Download className="h-4 w-4" /> Xuất PDF
          </Button>
          <Button size="sm" onClick={() => setShowBatchForm(!showBatchForm)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Tạo hàng loạt
          </Button>
        </div>
      </div>

      {showBatchForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">Tạo mã voucher hàng loạt</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Tên chiến dịch</label>
              <Input value={batchCampaign} onChange={e => setBatchCampaign(e.target.value)} placeholder="VD: Khai trương mùa hè" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Số lượng mã</label>
              <Input type="number" value={batchCount} onChange={e => setBatchCount(Number(e.target.value))} min={1} max={100} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Loại giảm</label>
              <Select value={batchType} onValueChange={setBatchType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Phần trăm (%)</SelectItem>
                  <SelectItem value="fixed">Số tiền (VND)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Giá trị giảm</label>
              <Input type="number" value={batchValue} onChange={e => setBatchValue(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Hạn sử dụng</label>
              <Input type="date" value={batchEndDate} onChange={e => setBatchEndDate(e.target.value)} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium mb-1 block">Phạm vi áp dụng</label>
              <Select value={batchScope} onValueChange={(v) => setBatchScope(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{SCOPE_LABELS.all}</SelectItem>
                  <SelectItem value="room">{SCOPE_LABELS.room}</SelectItem>
                  <SelectItem value="food">{SCOPE_LABELS.food}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Mã chỉ giảm trên phần được chọn. <strong>Tự động vô hiệu hoá sau 1 lần dùng.</strong>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleBatchCreate} disabled={creating}>
              {creating ? 'Đang tạo...' : `Tạo ${batchCount} mã (TDLUX-XXXX)`}
            </Button>
            <Button variant="outline" onClick={() => setShowBatchForm(false)}>Hủy</Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả ({vouchers.length})</SelectItem>
            <SelectItem value="active">Active ({vouchers.filter(v => v.status === 'active').length})</SelectItem>
            <SelectItem value="used">Đã dùng ({vouchers.filter(v => v.used_count >= v.usage_limit).length})</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterScope} onValueChange={setFilterScope}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Phạm vi" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mọi phạm vi</SelectItem>
            <SelectItem value="room">{SCOPE_LABELS.room}</SelectItem>
            <SelectItem value="food">{SCOPE_LABELS.food}</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filteredVouchers.length} mã</span>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-3 font-semibold">Mã</th>
                <th className="text-left p-3 font-semibold">Chiến dịch</th>
                <th className="text-left p-3 font-semibold">Giá trị</th>
                <th className="text-left p-3 font-semibold">Hạn</th>
                <th className="text-left p-3 font-semibold">Trạng thái</th>
                <th className="text-right p-3 font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Đang tải...</td></tr>
              ) : filteredVouchers.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Chưa có mã voucher nào</td></tr>
              ) : filteredVouchers.map(v => (
                <tr key={v.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                  <td className="p-3">
                    <code className="bg-primary/10 text-primary px-2 py-1 rounded font-bold text-xs tracking-wider">{v.code}</code>
                  </td>
                  <td className="p-3 text-muted-foreground">{v.campaign_name || '—'}</td>
                  <td className="p-3 font-semibold text-destructive">
                    {v.discount_type === 'percent' ? `${v.discount_value}%` : formatPriceFull(v.discount_value)}
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{new Date(v.end_date).toLocaleDateString('vi-VN')}</td>
                  <td className="p-3">{getStatusBadge(v)}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleShowQR(v.code)} title="Xem QR">
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(v.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Dialog */}
      <Dialog open={qrDialog.open} onOpenChange={(open) => setQrDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>QR Code: {qrDialog.code}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrDialog.dataUrl && <img src={qrDialog.dataUrl} alt={`QR ${qrDialog.code}`} className="w-48 h-48" />}
            <p className="text-xs text-muted-foreground">Quét để tự động áp dụng mã giảm giá</p>
            <code className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-bold text-lg tracking-wider">{qrDialog.code}</code>
            <p className="text-xs text-muted-foreground break-all">{SITE_URL}/apply?code={qrDialog.code}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVouchers;
