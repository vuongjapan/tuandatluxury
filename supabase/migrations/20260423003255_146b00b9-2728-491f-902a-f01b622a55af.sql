ALTER TABLE public.voucher_codes
ADD COLUMN IF NOT EXISTS applies_to TEXT NOT NULL DEFAULT 'all'
CHECK (applies_to IN ('all','room','food'));

COMMENT ON COLUMN public.voucher_codes.applies_to IS 'Voucher scope: all = tổng đơn (phòng+ăn), room = chỉ tiền phòng, food = chỉ đồ ăn/dịch vụ';