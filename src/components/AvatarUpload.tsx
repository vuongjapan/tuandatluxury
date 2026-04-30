import { useRef, useState } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Props {
  userId: string;
  currentUrl?: string;
  kind: 'avatar' | 'cover';
  onChange: (url: string) => void;
  className?: string;
}

const MAX_SIZE_MB = 5;

export const AvatarUpload = ({ userId, currentUrl, kind, onChange, className = '' }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({ title: `Ảnh tối đa ${MAX_SIZE_MB}MB`, variant: 'destructive' });
      return;
    }
    if (!/^image\//.test(file.type)) {
      toast({ title: 'File không phải ảnh', variant: 'destructive' });
      return;
    }
    setBusy(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (error) {
      setBusy(false);
      toast({ title: 'Tải ảnh thất bại', description: error.message, variant: 'destructive' });
      return;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    onChange(data.publicUrl);
    setBusy(false);
    toast({ title: 'Đã tải ảnh ✓' });
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
        {kind === 'avatar' ? 'Đổi ảnh đại diện' : 'Đổi ảnh bìa'}
      </Button>
      {currentUrl && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="gap-1.5 text-destructive hover:text-destructive"
          onClick={() => onChange('')}
          disabled={busy}
        >
          <Trash2 className="h-3.5 w-3.5" /> Xóa
        </Button>
      )}
    </div>
  );
};
