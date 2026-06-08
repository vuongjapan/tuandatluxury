import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, Loader2, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

const ROOM_NUMBERS = [
  '202','204','206','208',
  '302','304','306','308',
  '402','405','406','408',
  '502','504','506','508',
  '602','604','606',
];

const WEEKDAY_VI = ['CN','T2','T3','T4','T5','T6','T7'];

const formatNumber = (n: number) => n > 0 ? n.toLocaleString('vi-VN') : '';
const parseNumber = (s: string) => {
  const cleaned = s.replace(/[^\d]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
};

interface CellState {
  amount: number;
  status?: 'saving' | 'saved' | 'error';
}

const AdminRoomRevenue = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, CellState>>({}); // key = `${date}|${room}`
  const [globalStatus, setGlobalStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const daysInMonth = new Date(year, month, 0).getDate();
  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  const keyOf = (day: number, room: string) =>
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}|${room}`;

  // Fetch data for month
  const fetchData = useCallback(async () => {
    setLoading(true);
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
    const { data: rows, error } = await supabase
      .from('room_revenue' as any)
      .select('*')
      .gte('date', start)
      .lte('date', end);
    if (error) {
      toast({ title: 'Lỗi tải dữ liệu', description: error.message, variant: 'destructive' });
    } else {
      const map: Record<string, CellState> = {};
      (rows || []).forEach((r: any) => {
        map[`${r.date}|${r.room_number}`] = { amount: Number(r.amount) || 0 };
      });
      setData(map);
    }
    setLoading(false);
  }, [month, year, daysInMonth, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Save cell (upsert)
  const saveCell = async (day: number, room: string, amount: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const k = keyOf(day, room);
    setData(prev => ({ ...prev, [k]: { amount, status: 'saving' } }));
    setGlobalStatus('saving');
    const { error } = await supabase
      .from('room_revenue' as any)
      .upsert(
        {
          room_number: room,
          date: dateStr,
          amount,
          updated_by: user?.email || 'admin',
        },
        { onConflict: 'room_number,date' }
      );
    if (error) {
      setData(prev => ({ ...prev, [k]: { amount, status: 'error' } }));
      toast({ title: 'Lỗi lưu', description: error.message, variant: 'destructive' });
      setGlobalStatus('idle');
    } else {
      setData(prev => ({ ...prev, [k]: { amount, status: 'saved' } }));
      setGlobalStatus('saved');
      setTimeout(() => setGlobalStatus('idle'), 1500);
    }
  };

  // Totals
  const rowTotal = (day: number) =>
    ROOM_NUMBERS.reduce((s, r) => s + (data[keyOf(day, r)]?.amount || 0), 0);
  const colTotal = (room: string) =>
    days.reduce((s, d) => s + (data[keyOf(d, room)]?.amount || 0), 0);
  const grandTotal = days.reduce((s, d) => s + rowTotal(d), 0);

  // Navigation
  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1);
  };

  // Focus next cell on Enter/Tab
  const focusCell = (day: number, roomIdx: number) => {
    if (roomIdx >= ROOM_NUMBERS.length) {
      day += 1;
      roomIdx = 0;
    }
    if (day > daysInMonth) return;
    const k = `${day}-${ROOM_NUMBERS[roomIdx]}`;
    const el = inputRefs.current.get(k);
    el?.focus();
    el?.select();
  };

  // Export to Excel
  const exportExcel = () => {
    const header = ['Thứ', 'Ngày', ...ROOM_NUMBERS, 'Tổng Ngày'];
    const aoa: any[][] = [header];
    days.forEach(d => {
      const dow = new Date(year, month - 1, d).getDay();
      const row: any[] = [WEEKDAY_VI[dow], d];
      ROOM_NUMBERS.forEach(r => {
        const v = data[keyOf(d, r)]?.amount || 0;
        row.push(v || '');
      });
      row.push(rowTotal(d));
      aoa.push(row);
    });
    const totalRow: any[] = ['TỔNG DOANH THU', ''];
    ROOM_NUMBERS.forEach(r => totalRow.push(colTotal(r)));
    totalRow.push(grandTotal);
    aoa.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 6 }, { wch: 6 }, ...ROOM_NUMBERS.map(() => ({ wch: 9 })), { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Thang ${month}-${year}`);
    XLSX.writeFile(wb, `BangDatPhong_Thang${month}_Nam${year}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Bảng quản lý phòng</h2>
          <p className="text-sm text-muted-foreground">
            Bảng đặt phòng tháng {month} năm {year} · Click ô để sửa, Enter/Tab để chuyển ô · Tự lưu
          </p>
        </div>
        <div className="flex items-center gap-2">
          {globalStatus === 'saving' && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Đang lưu...
            </span>
          )}
          {globalStatus === 'saved' && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Check className="h-3 w-3" /> Đã lưu
            </span>
          )}
          <Button variant="outline" size="sm" onClick={exportExcel}>
            <Download className="h-4 w-4 mr-1" /> Xuất Excel
          </Button>
        </div>
      </div>

      {/* Month picker */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" /> Tháng trước
        </Button>
        <select
          value={month}
          onChange={(e) => setMonth(parseInt(e.target.value))}
          className="px-3 py-1.5 rounded border border-border bg-background text-sm"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <option key={m} value={m}>Tháng {m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="px-3 py-1.5 rounded border border-border bg-background text-sm"
        >
          {Array.from({ length: 7 }, (_, i) => today.getFullYear() - 2 + i).map(y => (
            <option key={y} value={y}>Năm {y}</option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={nextMonth}>
          Tháng sau <ChevronRight className="h-4 w-4" />
        </Button>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-auto max-h-[75vh] bg-card">
        <table className="text-xs border-collapse" style={{ fontFamily: 'system-ui, sans-serif' }}>
          <thead className="sticky top-0 z-20 bg-[#4472C4] text-white">
            <tr>
              <th className="sticky left-0 z-30 bg-[#4472C4] border border-white/40 px-2 py-1.5 min-w-[44px]">Thứ</th>
              <th className="sticky left-[44px] z-30 bg-[#4472C4] border border-white/40 px-2 py-1.5 min-w-[44px]">Ngày</th>
              {ROOM_NUMBERS.map(r => (
                <th key={r} className="border border-white/40 px-2 py-1.5 min-w-[68px] font-semibold">{r}</th>
              ))}
              <th className="border border-white/40 px-2 py-1.5 min-w-[90px] bg-[#C00000]">Tổng Ngày</th>
            </tr>
          </thead>
          <tbody>
            {days.map(d => {
              const dow = new Date(year, month - 1, d).getDay();
              const isWeekend = dow === 0 || dow === 5 || dow === 6;
              const rowBg = isWeekend ? 'bg-yellow-50' : 'bg-white';
              return (
                <tr key={d} className={rowBg}>
                  <td className={`sticky left-0 z-10 ${rowBg} border border-border px-2 py-1 text-center font-medium`}>
                    {WEEKDAY_VI[dow]}
                  </td>
                  <td className={`sticky left-[44px] z-10 ${rowBg} border border-border px-2 py-1 text-center font-medium`}>
                    {d}
                  </td>
                  {ROOM_NUMBERS.map((r, idx) => {
                    const k = keyOf(d, r);
                    const cell = data[k];
                    const amount = cell?.amount || 0;
                    const cellBg = amount > 0 ? 'bg-[#DCE6F1]' : '';
                    return (
                      <td key={r} className={`border border-border p-0 ${cellBg}`}>
                        <input
                          ref={(el) => {
                            if (el) inputRefs.current.set(`${d}-${r}`, el);
                          }}
                          type="text"
                          defaultValue={formatNumber(amount)}
                          key={`${k}-${amount}`}
                          onFocus={(e) => e.target.select()}
                          onBlur={(e) => {
                            const newVal = parseNumber(e.target.value);
                            if (newVal !== amount) saveCell(d, r, newVal);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Tab') {
                              e.preventDefault();
                              (e.target as HTMLInputElement).blur();
                              focusCell(d, idx + 1);
                            }
                          }}
                          className="w-full px-1.5 py-1 text-right bg-transparent outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-yellow-50 text-xs"
                        />
                      </td>
                    );
                  })}
                  <td className="border border-border px-2 py-1 text-right font-semibold bg-[#FCE4D6]">
                    {rowTotal(d).toLocaleString('vi-VN')}
                  </td>
                </tr>
              );
            })}
            {/* Total row */}
            <tr className="bg-gray-700 text-white font-bold sticky bottom-0 z-10">
              <td colSpan={2} className="sticky left-0 bg-gray-700 border border-gray-600 px-2 py-1.5 text-center">
                TỔNG DOANH THU
              </td>
              {ROOM_NUMBERS.map(r => (
                <td key={r} className="border border-gray-600 px-2 py-1.5 text-right">
                  {colTotal(r).toLocaleString('vi-VN')}
                </td>
              ))}
              <td className="border border-gray-600 px-2 py-1.5 text-right bg-[#C00000]">
                {grandTotal.toLocaleString('vi-VN')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        💡 Mẹo: Click ô để sửa, Enter/Tab để sang ô kế. Ô có số → nền xanh. Cuối tuần → nền vàng.
        Tổng ngày & tổng phòng tự cập nhật. Xuất Excel để tải file đầy đủ.
      </p>
    </div>
  );
};

export default AdminRoomRevenue;
