import { useState } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Globe, Save } from 'lucide-react';

const AdminWebDiscount = () => {
  const { settings, updateSetting } = useSiteSettings();
  const { toast } = useToast();
  const [value, setValue] = useState(settings.web_discount_percent || '0');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const err = await updateSetting('web_discount_percent', value);
    if (!err) {
      toast({ title: 'Đã cập nhật giảm giá web ✓' });
    } else {
      toast({ title: 'Lỗi', description: 'Không thể lưu', variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold">Giảm giá đặt qua Web</h2>
        <p className="text-sm text-muted-foreground">Giảm giá riêng cho khách đặt phòng trực tiếp trên website. Hiển thị trên lịch giá với giá gốc gạch ngang.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 max-w-lg space-y-4">
        <div className="flex items-center gap-3 text-primary">
          <Globe className="h-5 w-5" />
          <span className="font-semibold">Phần trăm giảm giá</span>
        </div>

        <div className="flex items-center gap-3">
          <Input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            min={0}
            max={50}
            className="w-32 text-center text-lg font-bold"
          />
          <span className="text-lg font-semibold text-muted-foreground">%</span>
        </div>

        <p className="text-xs text-muted-foreground">
          Đặt 0% để tắt giảm giá web. Giá trị khuyến nghị: 3-10%. Giảm giá này tách biệt với hệ thống mã voucher và khuyến mại chung.
        </p>

        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 max-w-lg">
        <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2">Cách hoạt động</h3>
        <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
          <li>• Giảm giá tự động áp dụng cho tất cả phòng khi đặt qua web</li>
          <li>• Lịch giá hiển thị giá gốc gạch ngang + giá web mới</li>
          <li>• Hóa đơn và email ghi rõ "Giảm giá đặt qua web"</li>
          <li>• Hoạt động độc lập với mã voucher và khuyến mại chung</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminWebDiscount;
