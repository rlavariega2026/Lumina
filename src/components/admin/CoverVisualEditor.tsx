/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Type,
  Sticker,
  Image as ImageIcon,
  Music,
  Shield,
  Eye,
  EyeOff,
  Move,
  RotateCw,
  Plus,
  Trash2,
  Copy,
  Layers,
  Lock,
  Unlock,
  Sliders,
  Volume2,
} from 'lucide-react';
import {
  GalleryItem,
  CoverTextConfig,
  FieldTextStyle,
  StickerElement,
  PhotoItem,
} from '../../types/gallery';
import { BUILTIN_STICKERS, STICKER_CATEGORIES } from '../../constants/stickers';
import { AMBIENT_PRESETS } from '../../services/audioPlayer';
import { CoverHero } from '../client/CoverHero';

interface CoverVisualEditorProps {
  gallery: GalleryItem;
  photos: PhotoItem[];
  onChange: (updated: Partial<GalleryItem>) => void;
}

type EditorTab = 'textos' | 'stickers' | 'logo' | 'marca_agua' | 'musica';

export const CoverVisualEditor: React.FC<CoverVisualEditorProps> = ({
  gallery,
  photos,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<EditorTab>('textos');
  const [selectedField, setSelectedField] = useState<keyof CoverTextConfig>('eventName');
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const coverTexts = gallery.coverTexts;
  const currentFieldStyle = coverTexts[selectedField];

  // Update a single text field style
  const updateTextStyle = (field: keyof CoverTextConfig, patch: Partial<FieldTextStyle>) => {
    const updatedTexts: CoverTextConfig = {
      ...coverTexts,
      [field]: {
        ...coverTexts[field],
        ...patch,
      },
    };
    onChange({ coverTexts: updatedTexts });
  };

  // Sticker actions
  const addSticker = (stickerId: string) => {
    const builtin = BUILTIN_STICKERS.find((b) => b.id === stickerId);
    if (!builtin) return;

    const newSticker: StickerElement = {
      id: 'stk_' + Math.random().toString(36).substring(2, 8),
      stickerId: builtin.id,
      name: builtin.name,
      category: builtin.category,
      x: 50,
      y: 50,
      width: 80,
      height: 80,
      rotation: 0,
      scale: 1,
      opacity: 0.9,
      zIndex: (gallery.stickers?.length || 0) + 1,
      isLocked: false,
    };

    const updated = [...(gallery.stickers || []), newSticker];
    onChange({ stickers: updated });
    setSelectedStickerId(newSticker.id);
  };

  const updateSticker = (id: string, patch: Partial<StickerElement>) => {
    const updated = (gallery.stickers || []).map((s) => (s.id === id ? { ...s, ...patch } : s));
    onChange({ stickers: updated });
  };

  const removeSticker = (id: string) => {
    const updated = (gallery.stickers || []).filter((s) => s.id !== id);
    onChange({ stickers: updated });
    if (selectedStickerId === id) setSelectedStickerId(null);
  };

  const duplicateSticker = (id: string) => {
    const target = (gallery.stickers || []).find((s) => s.id === id);
    if (!target) return;
    const copy: StickerElement = {
      ...target,
      id: 'stk_' + Math.random().toString(36).substring(2, 8),
      x: Math.min(target.x + 5, 90),
      y: Math.min(target.y + 5, 90),
    };
    onChange({ stickers: [...(gallery.stickers || []), copy] });
    setSelectedStickerId(copy.id);
  };

  const heroPhoto = photos.find((p) => p.id === gallery.heroPhotoId) || photos[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT: Controls Panel (5 cols) */}
      <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-6 shadow-xl">
        {/* Editor Sub-Tabs */}
        <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-2xl border border-zinc-800 overflow-x-auto">
          {[
            { id: 'textos', label: 'Textos', icon: Type },
            { id: 'stickers', label: 'Stickers', icon: Sticker },
            { id: 'logo', label: 'Logotipo', icon: ImageIcon },
            { id: 'marca_agua', label: 'Marca Agua', icon: Shield },
            { id: 'musica', label: 'Música', icon: Music },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as EditorTab)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex-1 justify-center ${
                  isActive
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ---------------- TAB 1: TEXTOS INDEPENDIENTES ---------------- */}
        {activeTab === 'textos' && (
          <div className="space-y-5 animate-in fade-in">
            {/* Field Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Campo a Personalizar:</label>
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value as keyof CoverTextConfig)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="eventName">Nombre del Evento</option>
                <option value="clientName">Nombre del Cliente</option>
                <option value="title">Título / Kicker</option>
                <option value="subtitle">Subtítulo</option>
                <option value="date">Fecha</option>
                <option value="location">Ubicación</option>
                <option value="description">Descripción</option>
                <option value="dedication">Dedicatoria</option>
                <option value="photographerSignature">Firma del Fotógrafo</option>
                <option value="photoCredits">Créditos de Equipo</option>
              </select>
            </div>

            {/* Field Visibility & Text Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Contenido del Texto:</span>
                <button
                  type="button"
                  onClick={() =>
                    updateTextStyle(selectedField, { visible: !currentFieldStyle.visible })
                  }
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition ${
                    currentFieldStyle.visible
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                  }`}
                >
                  {currentFieldStyle.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{currentFieldStyle.visible ? 'Visible' : 'Oculto'}</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={currentFieldStyle.text}
                onChange={(e) => updateTextStyle(selectedField, { text: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-400 resize-none"
              />
            </div>

            {/* Typographic Controls */}
            <div className="space-y-4 pt-2 border-t border-zinc-800">
              {/* Font Family & Size */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Tipografía:</label>
                  <select
                    value={currentFieldStyle.fontFamily}
                    onChange={(e) =>
                      updateTextStyle(selectedField, {
                        fontFamily: e.target.value as FieldTextStyle['fontFamily'],
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="cormorant">Cormorant Garamond (Elegante)</option>
                    <option value="serif">Playfair Display (Editorial)</option>
                    <option value="cinzel">Cinzel (Regio / Solemne)</option>
                    <option value="sans">Plus Jakarta (Moderno)</option>
                    <option value="outfit">Outfit (Geométrico)</option>
                    <option value="grotesk">Space Grotesk (Aventurero)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Tamaño: {currentFieldStyle.fontSize}px
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={currentFieldStyle.fontSize}
                    onChange={(e) =>
                      updateTextStyle(selectedField, { fontSize: parseInt(e.target.value) })
                    }
                    className="w-full accent-amber-400"
                  />
                </div>
              </div>

              {/* Color & Shadow */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Color del Texto:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentFieldStyle.color}
                      onChange={(e) => updateTextStyle(selectedField, { color: e.target.value })}
                      className="w-8 h-8 rounded border border-zinc-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentFieldStyle.color}
                      onChange={(e) => updateTextStyle(selectedField, { color: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Efecto Sombra:</label>
                  <select
                    value={currentFieldStyle.shadow}
                    onChange={(e) =>
                      updateTextStyle(selectedField, {
                        shadow: e.target.value as FieldTextStyle['shadow'],
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="none">Sin sombra</option>
                    <option value="subtle">Sombra sutil</option>
                    <option value="glow">Resplandor dorado</option>
                    <option value="strong">Sombra profunda</option>
                    <option value="retro">Borde retro</option>
                  </select>
                </div>
              </div>

              {/* Bold, Italic & Alignment */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateTextStyle(selectedField, { bold: !currentFieldStyle.bold })}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                      currentFieldStyle.bold
                        ? 'bg-amber-500 text-zinc-950 border-amber-400'
                        : 'bg-zinc-950 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateTextStyle(selectedField, { italic: !currentFieldStyle.italic })
                    }
                    className={`px-3 py-1.5 rounded-lg border text-xs italic transition ${
                      currentFieldStyle.italic
                        ? 'bg-amber-500 text-zinc-950 border-amber-400'
                        : 'bg-zinc-950 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    I
                  </button>
                </div>

                {/* Alignment */}
                <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-700">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => updateTextStyle(selectedField, { alignment: align })}
                      className={`px-2 py-1 text-xs rounded capitalize transition ${
                        currentFieldStyle.alignment === align
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {align === 'left' ? 'Izq' : align === 'center' ? 'Centro' : 'Der'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Letter Spacing & Rotation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Espaciado: {currentFieldStyle.letterSpacing}em
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.02"
                    value={currentFieldStyle.letterSpacing}
                    onChange={(e) =>
                      updateTextStyle(selectedField, {
                        letterSpacing: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Rotación: {currentFieldStyle.rotation}°
                  </label>
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    value={currentFieldStyle.rotation}
                    onChange={(e) =>
                      updateTextStyle(selectedField, { rotation: parseInt(e.target.value) })
                    }
                    className="w-full accent-amber-400"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- TAB 2: STICKERS & CAPAS ---------------- */}
        {activeTab === 'stickers' && (
          <div className="space-y-5 animate-in fade-in">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-zinc-200">Insertar Sticker Temático:</h4>
              <div className="grid grid-cols-4 gap-2.5 max-h-52 overflow-y-auto p-2 bg-zinc-950 rounded-2xl border border-zinc-800">
                {BUILTIN_STICKERS.map((stk) => (
                  <button
                    key={stk.id}
                    type="button"
                    onClick={() => addSticker(stk.id)}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-400 hover:text-amber-300 flex flex-col items-center justify-center transition cursor-pointer group"
                    title={stk.name}
                  >
                    <div
                      dangerouslySetInnerHTML={{ __html: stk.svg }}
                      className="w-7 h-7 mb-1 group-hover:scale-110 transition"
                    />
                    <span className="text-[9px] text-zinc-400 truncate w-full text-center">
                      {stk.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Stickers on Canvas List */}
            {gallery.stickers && gallery.stickers.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <h4 className="text-xs font-semibold text-zinc-200">Capas en Portada:</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {gallery.stickers.map((stk) => (
                    <div
                      key={stk.id}
                      onClick={() => setSelectedStickerId(stk.id)}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition ${
                        selectedStickerId === stk.id
                          ? 'border-amber-400 bg-amber-500/10 text-white'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                      }`}
                    >
                      <span className="truncate">{stk.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateSticker(stk.id);
                          }}
                          className="p-1 hover:text-white"
                          title="Duplicar"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSticker(stk.id);
                          }}
                          className="p-1 text-rose-400 hover:text-rose-300"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- TAB 3: LOGOTIPO ---------------- */}
        {activeTab === 'logo' && (
          <div className="space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <div>
                <h4 className="text-xs font-semibold text-white">Mostrar Logotipo</h4>
                <p className="text-[11px] text-zinc-400">Totalmente opcional para el fotógrafo.</p>
              </div>
              <input
                type="checkbox"
                checked={gallery.logo.enabled}
                onChange={(e) =>
                  onChange({
                    logo: { ...gallery.logo, enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
              />
            </div>

            {gallery.logo.enabled && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Cargar Logo en PNG Transparente:
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/svg+xml,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        onChange({
                          logo: { ...gallery.logo, imageUrl: url },
                        });
                      }
                    }}
                    className="w-full text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Posición:</label>
                    <select
                      value={gallery.logo.position}
                      onChange={(e) =>
                        onChange({
                          logo: {
                            ...gallery.logo,
                            position: e.target.value as any,
                          },
                        })
                      }
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white text-xs"
                    >
                      <option value="top-left">Superior Izquierda</option>
                      <option value="top-right">Superior Derecha</option>
                      <option value="bottom-left">Inferior Izquierda</option>
                      <option value="bottom-right">Inferior Derecha</option>
                      <option value="center">Centro</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">
                      Tamaño: {gallery.logo.size}px
                    </label>
                    <input
                      type="range"
                      min="40"
                      max="240"
                      value={gallery.logo.size}
                      onChange={(e) =>
                        onChange({
                          logo: { ...gallery.logo, size: parseInt(e.target.value) },
                        })
                      }
                      className="w-full accent-amber-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- TAB 4: MARCA DE AGUA ---------------- */}
        {activeTab === 'marca_agua' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <div>
                <h4 className="text-xs font-semibold text-white">Marca de Agua en Previsualización</h4>
                <p className="text-[11px] text-zinc-400">Protege fotos contra capturas no autorizadas.</p>
              </div>
              <input
                type="checkbox"
                checked={gallery.watermark.enabled}
                onChange={(e) =>
                  onChange({
                    watermark: { ...gallery.watermark, enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
              />
            </div>

            {gallery.watermark.enabled && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Texto de Protección:</label>
                  <input
                    type="text"
                    value={gallery.watermark.text}
                    onChange={(e) =>
                      onChange({
                        watermark: { ...gallery.watermark, text: e.target.value },
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Opacidad: {Math.round(gallery.watermark.opacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.8"
                    step="0.05"
                    value={gallery.watermark.opacity}
                    onChange={(e) =>
                      onChange({
                        watermark: {
                          ...gallery.watermark,
                          opacity: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-amber-400"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- TAB 5: MÚSICA DE FONDO ---------------- */}
        {activeTab === 'musica' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <div>
                <h4 className="text-xs font-semibold text-white">Música de Fondo</h4>
                <p className="text-[11px] text-zinc-400">Totalmente opcional para el cliente.</p>
              </div>
              <input
                type="checkbox"
                checked={gallery.music.enabled}
                onChange={(e) =>
                  onChange({
                    music: { ...gallery.music, enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
              />
            </div>

            {gallery.music.enabled && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Seleccionar Pista Ambiental Preconfigurada:
                  </label>
                  <select
                    value={gallery.music.presetKey || 'romantic_piano'}
                    onChange={(e) =>
                      onChange({
                        music: {
                          ...gallery.music,
                          presetKey: e.target.value as any,
                          audioUrl: undefined,
                        },
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-white"
                  >
                    {AMBIENT_PRESETS.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.name} ({p.genre})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    O Cargar Archivo de Audio Propio (MP3, WAV, M4A):
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        onChange({
                          music: {
                            ...gallery.music,
                            audioUrl: url,
                            title: file.name,
                          },
                        });
                      }
                    }}
                    className="w-full text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT: Live WYSIWYG Cover Preview (7 cols) */}
      <div className="lg:col-span-7 space-y-3">
        <div className="flex items-center justify-between px-2 text-xs text-zinc-400">
          <span className="font-semibold text-zinc-200">Previsualización en Tiempo Real</span>
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                previewDevice === 'desktop' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400'
              }`}
            >
              Escritorio
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                previewDevice === 'mobile' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400'
              }`}
            >
              Móvil
            </button>
          </div>
        </div>

        <div
          className={`mx-auto rounded-3xl overflow-hidden border-2 border-zinc-800 shadow-2xl transition-all duration-300 ${
            previewDevice === 'mobile' ? 'max-w-xs' : 'w-full'
          }`}
        >
          <CoverHero
            gallery={gallery}
            heroPhoto={heroPhoto}
            onEnterGallery={() => {}}
            isMusicPlaying={false}
          />
        </div>
      </div>
    </div>
  );
};
