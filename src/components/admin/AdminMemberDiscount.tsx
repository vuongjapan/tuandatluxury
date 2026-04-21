import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save, Percent, Tag } from 'lucide-react';
import { useMemberDiscount, updateMemberDiscount, updatePerPersonCombo } from '@/hooks/useMemberDiscount';
import { useQueryClient } from '@tanstack/react-query';

const AdminMemberDiscount = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { discount, perPerson, loading } = useMemberDiscount();

  const [roomPercent, setRoomPercent] = useState(10);
  const [foodPercent, setFoodPercent] = useState(15);
  const [code, setCode] = useState('MEMBER2025');
  const [perPersonEnabled, setPerPersonEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) {
      setRoomPercent(discount.room_percent);
      setFoodPercent(discount.food_percent);
      setCode(discount.code);
      setPerPersonEnabled(perPerson.enabled);
    }
  }, [loading, discount, perPerson]);

  const save = async () => {
    setSaving(true);
    const [r1, r2] = await Promise.all([
      updateMemberDiscount({ room_percent: roomPercent, food_percent: foodPercent, code }),
      updatePerPersonCombo({ enabled: perPersonEnabled }),
    ]);
    setSaving(false);
    if (r1.error || r2.error) {
      toast({ title: 'Lỗi', description: (r1.error || r2.error)?.message, variant: 'destructive' });
    } else {
      qc.invalidateQueries({ queryKey: ['site-settings'] });
      toast({ title: 'Đã lưu', description: 'Cài đặt đã cập nhật trên toàn web' });
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold mb-1">Ưu đãi thành viên & Combo</h2>
        <p className="text-sm text-muted-foreground">Quản lý % giảm giá thành viên và bật/tắt chế độ combo theo người</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h3 className="font-semibold flex items-center gap-2"><Percent className="h-4 w-4 text-primary" /> Ưu đãi thành viên</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Giảm giá phòng (%)</Label>
            <Input type="number" min={0} max={100} value={roomPercent} onChange={(e) => setRoomPercent(parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <Label>Giảm giá đồ ăn (%)</Label>
            <Input type="number" min={0} max={100} value={foodPercent} onChange={(e) => setFoodPercent(parseInt(e.target.value) || 0)} />
          </div>
        </div>

        <div>
          <Label className="flex items-center gap-1"><Tag className="h-3 w-3" /> Mã ưu đãi</Label>
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={50} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-semibold">Combo theo số người</h3>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-medium text-sm">Bật chế độ combo theo đầu người</p>
            <p className="text-xs text-muted-foreground mt-1">
              Khi bật: 1 khách = 1 menu, 2 khách = 2 menu, hoá đơn tính theo số người. Khi tắt: dùng flow combo cũ.
            </p>
          </div>
          <Switch checked={perPersonEnabled} onCheckedChange={setPerPersonEnabled} />
        </div>
      </div>

      <Button onClick={save} disabled={saving} variant="gold" className="w-full sm:w-auto gap-2">
        <Save className="h-4 w-4" /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
      </Button>
    </div>
  );
};

export default AdminMemberDiscount;
