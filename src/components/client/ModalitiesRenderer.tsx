/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  Share2,
  Maximize2,
  Printer,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { GalleryItem, PhotoItem } from '../../types/gallery';
import { TEMPLATES_CONFIG } from '../../constants/templates';

interface ModalitiesRendererProps {
  gallery: GalleryItem;
  photos: PhotoItem[];
  onOpenPhoto: (index: number) => void;
  onToggleFavorite: (photoId: string) => void;
  onTogglePrintSelected: (photoId: string) => void;
  onOpenShareModal: (photo: PhotoItem) => void;
}

export const ModalitiesRenderer: React.FC<ModalitiesRendererProps> = ({
  gallery,
  photos,
  onOpenPhoto,
  onToggleFavorite,
  onTogglePrintSelected,
  onOpenShareModal,
}) => {
  const template = TEMPLATES_CONFIG[gallery.templateId] || TEMPLATES_CONFIG.bodas_elegance;
  const modalityId = gallery.modalityId || 'classic_grid';

  // State for interactive carousel/book/slideshow modalities
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [bookPageIndex, setBookPageIndex] = useState(0);
  const [slideshowPlaying, setSlideshowPlaying] = useState(false);
  const [activeChapter, setActiveChapter] = useState<string>('Todos');

  // Chapters list for visual memory / combined
  const chapters = React.useMemo(() => {
    const set = new Set<string>();
    photos.forEach((p) => {
      if (p.chapter) set.add(p.chapter);
    });
    return Array.from(set);
  }, [photos]);

  const filteredPhotos = React.useMemo(() => {
    if (activeChapter === 'Todos' || !chapters.includes(activeChapter)) {
      return photos;
    }
    return photos.filter((p) => p.chapter === activeChapter);
  }, [photos, activeChapter, chapters]);

  // Slideshow timer for modality 14
  useEffect(() => {
    if (!slideshowPlaying || modalityId !== 'slideshow') return;
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % photos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slideshowPlaying, modalityId, photos.length]);

  if (photos.length === 0) {
    return (
      <div className="py-24 text-center text-zinc-500">
        <p className="text-sm">No hay fotografías cargadas en esta galería.</p>
      </div>
    );
  }

  // Common quick action card button bar
  const renderQuickActions = (photo: PhotoItem) => (
    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(photo.id);
        }}
        className={`p-2 rounded-full backdrop-blur-md transition cursor-pointer ${
          photo.isFavorite
            ? 'bg-rose-500 text-white'
            : 'bg-black/60 hover:bg-black/80 text-white'
        }`}
        title={photo.isFavorite ? 'Quitar favorito' : 'Marcar favorito'}
      >
        <Heart className={`w-3.5 h-3.5 ${photo.isFavorite ? 'fill-white' : ''}`} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTogglePrintSelected(photo.id);
        }}
        className={`p-2 rounded-full backdrop-blur-md transition cursor-pointer ${
          photo.isPrintSelected
            ? 'bg-amber-500 text-zinc-950'
            : 'bg-black/60 hover:bg-black/80 text-white'
        }`}
        title="Seleccionar para impresión"
      >
        <Printer className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpenShareModal(photo);
        }}
        className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition cursor-pointer"
        title="Compartir archivo fotográfico"
      >
        <Share2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  // -------------------------------------------------------------
  // 1. CUADRÍCULA CLÁSICA
  // -------------------------------------------------------------
  if (modalityId === 'classic_grid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {filteredPhotos.map((photo, index) => (
          <div
            key={photo.id}
            onClick={() => onOpenPhoto(index)}
            className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/80 cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
          >
            <img
              src={photo.thumbnailUrl || photo.previewUrl}
              alt={photo.title || photo.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
              <p className="text-xs font-semibold text-white truncate">{photo.title || photo.name}</p>
              {photo.caption && <p className="text-[11px] text-zinc-300 truncate">{photo.caption}</p>}
            </div>
            {renderQuickActions(photo)}
          </div>
        ))}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. MOSAICO ASIMÉTRICO
  // -------------------------------------------------------------
  if (modalityId === 'asymmetric_mosaic') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[220px] gap-3 sm:gap-4">
        {filteredPhotos.map((photo, index) => {
          // Dynamic rhythm: 1st is 2x2, every 5th is 2x1
          const isBig = index % 7 === 0;
          const isWide = index % 7 === 3;
          return (
            <div
              key={photo.id}
              onClick={() => onOpenPhoto(index)}
              className={`group relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/80 cursor-pointer shadow-md hover:shadow-2xl transition-all duration-300 ${
                isBig ? 'col-span-2 row-span-2' : isWide ? 'col-span-2 row-span-1' : 'col-span-1 row-span-1'
              }`}
            >
              <img
                src={isBig ? photo.previewUrl : photo.thumbnailUrl || photo.previewUrl}
                alt={photo.title || photo.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <p className="text-sm font-semibold text-white truncate">{photo.title || photo.name}</p>
                {photo.caption && <p className="text-xs text-zinc-300 truncate">{photo.caption}</p>}
              </div>
              {renderQuickActions(photo)}
            </div>
          );
        })}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. CARRUSEL HORIZONTAL
  // -------------------------------------------------------------
  if (modalityId === 'horizontal_carousel') {
    const current = filteredPhotos[carouselIndex] || filteredPhotos[0];
    return (
      <div className="space-y-4">
        <div className="relative aspect-[16/10] sm:aspect-[21/9] w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 group shadow-2xl">
          <img
            src={current.previewUrl || current.originalUrl}
            alt={current.title || current.name}
            className="w-full h-full object-contain"
            onClick={() => onOpenPhoto(carouselIndex)}
          />
          {/* Nav arrows */}
          <button
            onClick={() => setCarouselIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => setCarouselIndex((prev) => (prev + 1) % filteredPhotos.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-white drop-shadow-md">
            <div>
              <p className="font-semibold text-sm">{current.title || current.name}</p>
              <p className="text-xs text-zinc-300">{carouselIndex + 1} de {filteredPhotos.length}</p>
            </div>
            <button
              onClick={() => onOpenPhoto(carouselIndex)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-semibold"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Pantalla Completa</span>
            </button>
          </div>
        </div>

        {/* Thumbnails strip below */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
          {filteredPhotos.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setCarouselIndex(idx)}
              className={`w-24 h-16 rounded-lg overflow-hidden border transition shrink-0 cursor-pointer ${
                idx === carouselIndex ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-zinc-800 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={p.thumbnailUrl || p.previewUrl} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. CARRUSEL VERTICAL (SNAP FEED)
  // -------------------------------------------------------------
  if (modalityId === 'vertical_feed') {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        {filteredPhotos.map((photo, index) => (
          <div
            key={photo.id}
            onClick={() => onOpenPhoto(index)}
            className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/80 shadow-2xl cursor-pointer"
          >
            <img
              src={photo.previewUrl || photo.originalUrl}
              alt={photo.title || photo.name}
              className="w-full max-h-[75vh] object-cover group-hover:scale-[1.02] transition-transform duration-500"
              loading="lazy"
            />
            <div className="p-4 bg-zinc-950 flex items-center justify-between border-t border-zinc-800/60">
              <div>
                <h4 className="text-sm font-semibold text-white">{photo.title || photo.name}</h4>
                {photo.caption && <p className="text-xs text-zinc-400 mt-0.5">{photo.caption}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(photo.id);
                  }}
                  className={`p-2 rounded-full border transition ${
                    photo.isFavorite ? 'bg-rose-500 text-white border-rose-400' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${photo.isFavorite ? 'fill-white' : ''}`} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenShareModal(photo);
                  }}
                  className="p-2 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white transition"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 5. ÁLBUM EDITORIAL (REVISTA DE ARTE)
  // -------------------------------------------------------------
  if (modalityId === 'editorial_album') {
    return (
      <div className="space-y-16 max-w-5xl mx-auto py-6">
        {filteredPhotos.map((photo, index) => {
          const isEven = index % 2 === 0;
          return (
            <div
              key={photo.id}
              onClick={() => onOpenPhoto(index)}
              className={`flex flex-col md:flex-row items-center gap-8 md:gap-12 cursor-pointer group ${
                isEven ? '' : 'md:flex-row-reverse'
              }`}
            >
              <div className="w-full md:w-3/5 aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xl relative">
                <img
                  src={photo.previewUrl || photo.originalUrl}
                  alt={photo.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                {renderQuickActions(photo)}
              </div>
              <div className="w-full md:w-2/5 space-y-3">
                <span className="text-[11px] uppercase tracking-widest font-mono text-amber-400 font-semibold">
                  Fotografía Nº {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="text-2xl font-serif font-bold text-zinc-100 group-hover:text-amber-300 transition">
                  {photo.title || `Momento Editorial ${index + 1}`}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  {photo.caption || 'Captura de iluminación natural, composición equilibrada y textura preservada en alta resolución.'}
                </p>
                <div className="pt-2 flex items-center gap-4 text-[11px] text-zinc-500 font-mono">
                  <span>{photo.width} × {photo.height} px</span>
                  {photo.exif?.aperture && <span>· {photo.exif.aperture}</span>}
                  {photo.exif?.iso && <span>· {photo.exif.iso}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 6. LIBRO DIGITAL (DOBLE PÁGINA)
  // -------------------------------------------------------------
  if (modalityId === 'digital_book') {
    const leftPhoto = filteredPhotos[bookPageIndex * 2];
    const rightPhoto = filteredPhotos[bookPageIndex * 2 + 1];
    const totalSpreads = Math.ceil(filteredPhotos.length / 2);

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="relative bg-zinc-900 rounded-3xl p-4 sm:p-8 border border-zinc-800 shadow-2xl">
          {/* Book Spine Center line */}
          <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-px bg-zinc-800 z-10 shadow-[0_0_15px_rgba(0,0,0,0.8)]" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[460px]">
            {/* Left Page */}
            {leftPhoto ? (
              <div
                onClick={() => onOpenPhoto(bookPageIndex * 2)}
                className="group relative rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800/80 cursor-pointer flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <img src={leftPhoto.previewUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                  {renderQuickActions(leftPhoto)}
                </div>
                <div className="p-4">
                  <span className="text-[10px] font-mono text-amber-400">Pág. {bookPageIndex * 2 + 1}</span>
                  <h4 className="text-sm font-semibold text-white">{leftPhoto.title || leftPhoto.name}</h4>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-8 text-zinc-600 text-xs italic">Fin del Álbum</div>
            )}

            {/* Right Page */}
            {rightPhoto ? (
              <div
                onClick={() => onOpenPhoto(bookPageIndex * 2 + 1)}
                className="group relative rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800/80 cursor-pointer flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <img src={rightPhoto.previewUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                  {renderQuickActions(rightPhoto)}
                </div>
                <div className="p-4">
                  <span className="text-[10px] font-mono text-amber-400">Pág. {bookPageIndex * 2 + 2}</span>
                  <h4 className="text-sm font-semibold text-white">{rightPhoto.title || rightPhoto.name}</h4>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-8 text-zinc-600 text-xs italic">Página en blanco</div>
            )}
          </div>
        </div>

        {/* Page controls */}
        <div className="flex items-center justify-center gap-4 text-xs text-zinc-400">
          <button
            onClick={() => setBookPageIndex((p) => Math.max(0, p - 1))}
            disabled={bookPageIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white rounded-lg font-medium transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Pliego Anterior</span>
          </button>
          <span className="font-mono text-zinc-300">
            Pliego {bookPageIndex + 1} de {totalSpreads}
          </span>
          <button
            onClick={() => setBookPageIndex((p) => Math.min(totalSpreads - 1, p + 1))}
            disabled={bookPageIndex >= totalSpreads - 1}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white rounded-lg font-medium transition cursor-pointer"
          >
            <span>Siguiente Pliego</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 7. TIRA CINEMATOGRÁFICA
  // -------------------------------------------------------------
  if (modalityId === 'filmstrip') {
    const active = filteredPhotos[carouselIndex] || filteredPhotos[0];
    return (
      <div className="space-y-4">
        <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-black border border-zinc-800 group shadow-2xl">
          <img
            src={active.previewUrl || active.originalUrl}
            alt={active.title || active.name}
            className="w-full h-full object-contain cursor-pointer"
            onClick={() => onOpenPhoto(carouselIndex)}
          />
          {renderQuickActions(active)}
        </div>
        {/* Sprocket Filmstrip */}
        <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 overflow-x-auto">
          <div className="flex gap-3">
            {filteredPhotos.map((p, i) => (
              <div
                key={p.id}
                onClick={() => setCarouselIndex(i)}
                className={`relative w-28 h-20 rounded-lg overflow-hidden border-2 cursor-pointer transition shrink-0 ${
                  i === carouselIndex ? 'border-amber-400 scale-105' : 'border-zinc-800 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={p.thumbnailUrl || p.previewUrl} alt="" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 px-1 bg-black/70 text-[9px] font-mono text-white rounded">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 8. GALERÍA MASONRY
  // -------------------------------------------------------------
  if (modalityId === 'masonry') {
    return (
      <div className="columns-2 sm:columns-3 md:columns-4 gap-4 space-y-4">
        {filteredPhotos.map((photo, index) => (
          <div
            key={photo.id}
            onClick={() => onOpenPhoto(index)}
            className="group relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/80 cursor-pointer shadow-md hover:shadow-xl transition-all break-inside-avoid"
          >
            <img
              src={photo.previewUrl || photo.thumbnailUrl}
              alt={photo.title || photo.name}
              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
              <p className="text-xs font-semibold text-white truncate">{photo.title || photo.name}</p>
            </div>
            {renderQuickActions(photo)}
          </div>
        ))}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 9. PANTALLA COMPLETA DIRECTA
  // -------------------------------------------------------------
  if (modalityId === 'fullscreen_immersive') {
    const hero = filteredPhotos[carouselIndex] || filteredPhotos[0];
    return (
      <div className="relative min-h-[75vh] rounded-3xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center group shadow-2xl">
        <img
          src={hero.originalUrl || hero.previewUrl}
          alt={hero.title || hero.name}
          className="max-h-[75vh] w-full object-contain cursor-pointer"
          onClick={() => onOpenPhoto(carouselIndex)}
        />
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={() => onOpenPhoto(carouselIndex)}
            className="p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition cursor-pointer"
            title="Abrir visor completo"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white drop-shadow-lg">
          <div>
            <h3 className="text-base font-semibold">{hero.title || hero.name}</h3>
            <p className="text-xs text-zinc-400">{carouselIndex + 1} de {filteredPhotos.length}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCarouselIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length)}
              className="p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCarouselIndex((prev) => (prev + 1) % filteredPhotos.length)}
              className="p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 10. COLLAGE ARTÍSTICO
  // -------------------------------------------------------------
  if (modalityId === 'artistic_collage') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 p-4">
        {filteredPhotos.map((photo, index) => {
          // slight rotation: -2 to 2 degrees
          const rot = ((index % 5) - 2) * 1.5;
          return (
            <div
              key={photo.id}
              onClick={() => onOpenPhoto(index)}
              style={{ transform: `rotate(${rot}deg)` }}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border-2 border-white/10 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <img src={photo.thumbnailUrl || photo.previewUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <span className="text-xs text-white font-medium truncate">{photo.title || photo.name}</span>
              </div>
              {renderQuickActions(photo)}
            </div>
          );
        })}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 11. POLAROID INSTANTÁNEA
  // -------------------------------------------------------------
  if (modalityId === 'polaroid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 sm:gap-8 p-4">
        {filteredPhotos.map((photo, index) => {
          const rot = ((index % 4) - 1.5) * 2;
          return (
            <div
              key={photo.id}
              onClick={() => onOpenPhoto(index)}
              style={{ transform: `rotate(${rot}deg)` }}
              className="group bg-zinc-100 p-3 pb-6 rounded-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer text-zinc-900"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-zinc-900 rounded mb-3">
                <img src={photo.thumbnailUrl || photo.previewUrl} alt="" className="w-full h-full object-cover" />
                {renderQuickActions(photo)}
              </div>
              <p className="text-center font-serif text-xs italic tracking-wide text-zinc-700 truncate px-1">
                {photo.title || photo.name}
              </p>
            </div>
          );
        })}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 12. CONTACT SHEET (35MM PRO)
  // -------------------------------------------------------------
  if (modalityId === 'contact_sheet') {
    return (
      <div className="bg-black border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-zinc-800 text-xs font-mono text-zinc-500">
          <span>KODAK PRO 400 · 35MM LABORATORY CONTACT SHEET</span>
          <span>{filteredPhotos.length} FRAMES</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredPhotos.map((photo, index) => (
            <div
              key={photo.id}
              onClick={() => onOpenPhoto(index)}
              className="group relative aspect-[3/2] bg-zinc-950 border border-zinc-800 rounded overflow-hidden cursor-pointer hover:border-amber-400 transition"
            >
              <img src={photo.thumbnailUrl || photo.previewUrl} alt="" className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition" />
              <div className="absolute top-1 left-1 px-1 bg-black/80 rounded text-[9px] font-mono text-amber-400">
                {String(index + 1).padStart(2, '0')}A
              </div>
              {photo.isFavorite && (
                <div className="absolute bottom-1 right-1 text-rose-500">
                  <Heart className="w-3.5 h-3.5 fill-rose-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 13. TIMELINE CRONOLÓGICO
  // -------------------------------------------------------------
  if (modalityId === 'timeline') {
    return (
      <div className="relative max-w-4xl mx-auto py-8">
        {/* Central timeline line */}
        <div className="absolute top-0 bottom-0 left-4 md:left-1/2 w-0.5 bg-zinc-800 -translate-x-1/2" />
        <div className="space-y-12">
          {filteredPhotos.map((photo, index) => {
            const isLeft = index % 2 === 0;
            return (
              <div
                key={photo.id}
                onClick={() => onOpenPhoto(index)}
                className={`relative flex flex-col md:flex-row items-center gap-6 cursor-pointer group ${
                  isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Timeline node marker */}
                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-amber-400 ring-4 ring-zinc-950 z-10" />

                <div className="w-full md:w-1/2 pl-12 md:pl-0 md:px-8">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xl group-hover:scale-105 transition">
                    <img src={photo.previewUrl || photo.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="w-full md:w-1/2 pl-12 md:pl-0 md:px-8 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{photo.dateTaken || `Hito ${index + 1}`}</span>
                  </div>
                  <h4 className="text-base font-semibold text-white">{photo.title || photo.name}</h4>
                  {photo.caption && <p className="text-xs text-zinc-400">{photo.caption}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 14. PRESENTACIÓN AUTOMÁTICA (SLIDESHOW)
  // -------------------------------------------------------------
  if (modalityId === 'slideshow') {
    const current = filteredPhotos[carouselIndex] || filteredPhotos[0];
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-black border border-zinc-800 shadow-2xl flex items-center justify-center">
          <img
            key={current.id}
            src={current.previewUrl || current.originalUrl}
            alt=""
            className="w-full h-full object-contain animate-in fade-in duration-700"
            onClick={() => onOpenPhoto(carouselIndex)}
          />
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white backdrop-blur-md bg-black/50 p-4 rounded-2xl border border-white/10">
            <div>
              <h4 className="text-sm font-semibold">{current.title || current.name}</h4>
              <p className="text-xs text-zinc-400">{carouselIndex + 1} de {filteredPhotos.length}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSlideshowPlaying(!slideshowPlaying)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs transition cursor-pointer"
              >
                {slideshowPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{slideshowPlaying ? 'Pausar' : 'Reproducir Diapositivas'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 15. GALERÍA TIPO PINTEREST
  // -------------------------------------------------------------
  if (modalityId === 'pinterest') {
    return (
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {filteredPhotos.map((photo, index) => (
          <div
            key={photo.id}
            onClick={() => onOpenPhoto(index)}
            className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/80 cursor-pointer shadow-md hover:shadow-2xl transition break-inside-avoid"
          >
            <img src={photo.previewUrl || photo.thumbnailUrl} alt="" className="w-full h-auto object-cover" />
            <div className="p-3 bg-zinc-950 border-t border-zinc-800/60 flex items-center justify-between">
              <span className="text-xs font-semibold text-white truncate max-w-[150px]">{photo.title || photo.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(photo.id);
                }}
                className={`p-1.5 rounded-full ${photo.isFavorite ? 'text-rose-500' : 'text-zinc-400 hover:text-white'}`}
              >
                <Heart className={`w-4 h-4 ${photo.isFavorite ? 'fill-rose-500' : ''}`} />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 16. GALERÍA HORIZONTAL (RIEL DE SCROLL)
  // -------------------------------------------------------------
  if (modalityId === 'horizontal_rail') {
    return (
      <div className="py-4">
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin px-2">
          {filteredPhotos.map((photo, index) => (
            <div
              key={photo.id}
              onClick={() => onOpenPhoto(index)}
              className="group relative h-[450px] aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xl cursor-pointer shrink-0"
            >
              <img src={photo.previewUrl || photo.originalUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-4 flex flex-col justify-end">
                <h4 className="text-sm font-semibold text-white">{photo.title || photo.name}</h4>
                {photo.caption && <p className="text-xs text-zinc-300">{photo.caption}</p>}
              </div>
              {renderQuickActions(photo)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 17. PORTAFOLIO MINIMALISTA
  // -------------------------------------------------------------
  if (modalityId === 'minimalist_portfolio') {
    return (
      <div className="space-y-24 max-w-4xl mx-auto py-12">
        {filteredPhotos.map((photo, index) => (
          <div
            key={photo.id}
            onClick={() => onOpenPhoto(index)}
            className="group space-y-4 cursor-pointer"
          >
            <div className="aspect-[16/10] rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800/80 shadow-2xl relative">
              <img src={photo.previewUrl || photo.originalUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-out" />
              {renderQuickActions(photo)}
            </div>
            <div className="flex items-baseline justify-between px-2 text-zinc-300">
              <h3 className="font-serif text-lg text-white group-hover:text-amber-300 transition">{photo.title || photo.name}</h3>
              <span className="text-xs font-mono text-zinc-500">{String(index + 1).padStart(2, '0')} / {photos.length}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 18. GALERÍA CINEMATOGRÁFICA (21:9 LETTERBOX)
  // -------------------------------------------------------------
  if (modalityId === 'cinematic_dark') {
    return (
      <div className="space-y-8 max-w-5xl mx-auto py-6">
        {filteredPhotos.map((photo, index) => (
          <div
            key={photo.id}
            onClick={() => onOpenPhoto(index)}
            className="group relative aspect-[21/9] rounded-2xl overflow-hidden bg-black border border-zinc-800/90 shadow-2xl cursor-pointer"
          >
            <img src={photo.previewUrl || photo.originalUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end justify-between p-6">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">CINEMA 21:9</span>
                <h4 className="text-lg font-semibold text-white">{photo.title || photo.name}</h4>
              </div>
              <button className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs text-white">
                Ver en Cine
              </button>
            </div>
            {renderQuickActions(photo)}
          </div>
        ))}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 19. MEMORIA VISUAL (POR CAPÍTULOS / MOMENTOS)
  // -------------------------------------------------------------
  if (modalityId === 'visual_memory') {
    return (
      <div className="space-y-6">
        {/* Chapters Tabs */}
        {chapters.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveChapter('Todos')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeChapter === 'Todos' ? 'bg-amber-500 text-zinc-950 shadow' : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              Todos los Momentos ({photos.length})
            </button>
            {chapters.map((ch) => (
              <button
                key={ch}
                onClick={() => setActiveChapter(ch)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeChapter === ch ? 'bg-amber-500 text-zinc-950 shadow' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredPhotos.map((photo, index) => (
            <div
              key={photo.id}
              onClick={() => onOpenPhoto(index)}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-md cursor-pointer"
            >
              <img src={photo.thumbnailUrl || photo.previewUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-3 flex flex-col justify-end">
                <span className="text-[10px] text-amber-300 font-mono">{photo.chapter || 'Momento'}</span>
                <p className="text-xs font-semibold text-white truncate">{photo.title || photo.name}</p>
              </div>
              {renderQuickActions(photo)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 20. GALERÍA COMBINADA (MULTI-EXPERIENCIA)
  // -------------------------------------------------------------
  const featuredPhotos = photos.filter((p) => p.featured);
  const regularPhotos = photos.filter((p) => !p.featured);

  return (
    <div className="space-y-12">
      {/* Section A: Featured Highlights Hero Grid */}
      {featuredPhotos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            <span>Momentos Estelares</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredPhotos.slice(0, 2).map((photo, index) => (
              <div
                key={photo.id}
                onClick={() => onOpenPhoto(index)}
                className="group relative aspect-[16/10] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xl cursor-pointer"
              >
                <img src={photo.previewUrl || photo.originalUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-amber-400 font-bold">Destacada</span>
                    <h4 className="text-sm font-semibold text-white">{photo.title || photo.name}</h4>
                  </div>
                </div>
                {renderQuickActions(photo)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section B: All Photos in Mosaico */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-semibold uppercase tracking-wider text-zinc-300">Colección Completa ({photos.length} Fotos)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              onClick={() => onOpenPhoto(index)}
              className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/80 cursor-pointer shadow-md hover:shadow-xl transition"
            >
              <img src={photo.thumbnailUrl || photo.previewUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
              {renderQuickActions(photo)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
