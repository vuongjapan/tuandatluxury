import imageCompression from 'browser-image-compression';

const MAX_FILE_SIZE_MB = 50; // Hard reject above this

/**
 * Validate + compress an image file before uploading.
 * - Hard-rejects files over `maxFileSizeMB` (default 50MB).
 * - Resizes to maxWidthOrHeight, converts to WebP at target quality.
 * - Skips non-images (returns original).
 * - If output is larger than original, returns original.
 *
 * Backwards-compatible signature: existing callers that pass `maxWidth/maxHeight/quality`
 * still work; the new implementation uses `browser-image-compression` under the hood
 * with WebP for ~30-50% smaller files vs JPEG.
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

  // Hard limit
  const maxBytes = maxFileSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(
      `File "${file.name}" vượt quá giới hạn ${maxFileSizeMB}MB (${(file.size / 1024 / 1024).toFixed(1)}MB). Vui lòng chọn file nhỏ hơn.`
    );
  }

  // Skip non-images and SVGs
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: targetMaxKB / 1024,
      maxWidthOrHeight: Math.max(maxWidth, maxHeight),
      useWebWorker: true,
      fileType: 'image/webp',
      initialQuality: quality,
      alwaysKeepResolution: false,
    });

    // Wrap as File with .webp extension
    const webpName = file.name.replace(/\.[^.]+$/, '.webp');
    const finalFile = new File([compressed], webpName, { type: 'image/webp' });

    // If compression somehow grew the file (rare for tiny inputs), keep original
    return finalFile.size < file.size ? finalFile : file;
  } catch (err) {
    console.warn('Image compression failed, uploading original:', err);
    return file;
  }
}
