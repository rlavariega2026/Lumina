/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Share2,
  Download,
  CheckCircle2,
  Layers,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { PhotoItem, GalleryItem } from '../../types/gallery';
import { ShareService, SOCIAL_PRESETS, SocialCropPreset } from '../../services/shareService';

interface SharePhotoModalProps {
  photo: PhotoItem | null;
  gallery: GalleryItem;
  isOpen: boolean;
  onClose: () => void;
}

export const SharePhotoModal: React.FC<SharePhotoModalProps> = ({
  photo,
  gallery,
  isOpen,
  onClose,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<SocialCropPreset>('original');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusResult, setStatusResult] = useState<{
    downloaded: boolean;
    message: string;
  } | null>(null);

  if (!isOpen || !photo) return null;

  const handleShare = async () => {
    setIsProcessing(true);
    setStatusResult(null);
    try {
      const res = await ShareService.sharePhotoFile(
        photo,
        gallery.eventName,
        selectedPreset
      );
      if (res.downloaded) {
        setStatusResult({
          downloaded: true,
          message: res.message,
        });
      } else if (res.sharedViaNative) {
        onClose();
      }
    } catch (err: unknown) {
      console.error(err);
      setStatusResult({
        downloaded: false,
        message: 'Ocurrió un error al procesar el archivo fotográfico.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-semibold text-sm text-zinc-100">Compartir Archivo Fotográfico</h3>
              <p className="text-xs text-zinc-400">Se comparte el archivo de imagen real en alta calidad, no un simple enlace.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Photo Preview & Details */}
          <div className="flex items-center gap-4 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700">
              <img
                src={photo.thumbnailUrl || photo.previewUrl}
                alt={photo.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1 text-xs">
              <h4 className="font-semibold text-white truncate text-sm mb-0.5">{photo.title || photo.name}</h4>
              <p className="text-zinc-400 mb-1">{photo.width} × {photo.height} px · {photo.format}</p>
              <span className="text-[11px] text-amber-400/90 font-medium">
                {gallery.eventName}
              </span>
            </div>
          </div>

          {/* Social Format Presets */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Adaptar proporción según tu destino:</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {SOCIAL_PRESETS.map((p) => {
                const isSelected = selectedPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(p.id);
                      setStatusResult(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/10 text-white'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-white">{p.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300">
                        {p.ratioText}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">
                      {p.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fallback instructions notification */}
          {statusResult && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-semibold text-amber-300">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>¡Fotografía lista y descargada en tu dispositivo!</span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-[11px]">
                {statusResult.message}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-2 py-1 bg-zinc-900 rounded text-[10px] font-mono text-zinc-300 border border-zinc-800">
                  WhatsApp: Adjuntar → Foto o Video
                </span>
                <span className="px-2 py-1 bg-zinc-900 rounded text-[10px] font-mono text-zinc-300 border border-zinc-800">
                  Instagram: Crear publicación → Seleccionar
                </span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleShare}
            disabled={isProcessing}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            <span>
              {isProcessing
                ? 'Preparando archivo de alta resolución...'
                : 'Compartir Archivo de Fotografía'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
