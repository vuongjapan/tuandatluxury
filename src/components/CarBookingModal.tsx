import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TransportForm, TabKey } from "@/pages/Transport";
import { Plane, Waves, Landmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const META: Record<TabKey, { title: string; subtitle: string; price: string; Icon: any }> = {
  airport: { title: "Đặt xe sân bay Thọ Xuân", subtitle: "Khoảng cách ~45km · ~50 phút", price: "Giá báo qua SĐT trong 30 phút", Icon: Plane },
  beach: { title: "Đặt xe ra Bãi Tắm Sầm Sơn", subtitle: "Mỗi 30 phút · 06:00 – 20:00", price: "Hoàn toàn miễn phí cho khách lưu trú", Icon: Waves },
  square: { title: "Đặt xe ra Quảng Trường Biển", subtitle: "Khách sạn ↔ Quảng trường biển Sầm Sơn", price: "Hoàn toàn miễn phí cho khách lưu trú", Icon: Landmark },
};

export default function CarBookingModal({ open, tab, onClose }: { open: boolean; tab: TabKey | null; onClose: () => void }) {
  const { toast } = useToast();
  const [doneCode, setDoneCode] = useState<string | null>(null);

  if (!tab) return null;
  const m = META[tab];
  const Icon = m.Icon;

  const handleSuccess = (id: string) => {
    setDoneCode(id);
    toast({ title: "Đặt xe thành công!", description: `Mã: ${id}. Lễ tân sẽ liên hệ trong 30 phút.` });
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) { setDoneCode(null); onClose(); }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl">
            <Icon className="h-6 w-6 text-primary" /> {m.title}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {m.subtitle} · <span className="text-primary font-semibold">{m.price}</span>
          </DialogDescription>
        </DialogHeader>
        <TransportForm tab={tab} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
