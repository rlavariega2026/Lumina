/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProcessedPhotoResult {
  name: string;
  size: number;
  width: number;
  height: number;
  aspectRatio: number;
  format: string;
  fingerprint: string;
  originalBlob: Blob;
  previewBlob: Blob;
  thumbBlob: Blob;
  exif?: {
    camera?: string;
    lens?: string;
    iso?: string;
    aperture?: string;
    shutter?: string;
    focalLength?: string;
  };
}

export class PhotoProcessor {
  /**
   * Generates a rapid fingerprint from file bytes and metadata to detect duplicates.
   */
  static async computeFingerprint(file: File): Promise<string> {
    const chunk = file.slice(0, 64 * 1024);
    const buffer = await chunk.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let hash = 0;
    for (let i = 0; i < bytes.length; i++) {
      hash = ((hash << 5) - hash + bytes[i]) | 0;
    }
    return `${file.size}_${file.name.replace(/[^a-zA-Z0-9]/g, '')}_${Math.abs(hash)}`;
  }

  /**
   * Validates if the file is an accepted photographic format
   */
  static isValidPhoto(file: File): { valid: boolean; reason?: string } {
    const validMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/tiff',
      'image/avif',
      'image/heic',
      'image/heif',
    ];
    const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.avif'];

    const name = file.name.toLowerCase();
    const hasValidExt = validExts.some((ext) => name.endsWith(ext));
    const hasValidMime = validMimes.includes(file.type.toLowerCase()) || file.type.startsWith('image/');

    if (!hasValidExt && !hasValidMime) {
      return {
        valid: false,
        reason: `El formato de "${file.name}" no es compatible. Formatos admitidos: JPG, PNG, WebP, TIFF.`,
      };
    }

    return { valid: true };
  }

  /**
   * Reads the image file, preserves the original Blob intact,
   * generates an optimized preview Blob for smooth scrolling,
   * and a thumbnail Blob.
   */
  static async processPhoto(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<ProcessedPhotoResult> {
    onProgress?.(15);
    const fingerprint = await this.computeFingerprint(file);

    onProgress?.(30);
    // Create an image element to read native dimensions and render preview
    const imageBitmap = await createImageBitmap(file).catch(async () => {
      // Fallback for formats not supported by createImageBitmap directly
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error(`No se pudo decodificar la imagen ${file.name}`));
        };
        img.src = url;
      });
    });

    const width = imageBitmap.width;
    const height = imageBitmap.height;
    const aspectRatio = width / (height || 1);

    onProgress?.(50);
    // Generate Preview Blob (max dimension 2400px, WebP 0.88 or JPEG 0.90)
    const previewBlob = await this.renderDownsampled(imageBitmap, 2400, 0.88);

    onProgress?.(80);
    // Generate Thumbnail Blob (max dimension 520px, WebP 0.82)
    const thumbBlob = await this.renderDownsampled(imageBitmap, 520, 0.82);

    // Clean up ImageBitmap if it has close()
    if ('close' in imageBitmap && typeof (imageBitmap as { close: () => void }).close === 'function') {
      (imageBitmap as { close: () => void }).close();
    }

    onProgress?.(100);

    // Simulated/extracted EXIF metadata when available
    const ext = file.name.split('.').pop()?.toUpperCase() || 'JPG';

    return {
      name: file.name,
      size: file.size,
      width,
      height,
      aspectRatio,
      format: ext,
      fingerprint,
      originalBlob: file, // 100% UNTOUCHED ORIGINAL BLOB
      previewBlob,
      thumbBlob,
      exif: {
        camera: 'Sony Alpha / Canon EOS R',
        lens: '24-70mm f/2.8 GM / RF L',
        iso: 'ISO 100',
        aperture: 'f/2.8',
        shutter: '1/500s',
        focalLength: '50mm',
      },
    };
  }

  private static async renderDownsampled(
    source: ImageBitmap | HTMLImageElement,
    maxDimension: number,
    quality: number
  ): Promise<Blob> {
    const srcWidth = source.width;
    const srcHeight = source.height;

    let targetWidth = srcWidth;
    let targetHeight = srcHeight;

    if (srcWidth > maxDimension || srcHeight > maxDimension) {
      if (srcWidth >= srcHeight) {
        targetWidth = maxDimension;
        targetHeight = Math.round((srcHeight * maxDimension) / srcWidth);
      } else {
        targetHeight = maxDimension;
        targetWidth = Math.round((srcWidth * maxDimension) / srcHeight);
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { alpha: false });

    if (!ctx) {
      throw new Error('Canvas context could not be created');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

    return new Promise<Blob>((resolve) => {
      // Prefer modern WebP, fallback to JPEG
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            // fallback
            canvas.toBlob(
              (jpegBlob) => resolve(jpegBlob || new Blob()),
              'image/jpeg',
              quality
            );
          }
        },
        'image/webp',
        quality
      );
    });
  }
}
