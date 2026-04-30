import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';
import Header from '@/components/Header';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // Supabase auth processes the recovery link automatically and emits PASSWORD_RECOVERY event.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    // also check existing session (link may already be processed)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) { toast({ title: 'Mật khẩu phải ≥ 8 ký tự', variant: 'destructive' }); return; }
    if (pw !== pw2) { toast({ title: 'Mật khẩu xác nhận không khớp', variant: 'destructive' }); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast({ title: 'Lỗi', description: error.message, variant: 'destructive' }); return; }
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-12 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-card-hover p-8">
          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
              <h1 className="font-display text-2xl font-bold">Mật khẩu đã được cập nhật!</h1>
              <p className="text-sm text-muted-foreground">Bạn có thể đăng nhập với mật khẩu mới.</p>
              <Button variant="hero" className="w-full" onClick={() => navigate('/member')}>
                Đăng nhập ngay →
              </Button>
            </div>
          ) : !ready ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground mt-3">Đang xác thực link đặt lại...</p>
              <p className="text-xs text-muted-foreground mt-2">Nếu link đã hết hạn, vui lòng yêu cầu link mới.</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <KeyRound className="h-10 w-10 text-primary mx-auto mb-3" />
                <h1 className="font-display text-2xl font-bold text-foreground">Tạo mật khẩu mới</h1>
                <p className="text-sm text-muted-foreground mt-1">Tuấn Đạt Luxury Hotel</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <PwField label="Mật khẩu mới *" value={pw} onChange={setPw} show={show} setShow={setShow} />
                <PwField label="Xác nhận mật khẩu *" value={pw2} onChange={setPw2} show={show} setShow={setShow} />
                {pw2 && (
                  <p className={`text-xs ${pw === pw2 ? 'text-green-700' : 'text-destructive'}`}>
                    {pw === pw2 ? '✅ Mật khẩu khớp' : '❌ Chưa khớp'}
                  </p>
                )}
                <Button type="submit" variant="hero" className="w-full gap-2" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Xác nhận mật khẩu mới
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

const PwField = ({ label, value, onChange, show, setShow }: any) => (
  <div>
    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{label}</label>
    <div className="relative">
      <Input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} required minLength={8} />
      <button type="button" tabIndex={-1} onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  </div>
);

export default ResetPassword;
