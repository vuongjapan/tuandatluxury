import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Plane, Waves, Landmark, Phone, MessageCircle, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type TabKey = "airport" | "beach" | "square";

const TABS: { key: TabKey; label: string; icon: any; price: string; subtitle: string }[] = [
  { key: "airport", label: "Sân bay", icon: Plane, price: "Theo yêu cầu — báo giá", subtitle: "Sân bay Thọ Xuân ↔ Khách sạn (~45km, ~50 phút)" },
  { key: "beach", label: "Bãi tắm", icon: Waves, price: "Miễn phí", subtitle: "Xe chạy mỗi 30 phút từ 06:00–20:00" },
  { key: "square", label: "Quảng trường", icon: Landmark, price: "Miễn phí", subtitle: "Khách sạn ↔ Quảng trường biển Sầm Sơn" },
];

export default function Transport() {
  const [params, setParams] = useSearchParams();
  const initialTab = (params.get("tab") as TabKey) || "airport";
  const [tab, setTab] = useState<TabKey>(initialTab);
  const { toast } = useToast();

  useEffect(() => { setParams({ tab }, { replace: true }); }, [tab, setParams]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/services" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4" /> Quay lại Dịch vụ
          </Link>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">Đặt xe đưa đón</h1>
          <p className="text-muted-foreground mb-6">Dịch vụ đưa đón tận nơi cho khách lưu trú tại Tuấn Đạt Luxury.</p>

          {/* Tabs */}
          <div className="grid grid-cols-3 gap-2 mb-8 bg-card p-2 rounded-xl border border-border">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-all text-sm font-semibold ${tab === t.key ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-secondary"}`}>
                <t.icon className="h-5 w-5" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Info banner */}
          <div className="bg-secondary border border-border rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-foreground">{TABS.find(t => t.key === tab)?.subtitle}</p>
            <p className="text-xs text-primary font-bold mt-1">{TABS.find(t => t.key === tab)?.price}</p>
          </div>

          <TransportForm tab={tab} onSuccess={(id) => toast({ title: "Đặt xe thành công!", description: `Mã: ${id}. Email xác nhận đã được gửi.` })} />

          {/* Quick contact */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            <a href="tel:0384418811" className="flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-semibold text-sm">
              <Phone className="h-4 w-4" /> Gọi 038.441.8811
            </a>
            <a href="https://zalo.me/0384418811" target="_blank" rel="noopener" className="flex items-center justify-center gap-2 bg-card border border-border py-3 rounded-lg font-semibold text-sm">
              <MessageCircle className="h-4 w-4" /> Chat Zalo
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function TransportForm({ tab, onSuccess }: { tab: TabKey; onSuccess: (id: string) => void }) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [form, setForm] = useState({
    guest_name: "",
    guest_phone: "",
    guest_email: "",
    room_number: "",
    pickup_datetime: "",
    passengers: 1,
    luggage: "",
    flight_number: "",
    notes: "",
    pickup_direction: "to_hotel", // for airport / square
  });

  const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guest_name || !form.guest_phone || !form.guest_email || !form.pickup_datetime) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng điền các trường bắt buộc (*)", variant: "destructive" });
      return;
    }
    if (tab === "airport" && !form.flight_number) {
      toast({ title: "Thiếu số hiệu chuyến bay", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      let pickup = "", dropoff = "";
      if (tab === "airport") {
        if (form.pickup_direction === "to_hotel") { pickup = "Sân bay Thọ Xuân"; dropoff = "Khách sạn Tuấn Đạt Luxury"; }
        else { pickup = "Khách sạn Tuấn Đạt Luxury"; dropoff = "Sân bay Thọ Xuân"; }
      } else if (tab === "square") {
        if (form.pickup_direction === "to_hotel") { pickup = "Quảng trường biển Sầm Sơn"; dropoff = "Khách sạn Tuấn Đạt Luxury"; }
        else { pickup = "Khách sạn Tuấn Đạt Luxury"; dropoff = "Quảng trường biển Sầm Sơn"; }
      } else {
        pickup = "Khách sạn Tuấn Đạt Luxury"; dropoff = "Bãi tắm Sầm Sơn";
      }

      const payload = {
        guest_name: form.guest_name,
        guest_phone: form.guest_phone,
        guest_email: form.guest_email,
        room_number: form.room_number || null,
        transport_type: tab,
        pickup_location: pickup,
        dropoff_location: dropoff,
        pickup_datetime: new Date(form.pickup_datetime).toISOString(),
        passengers: Number(form.passengers) || 1,
        luggage: tab === "airport" ? (form.luggage || null) : null,
        flight_number: tab === "airport" ? (form.flight_number || null) : null,
        notes: form.notes || null,
        price: 0,
        status: "pending" as const,
      };

      const { data, error } = await (supabase as any).from("transport_bookings").insert(payload).select().single();
      if (error) throw error;

      // Trigger email (don't block UX if it fails)
      try {
        await supabase.functions.invoke("send-transport-email", {
          body: { type: "guest_confirmation", booking: data },
        });
      } catch (err) {
        console.error("Email send failed:", err);
      }

      setDone(data.booking_id);
      onSuccess(data.booking_id);
    } catch (err: any) {
      toast({ title: "Lỗi đặt xe", description: err.message || "Vui lòng thử lại", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <CheckCircle2 className="h-14 w-14 text-green-600 mx-auto mb-4" />
        <h3 className="font-display text-2xl font-bold mb-2">Đặt xe thành công!</h3>
        <p className="text-muted-foreground mb-4">Mã xác nhận của bạn:</p>
        <p className="text-3xl font-bold text-primary tracking-wider mb-4">{done}</p>
        <p className="text-sm text-muted-foreground mb-6">Email xác nhận đã được gửi đến <b>{form.guest_email}</b>. Lễ tân sẽ liên hệ trong vòng 30 phút.</p>
        <Button onClick={() => { setDone(null); setForm({ ...form, notes: "" }); }} variant="outline">Đặt thêm chuyến khác</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-5 md:p-6 space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Họ và tên *</Label>
          <Input value={form.guest_name} onChange={e => update("guest_name", e.target.value)} required />
        </div>
        <div>
          <Label>Số điện thoại *</Label>
          <Input type="tel" value={form.guest_phone} onChange={e => update("guest_phone", e.target.value)} required />
        </div>
        <div>
          <Label>Email nhận xác nhận *</Label>
          <Input type="email" value={form.guest_email} onChange={e => update("guest_email", e.target.value)} required />
        </div>
        <div>
          <Label>Số phòng (nếu đang lưu trú)</Label>
          <Input value={form.room_number} onChange={e => update("room_number", e.target.value)} placeholder="VD: 305" />
        </div>
      </div>

      {(tab === "airport" || tab === "square") && (
        <div>
          <Label>Loại hành trình *</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer text-sm ${form.pickup_direction === "to_hotel" ? "border-primary bg-primary/5" : "border-border"}`}>
              <input type="radio" name="dir" checked={form.pickup_direction === "to_hotel"} onChange={() => update("pickup_direction", "to_hotel")} />
              {tab === "airport" ? "Đón từ sân bay → KS" : "Quảng trường → KS"}
            </label>
            <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer text-sm ${form.pickup_direction === "from_hotel" ? "border-primary bg-primary/5" : "border-border"}`}>
              <input type="radio" name="dir" checked={form.pickup_direction === "from_hotel"} onChange={() => update("pickup_direction", "from_hotel")} />
              {tab === "airport" ? "Đưa từ KS → sân bay" : "KS → Quảng trường"}
            </label>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Ngày & Giờ đón *</Label>
          <Input type="datetime-local" value={form.pickup_datetime} onChange={e => update("pickup_datetime", e.target.value)} required />
        </div>
        <div>
          <Label>Số hành khách *</Label>
          <div className="flex items-center gap-2 mt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => update("passengers", Math.max(1, form.passengers - 1))}>−</Button>
            <Input type="number" min={1} value={form.passengers} onChange={e => update("passengers", Number(e.target.value))} className="text-center" />
            <Button type="button" variant="outline" size="sm" onClick={() => update("passengers", form.passengers + 1)}>+</Button>
          </div>
        </div>
      </div>

      {tab === "airport" && (
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Số hiệu chuyến bay *</Label>
            <Input value={form.flight_number} onChange={e => update("flight_number", e.target.value)} placeholder="VD: VN123" required />
          </div>
          <div>
            <Label>Hành lý</Label>
            <select value={form.luggage} onChange={e => update("luggage", e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md text-sm">
              <option value="">-- Chọn --</option>
              <option>Không có hành lý</option>
              <option>1 vali xách tay</option>
              <option>1 vali ký gửi</option>
              <option>2 vali ký gửi</option>
              <option>Nhiều hơn (ghi chú bên dưới)</option>
            </select>
          </div>
        </div>
      )}

      <div>
        <Label>Ghi chú thêm</Label>
        <Textarea value={form.notes} onChange={e => update("notes", e.target.value)} rows={3} placeholder="Yêu cầu đặc biệt..." />
      </div>

      <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground font-bold py-6">
        {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Đang gửi...</> : "🚗 ĐẶT XE NGAY"}
      </Button>
    </form>
  );
}
