import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Archive, RotateCcw, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const TRASH_KEY = 'tdl_admin_trash';

export interface TrashItem {
  type: 'booking';
  data: any;
  deletedAt: string;
}

export function getTrash(): TrashItem[] {
  try { return JSON.parse(localStorage.getItem(TRASH_KEY) || '[]'); } catch { return []; }
}

export function saveTrash(items: TrashItem[]) {
  localStorage.setItem(TRASH_KEY, JSON.stringify(items));
}

interface Props {
  trashItems: TrashItem[];
  setTrashItems: (items: TrashItem[]) => void;
  onRefresh: () => void;
}

const AdminTrash = ({ trashItems, setTrashItems, onRefresh }: Props) => {
  const { toast } = useToast();

  const restoreFromTrash = async (index: number) => {
    const item = trashItems[index];
    if (item.type === 'booking') {
      await supabase.from('bookings').update({ status: 'pending' }).eq('id', item.data.id);
      onRefresh();
    }
    const newTrash = trashItems.filter((_, i) => i !== index);
    saveTrash(newTrash);
    setTrashItems(newTrash);
    toast({ title: 'Đã khôi phục' });
  };

  const permanentDelete = (index: number) => {
    if (!confirm('Xóa vĩnh viễn? Không thể hoàn tác!')) return;
    const newTrash = trashItems.filter((_, i) => i !== index);
    saveTrash(newTrash);
    setTrashItems(newTrash);
    toast({ title: 'Đã xóa vĩnh viễn' });
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
        <Archive className="h-5 w-5 text-muted-foreground" />
        Thùng rác ({trashItems.length})
      </h3>
      {trashItems.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Thùng rác trống</p>
      ) : (
        <div className="space-y-3">
          {trashItems.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-secondary rounded-lg gap-3">
              <div className="min-w-0">
                <p className="font-medium text-sm">🏨 Đặt phòng</p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.data.guest_name} · {item.data.booking_code} · {item.data.guest_phone}
                </p>
                <p className="text-xs text-muted-foreground">
                  Xóa lúc: {format(new Date(item.deletedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => restoreFromTrash(idx)}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />Khôi phục
                </Button>
                <Button variant="destructive" size="sm" onClick={() => permanentDelete(idx)}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" />Xóa hẳn
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTrash;
