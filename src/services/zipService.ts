/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { GalleryItem, PhotoItem } from '../types/gallery';
import { storageService } from './storage';

export class ZipDownloadService {
  /**
   * Triggers a browser download from a Blob or URL.
   */
  static triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  /**
   * Downloads a single photo (either original untouched or web preview).
   */
  static async downloadSinglePhoto(
    photo: PhotoItem,
    type: 'original' | 'preview' = 'original'
  ): Promise<void> {
    const blobs = await storageService.getPhotoBlobs(photo.id);
    let targetBlob: Blob | null = null;

    if (blobs) {
      targetBlob = type === 'original' ? blobs.originalBlob : blobs.previewBlob;
    } else if (photo.originalUrl) {
      // If fetched from URL
      const resp = await fetch(photo.originalUrl);
      targetBlob = await resp.blob();
    }

    if (!targetBlob) {
      throw new Error('No se pudo recuperar el archivo de la fotografía.');
    }

    const cleanName = photo.name.includes('.') ? photo.name : `${photo.name}.jpg`;
    this.triggerDownload(targetBlob, cleanName);
  }

  /**
   * Bundles an array of photos into a single zip file with progress tracking.
   */
  static async downloadPhotosAsZip(
    gallery: GalleryItem,
    photos: PhotoItem[],
    useOriginals = true,
    zipFilename?: string,
    onProgress?: (percent: number, statusText: string) => void
  ): Promise<void> {
    const zip = new JSZip();
    const folderName = `${gallery.eventName.replace(/[/\\?%*:|"<>]/g, '_')}_Fotos`;
    const folder = zip.folder(folderName) || zip;

    // Add metadata summary file
    const summaryText = `================================================
${gallery.eventName}
================================================
Cliente: ${gallery.clientName}
Fecha: ${gallery.date}
Ubicación: ${gallery.location}
Fotógrafo / Estudio: ${gallery.coverTexts.photographerSignature.text || 'Lumina Studio'}
Total de fotografías en este paquete: ${photos.length}

Generado a través de Lumina Studio Digital Galleries.
Todos los derechos reservados © ${new Date().getFullYear()}.
================================================
`;
    folder.file('INFORMACION_GALERIA.txt', summaryText);

    const total = photos.length;
    for (let i = 0; i < total; i++) {
      const photo = photos[i];
      onProgress?.(
        Math.round((i / total) * 90),
        `Procesando foto ${i + 1} de ${total}: ${photo.name}`
      );

      const blobs = await storageService.getPhotoBlobs(photo.id);
      let blob: Blob | null = null;

      if (blobs) {
        blob = useOriginals ? blobs.originalBlob : blobs.previewBlob;
      } else if (photo.originalUrl) {
        try {
          const resp = await fetch(photo.originalUrl);
          blob = await resp.blob();
        } catch {
          console.warn(`Could not fetch photo ${photo.id}`);
        }
      }

      if (blob) {
        const ext = photo.name.split('.').pop() || 'jpg';
        const filename = `${String(i + 1).padStart(3, '0')}_${photo.name.replace(/\.[^/.]+$/, '')}.${ext}`;
        folder.file(filename, blob);
      }
    }

    onProgress?.(92, 'Comprimiendo archivo ZIP...');
    const zipBlob = await zip.generateAsync(
      {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      },
      (metadata) => {
        onProgress?.(92 + Math.round(metadata.percent * 0.08), 'Generando archivo ZIP...');
      }
    );

    const finalName =
      zipFilename ||
      `${gallery.eventName.replace(/[/\\?%*:|"<>]/g, '_')}_ColeccionCompleta.zip`;

    this.triggerDownload(zipBlob, finalName);
    onProgress?.(100, '¡Descarga completada!');
  }
}
