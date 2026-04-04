import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { UserPlus, LogIn, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';

const MemberAuth = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw new Error(error);
        toast({ title: 'Đăng nhập thành công!' });
        navigate('/');
      } else {
        if (!fullName.trim() || !phone.trim()) {
          throw new Error('Vui lòng điền đầy đủ thông tin');
        }
        if (password !== confirmPassword) {
          throw new Error('Mật khẩu xác nhận không khớp');
        }
        const { error } = await signUp(email, password, fullName, phone);
        if (error) throw new Error(error);
        toast({ title: 'Đăng ký thành công!', description: 'Bạn đã trở thành thành viên Tuấn Đạt Luxury Hotel.' });
        navigate('/');
      }
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-12 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-card rounded-2xl border border-border shadow-card-hover p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gold-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                {mode === 'login' ? (
                  <LogIn className="h-8 w-8 text-primary-foreground" />
                ) : (
                  <UserPlus className="h-8 w-8 text-primary-foreground" />
                )}
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                {mode === 'login' ? 'Đăng nhập' : 'Đăng ký thành viên'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Tuấn Đạt Luxury Hotel</p>
            </div>

            {/* Tab switcher */}
            <div className="flex rounded-xl bg-secondary p-1 mb-6">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  mode === 'login' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  mode === 'register' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                Đăng ký
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Họ tên</label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Số điện thoại</label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912 345 678"
                      required
                    />
                  </div>
                </>
              )}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Mật khẩu</label>
                <div className="relative">
                  <Input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {mode === 'register' && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Xác nhận mật khẩu</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive mt-1">Mật khẩu không khớp</p>
                  )}
                </div>
              )}
              <Button variant="hero" className="w-full" type="submit" disabled={loading || (mode === 'register' && password !== confirmPassword)}>
                {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
              </Button>
            </form>

            {mode === 'register' && (
              <div className="mt-4 p-3 bg-secondary rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  🎖 Đặt phòng 3+ lần → <span className="font-semibold text-primary">VIP</span> &nbsp;|&nbsp;
                  10+ lần → <span className="font-semibold text-primary">Siêu VIP</span>
                </p>
              </div>
            )}

            <div className="mt-6 text-center">
              <a href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Về trang chủ
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MemberAuth;
