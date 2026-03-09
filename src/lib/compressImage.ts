const MAX_FILE_SIZE_MB = 10; // Maximum allowed file size in MB before compression

/**
 * Validate and compress an image file before uploading.
 * - Rejects files larger than maxFileSizeMB (even non-images).
 * - Resizes to maxWidth/maxHeight and compresses to JPEG quality.
 * - If the result is still over targetMaxKB, iteratively reduces quality.
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    maxFileSizeMB?: number;
    targetMaxKB?: number;
  } = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.7,
    maxFileSizeMB = MAX_FILE_SIZE_MB,
    targetMaxKB = 500,
  } = options;

  // Hard limit: reject oversized files
  const maxBytes = maxFileSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(
      `File "${file.name}" vượt quá giới hạn ${maxFileSizeMB}MB (${(file.size / 1024 / 1024).toFixed(1)}MB). Vui lòng chọn file nhỏ hơn.`
    );
  }

  // Skip non-image files or SVGs
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Only resize if larger than max dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      // Iterative compression: reduce quality until under targetMaxKB
      let currentQuality = quality;
      const targetBytes = targetMaxKB * 1024;
      let blob: Blob | null = null;

      for (let attempt = 0; attempt < 5; attempt++) {
        blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob((b) => res(b), 'image/jpeg', currentQuality)
        );

        if (!blob || blob.size <= targetBytes || currentQuality <= 0.3) break;
        currentQuality -= 0.1;
      }

      if (blob) {
        const compressed = new File(
          [blob],
          file.name.replace(/\.[^.]+$/, '.jpg'),
          { type: 'image/jpeg' }
        );
        // Only use compressed if it's actually smaller
        resolve(compressed.size < file.size ? compressed : file);
      } else {
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Không thể đọc file ảnh "${file.name}". File có thể bị hỏng.`));
    };

    img.src = url;
  });
}
