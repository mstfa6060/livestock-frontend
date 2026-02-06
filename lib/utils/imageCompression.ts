/**
 * Image Compression Utility
 * Web standartlarına uygun resim optimizasyonu
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1 arası
  maxSizeMB?: number;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  maxSizeMB: 1,
};

/**
 * Resmi web standartlarına uygun şekilde sıkıştırır
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = file.size;

  // Video dosyalarını sıkıştırma
  if (file.type.startsWith('video/')) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
    };
  }

  // Resim değilse direkt döndür
  if (!file.type.startsWith('image/')) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
    };
  }

  // GIF dosyalarını sıkıştırma (animasyonu bozar)
  if (file.type === 'image/gif') {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        try {
          // Yeni boyutları hesapla
          let { width, height } = img;
          const maxWidth = opts.maxWidth!;
          const maxHeight = opts.maxHeight!;

          // Aspect ratio'yu koru
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          // Canvas oluştur
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context oluşturulamadı'));
            return;
          }

          // Resmi çiz
          ctx.drawImage(img, 0, 0, width, height);

          // Sıkıştırılmış resmi blob olarak al
          const quality = opts.quality!;
          const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

          const tryCompress = (currentQuality: number) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Blob oluşturulamadı'));
                  return;
                }

                const maxSizeBytes = opts.maxSizeMB! * 1024 * 1024;

                // Boyut hala büyükse ve kalite düşürülebilirse tekrar dene
                if (blob.size > maxSizeBytes && currentQuality > 0.3) {
                  tryCompress(currentQuality - 0.1);
                  return;
                }

                // Yeni dosya oluştur
                const compressedFile = new File(
                  [blob],
                  file.name.replace(/\.[^/.]+$/, outputType === 'image/png' ? '.png' : '.jpg'),
                  { type: outputType, lastModified: Date.now() }
                );

                resolve({
                  file: compressedFile,
                  originalSize,
                  compressedSize: compressedFile.size,
                  compressionRatio: compressedFile.size / originalSize,
                });
              },
              outputType,
              currentQuality
            );
          };

          tryCompress(quality);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Resim yüklenemedi'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Dosya okunamadı'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Birden fazla resmi sıkıştırır
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {},
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i + 1, files.length, file.name);

    try {
      const result = await compressImage(file, options);
      results.push(result);
    } catch (error) {
      console.error(`Error compressing ${file.name}:`, error);
      // Hata olursa orijinal dosyayı kullan
      results.push({
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
      });
    }
  }

  return results;
}

/**
 * Dosya boyutunu okunabilir formata çevirir
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Sıkıştırma oranını yüzde olarak formatlar
 */
export function formatCompressionRatio(ratio: number): string {
  const percentage = Math.round((1 - ratio) * 100);
  return percentage > 0 ? `-${percentage}%` : '0%';
}
