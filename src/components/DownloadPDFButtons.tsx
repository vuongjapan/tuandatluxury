import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Download, Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  bookingId?: string;
  bookingCode: string;
  isPaid: boolean;
  compact?: boolean;
}

export function DownloadPDFButtons({ bookingId, bookingCode, isPaid, compact = false }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<'summary' | 'detail' | 'both' | null>(null);

  const fetchPdfs = async () => {
    const { data, error } = await supabase.functions.invoke('generate-booking-pdf', {
      body: bookingId
        ? { booking_id: bookingId, is_paid: isPaid }
        : { booking_code: bookingCode, is_paid: isPaid },
    });
    if (error) throw error;
    return data as {
      pdf1_base64: string;
      pdf2_base64: string;
      pdf1_name: string;
      pdf2_name: string;
    };
  };

  const triggerDownload = (base64: string, filename: string) => {
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownload = async (which: 'summary' | 'detail' | 'both') => {
    setLoading(which);
    try {
      const data = await fetchPdfs();
      if (which === 'summary' || which === 'both') {
        triggerDownload(data.pdf1_base64, data.pdf1_name);
      }
      if (which === 'detail' || which === 'both') {
        triggerDownload(data.pdf2_base64, data.pdf2_name);
      }
      toast({ title: '✅ Đã tải PDF thành công' });
    } catch (e: any) {
      toast({
        title: 'Lỗi tải PDF',
        description: e?.message || 'Vui lòng thử lại',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  if (compact) {
    return (
      <button
        onClick={() => handleDownload('both')}
        disabled={loading !== null}
        className="p-1 rounded hover:bg-amber-50 text-amber-700 disabled:opacity-40"
        title="Tải 2 file PDF (Tổng thể + Chi tiết)"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      </button>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        Tải hóa đơn PDF
      </h3>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          onClick={() => handleDownload('summary')}
          disabled={loading !== null}
          className="bg-amber-600 hover:bg-amber-700 text-white flex-1"
        >
          {loading === 'summary'
            ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
            : <Download className="h-4 w-4 mr-2" />}
          {isPaid ? 'PDF Tổng thể (Đã TT)' : 'PDF Tổng thể (Chưa TT)'}
        </Button>
        <Button
          onClick={() => handleDownload('detail')}
          disabled={loading !== null}
          variant="secondary"
          className="flex-1"
        >
          {loading === 'detail'
            ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
            : <Download className="h-4 w-4 mr-2" />}
          PDF Chi tiết dịch vụ
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        💡 Sau khi tải về, nhấn vào nút <span className="font-semibold">"Mở Google Maps"</span> trong PDF để xem vị trí khách sạn.
      </p>
    </div>
  );
}

export default DownloadPDFButtons;
