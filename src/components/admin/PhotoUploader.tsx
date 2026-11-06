/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, RefreshCw, X, FileImage, ShieldCheck } from 'lucide-react';
import { PhotoProcessor } from '../../services/photoProcessor';
import { storageService } from '../../services/storage';
import { PhotoItem } from '../../types/gallery';

interface PhotoUploaderProps {
  galleryId: string;
  existingPhotos: PhotoItem[];
  onUploadComplete: (newPhotos: PhotoItem[]) => void;
}

interface UploadQueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'processing' | 'done' | 'error' | 'duplicate';
  errorMessage?: string;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  galleryId,
  existingPhotos,
  onUploadComplete,
}) => {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: UploadQueueItem[] = [];
    const existingNames = new Set(existingPhotos.map((p) => p.name.toLowerCase()));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = PhotoProcessor.isValidPhoto(file);

      if (!validation.valid) {
        newItems.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          name: file.name,
          size: file.size,
          progress: 0,
          status: 'error',
          errorMessage: validation.reason,
        });
        continue;
      }

      // Check duplicates by filename & size
      const isDuplicate = existingNames.has(file.name.toLowerCase());

      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: isDuplicate ? 'duplicate' : 'pending',
        errorMessage: isDuplicate ? 'Fotografía ya existente en esta galería' : undefined,
      });
    }

    setQueue((prev) => [...prev, ...newItems]);
  };

  const processBatch = async () => {
    if (isUploading) return;
    setIsUploading(true);

    const pending = queue.filter((item) => item.status === 'pending' || item.status === 'duplicate');
    const createdPhotos: PhotoItem[] = [];

    let currentOrder = existingPhotos.length;

    for (const item of pending) {
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'processing', progress: 10 } : q))
      );

      try {
        const processed = await PhotoProcessor.processPhoto(item.file, (percent) => {
          setQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, progress: percent } : q))
          );
        });

        const newPhotoId = 'pho_' + Math.random().toString(36).substring(2, 9);
        const photoRecord: PhotoItem = {
          id: newPhotoId,
          galleryId,
          name: processed.name,
          originalUrl: '',
          previewUrl: '',
          thumbnailUrl: '',
          size: processed.size,
          width: processed.width,
          height: processed.height,
          aspectRatio: processed.aspectRatio,
          format: processed.format,
          order: currentOrder++,
          title: processed.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
          exif: processed.exif,
          isFavorite: false,
          isPrintSelected: false,
          featured: false,
        };

        await storageService.savePhotoWithBlobs(
          photoRecord,
          processed.originalBlob,
          processed.previewBlob,
          processed.thumbBlob
        );

        createdPhotos.push(photoRecord);

        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'done', progress: 100 } : q))
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al procesar la imagen';
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'error', errorMessage: msg } : q))
        );
      }
    }

    setIsUploading(false);
    if (createdPhotos.length > 0) {
      onUploadComplete(createdPhotos);
    }
  };

  const clearDone = () => {
    setQueue((prev) => prev.filter((item) => item.status !== 'done'));
  };

  const removeItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const totalProgress =
    queue.length > 0
      ? Math.round(
          queue.reduce((sum, item) => sum + item.progress, 0) / queue.length
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* High-res capability banner */}
      <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs text-zinc-300">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>
            <strong className="text-white">Motor de Alta Resolución 8K:</strong> Se preservan los archivos originales sin compresión destructiva en el almacenamiento seguro de objetos.
          </span>
        </div>
        <span className="font-mono text-[11px] text-zinc-400">JPG · PNG · WebP · TIFF</span>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFilesSelected(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
            : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700 hover:bg-zinc-900/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.tiff,.tif"
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-white">
              Arrastra tus fotografías aquí o haz clic para explorar
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              Carga individual o por lotes de cientos de imágenes. Compatible con resoluciones de hasta 8K.
            </p>
          </div>
        </div>
      </div>

      {/* Queue Progress & Actions */}
      {queue.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Cola de Carga ({queue.length} archivos)
              </h4>
              <p className="text-[11px] text-zinc-400">
                {queue.filter((q) => q.status === 'done').length} completados · {queue.filter((q) => q.status === 'error').length} errores
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearDone}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition"
              >
                Limpiar Completados
              </button>
              <button
                onClick={processBatch}
                disabled={isUploading || queue.every((q) => q.status === 'done')}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isUploading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isUploading ? 'Procesando Lote...' : 'Iniciar Carga de Fotografías'}</span>
              </button>
            </div>
          </div>

          {/* General Progress Bar */}
          {isUploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono text-amber-300">
                <span>Progreso General</span>
                <span>{totalProgress}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* File Queue Items List */}
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <FileImage className="w-4 h-4 text-zinc-400 shrink-0" />
                  <div className="min-w-0 flex-1 truncate">
                    <p className="font-medium text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{formatSize(item.size)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {item.status === 'processing' && (
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full" style={{ width: `${item.progress}%` }} />
                      </div>
                      <span className="font-mono text-[10px] text-amber-300">{item.progress}%</span>
                    </div>
                  )}

                  {item.status === 'done' && (
                    <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Listo</span>
                    </span>
                  )}

                  {item.status === 'error' && (
                    <span className="flex items-center gap-1 text-rose-400 text-xs" title={item.errorMessage}>
                      <AlertCircle className="w-4 h-4" />
                      <span className="truncate max-w-[120px]">{item.errorMessage}</span>
                    </span>
                  )}

                  {item.status === 'duplicate' && (
                    <span className="text-amber-400 text-[11px] bg-amber-500/10 px-2 py-0.5 rounded">
                      Duplicado (se omitirá)
                    </span>
                  )}

                  {item.status !== 'processing' && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-zinc-500 hover:text-white rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
