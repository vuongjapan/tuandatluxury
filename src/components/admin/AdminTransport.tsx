import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, X, CheckCircle2, Eye, Loader2 } from "lucide-react";

interface T { id: string; booking_id: string; guest_name: string; guest_phone: string; guest_email: string; room_number: string | null; transport_type: string; pickup_location: string | null; dropoff_location: string | null; pickup_datetime: string; passengers: number; luggage: string | null; flight_number: string | null; notes: string | null; status: string; created_at: string; }

const TYPE_LABEL: Record<string, string> = { airport: "Sân bay", beach: "Bãi tắm", square: "Quảng trường" };
const STATUS_LABEL: Record<string, string> = { pending: "Chờ", confirmed: "Đã xác nhận", completed: "Hoàn thành", cancelled: "Huỷ" };
const STATUS_COLOR: Record<string, string> = { pending: "bg-yellow-100 text-yellow-800", confirmed: "bg-green-100 text-green-800", completed: "bg-blue-100 text-blue-800", cancelled: "bg-red-100 text-red-800" };

export default function AdminTransport() {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<T | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("transport_bookings").select("*").order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (item: T, status: string) => {
    setBusyId(item.id);
    try {
      await (supabase as any).from("transport_bookings").update({ status }).eq("id", item.id);
      if (status === "confirmed" || status === "cancelled") {
        try {
          await supabase.functions.invoke("send-transport-email", {
            body: { type: "status_update", booking: { ...item, status } },
          });
        } catch (e) { console.error(e); }
      }
      toast({ title: "Đã cập nhật" });
      load();
    } catch (e: any) {
      toast({ title: "Lỗi", description: e.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const filtered = items.filter(i => filter === "all" || i.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["all", "pending", "confirmed", "completed", "cancelled"].map(s => (
          <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)}>
            {s === "all" ? "Tất cả" : STATUS_LABEL[s]} {s !== "all" && `(${items.filter(i => i.status === s).length})`}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase">
              <tr>
                <th className="px-3 py-2 text-left">Mã</th>
                <th className="px-3 py-2 text-left">Khách</th>
                <th className="px-3 py-2 text-left">SĐT</th>
                <th className="px-3 py-2 text-left">Loại</th>
                <th className="px-3 py-2 text-left">Giờ đón</th>
                <th className="px-3 py-2 text-center">Khách</th>
                <th className="px-3 py-2 text-center">Trạng thái</th>
                <th className="px-3 py-2 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id} className="border-t border-border hover:bg-secondary/50">
                  <td className="px-3 py-2 font-mono text-xs text-primary">{i.booking_id}</td>
                  <td className="px-3 py-2">{i.guest_name}{i.room_number && <span className="text-xs text-muted-foreground"> · P.{i.room_number}</span>}</td>
                  <td className="px-3 py-2">{i.guest_phone}</td>
                  <td className="px-3 py-2">{TYPE_LABEL[i.transport_type]}</td>
                  <td className="px-3 py-2 text-xs">{new Date(i.pickup_datetime).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="px-3 py-2 text-center">{i.passengers}</td>
                  <td className="px-3 py-2 text-center"><span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[i.status]}`}>{STATUS_LABEL[i.status]}</span></td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 justify-center">
                      <Button size="sm" variant="ghost" onClick={() => setSelected(i)} title="Xem"><Eye className="h-3.5 w-3.5" /></Button>
                      {i.status === "pending" && (
                        <Button size="sm" variant="ghost" disabled={busyId === i.id} onClick={() => setStatus(i, "confirmed")} title="Xác nhận" className="text-green-600"><Check className="h-3.5 w-3.5" /></Button>
                      )}
                      {i.status === "confirmed" && (
                        <Button size="sm" variant="ghost" disabled={busyId === i.id} onClick={() => setStatus(i, "completed")} title="Hoàn thành" className="text-blue-600"><CheckCircle2 className="h-3.5 w-3.5" /></Button>
                      )}
                      {i.status !== "cancelled" && i.status !== "completed" && (
                        <Button size="sm" variant="ghost" disabled={busyId === i.id} onClick={() => setStatus(i, "cancelled")} title="Huỷ" className="text-destructive"><X className="h-3.5 w-3.5" /></Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Chưa có đơn nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card max-w-lg w-full rounded-xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-4">Chi tiết đặt xe</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-muted-foreground inline">Mã: </dt><dd className="inline font-mono font-bold text-primary">{selected.booking_id}</dd></div>
              <div><dt className="text-muted-foreground inline">Loại: </dt><dd className="inline">{TYPE_LABEL[selected.transport_type]}</dd></div>
              <div><dt className="text-muted-foreground inline">Khách: </dt><dd className="inline">{selected.guest_name}</dd></div>
              <div><dt className="text-muted-foreground inline">SĐT: </dt><dd className="inline">{selected.guest_phone}</dd></div>
              <div><dt className="text-muted-foreground inline">Email: </dt><dd className="inline">{selected.guest_email}</dd></div>
              {selected.room_number && <div><dt className="text-muted-foreground inline">Phòng: </dt><dd className="inline">{selected.room_number}</dd></div>}
              <div><dt className="text-muted-foreground inline">Đón: </dt><dd className="inline">{selected.pickup_location}</dd></div>
              <div><dt className="text-muted-foreground inline">Trả: </dt><dd className="inline">{selected.dropoff_location}</dd></div>
              <div><dt className="text-muted-foreground inline">Giờ: </dt><dd className="inline font-semibold">{new Date(selected.pickup_datetime).toLocaleString("vi-VN")}</dd></div>
              <div><dt className="text-muted-foreground inline">Số khách: </dt><dd className="inline">{selected.passengers}</dd></div>
              {selected.flight_number && <div><dt className="text-muted-foreground inline">Chuyến bay: </dt><dd className="inline">{selected.flight_number}</dd></div>}
              {selected.luggage && <div><dt className="text-muted-foreground inline">Hành lý: </dt><dd className="inline">{selected.luggage}</dd></div>}
              {selected.notes && <div className="pt-2 border-t"><dt className="text-muted-foreground">Ghi chú:</dt><dd>{selected.notes}</dd></div>}
            </dl>
            <Button onClick={() => setSelected(null)} className="w-full mt-4">Đóng</Button>
          </div>
        </div>
      )}
    </div>
  );
}
