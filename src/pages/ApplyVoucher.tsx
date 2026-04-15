import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const ApplyVoucher = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code') || '';

  useEffect(() => {
    if (code) {
      // Store code in sessionStorage for auto-fill at booking
      sessionStorage.setItem('voucher_code', code);
      navigate(`/booking?voucher=${code}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [code, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Đang áp dụng mã giảm giá...</p>
      </div>
    </div>
  );
};

export default ApplyVoucher;
