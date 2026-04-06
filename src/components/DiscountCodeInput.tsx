import { useState } from 'react';
import { Tag, Check, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { validateDiscountCode, type DiscountCode } from '@/hooks/usePromotionSystem';

interface DiscountCodeInputProps {
  orderType: 'room' | 'food';
  orderAmount: number;
  onApply: (discount: DiscountCode) => void;
  onRemove: () => void;
  appliedCode: DiscountCode | null;
}

const DiscountCodeInput = ({ orderType, orderAmount, onApply, onRemove, appliedCode }: DiscountCodeInputProps) => {
  const { language, formatPrice } = useLanguage();
  const isVi = language === 'vi';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    const result = await validateDiscountCode(code.trim(), orderType, orderAmount);
    if (result.valid && result.discount) {
      onApply(result.discount);
      setCode('');
    } else {
      setError(result.message || (isVi ? 'Mã không hợp lệ' : 'Invalid code'));
    }
    setLoading(false);
  };

  if (appliedCode) {
    const discountText = appliedCode.discount_type === 'percent'
      ? `-${appliedCode.discount_value}%`
      : `-${formatPrice(appliedCode.discount_value)}`;

    return (
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <div>
              <span className="font-semibold text-sm text-foreground">{appliedCode.code}</span>
              <span className="text-xs text-primary ml-2">{discountText}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove} className="h-7 w-7 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {isVi ? appliedCode.title_vi : appliedCode.title_en}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
            placeholder={isVi ? 'Nhập mã giảm giá' : 'Enter discount code'}
            className="pl-10"
            onKeyDown={e => e.key === 'Enter' && handleApply()}
          />
        </div>
        <Button variant="outline" onClick={handleApply} disabled={loading || !code.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isVi ? 'Áp dụng' : 'Apply')}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default DiscountCodeInput;
