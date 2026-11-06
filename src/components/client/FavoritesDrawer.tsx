/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Heart, Download, Share2 } from 'lucide-react';
import { PhotoItem, GalleryItem } from '../../types/gallery';
import { ZipDownloadService } from '../../services/zipService';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: PhotoItem[];
  gallery: GalleryItem;
  onOpenPhoto: (index: number) => void;
  onToggleFavorite: (photoId: string) => void;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  onClose,
  favorites,
  gallery,
  onOpenPhoto,
  onToggleFavorite,
}) => {
  if (!isOpen) return null;

  const handleDownloadFavoritesZip = async () => {
    if (favorites.length === 0) return;
    await ZipDownloadService.downloadPhotosAsZip(
      gallery,
      favorites,
      true,
      `${gallery.eventName}_Mis_Favoritos.zip`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full flex flex-col text-zinc-100 shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
              <Heart className="w-4 h-4 fill-rose-500" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Mis Fotografías Favoritas</h3>
              <p className="text-xs text-zinc-400">{favorites.length} seleccionadas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {favorites.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 space-y-2">
              <Heart className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-xs">Aún no has marcado fotos como favoritas.</p>
              <p className="text-[11px] text-zinc-600">Toca el corazón en cualquier foto para guardarla aquí.</p>
            </div>
          ) : (
            favorites.map((photo, idx) => (
              <div
                key={photo.id}
                onClick={() => onOpenPhoto(idx)}
                className="flex items-center gap-3 p-2.5 bg-zinc-950 rounded-xl border border-zinc-800/80 hover:border-zinc-700 cursor-pointer group transition"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                  <img src={photo.thumbnailUrl || photo.previewUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate">{photo.title || photo.name}</h4>
                  <p className="text-[11px] text-zinc-400">{photo.width} × {photo.height} px</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(photo.id);
                  }}
                  className="p-2 text-rose-400 hover:text-rose-300 transition"
                  title="Quitar de favoritos"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        {favorites.length > 0 && (
          <div className="p-5 border-t border-zinc-800 bg-zinc-950/60">
            <button
              onClick={handleDownloadFavoritesZip}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Favoritos en ZIP ({favorites.length})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
