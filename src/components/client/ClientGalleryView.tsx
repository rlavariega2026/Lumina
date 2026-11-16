import { apiUrl, readPublicGallery } from '../../services/cloud';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Printer,
  Download,
  Share2,
  QrCode,
  Volume2,
  VolumeX,
  ArrowLeft,
  Lock,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { GalleryItem, PhotoItem } from '../../types/gallery';
import { storageService } from '../../services/storage';
import { audioController } from '../../services/audioPlayer';
import { ZipDownloadService } from '../../services/zipService';
import { CoverHero } from './CoverHero';
import { ModalitiesRenderer } from './ModalitiesRenderer';
import { FullscreenLightbox } from './FullscreenLightbox';
import { FavoritesDrawer } from './FavoritesDrawer';
import { PrintSelectionDrawer } from './PrintSelectionDrawer';
import { SharePhotoModal } from './SharePhotoModal';
import { PinLockScreen } from './PinLockScreen';
import { QRCodeGenerator } from '../common/QRCodeGenerator';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { TEMPLATES_CONFIG } from '../../constants/templates';

interface ClientGalleryViewProps {
  galleryId: string;
  publicRoute?: string;
  onBackToAdmin?: () => void;
  isPreviewMode?: boolean;
}

export const ClientGalleryView: React.FC<ClientGalleryViewProps> = ({
  galleryId,
  publicRoute,
  onBackToAdmin,
  isPreviewMode = false,
}) => {
  const [gallery, setGallery] = useState<GalleryItem | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lockedName, setLockedName] = useState('');
  const [publicError, setPublicError] = useState('');
  const [publicUrl, setPublicUrl] = useState('');
  const [demo, setDemo] = useState(false);
  const [installHelp, setInstallHelp] = useState(false);

  const loadPublic = async (pin?: string) => {
    if (!publicRoute) return;
    const result = await readPublicGallery(publicRoute, pin);
    if ('locked' in result) { setLockedName(result.name); return; }
    setLockedName('');
    setGallery(result.gallery);
    const preferences = readVisitorPhotos(result.gallery.id);
    setPhotos(result.photos.map(photo => ({ ...photo, ...preferences[photo.id] })));
    setPublicUrl(result.url);
    setDemo(result.mode === 'demo');
    setIsUnlocked(true);
  };

  const requestFullscreen = (event: React.MouseEvent) => {
    if (!publicRoute || document.fullscreenElement || window.matchMedia('(display-mode: standalone)').matches
      || !(event.target instanceof Element) || event.target.closest('button,a,input,select,textarea,form,label,[role="button"],[role="dialog"],[contenteditable],[data-lumina-interactive],video,audio')) return;
    const root = document.documentElement;
    const showHelp = () => { if (/iPhone|iPad|iPod/.test(navigator.userAgent)) setInstallHelp(true); };
    if (root.requestFullscreen && document.fullscreenEnabled !== false) void root.requestFullscreen().catch(showHelp);
    else showHelp();
  };

  // Security & Locks
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Modals & Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showPrintSelection, setShowPrintSelection] = useState(false);
  const [sharePhotoTarget, setSharePhotoTarget] = useState<PhotoItem | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // Audio state
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ percent: number; text: string } | null>(null);

  const galleryContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!publicRoute) return;
    const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!manifest) return;
    const original = manifest.href;
    manifest.href = apiUrl('manifest', { start: location.pathname + location.search });
    return () => { manifest.href = original; };
  }, [publicRoute]);

  // Load gallery data
  const loadGalleryData = async () => {
    setLoading(true);
    try {
      const g = await storageService.getGalleryById(galleryId);
      if (g) {
        setGallery(g);

        // Check expiration
        if (g.hasExpiration && g.expirationDate) {
          const exp = new Date(g.expirationDate);
          if (exp < new Date()) {
            setIsExpired(true);
          }
        }

        // If not private, set unlocked
        if (!g.isPrivate) {
          setIsUnlocked(true);
        }

        // Fetch photos
        const pList = await storageService.getPhotosByGallery(g.id);
        setPhotos(pList);

        // Increment visit stat once
        if (!isPreviewMode) {
          await storageService.incrementStat(g.id, 'views');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (publicRoute) void loadPublic().catch(error => setPublicError(error.message)).finally(() => setLoading(false));
    else void loadGalleryData();
    return () => {
      audioController.stop();
    };
  }, [galleryId, publicRoute]);

  const toggleMusic = () => {
    if (!gallery) return;
    const playing = audioController.toggle(gallery.music);
    setIsMusicPlaying(playing);
  };

  function readVisitorPhotos(id: string): Record<string, Pick<PhotoItem, 'isFavorite' | 'isPrintSelected'>> {
    try { return JSON.parse(localStorage.getItem('lumina-selection-' + id) || '{}'); }
    catch { return {}; }
  }

  function saveVisitorPhoto(photo: PhotoItem) {
    if (!gallery) return;
    try {
      const preferences = readVisitorPhotos(gallery.id);
      preferences[photo.id] = { isFavorite: photo.isFavorite, isPrintSelected: photo.isPrintSelected };
      localStorage.setItem('lumina-selection-' + gallery.id, JSON.stringify(preferences));
    } catch { /* selection still works in this view */ }
  }

  const handleToggleFavorite = async (photoId: string) => {
    const updated = photos.map((p) => {
      if (p.id === photoId) {
        return { ...p, isFavorite: !p.isFavorite };
      }
      return p;
    });
    setPhotos(updated);
    const photoToUpdate = updated.find((p) => p.id === photoId);
    if (photoToUpdate && publicRoute) saveVisitorPhoto(photoToUpdate);
    if (photoToUpdate && !publicRoute) {
      await storageService.savePhotoRecord(photoToUpdate);
      if (gallery) {
        await storageService.incrementStat(gallery.id, 'favoritesCount');
      }
    }
  };

  const handleTogglePrintSelected = async (photoId: string) => {
    const updated = photos.map((p) => {
      if (p.id === photoId) {
        return { ...p, isPrintSelected: !p.isPrintSelected };
      }
      return p;
    });
    setPhotos(updated);
    const photoToUpdate = updated.find((p) => p.id === photoId);
    if (photoToUpdate && publicRoute) saveVisitorPhoto(photoToUpdate);
    if (photoToUpdate && !publicRoute) {
      await storageService.savePhotoRecord(photoToUpdate);
    }
  };

  const handleDownloadFullAlbumZip = async () => {
    if (!gallery || photos.length === 0) return;
    setIsDownloadingZip(true);
    setZipProgress({ percent: 0, text: 'Iniciando compresión de álbum...' });

    try {
      await ZipDownloadService.downloadPhotosAsZip(
        gallery,
        photos,
        gallery.downloads.allowOriginal,
        `${gallery.eventName}_AlbumCompleto.zip`,
        (percent, text) => {
          setZipProgress({ percent, text });
        }
      );
      if (!publicRoute) await storageService.incrementStat(gallery.id, 'zipDownloadsCount');
    } finally {
      setTimeout(() => {
        setIsDownloadingZip(false);
        setZipProgress(null);
      }, 1500);
    }
  };

  const scrollToGallery = () => {
    galleryContentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (publicError) return <main className="grid min-h-dvh place-items-center bg-zinc-950 p-8 text-zinc-100"><p role="alert">{publicError}</p></main>;
  if (lockedName) return <PinLockScreen galleryName={lockedName} verifyPin={loadPublic} onUnlock={() => setIsUnlocked(true)} />;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 space-y-3">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-widest font-mono text-zinc-500">Cargando Galería Lumina...</p>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center text-zinc-300 space-y-4">
        <h2 className="text-lg font-bold text-white">Galería no encontrada</h2>
        <p className="text-xs text-zinc-500">El identificador de galería solicitado no existe o fue eliminado.</p>
        {onBackToAdmin && (
          <button
            onClick={onBackToAdmin}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs"
          >
            Regresar al Panel
          </button>
        )}
      </div>
    );
  }

  // Handle expired gallery
  if (isExpired) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center text-zinc-100 select-none">
        <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 text-zinc-500 flex items-center justify-center mb-4">
          <Calendar className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Galería Expirada</h2>
        <p className="text-xs text-zinc-400 max-w-sm mb-4">
          La fecha de vigencia para visualizar la galería «{gallery.eventName}» ha concluido.
          Ponte en contacto con tu fotógrafo para reactivar el acceso.
        </p>
        {onBackToAdmin && (
          <button
            onClick={onBackToAdmin}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold"
          >
            Volver al Panel del Fotógrafo
          </button>
        )}
      </div>
    );
  }

  // Handle private PIN lock
  if (!isUnlocked && gallery.isPrivate) {
    return (
      <PinLockScreen
        galleryName={gallery.eventName}
        expectedPin={gallery.pinCode}
        onUnlock={() => setIsUnlocked(true)}
      />
    );
  }

  const template = TEMPLATES_CONFIG[gallery.templateId] || TEMPLATES_CONFIG.bodas_elegance;
  const heroPhoto = photos.find((p) => p.id === gallery.heroPhotoId) || photos[0];
  const favorites = photos.filter((p) => p.isFavorite);
  const printSelections = photos.filter((p) => p.isPrintSelected);

  const galleryPublicUrl = publicUrl || gallery.publication?.url || `${window.location.origin}${import.meta.env.BASE_URL}?gallery=${encodeURIComponent(gallery.slug || gallery.id)}`;

  return (
    <div onClick={requestFullscreen} className={`lumina-public-gallery min-h-screen ${template.bgColor} ${template.fontBody} text-zinc-100 selection:bg-amber-500/20 selection:text-amber-200`}>
      {demo && <div className="lumina-demo" aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL}lav-digital.png`} alt="" />
        <strong>DEMO</strong>
        <span>Versión de demostración • LAV Digital MKT</span>
      </div>}
      {installHelp && <div data-lumina-interactive className="fixed inset-x-4 bottom-4 z-[65] mx-auto max-w-sm rounded-xl bg-zinc-900 p-3">
        En Safari puedes usar Compartir y Agregar a inicio.
        <button onClick={() => setInstallHelp(false)} className="ml-2 underline">Cerrar</button>
      </div>}
      {/* 1. Cover Hero Section */}
      <CoverHero
        gallery={gallery}
        heroPhoto={heroPhoto}
        onEnterGallery={scrollToGallery}
        isMusicPlaying={isMusicPlaying}
        onToggleMusic={toggleMusic}
      />

      {/* 2. Client Top Navigation Bar Contract (Sticky below cover) */}
      <div
        ref={galleryContentRef} data-lumina-interactive
        className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-md border-y border-zinc-800/80 px-4 sm:px-8 py-3 flex items-center justify-between gap-4"
      >
        {/* Zone 1: Gallery Brand / Title */}
        <div className="flex items-center gap-3 shrink-0">
          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition cursor-pointer"
              title="Volver al Panel de Administración"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Panel Admin</span>
            </button>
          )}
          <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[180px] sm:max-w-xs">
            {gallery.eventName}
          </span>
          {isPreviewMode && (
            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Modo Previsualización
            </span>
          )}
        </div>

        {/* Zone 2: Navigation / Quick stats & filters */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Favorites tab */}
          <button
            onClick={() => setShowFavorites(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer shrink-0 ${
              favorites.length > 0
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/25'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Mis fotos favoritas"
          >
            <Heart className={`w-3.5 h-3.5 ${favorites.length > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>Favoritos ({favorites.length})</span>
          </button>

          {/* Print selections tab */}
          <button
            onClick={() => setShowPrintSelection(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer shrink-0 ${
              printSelections.length > 0
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Selección para impresión"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Impresión</span>
            <span>({printSelections.length})</span>
          </button>

          {/* QR Code button */}
          <button
            onClick={() => setShowQrModal(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition cursor-pointer shrink-0"
            title="Ver código QR para móvil"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden md:inline ml-1">Código QR</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>

        {/* Zone 3: 1 Primary Action (Full Album ZIP Download) */}
        <div className="flex items-center shrink-0">
          {gallery.downloads.allowZipAlbum && (
            <button
              onClick={handleDownloadFullAlbumZip}
              disabled={isDownloadingZip}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs transition shadow-sm cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloadingZip ? 'Comprimiendo...' : 'Descargar Álbum ZIP'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ZIP Progress Toast Overlay */}
      {zipProgress && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-950/95 border border-amber-500/40 rounded-2xl p-4 text-xs shadow-2xl text-zinc-200 w-80 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between font-semibold text-amber-400 mb-1.5">
            <span>Generando archivo ZIP</span>
            <span>{zipProgress.percent}%</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mb-2">
            <div
              className="bg-amber-500 h-full transition-all duration-300"
              style={{ width: `${zipProgress.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-400 truncate">{zipProgress.text}</p>
        </div>
      )}

      {/* 3. Main Gallery Container: Render Active Modality (1 to 20) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <ModalitiesRenderer
          gallery={gallery}
          photos={photos}
          onOpenPhoto={(idx) => setLightboxIndex(idx)}
          onToggleFavorite={handleToggleFavorite}
          onTogglePrintSelected={handleTogglePrintSelected}
          onOpenShareModal={(p) => setSharePhotoTarget(p)}
        />
      </main>

      {/* 4. Client Gallery Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-12 px-6 text-center text-xs text-zinc-500">
        <div className="max-w-md mx-auto space-y-3">
          <p className="text-zinc-400 font-semibold">{gallery.eventName}</p>
          <p className="text-[11px]">
            {gallery.coverTexts.photographerSignature.text || 'Fotografía Profesional por Lumina Studio'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2 text-[11px] text-zinc-600">
            <span>© {new Date().getFullYear()} Todos los derechos reservados</span>
            <span>·</span>
            <span>Plataforma Lumina Studio</span>
          </div>
        </div>
      </footer>

      {/* 4 BIS. Fullscreen Lightbox Modal */}
      {lightboxIndex !== null && (
        <FullscreenLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          gallery={gallery}
          isOpen={true}
          onClose={() => setLightboxIndex(null)}
          onToggleFavorite={handleToggleFavorite}
          onTogglePrintSelected={handleTogglePrintSelected}
          onOpenShareModal={(p) => setSharePhotoTarget(p)}
          onAddComment={async (photoId, author, text) => {
            const newComment = {
              id: 'com_' + Math.random().toString(36).substring(2, 8),
              photoId,
              authorName: author,
              comment: text,
              createdAt: new Date().toISOString(),
            };
            const updated = {
              ...gallery,
              comments: [...(gallery.comments || []), newComment],
            };
            setGallery(updated);
            if (!publicRoute) await storageService.saveGallery(updated);
          }}
        />
      )}

      {/* Favorites Drawer */}
      <FavoritesDrawer
        isOpen={showFavorites}
        onClose={() => setShowFavorites(false)}
        favorites={favorites}
        gallery={gallery}
        onOpenPhoto={(idx) => {
          const fav = favorites[idx];
          const globalIdx = photos.findIndex((p) => p.id === fav.id);
          if (globalIdx !== -1) setLightboxIndex(globalIdx);
          setShowFavorites(false);
        }}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Print Selection Drawer */}
      <PrintSelectionDrawer
        isOpen={showPrintSelection}
        onClose={() => setShowPrintSelection(false)}
        selectedPhotos={printSelections}
        gallery={gallery}
        onTogglePrintSelected={handleTogglePrintSelected}
      />

      {/* Share Photo Modal */}
      <SharePhotoModal
        photo={sharePhotoTarget}
        gallery={gallery}
        isOpen={sharePhotoTarget !== null}
        onClose={() => setSharePhotoTarget(null)}
      />

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute -top-10 right-0 text-zinc-400 hover:text-white p-2"
            >
              Cerrar
            </button>
            <QRCodeGenerator
              url={galleryPublicUrl}
              title={gallery.eventName}
            />
          </div>
        </div>
      )}
    </div>
  );
};
