/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PhotoItem } from '../types/gallery';
import { storageService } from './storage';
import { ZipDownloadService } from './zipService';

export type SocialCropPreset = 'original' | 'instagram_square' | 'instagram_story' | 'horizontal_landscape';

export interface SocialPresetInfo {
  id: SocialCropPreset;
  name: string;
  ratioText: string;
  targetWidth: number;
  targetHeight: number;
  description: string;
}

export const SOCIAL_PRESETS: SocialPresetInfo[] = [
  {
    id: 'original',
    name: 'Formato Original',
    ratioText: 'Nativo',
    targetWidth: 0,
    targetHeight: 0,
    description: 'Máxima resolución nativa sin ningún recorte ni modificación.',
  },
  {
    id: 'instagram_square',
    name: 'Instagram Post Cuadrado',
    ratioText: '1:1',
    targetWidth: 1440,
    targetHeight: 1440,
    description: 'Proporción 1:1 optimizada para el feed de Instagram y publicaciones cuadradas.',
  },
  {
    id: 'instagram_story',
    name: 'Instagram Story / Reel',
    ratioText: '9:16',
    targetWidth: 1080,
    targetHeight: 1920,
    description: 'Proporción vertical 9:16 de pantalla completa con fondo cinemático difuminado.',
  },
  {
    id: 'horizontal_landscape',
    name: 'Facebook / X / Web',
    ratioText: '16:9',
    targetWidth: 1920,
    targetHeight: 1080,
    description: 'Proporción horizontal 16:9 panorámica para cabeceras y publicaciones horizontales.',
  },
];

export class ShareService {
  /**
   * Adapts a photo blob to a specific social aspect ratio with ambient artistic padding.
   */
  static async renderSocialVersion(
    sourceBlob: Blob,
    preset: SocialCropPreset
  ): Promise<File> {
    if (preset === 'original') {
      return new File([sourceBlob], 'foto_compartir.jpg', { type: sourceBlob.type || 'image/jpeg' });
    }

    const presetInfo = SOCIAL_PRESETS.find((p) => p.id === preset)!;
    const imgBitmap = await createImageBitmap(sourceBlob);

    const canvas = document.createElement('canvas');
    canvas.width = presetInfo.targetWidth;
    canvas.height = presetInfo.targetHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return new File([sourceBlob], 'foto_compartir.jpg', { type: 'image/jpeg' });
    }

    // 1. Draw blurred ambient backdrop from the image itself
    ctx.filter = 'blur(40px) brightness(0.65)';
    ctx.drawImage(imgBitmap, -50, -50, canvas.width + 100, canvas.height + 100);
    ctx.filter = 'none';

    // 2. Draw centered image fitting inside bounds without cropping or distortion
    const imgRatio = imgBitmap.width / imgBitmap.height;
    const canvasRatio = canvas.width / canvas.height;

    let drawW = canvas.width;
    let drawH = canvas.height;
    let drawX = 0;
    let drawY = 0;

    if (imgRatio > canvasRatio) {
      drawW = canvas.width;
      drawH = canvas.width / imgRatio;
      drawY = (canvas.height - drawH) / 2;
    } else {
      drawH = canvas.height;
      drawW = canvas.height * imgRatio;
      drawX = (canvas.width - drawW) / 2;
    }

    // Soft subtle shadow for framed photo
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 15;
    ctx.drawImage(imgBitmap, drawX, drawY, drawW, drawH);

    const convertedBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || sourceBlob), 'image/jpeg', 0.92);
    });

    if ('close' in imgBitmap && typeof (imgBitmap as { close: () => void }).close === 'function') {
      (imgBitmap as { close: () => void }).close();
    }

    return new File([convertedBlob], `foto_${preset}.jpg`, { type: 'image/jpeg' });
  }

  /**
   * Attempts to share the ACTUAL photo file using the Web Share API Level 2.
   * If not supported, triggers download and returns fallback info.
   */
  static async sharePhotoFile(
    photo: PhotoItem,
    galleryTitle: string,
    preset: SocialCropPreset = 'original'
  ): Promise<{ sharedViaNative: boolean; downloaded: boolean; message: string }> {
    const blobs = await storageService.getPhotoBlobs(photo.id);
    let rawBlob: Blob | null = null;

    if (blobs) {
      rawBlob = blobs.originalBlob;
    } else if (photo.originalUrl) {
      const resp = await fetch(photo.originalUrl);
      rawBlob = await resp.blob();
    }

    if (!rawBlob) {
      throw new Error('No se pudo obtener la fotografía para compartir.');
    }

    const fileToShare = await this.renderSocialVersion(rawBlob, preset);

    // Test Web Share API with files
    const nav = navigator as unknown as {
      canShare?: (data: { files?: File[] }) => boolean;
      share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
    };

    if (nav.canShare && nav.share && nav.canShare({ files: [fileToShare] })) {
      try {
        await nav.share({
          files: [fileToShare],
          title: photo.title || galleryTitle,
          text: `Fotografía de ${galleryTitle}`,
        });
        return {
          sharedViaNative: true,
          downloaded: false,
          message: 'Fotografía compartida con éxito.',
        };
      } catch (err: unknown) {
        // If user cancelled, don't trigger download
        if (err instanceof Error && err.name === 'AbortError') {
          return {
            sharedViaNative: false,
            downloaded: false,
            message: 'Compartición cancelada.',
          };
        }
      }
    }

    // Fallback: Download file directly and guide user
    ZipDownloadService.triggerDownload(fileToShare, fileToShare.name);

    return {
      sharedViaNative: false,
      downloaded: true,
      message:
        'El archivo fotográfico se ha descargado a tu dispositivo en alta resolución. Ya puedes adjuntarlo directamente en WhatsApp, Instagram, Facebook o tu aplicación preferida.',
    };
  }
}
