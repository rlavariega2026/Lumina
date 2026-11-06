/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Eye,
  Layout,
  Sliders,
  UploadCloud,
  Images,
  Palette,
  Shield,
  Download,
  Server,
  Sparkles,
  Check,
  Lock,
  Calendar,
  Copy,
} from 'lucide-react';
import { GalleryItem, PhotoItem, TemplateId, ModalityId } from '../../types/gallery';
import { TEMPLATES_CONFIG } from '../../constants/templates';
import { MODALITIES_CONFIG } from '../../constants/modalities';
import { storageService } from '../../services/storage';
import { PhotoUploader } from './PhotoUploader';
import { PhotoGridManager } from './PhotoGridManager';
import { CoverVisualEditor } from './CoverVisualEditor';
import { HostingerDeployModal } from './HostingerDeployModal';

interface GalleryEditorProps {
  galleryId: string;
  onBack: () => void;
  onPreview: (galleryId: string) => void;
}

type EditorTab =
  | 'general'
  | 'plantilla'
  | 'modalidad'
  | 'subir'
  | 'fotos'
  | 'visual'
  | 'descargas'
  | 'hostinger';

export const GalleryEditor: React.FC<GalleryEditorProps> = ({
  galleryId,
  onBack,
  onPreview,
}) => {
  const [gallery, setGallery] = useState<GalleryItem | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [activeTab, setActiveTab] = useState<EditorTab>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [toastText, setToastText] = useState('¡Cambios guardados con éxito!');
  const [showHostingerModal, setShowHostingerModal] = useState(false);

  // "Guardar como..." Modal state
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');
  const [isSavingAs, setIsSavingAs] = useState(false);

  const loadData = async () => {
    const g = await storageService.getGalleryById(galleryId);
    if (g) {
      setGallery(g);
      const pList = await storageService.getPhotosByGallery(g.id);
      setPhotos(pList);
    }
  };

  useEffect(() => {
    loadData();
  }, [galleryId]);

  const handleSave = async (updatedData?: Partial<GalleryItem>) => {
    if (!gallery) return;
    setIsSaving(true);
    const updated: GalleryItem = {
      ...gallery,
      ...(updatedData || {}),
      updatedAt: new Date().toISOString(),
    };
    setGallery(updated);
    await storageService.saveGallery(updated);
    setIsSaving(false);
    setToastText('¡Cambios guardados con éxito!');
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2500);
  };

  const handleOpenSaveAs = () => {
    if (!gallery) return;
    setSaveAsName(`${gallery.eventName} (Copia)`);
    setShowSaveAsModal(true);
  };

  const handleExecuteSaveAs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gallery || !saveAsName.trim()) return;
    setIsSavingAs(true);
    try {
      const finalName = saveAsName.trim();
      const cleanSlug = finalName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const newSlug = `${cleanSlug || 'galeria'}-${Date.now().toString(36)}`;
      const newCopy = await storageService.duplicateGallery(gallery.id, finalName, newSlug);
      if (newCopy) {
        setShowSaveAsModal(false);
        setGallery(newCopy);
        const pList = await storageService.getPhotosByGallery(newCopy.id);
        setPhotos(pList);
        setToastText(`¡Guardado como «${finalName}»! Ahora estás editando la nueva galería.`);
        setShowSavedToast(true);
        setTimeout(() => setShowSavedToast(false), 3000);
      }
    } catch (err) {
      console.error('Error al guardar como:', err);
    } finally {
      setIsSavingAs(false);
    }
  };

  if (!gallery) {
    return (
      <div className="py-24 text-center text-zinc-500">
        <p>Cargando editor de galería...</p>
      </div>
    );
  }

  const navTabs: { id: EditorTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'general', label: '1. Información', icon: Sliders },
    { id: 'plantilla', label: '2. Plantilla (20)', icon: Palette },
    { id: 'modalidad', label: '3. Modalidad (20)', icon: Layout },
    { id: 'subir', label: '4. Cargar Fotos', icon: UploadCloud },
    { id: 'fotos', label: `5. Galería (${photos.length})`, icon: Images },
    { id: 'visual', label: '6. Editor Visual & Portada', icon: Sparkles },
    { id: 'descargas', label: '7. Descargas & Permisos', icon: Shield },
    { id: 'hostinger', label: '8. Hostinger & Despliegue', icon: Server },
  ];

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
            title="Volver al listado"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{gallery.eventName}</h2>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  gallery.isPublished
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {gallery.isPublished ? 'Publicada' : 'Borrador'}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Cliente: {gallery.clientName} · {photos.length} Fotografías
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
          <button
            onClick={() => onPreview(gallery.id)}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Eye className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Previsualizar</span>
          </button>

          {/* Botón Guardar Como */}
          <button
            type="button"
            onClick={handleOpenSaveAs}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-300 hover:text-amber-200 border border-zinc-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            title="Guardar una copia o nueva versión con otro nombre"
          >
            <Copy className="w-3.5 h-3.5 text-amber-400" />
            <span>Guardar como...</span>
          </button>

          {/* Botón Guardar */}
          <button
            onClick={() => handleSave()}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-amber-500/10"
          >
            {showSavedToast ? (
              <>
                <Check className="w-4 h-4 text-zinc-950" />
                <span>¡Guardado!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Main Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto scrollbar-none">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === 'hostinger') {
                  setShowHostingerModal(true);
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ---------------- 1. INFORMACIÓN GENERAL ---------------- */}
      {activeTab === 'general' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6">
          <h3 className="font-bold text-sm text-white">Detalles del Evento y Configuración de Acceso</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1">Nombre del Evento:</label>
              <input
                type="text"
                value={gallery.eventName}
                onChange={(e) => {
                  const val = e.target.value;
                  setGallery({
                    ...gallery,
                    eventName: val,
                    coverTexts: {
                      ...gallery.coverTexts,
                      eventName: { ...gallery.coverTexts.eventName, text: val },
                    },
                  });
                }}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Nombre del Cliente:</label>
              <input
                type="text"
                value={gallery.clientName}
                onChange={(e) => {
                  const val = e.target.value;
                  setGallery({
                    ...gallery,
                    clientName: val,
                    coverTexts: {
                      ...gallery.coverTexts,
                      clientName: { ...gallery.coverTexts.clientName, text: val },
                    },
                  });
                }}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Categoría del Evento:</label>
              <select
                value={gallery.category}
                onChange={(e) => setGallery({ ...gallery, category: e.target.value as any })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
              >
                <option value="Bodas">Bodas</option>
                <option value="Graduaciones">Graduaciones</option>
                <option value="XV Años">XV Años</option>
                <option value="Infantil">Infantil</option>
                <option value="Escolar">Escolar</option>
                <option value="Lifestyle">Lifestyle</option>
                <option value="Corporativo">Corporativo</option>
                <option value="Viajes">Viajes</option>
                <option value="Familia">Familia</option>
                <option value="Maternidad">Maternidad</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Fecha del Evento:</label>
              <input
                type="date"
                value={gallery.date}
                onChange={(e) => {
                  const val = e.target.value;
                  setGallery({
                    ...gallery,
                    date: val,
                    coverTexts: {
                      ...gallery.coverTexts,
                      date: { ...gallery.coverTexts.date, text: val },
                    },
                  });
                }}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Ubicación / Lugar:</label>
              <input
                type="text"
                value={gallery.location}
                onChange={(e) => {
                  const val = e.target.value;
                  setGallery({
                    ...gallery,
                    location: val,
                    coverTexts: {
                      ...gallery.coverTexts,
                      location: { ...gallery.coverTexts.location, text: val },
                    },
                  });
                }}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Slug URL Amigable:</label>
              <input
                type="text"
                value={gallery.slug}
                onChange={(e) => setGallery({ ...gallery, slug: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Descripción de la Galería:</label>
            <textarea
              rows={3}
              value={gallery.description}
              onChange={(e) => setGallery({ ...gallery, description: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-white resize-none"
            />
          </div>

          {/* Privacy & Expiration */}
          <div className="pt-4 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Private with PIN */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-white">Proteger con PIN / Contraseña</span>
                </div>
                <input
                  type="checkbox"
                  checked={gallery.isPrivate}
                  onChange={(e) => setGallery({ ...gallery, isPrivate: e.target.checked })}
                  className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                />
              </div>
              {gallery.isPrivate && (
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Código PIN (ej. 1234):</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={gallery.pinCode || ''}
                    placeholder="1234"
                    onChange={(e) => setGallery({ ...gallery, pinCode: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white font-mono text-center tracking-widest text-sm"
                  />
                </div>
              )}
            </div>

            {/* Expiration date */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-white">Establecer Fecha de Expiración</span>
                </div>
                <input
                  type="checkbox"
                  checked={gallery.hasExpiration}
                  onChange={(e) => setGallery({ ...gallery, hasExpiration: e.target.checked })}
                  className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                />
              </div>
              {gallery.hasExpiration && (
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Fecha límite de acceso:</label>
                  <input
                    type="date"
                    value={gallery.expirationDate || ''}
                    onChange={(e) => setGallery({ ...gallery, expirationDate: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 2. VEINTE (20) PLANTILLAS TEMÁTICAS ---------------- */}
      {activeTab === 'plantilla' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <h3 className="font-bold text-sm text-white">Seleccionar entre las 20 Plantillas Temáticas Profesionales</h3>
            <span>Plantilla activa: <strong className="text-amber-400">{TEMPLATES_CONFIG[gallery.templateId]?.name}</strong></span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.values(TEMPLATES_CONFIG).map((tmpl) => {
              const isSelected = gallery.templateId === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => {
                    handleSave({ templateId: tmpl.id });
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-48 group shadow-lg ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400/40 bg-zinc-900'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  {/* Decorative color indicator */}
                  <div
                    className="h-2 w-full rounded-full mb-3"
                    style={{
                      background: `linear-gradient(to right, ${tmpl.primaryColor}, ${tmpl.accentColor})`,
                    }}
                  />

                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-semibold">
                      {tmpl.category}
                    </span>
                    <h4
                      className="font-bold text-sm text-white mt-0.5 group-hover:text-amber-300 transition"
                      style={{ color: isSelected ? tmpl.primaryColor : undefined }}
                    >
                      {tmpl.name}
                    </h4>
                    <p className="text-[11px] text-zinc-400 leading-snug mt-1 line-clamp-2">
                      {tmpl.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 font-mono text-[10px]">
                      {tmpl.fontTitle.replace('font-[', '').replace(']', '')}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                        <Check className="w-3.5 h-3.5" />
                        <span>Activa</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- 3. VEINTE (20) MODALIDADES DE PRESENTACIÓN ---------------- */}
      {activeTab === 'modalidad' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <h3 className="font-bold text-sm text-white">Seleccionar entre las 20 Modalidades de Presentación</h3>
            <span>Modalidad activa: <strong className="text-amber-400">{MODALITIES_CONFIG[gallery.modalityId]?.name}</strong></span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.values(MODALITIES_CONFIG).map((mod) => {
              const isSelected = gallery.modalityId === mod.id;
              return (
                <div
                  key={mod.id}
                  onClick={() => {
                    handleSave({ modalityId: mod.id });
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-48 group shadow-lg ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400/40 bg-zinc-900'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-medium">
                        {mod.badge}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">{mod.category}</span>
                    </div>

                    <h4 className="font-bold text-sm text-white group-hover:text-amber-300 transition mt-1">
                      {mod.name}
                    </h4>
                    <p className="text-[11px] text-zinc-400 leading-snug mt-1.5 line-clamp-3">
                      {mod.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-end">
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                        <Check className="w-3.5 h-3.5" />
                        <span>Activa</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-500 group-hover:text-zinc-300 transition">
                        Seleccionar
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- 4. CARGAR FOTOGRAFÍAS (ALTA RESOLUCIÓN) ---------------- */}
      {activeTab === 'subir' && (
        <PhotoUploader
          galleryId={gallery.id}
          existingPhotos={photos}
          onUploadComplete={(newPhotos) => {
            setPhotos((prev) => [...prev, ...newPhotos]);
            handleSave();
          }}
        />
      )}

      {/* ---------------- 5. ADMINISTRAR FOTOGRAFÍAS ---------------- */}
      {activeTab === 'fotos' && (
        <PhotoGridManager
          gallery={gallery}
          photos={photos}
          onPhotosUpdated={(updatedPhotos) => {
            setPhotos(updatedPhotos);
          }}
          onSetHeroPhoto={(heroId) => {
            handleSave({ heroPhotoId: heroId });
          }}
        />
      )}

      {/* ---------------- 6. EDITOR VISUAL & PORTADA ---------------- */}
      {activeTab === 'visual' && (
        <CoverVisualEditor
          gallery={gallery}
          photos={photos}
          onChange={(patch) => {
            setGallery((prev) => (prev ? { ...prev, ...patch } : prev));
          }}
        />
      )}

      {/* ---------------- 7. DESCARGAS & PERMISOS ---------------- */}
      {activeTab === 'descargas' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6 max-w-2xl">
          <h3 className="font-bold text-sm text-white">Configuración de Permisos de Descarga</h3>
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-zinc-950 rounded-xl border border-zinc-800">
              <div>
                <h4 className="font-semibold text-white">Permitir Descarga de Originales en Alta Resolución</h4>
                <p className="text-[11px] text-zinc-400">El cliente podrá descargar el archivo fotográfico original sin compresión.</p>
              </div>
              <input
                type="checkbox"
                checked={gallery.downloads.allowOriginal}
                onChange={(e) =>
                  setGallery({
                    ...gallery,
                    downloads: { ...gallery.downloads, allowOriginal: e.target.checked },
                  })
                }
                className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-zinc-950 rounded-xl border border-zinc-800">
              <div>
                <h4 className="font-semibold text-white">Permitir Descarga de Álbum Completo en ZIP</h4>
                <p className="text-[11px] text-zinc-400">Habilita el botón «Descargar Álbum ZIP» en la cabecera del cliente.</p>
              </div>
              <input
                type="checkbox"
                checked={gallery.downloads.allowZipAlbum}
                onChange={(e) =>
                  setGallery({
                    ...gallery,
                    downloads: { ...gallery.downloads, allowZipAlbum: e.target.checked },
                  })
                }
                className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-zinc-950 rounded-xl border border-zinc-800">
              <div>
                <h4 className="font-semibold text-white">Permitir Descargar Selección en ZIP</h4>
                <p className="text-[11px] text-zinc-400">Permite descargar únicamente las fotos marcadas como favoritas o seleccionadas.</p>
              </div>
              <input
                type="checkbox"
                checked={gallery.downloads.allowZipSelection}
                onChange={(e) =>
                  setGallery({
                    ...gallery,
                    downloads: { ...gallery.downloads, allowZipSelection: e.target.checked },
                  })
                }
                className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Hostinger Deploy Modal */}
      <HostingerDeployModal
        isOpen={showHostingerModal}
        onClose={() => setShowHostingerModal(false)}
      />

      {/* Modal: Guardar como... */}
      {showSaveAsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <Copy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Guardar Galería Como...</h3>
                  <p className="text-[11px] text-zinc-400">Crea una nueva versión o copia independiente</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveAsModal(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteSaveAs} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Nombre de la Nueva Galería:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="ej. Boda Valentina & Mateo - Versión Blanca"
                  value={saveAsName}
                  onChange={(e) => setSaveAsName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-400"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Se duplicarán todas las {photos.length} fotografías en alta resolución, la plantilla, modalidades y personalización de portada bajo este nuevo nombre.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowSaveAsModal(false)}
                  disabled={isSavingAs}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingAs || !saveAsName.trim()}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/10 disabled:opacity-50"
                >
                  {isSavingAs ? 'Guardando copia...' : 'Guardar como Nueva Galería'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-zinc-900 border border-amber-400/50 rounded-xl text-xs font-semibold text-amber-200 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastText}</span>
        </div>
      )}
    </div>
  );
};
