/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Star,
  Trash2,
  ArrowUp,
  ArrowDown,
  Edit2,
  Check,
  X,
  Download,
  Image as ImageIcon,
  AlertTriangle,
} from 'lucide-react';
import { PhotoItem, GalleryItem } from '../../types/gallery';
import { storageService } from '../../services/storage';
import { ZipDownloadService } from '../../services/zipService';

interface PhotoGridManagerProps {
  gallery: GalleryItem;
  photos: PhotoItem[];
  onPhotosUpdated: (photos: PhotoItem[]) => void;
  onSetHeroPhoto: (photoId: string) => void;
}

export const PhotoGridManager: React.FC<PhotoGridManagerProps> = ({
  gallery,
  photos,
  onPhotosUpdated,
  onSetHeroPhoto,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editChapter, setEditChapter] = useState('');
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'single' | 'batch';
    photoId?: string;
    count?: number;
  } | null>(null);

  const startEdit = (photo: PhotoItem) => {
    setEditingPhotoId(photo.id);
    setEditTitle(photo.title || photo.name);
    setEditCaption(photo.caption || '');
    setEditChapter(photo.chapter || '');
  };

  const saveEdit = async (photo: PhotoItem) => {
    const updated = {
      ...photo,
      title: editTitle.trim(),
      caption: editCaption.trim(),
      chapter: editChapter.trim(),
    };
    await storageService.savePhotoRecord(updated);
    onPhotosUpdated(photos.map((p) => (p.id === photo.id ? updated : p)));
    setEditingPhotoId(null);
  };

  const toggleFeatured = async (photo: PhotoItem) => {
    const updated = { ...photo, featured: !photo.featured };
    await storageService.savePhotoRecord(updated);
    onPhotosUpdated(photos.map((p) => (p.id === photo.id ? updated : p)));
  };

  const movePhoto = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;

    const copy = [...photos];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    const orderedIds = copy.map((p) => p.id);
    await storageService.reorderPhotos(gallery.id, orderedIds);
    onPhotosUpdated(copy);
  };

  const requestDeleteSingle = (photoId: string) => {
    setDeleteConfirmTarget({ type: 'single', photoId });
  };

  const requestDeleteBatch = () => {
    if (selectedIds.size === 0) return;
    setDeleteConfirmTarget({ type: 'batch', count: selectedIds.size });
  };

  const executeConfirmedDelete = async () => {
    if (!deleteConfirmTarget) return;

    if (deleteConfirmTarget.type === 'single' && deleteConfirmTarget.photoId) {
      await storageService.deletePhoto(deleteConfirmTarget.photoId);
      onPhotosUpdated(photos.filter((p) => p.id !== deleteConfirmTarget.photoId));
    } else if (deleteConfirmTarget.type === 'batch') {
      for (const id of Array.from(selectedIds)) {
        await storageService.deletePhoto(id);
      }
      onPhotosUpdated(photos.filter((p) => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
    }

    setDeleteConfirmTarget(null);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(photos.map((p) => p.id)));
    }
  };

  const handleBatchDownloadZip = async () => {
    const targetPhotos = photos.filter((p) => selectedIds.has(p.id));
    if (targetPhotos.length === 0) return;

    await ZipDownloadService.downloadPhotosAsZip(
      gallery,
      targetPhotos,
      true,
      `${gallery.eventName}_Seleccion_Admin.zip`
    );
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500 bg-zinc-950 rounded-2xl border border-zinc-800">
        <p className="text-sm">Aún no hay fotografías en esta galería. Utiliza la pestaña «Cargar Fotografías» para añadir imágenes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Batch toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-zinc-300">
            <input
              type="checkbox"
              checked={selectedIds.size === photos.length && photos.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded accent-amber-400"
            />
            <span>Seleccionar todo ({selectedIds.size} seleccionadas)</span>
          </label>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchDownloadZip}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Selección en ZIP</span>
            </button>
            <button
              onClick={requestDeleteBatch}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg transition border border-rose-500/30 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar Selección</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid of photos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => {
          const isHero = gallery.heroPhotoId === photo.id || (index === 0 && !gallery.heroPhotoId);
          const isSelected = selectedIds.has(photo.id);
          const isEditing = editingPhotoId === photo.id;

          return (
            <div
              key={photo.id}
              className={`rounded-2xl overflow-hidden bg-zinc-950 border transition-all ${
                isSelected ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-zinc-800'
              }`}
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-square w-full overflow-hidden bg-zinc-900 group">
                <img
                  src={photo.thumbnailUrl || photo.previewUrl}
                  alt={photo.name}
                  className="w-full h-full object-cover"
                />

                {/* Top badges */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(photo.id)}
                    className="w-4 h-4 rounded accent-amber-400 cursor-pointer shadow"
                  />
                  {isHero && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-zinc-950 shadow">
                      Portada
                    </span>
                  )}
                  {photo.featured && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500 text-zinc-950 shadow flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-zinc-950" />
                      <span>Destacada</span>
                    </span>
                  )}
                </div>

                {/* Move up / down buttons */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition z-10">
                  <button
                    onClick={() => movePhoto(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded bg-black/70 hover:bg-black text-white disabled:opacity-30 cursor-pointer"
                    title="Mover hacia arriba"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => movePhoto(index, 'down')}
                    disabled={index === photos.length - 1}
                    className="p-1.5 rounded bg-black/70 hover:bg-black text-white disabled:opacity-30 cursor-pointer"
                    title="Mover hacia abajo"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Details & Actions */}
              <div className="p-3 text-xs space-y-2">
                {isEditing ? (
                  <div className="space-y-2 animate-in fade-in">
                    <input
                      type="text"
                      placeholder="Título de la fotografía"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Capítulo (ej. Preparativos, Fiesta...)"
                      value={editChapter}
                      onChange={(e) => setEditChapter(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-xs"
                    />
                    <textarea
                      placeholder="Descripción / Pie de foto"
                      rows={2}
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-white text-xs resize-none"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setEditingPhotoId(null)}
                        className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => saveEdit(photo)}
                        className="px-2.5 py-1 bg-amber-500 text-zinc-950 font-bold rounded"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-white truncate text-xs">
                          {photo.title || photo.name}
                        </h4>
                        {photo.chapter && (
                          <span className="text-[10px] text-amber-400 font-mono">
                            {photo.chapter}
                          </span>
                        )}
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {photo.width} × {photo.height} px
                        </p>
                      </div>
                      <button
                        onClick={() => startEdit(photo)}
                        className="p-1 text-zinc-400 hover:text-white"
                        title="Editar metadatos"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick toolbar */}
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-[11px]">
                      <button
                        onClick={() => onSetHeroPhoto(photo.id)}
                        className={`text-[10px] transition cursor-pointer ${
                          isHero ? 'text-amber-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {isHero ? '★ Portada' : 'Fijar Portada'}
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleFeatured(photo)}
                          className={`p-1 rounded transition ${
                            photo.featured ? 'text-sky-400' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                          title="Alternar destacada"
                        >
                          <Star className={`w-3.5 h-3.5 ${photo.featured ? 'fill-sky-400' : ''}`} />
                        </button>
                        <button
                          onClick={() => requestDeleteSingle(photo.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                          title="Eliminar foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* In-app delete confirmation modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {deleteConfirmTarget.type === 'single'
                    ? '¿Eliminar fotografía?'
                    : `¿Eliminar ${deleteConfirmTarget.count} fotografías?`}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Esta acción eliminará el archivo original y sus miniaturas del almacenamiento local.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeConfirmedDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-lg shadow-rose-950"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
