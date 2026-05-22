import { useState } from 'react';
import { HelpCircle, X, Sparkles, AlertTriangle, Users, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  minPerPerson?: number;
  className?: string;
}

const MealHelpPopup = ({ minPerPerson = 300000, className }: Props) => {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const isVi = language === 'vi';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center gap-1 text-xs text-primary/80 hover:text-primary underline-offset-2 hover:underline transition',
          className,
        )}
      >
        <HelpCircle className="h-3.5 w-3.5" />
        {isVi ? 'Hướng dẫn cách đặt ăn' : 'How meal booking works'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-card rounded-2xl max-w-md w-full shadow-2xl max-h-[85vh] overflow-y-auto border border-border"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/60">
              <h3 className="font-display text-lg font-semibold">
                {isVi ? 'Hướng dẫn đặt bữa ăn' : 'Meal booking guide'}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition p-1 -m-1"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 text-sm text-foreground/90">
              <section>
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <h4 className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {isVi ? 'Ngày không bắt buộc' : 'Optional days'}
                  </h4>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-6">
                  {isVi
                    ? 'Bạn có thể đặt trước hoặc gọi trực tiếp tại nhà hàng. Không cần chọn ngay.'
                    : 'Pre-order in advance or simply order at the restaurant. Not required upfront.'}
                </p>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <h4 className="font-semibold text-orange-700 dark:text-orange-400">
                    {isVi ? 'Ngày bắt buộc chọn ăn' : 'Mandatory meal days'}
                  </h4>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-6 mb-2">
                  {isVi
                    ? 'Vào các ngày T6/T7/CN tháng 6–7, nhà hàng phục vụ theo combo. Bạn phải chọn 1 trong 3 cách:'
                    : 'On peak weekends in June–July, the restaurant serves set combos. Choose one of three options:'}
                </p>
                <ul className="list-disc pl-10 space-y-1 text-muted-foreground">
                  <li>
                    <span className="font-medium text-foreground">
                      {isVi ? 'Set menu combo' : 'Set combo'}
                    </span>{' '}
                    — {isVi ? 'chọn combo + thực đơn + số suất' : 'pick a combo, menu and servings'}.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">
                      {isVi ? 'Đặt món riêng' : 'Order à la carte'}
                    </span>{' '}
                    —{' '}
                    {isVi
                      ? `tổng ≥ ${minPerPerson.toLocaleString('vi-VN')}đ/người`
                      : `total ≥ ${minPerPerson.toLocaleString('vi-VN')}đ per person`}
                    .
                  </li>
                  <li>
                    <span className="font-medium text-foreground">
                      {isVi ? 'Mã miễn trừ' : 'Bypass code'}
                    </span>{' '}
                    —{' '}
                    {isVi ? 'nhập mã được cấp để bỏ qua.' : 'enter a code provided by staff to skip.'}
                  </li>
                </ul>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-1.5">
                  <Users className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-primary">
                    {isVi ? 'Nhiều nhóm bàn' : 'Multiple groups'}
                  </h4>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-6">
                  {isVi
                    ? `Bạn có thể chia đoàn thành nhiều nhóm bàn (mỗi nhóm tối thiểu 4 suất). Mỗi nhóm có thể chọn combo + thực đơn riêng. Tổng số suất các nhóm cần phủ đủ số khách.`
                    : `You can split into multiple table groups (min 4 servings each). Each group picks its own combo & menu. Total servings must cover all guests.`}
                </p>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-1.5">
                  <RotateCcw className="h-4 w-4 text-foreground/70" />
                  <h4 className="font-semibold">{isVi ? 'Thay đổi / Hủy' : 'Edit / Remove'}</h4>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-6">
                  {isVi
                    ? 'Nhấn nút × trên mỗi nhóm hoặc món để bỏ chọn và chọn lại.'
                    : 'Click × on any group or dish to remove and re-select.'}
                </p>
              </section>
            </div>

            <div className="px-5 pb-5 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold hover:bg-primary/90 transition"
              >
                {isVi ? 'Đã hiểu' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MealHelpPopup;
