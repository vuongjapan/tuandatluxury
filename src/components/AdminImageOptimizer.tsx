import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ImageDown, Loader2, CheckCircle2 } from 'lucide-react';

interface OptResult {
  path: string;
  bucket: string;
  originalSize: number;
  newSize: number;
  skipped: boolean;
}

const BUCKETS = ['gallery', 'dining', 'site-assets'];
const MAX_WIDTH = 1200;
const QUALITY = 0.65;

async function compressBlobToJpeg(blob: Blob): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_WIDTH) {
        const ratio = MAX_WIDTH / width;
        width = MAX_WIDTH;
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (b) => resolve(b),
        'image/jpeg',
        QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const AdminImageOptimizer = () => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<OptResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const { toast } = useToast();

  const optimizeAll = async () => {
    setRunning(true);
    setResults([]);
    setProgress(0);

    const allFiles: { bucket: string; name: string }[] = [];

    // List all files in all buckets
    for (const bucket of BUCKETS) {
      const { data: folders } = await supabase.storage.from(bucket).list('', { limit: 1000 });
      if (!folders) continue;
      for (const item of folders) {
        if (item.id && item.metadata) {
          // It's a file at root level
          if (item.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
            allFiles.push({ bucket, name: item.name });
          }
        } else if (!item.id || !item.metadata) {
          // It's a folder, list its contents
          const { data: subFiles } = await supabase.storage.from(bucket).list(item.name, { limit: 1000 });
          if (subFiles) {
            for (const sub of subFiles) {
              if (sub.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
                allFiles.push({ bucket, name: `${item.name}/${sub.name}` });
              }
            }
          }
        }
      }
    }

    setTotal(allFiles.length);
    if (allFiles.length === 0) {
      toast({ title: 'Không tìm thấy ảnh nào để tối ưu' });
      setRunning(false);
      return;
    }

    const newResults: OptResult[] = [];

    for (let i = 0; i < allFiles.length; i++) {
      const { bucket, name } = allFiles[i];
      setCurrentFile(`${bucket}/${name}`);
      setProgress(i + 1);

      try {
        // Download
        const { data: downloadData, error: dlErr } = await supabase.storage.from(bucket).download(name);
        if (dlErr || !downloadData) {
          newResults.push({ path: name, bucket, originalSize: 0, newSize: 0, skipped: true });
          continue;
        }

        const originalSize = downloadData.size;

        // Skip small files (< 100KB)
        if (originalSize < 100 * 1024) {
          newResults.push({ path: name, bucket, originalSize, newSize: originalSize, skipped: true });
          continue;
        }

        // Compress
        const compressed = await compressBlobToJpeg(downloadData);
        if (!compressed || compressed.size >= originalSize) {
          newResults.push({ path: name, bucket, originalSize, newSize: originalSize, skipped: true });
          continue;
        }

        // Re-upload (overwrite)
        const { error: upErr } = await supabase.storage.from(bucket).update(name, compressed, {
          contentType: 'image/jpeg',
          upsert: true,
        });

        if (upErr) {
          // Try upload with upsert if update fails
          await supabase.storage.from(bucket).upload(name, compressed, {
            contentType: 'image/jpeg',
            upsert: true,
          });
        }

        newResults.push({ path: name, bucket, originalSize, newSize: compressed.size, skipped: false });
      } catch {
        newResults.push({ path: name, bucket, originalSize: 0, newSize: 0, skipped: true });
      }
    }

    setResults(newResults);
    setRunning(false);

    const optimized = newResults.filter(r => !r.skipped);
    const savedBytes = optimized.reduce((sum, r) => sum + (r.originalSize - r.newSize), 0);
    toast({
      title: `Đã tối ưu ${optimized.length}/${allFiles.length} ảnh`,
      description: `Tiết kiệm ${formatSize(savedBytes)}`,
    });
  };

  const optimized = results.filter(r => !r.skipped);
  const totalSaved = optimized.reduce((sum, r) => sum + (r.originalSize - r.newSize), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Nén & tối ưu ảnh Storage</h3>
          <p className="text-sm text-muted-foreground">
            Quét tất cả ảnh trên Storage, nén xuống JPEG chất lượng {Math.round(QUALITY * 100)}%, max {MAX_WIDTH}px
          </p>
        </div>
        <Button
          onClick={optimizeAll}
          disabled={running}
          variant="gold"
        >
          {running ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Đang xử lý...</>
          ) : (
            <><ImageDown className="h-4 w-4 mr-2" /> Tối ưu tất cả ảnh</>
          )}
        </Button>
      </div>

      {running && (
        <div className="space-y-2">
          <Progress value={(progress / total) * 100} />
          <p className="text-xs text-muted-foreground">
            {progress}/{total} — {currentFile}
          </p>
        </div>
      )}

      {results.length > 0 && !running && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <CheckCircle2 className="h-4 w-4" />
            Đã tối ưu {optimized.length} ảnh, tiết kiệm {formatSize(totalSaved)}
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1 text-xs">
            {results.filter(r => !r.skipped).map((r, i) => (
              <div key={i} className="flex justify-between text-muted-foreground bg-muted/50 rounded px-2 py-1">
                <span className="truncate flex-1">{r.bucket}/{r.path}</span>
                <span className="shrink-0 ml-2 text-primary font-medium">
                  {formatSize(r.originalSize)} → {formatSize(r.newSize)} (-{Math.round((1 - r.newSize / r.originalSize) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminImageOptimizer;
