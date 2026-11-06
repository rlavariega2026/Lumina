/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Heart,
  Share2,
  Download,
  Info,
  Printer,
  MessageSquare,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';
import { PhotoItem, GalleryItem } from '../../types/gallery';
import { ZipDownloadService } from '../../services/zipService';

interface FullscreenLightboxProps {
  photos: PhotoItem[];
  initialIndex: number;
  gallery: GalleryItem;
  isOpen: boolean;
  onClose: (lastIndex: number) => void;
  onToggleFavorite?: (photoId: string) => void;
  onTogglePrintSelected?: (photoId: string) => void;
  onOpenShareModal?: (photo: PhotoItem) => void;
  onAddComment?: (photoId: string, author: string, text: string) => void;
}

export const FullscreenLightbox: React.FC<FullscreenLightboxProps> = ({
  photos,
  initialIndex,
  gallery,
  isOpen,
  onClose,
  onToggleFavorite,
  onTogglePrintSelected,
  onOpenShareModal,
  onAddComment,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isSlideshowRunning, setIsSlideshowRunning] = useState(false);
  const [slideshowInterval, setSlideshowInterval] = useState(4); // seconds
  const [transitionType, setTransitionType] = useState<'fade' | 'slide'>('fade');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showExif, setShowExif] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentText, setCommentText] = useState('');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

  // Sync index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoomLevel(1);
  }, [initialIndex]);

  const currentPhoto = photos[currentIndex] || photos[0];

  // Auto-hide controls timer
  const resetIdleTimer = useCallback(() => {
    setShowControls(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!isSlideshowRunning) {
      idleTimerRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  }, [isSlideshowRunning]);

  useEffect(() => {
    const handleMouseMove = () => resetIdleTimer();
    window.addEventListener('mousemove', handleMouseMove);
    resetIdleTimer();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  const goToNext = useCallback(() => {
    setZoomLevel(1);
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const goToPrev = useCallback(() => {
    setZoomLevel(1);
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Slideshow timer
  useEffect(() => {
    if (!isSlideshowRunning) return;

    const timer = window.setInterval(() => {
      goToNext();
    }, slideshowInterval * 1000);

    return () => clearInterval(timer);
  }, [isSlideshowRunning, slideshowInterval, goToNext]);

  // Fullscreen API toggle
  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      resetIdleTimer();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'Escape') onClose(currentIndex);
      if (e.key === ' ') {
        e.preventDefault();
        setIsSlideshowRunning((prev) => !prev);
      }
      if (e.key === 'f' || e.key === 'F') toggleBrowserFullscreen();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, goToNext, goToPrev, onClose, resetIdleTimer]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    resetIdleTimer();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Horizontal swipe threshold
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        goToNext();
      } else {
        goToPrev();
      }
    } else if (deltaY > 90) {
      // Swipe down to dismiss
      onClose(currentIndex);
    }
  };

  const handleDownload = async () => {
    if (!currentPhoto) return;
    await ZipDownloadService.downloadSinglePhoto(currentPhoto, 'original');
  };

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentPhoto) return;
    onAddComment?.(currentPhoto.id, commentAuthor.trim() || 'Cliente', commentText.trim());
    setCommentText('');
    setShowCommentInput(false);
  };

  if (!isOpen || !currentPhoto) return null;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none transition-all duration-300"
    >
      {/* Top Header Controls (Auto-hide) */}
      <div
        className={`absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/85 via-black/40 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white/90 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 tabular-nums">
            {currentIndex + 1} / {photos.length}
          </span>
          <div className="hidden sm:block">
            <h4 className="text-sm font-semibold text-white truncate max-w-xs md:max-w-md">
              {currentPhoto.title || currentPhoto.name}
            </h4>
            {currentPhoto.chapter && (
              <p className="text-xs text-amber-300/80">{currentPhoto.chapter}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Slideshow button */}
          <button
            onClick={() => setIsSlideshowRunning(!isSlideshowRunning)}
            className={`p-2.5 rounded-full backdrop-blur-md border transition cursor-pointer ${
              isSlideshowRunning
                ? 'bg-amber-500 text-zinc-950 border-amber-400'
                : 'bg-black/50 text-white border-white/15 hover:bg-white/20'
            }`}
            title={isSlideshowRunning ? 'Pausar presentación' : 'Iniciar presentación automática'}
          >
            {isSlideshowRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Fullscreen browser toggle */}
          <button
            onClick={toggleBrowserFullscreen}
            className="p-2.5 rounded-full bg-black/50 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md transition cursor-pointer"
            title="Pantalla completa nativa"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close button */}
          <button
            onClick={() => onClose(currentIndex)}
            className="p-2.5 rounded-full bg-black/50 hover:bg-rose-500/30 text-white hover:text-rose-200 border border-white/15 backdrop-blur-md transition cursor-pointer ml-1"
            title="Salir (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Photo Viewport */}
      <div
        onClick={() => resetIdleTimer()}
        className="relative flex-1 flex items-center justify-center p-2 sm:p-6 cursor-pointer"
      >
        <img
          key={currentPhoto.id}
          src={currentPhoto.originalUrl || currentPhoto.previewUrl}
          alt={currentPhoto.title || currentPhoto.name}
          className={`max-w-full max-h-full object-contain transition-all duration-300 pointer-events-auto ${
            transitionType === 'fade' ? 'animate-in fade-in zoom-in-95 duration-200' : ''
          }`}
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
          }}
          draggable={false}
        />

        {/* Ambient watermark if configured */}
        {gallery.watermark.enabled && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            <span
              className="font-bold text-white tracking-widest uppercase select-none opacity-20 text-xl sm:text-3xl text-center px-4"
              style={{ transform: `rotate(${gallery.watermark.rotation}deg)` }}
            >
              {gallery.watermark.text}
            </span>
          </div>
        )}

        {/* Lateral Navigation arrows */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrev();
          }}
          className={`absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-opacity duration-300 cursor-pointer ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          title="Foto anterior (←)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className={`absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-opacity duration-300 cursor-pointer ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          title="Foto siguiente (→)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* EXIF Info Drawer */}
      {showExif && currentPhoto.exif && (
        <div className="absolute bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 bg-zinc-950/90 border border-zinc-800 rounded-2xl p-4 text-xs text-zinc-300 backdrop-blur-md shadow-2xl z-40 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 font-semibold text-white">
            <span>Metadatos Fotográficos (EXIF)</span>
            <button onClick={() => setShowExif(false)} className="text-zinc-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-500">Cámara:</span>
              <span className="text-zinc-200">{currentPhoto.exif.camera || 'Cámara profesional'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Lente:</span>
              <span className="text-zinc-200">{currentPhoto.exif.lens || 'Lente serie Pro'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Apertura:</span>
              <span className="text-amber-400">{currentPhoto.exif.aperture || 'f/2.8'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Velocidad:</span>
              <span className="text-amber-400">{currentPhoto.exif.shutter || '1/500s'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Sensibilidad:</span>
              <span className="text-amber-400">{currentPhoto.exif.iso || 'ISO 100'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Resolución:</span>
              <span className="text-zinc-200">{currentPhoto.width} × {currentPhoto.height} px</span>
            </div>
          </div>
        </div>
      )}

      {/* Comment Input Modal / Drawer */}
      {showCommentInput && (
        <div className="absolute bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 bg-zinc-950/95 border border-zinc-800 rounded-2xl p-4 text-xs text-zinc-300 backdrop-blur-md shadow-2xl z-40">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800 font-semibold text-white">
            <span>Dejar un comentario en esta fotografía</span>
            <button onClick={() => setShowCommentInput(false)} className="text-zinc-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={submitComment} className="space-y-2.5">
            <input
              type="text"
              placeholder="Tu nombre (ej. Carlos, Abuela, etc.)"
              value={commentAuthor}
              onChange={(e) => setCommentAuthor(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-xs outline-none focus:border-amber-400"
            />
            <textarea
              placeholder="Escribe tu nota o felicitación..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-400 resize-none"
            />
            <button
              type="submit"
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg text-xs transition cursor-pointer"
            >
              Publicar Comentario
            </button>
          </form>
        </div>
      )}

      {/* Bottom Floating Toolbar (Auto-hide) */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Left tools: Zoom & EXIF */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.5, 3))}
            className="p-2.5 rounded-full bg-black/50 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition cursor-pointer"
            title="Ampliar (Zoom In)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.5, 1))}
            className="p-2.5 rounded-full bg-black/50 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition cursor-pointer"
            title="Reducir (Zoom Out)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowExif(!showExif)}
            className={`p-2.5 rounded-full border backdrop-blur-md transition cursor-pointer ${
              showExif ? 'bg-amber-500 text-zinc-950 border-amber-400' : 'bg-black/50 text-white border-white/10 hover:bg-white/20'
            }`}
            title="Ver datos EXIF"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Center Thumbnail Dots/Strip preview */}
        <div className="hidden md:flex items-center gap-1.5 max-w-sm overflow-x-auto py-1 px-3 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
          {photos.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => {
                setZoomLevel(1);
                setCurrentIndex(idx);
              }}
              className={`w-7 h-7 rounded-md overflow-hidden border transition cursor-pointer shrink-0 ${
                idx === currentIndex ? 'border-amber-400 ring-2 ring-amber-400/40 scale-110' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={p.thumbnailUrl || p.previewUrl} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* Right tools: Favorite, Print, Share, Download, Comment */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Favorite */}
          <button
            onClick={() => onToggleFavorite?.(currentPhoto.id)}
            className={`p-2.5 rounded-full backdrop-blur-md border transition cursor-pointer ${
              currentPhoto.isFavorite
                ? 'bg-rose-500 text-white border-rose-400'
                : 'bg-black/50 text-white border-white/10 hover:bg-white/20'
            }`}
            title={currentPhoto.isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
          >
            <Heart className={`w-4 h-4 ${currentPhoto.isFavorite ? 'fill-white' : ''}`} />
          </button>

          {/* Print Selection */}
          <button
            onClick={() => onTogglePrintSelected?.(currentPhoto.id)}
            className={`p-2.5 rounded-full backdrop-blur-md border transition cursor-pointer ${
              currentPhoto.isPrintSelected
                ? 'bg-amber-500 text-zinc-950 border-amber-400'
                : 'bg-black/50 text-white border-white/10 hover:bg-white/20'
            }`}
            title={currentPhoto.isPrintSelected ? 'Seleccionada para impresión' : 'Añadir a lista de impresión'}
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Comment */}
          <button
            onClick={() => setShowCommentInput(!showCommentInput)}
            className="p-2.5 rounded-full bg-black/50 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition cursor-pointer"
            title="Comentarios"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* Share Real File */}
          <button
            onClick={() => onOpenShareModal?.(currentPhoto)}
            className="p-2.5 rounded-full bg-black/50 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition cursor-pointer"
            title="Compartir fotografía real"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Download Original Photo */}
          {gallery.downloads.allowOriginal && (
            <button
              onClick={handleDownload}
              className="p-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold border border-amber-400 backdrop-blur-md transition cursor-pointer"
              title="Descargar fotografía original"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
