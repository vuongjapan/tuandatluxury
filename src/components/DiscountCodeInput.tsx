import { useState } from 'react';
import { Tag, X, Loader2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { validateDiscountCode, type DiscountCode } from '@/hooks/usePromotionSystem';

interface DiscountCodeInputProps {
  orderType: 'room' | 'food';
  orderAmount: number;
  /** Apply a single code (legacy single-mode). */
  onApply?: (discount: DiscountCode) => void;
  /** Remove the (only / single) applied code (legacy single-mode). */
  onRemove?: () => void;
  /** Currently applied code in single-mode. */
  appliedCode?: DiscountCode | null;

  /** NEW: Multi-mode — array of applied codes. When provided, multi-mode is active. */
  appliedCodes?: DiscountCode[];
  /** Add a new code in multi-mode. */
  onAdd?: (discount: DiscountCode) => void;
  /** Remove a single code by code-string in multi-mode. */
  onRemoveCode?: (code: string) => void;
}

const DiscountCodeInput = ({
  orderType, orderAmount,
  onApply, onRemove, appliedCode,
  appliedCodes, onAdd, onRemoveCode,
}: DiscountCodeInputProps) => {
  const { language, formatPrice } = useLanguage();
  const isVi = language === 'vi';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isMulti = Array.isArray(appliedCodes);
  const codes = isMulti ? appliedCodes! : (appliedCode ? [appliedCode] : []);

  const handleApply = async () => {
    if (!code.trim()) return;
    const upper = code.trim().toUpperCase();

    // Prevent duplicates
    if (codes.some(c => c.code.toUpperCase() === upper)) {
      setError(isVi ? 'Mã này đã được áp dụng' : 'This code is already applied');
      return;
    }

    setLoading(true);
    setError('');
    const result = await validateDiscountCode(upper, orderType, orderAmount);

    if (result.valid && result.discount) {
      if (isMulti && onAdd) onAdd(result.discount);
      else if (onApply) onApply(result.discount);
      setCode('');
    } else {
      setError(result.message || (isVi ? 'Mã không hợp lệ' : 'Invalid code'));
    }
    setLoading(false);
  };

  const removeOne = (c: DiscountCode) => {
    if (isMulti && onRemoveCode) onRemoveCode(c.code);
    else if (onRemove) onRemove();
  };

  return (
    <div className="space-y-2">
      {/* Applied codes list */}
      {codes.length > 0 && (
        <div className="space-y-1.5">
          {codes.map(c => {
            const text = c.discount_type === 'percent'
              ? `-${c.discount_value}%`
              : `-${formatPrice(c.discount_value)}`;
            return (
              <div key={c.code} className="bg-primary/5 border border-primary/20 rounded-xl p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Tag className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <span className="font-semibold text-sm text-foreground">{c.code}</span>
                      <span className="text-xs text-primary ml-2">{text}</span>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {isVi ? c.title_vi : c.title_en}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeOne(c)} className="h-7 w-7 p-0 shrink-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Input row — always visible in multi-mode, hidden when a code is applied in single-mode */}
      {(isMulti || codes.length === 0) && (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
                placeholder={isVi
                  ? (codes.length > 0 ? 'Thêm mã khác...' : 'Nhập mã giảm giá')
                  : (codes.length > 0 ? 'Add another code...' : 'Enter discount code')}
                className="pl-10"
                onKeyDown={e => e.key === 'Enter' && handleApply()}
              />
            </div>
            <Button variant="outline" onClick={handleApply} disabled={loading || !code.trim()}>
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : codes.length > 0 ? <><Plus className="h-4 w-4 mr-1" /> {isVi ? 'Thêm' : 'Add'}</> : (isVi ? 'Áp dụng' : 'Apply')}
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          {isMulti && codes.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {isVi ? '✨ Bạn có thể nhập thêm nhiều mã khác' : '✨ You can stack multiple codes'}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default DiscountCodeInput;
