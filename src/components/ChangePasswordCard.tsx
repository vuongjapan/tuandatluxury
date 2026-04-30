import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, KeyRound, Mail } from 'lucide-react';

interface Props {
  email: string;
}

function strength(pw: string) {
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const labels = ['Rất yếu', 'Yếu', 'Trung bình', 'Tốt', 'Mạnh'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  return { checks, score, label: labels[score], color: colors[score] };
}

export const ChangePasswordCard = ({ email }: Props) => {
  const { toast } = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  const s = strength(next);
  const matches = next.length > 0 && next === confirm;

  const handleChange = async () => {
    if (!current || !next) { toast({ title: 'Nhập đầy đủ mật khẩu', variant: 'destructive' }); return; }
    if (next.length < 8) { toast({ title: 'Mật khẩu mới phải ≥ 8 ký tự', variant: 'destructive' }); return; }
    if (next !== confirm) { toast({ title: 'Mật khẩu xác nhận không khớp', variant: 'destructive' }); return; }
    setBusy(true);
    // Verify current
    const { error: vErr } = await supabase.auth.signInWithPassword({ email, password: current });
    if (vErr) {
      setBusy(false);
      toast({ title: 'Mật khẩu hiện tại không đúng', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (error) { toast({ title: 'Đổi mật khẩu thất bại', description: error.message, variant: 'destructive' }); return; }
    setCurrent(''); setNext(''); setConfirm('');
    toast({ title: '✅ Đã đổi mật khẩu' });
  };

  const handleReset = async () => {
    setResetBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetBusy(false);
    if (error) { toast({ title: 'Gửi email thất bại', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '📧 Đã gửi email đặt lại mật khẩu', description: `Kiểm tra hộp thư ${email}` });
  };

  return (
    <div className="border border-border rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-primary" /> Đổi mật khẩu
      </h3>

      <div className="space-y-3 text-sm">
        <PasswordField label="Mật khẩu hiện tại *" value={current} onChange={setCurrent} show={show} setShow={setShow} />
        <PasswordField label="Mật khẩu mới *" value={next} onChange={setNext} show={show} setShow={setShow} />

        {next.length > 0 && (
          <div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className={`h-full ${s.color} transition-all`} style={{ width: `${(s.score / 4) * 100}%` }} />
            </div>
            <p className="text-xs mt-1 text-muted-foreground">Độ mạnh: <span className="font-semibold text-foreground">{s.label}</span></p>
            <ul className="text-[11px] text-muted-foreground mt-1 grid grid-cols-2 gap-x-2">
              <li>{s.checks.length ? '✅' : '⬜'} Ít nhất 8 ký tự</li>
              <li>{s.checks.upper ? '✅' : '⬜'} Có chữ hoa</li>
              <li>{s.checks.number ? '✅' : '⬜'} Có số</li>
              <li>{s.checks.special ? '✅' : '⬜'} Ký tự đặc biệt</li>
            </ul>
          </div>
        )}

        <PasswordField label="Xác nhận mật khẩu mới *" value={confirm} onChange={setConfirm} show={show} setShow={setShow} />
        {confirm.length > 0 && (
          <p className={`text-xs ${matches ? 'text-green-700' : 'text-destructive'}`}>
            {matches ? '✅ Mật khẩu khớp' : '❌ Mật khẩu chưa khớp'}
          </p>
        )}
      </div>

      <Button onClick={handleChange} disabled={busy} className="w-full gap-2">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        Đổi mật khẩu
      </Button>

      <div className="border-t border-border pt-3">
        <p className="text-xs text-muted-foreground mb-2">Hoặc nếu quên mật khẩu hiện tại:</p>
        <Button onClick={handleReset} variant="outline" disabled={resetBusy} className="w-full gap-2">
          {resetBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          Gửi link đặt lại về email
        </Button>
      </div>
    </div>
  );
};

const PasswordField = ({ label, value, onChange, show, setShow }: any) => (
  <div>
    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{label}</label>
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  </div>
);
