/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  Copy,
  Trash2,
  QrCode,
  Share2,
  ExternalLink,
  Check,
  Calendar,
  Layers,
  Server,
  BarChart3,
  Users,
  Lock,
  Sparkles,
} from 'lucide-react';
import { GalleryItem, TemplateId, ModalityId } from '../../types/gallery';
import { storageService } from '../../services/storage';
import { TEMPLATES_CONFIG } from '../../constants/templates';
import { MODALITIES_CONFIG } from '../../constants/modalities';
import { QRCodeGenerator } from '../common/QRCodeGenerator';
import { HostingerDeployModal } from './HostingerDeployModal';
import { AnalyticsModal } from './AnalyticsModal';
import { ClientManager } from './ClientManager';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface AdminDashboardProps {
  onOpenGalleryEditor: (galleryId: string) => void;
  onPreviewGallery: (galleryId: string) => void;
  onOpenClientView: (galleryId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenGalleryEditor,
  onPreviewGallery,
  onOpenClientView,
}) => {
  const [galleries, setGalleries] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Modals & Active Targets
  const [activeTab, setActiveTab] = useState<'galerias' | 'clientes'>('galerias');
  const [qrTargetGallery, setQrTargetGallery] = useState<GalleryItem | null>(null);
  const [analyticsTargetGallery, setAnalyticsTargetGallery] = useState<GalleryItem | null>(null);
  const [showHostingerModal, setShowHostingerModal] = useState(false);
  const [copiedLinkGalleryId, setCopiedLinkGalleryId] = useState<string | null>(null);

  // New features requested:
  // 1. Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 2. Share / Link modal state
  const [linkTargetGallery, setLinkTargetGallery] = useState<GalleryItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 3. Custom creation modal state (name, client, category, template, modality)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newCategory, setNewCategory] = useState<GalleryItem['category']>('Bodas');
  const [newTemplateId, setNewTemplateId] = useState<TemplateId>('bodas_elegance');
  const [newModalityId, setNewModalityId] = useState<ModalityId>('classic_grid');
  const [newLocation, setNewLocation] = useState('Estudio / Locación');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);

  const loadGalleries = async () => {
    setLoading(true);
    const list = await storageService.getGalleries();
    setGalleries(list);
    setLoading(false);
  };

  useEffect(() => {
    loadGalleries();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Robust clipboard copy with fallback for iframes
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fallback
    }

    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch (err) {
      console.error('Fallback clipboard copy failed:', err);
      return false;
    }
  };

  const handleOpenCreateModal = () => {
    setNewGalleryName('');
    setNewClientName('');
    setNewCategory('Bodas');
    setNewTemplateId('bodas_elegance');
    setNewModalityId('classic_grid');
    setNewLocation('Estudio / Locación');
    setNewDate(new Date().toISOString().split('T')[0]);
    setShowCreateModal(true);
  };

  const handleCreateGallerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalEventName = newGalleryName.trim() || 'Mi Nueva Galería Fotográfica';
    const finalClientName = newClientName.trim() || 'Cliente Exclusivo';
    const cleanSlugName = finalEventName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newId = 'gal_' + Math.random().toString(36).substring(2, 9);
    const newSlug = `${cleanSlugName || 'galeria'}-${Date.now().toString(36)}`;
    const newGallery: GalleryItem = {
      id: newId,
      slug: newSlug,
      eventName: finalEventName,
      clientName: finalClientName,
      category: newCategory,
      date: newDate || new Date().toISOString().split('T')[0],
      location: newLocation || 'Estudio / Locación',
      description: 'Sesión fotográfica profesional en alta resolución.',
      templateId: newTemplateId,
      modalityId: newModalityId,
      isPublished: false,
      isPrivate: false,
      hasExpiration: false,
      coverTexts: {
        eventName: {
          text: finalEventName,
          visible: true,
          fontFamily: 'serif',
          fontSize: 48,
          color: '#ffffff',
          alignment: 'center',
          bold: true,
          italic: false,
          letterSpacing: 0.05,
          lineHeight: 1.1,
          opacity: 1,
          shadow: 'glow',
          outline: false,
          positionX: 50,
          positionY: 45,
          rotation: 0,
        },
        clientName: {
          text: finalClientName,
          visible: true,
          fontFamily: 'cormorant',
          fontSize: 22,
          color: '#F5E6BE',
          alignment: 'center',
          bold: false,
          italic: true,
          letterSpacing: 0.1,
          lineHeight: 1.2,
          opacity: 0.95,
          shadow: 'subtle',
          outline: false,
          positionX: 50,
          positionY: 55,
          rotation: 0,
        },
        title: {
          text: 'PORTAFOLIO FOTOGRÁFICO',
          visible: true,
          fontFamily: 'cinzel',
          fontSize: 13,
          color: '#D4AF37',
          alignment: 'center',
          bold: true,
          italic: false,
          letterSpacing: 0.2,
          lineHeight: 1.2,
          opacity: 0.9,
          shadow: 'subtle',
          outline: false,
          positionX: 50,
          positionY: 36,
          rotation: 0,
        },
        subtitle: {
          text: 'Colección Oficial Digital',
          visible: true,
          fontFamily: 'sans',
          fontSize: 15,
          color: '#E2E8F0',
          alignment: 'center',
          bold: false,
          italic: false,
          letterSpacing: 0.08,
          lineHeight: 1.2,
          opacity: 0.85,
          shadow: 'none',
          outline: false,
          positionX: 50,
          positionY: 62,
          rotation: 0,
        },
        date: {
          text: newDate || new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
          visible: true,
          fontFamily: 'outfit',
          fontSize: 15,
          color: '#F8FAFC',
          alignment: 'center',
          bold: false,
          italic: false,
          letterSpacing: 0.1,
          lineHeight: 1.2,
          opacity: 0.9,
          shadow: 'subtle',
          outline: false,
          positionX: 50,
          positionY: 68,
          rotation: 0,
        },
        location: {
          text: newLocation || 'Locación Principal',
          visible: true,
          fontFamily: 'sans',
          fontSize: 13,
          color: '#CBD5E1',
          alignment: 'center',
          bold: false,
          italic: false,
          letterSpacing: 0.1,
          lineHeight: 1.2,
          opacity: 0.8,
          shadow: 'none',
          outline: false,
          positionX: 50,
          positionY: 74,
          rotation: 0,
        },
        description: {
          text: 'Disfruta y descarga tu colección de fotografías en máxima calidad original.',
          visible: true,
          fontFamily: 'sans',
          fontSize: 14,
          color: '#94A3B8',
          alignment: 'center',
          bold: false,
          italic: false,
          letterSpacing: 0.02,
          lineHeight: 1.4,
          opacity: 0.85,
          shadow: 'none',
          outline: false,
          positionX: 50,
          positionY: 80,
          rotation: 0,
        },
        dedication: {
          text: '«Cada instante tiene su propia eternidad.»',
          visible: false,
          fontFamily: 'cormorant',
          fontSize: 16,
          color: '#F5E6BE',
          alignment: 'center',
          bold: false,
          italic: true,
          letterSpacing: 0.05,
          lineHeight: 1.2,
          opacity: 0.9,
          shadow: 'none',
          outline: false,
          positionX: 50,
          positionY: 86,
          rotation: 0,
        },
        photographerSignature: {
          text: 'Lumina Studio Photography',
          visible: true,
          fontFamily: 'cinzel',
          fontSize: 11,
          color: '#D4AF37',
          alignment: 'center',
          bold: false,
          italic: false,
          letterSpacing: 0.2,
          lineHeight: 1.2,
          opacity: 0.8,
          shadow: 'none',
          outline: false,
          positionX: 50,
          positionY: 92,
          rotation: 0,
        },
        photoCredits: {
          text: 'Equipo: Sony Alpha / 24-70mm f/2.8',
          visible: false,
          fontFamily: 'sans',
          fontSize: 11,
          color: '#64748B',
          alignment: 'center',
          bold: false,
          italic: false,
          letterSpacing: 0.05,
          lineHeight: 1.2,
          opacity: 0.7,
          shadow: 'none',
          outline: false,
          positionX: 50,
          positionY: 95,
          rotation: 0,
        },
      },
      stickers: [],
      logo: {
        enabled: false,
        imageUrl: '',
        size: 100,
        position: 'bottom-right',
        opacity: 0.8,
        rotation: 0,
        margin: 20,
        applyToAllPhotos: false,
        applyToSelectedOnly: false,
      },
      watermark: {
        enabled: false,
        type: 'text',
        text: 'MUESTRA DIGITAL',
        opacity: 0.35,
        rotation: -30,
        tileSize: 'single',
        protectPreview: false,
        allowCleanOriginalDownload: true,
      },
      music: {
        enabled: false,
        title: 'Atardecer Acústico',
        presetKey: 'ambient_acoustic',
        volume: 0.5,
        loop: true,
        autoplay: false,
      },
      downloads: {
        allowOriginal: true,
        allowOptimized: true,
        allowZipAlbum: true,
        allowZipSelection: true,
        requirePinForDownload: false,
      },
      stats: {
        views: 0,
        uniqueVisitors: 0,
        downloadsCount: 0,
        zipDownloadsCount: 0,
        sharesCount: 0,
        favoritesCount: 0,
      },
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await storageService.saveGallery(newGallery);
    await loadGalleries();
    setShowCreateModal(false);
    showToast(`Galería «${finalEventName}» creada con éxito`);
    onOpenGalleryEditor(newId);
  };

  const handleDuplicate = async (id: string) => {
    const copy = await storageService.duplicateGallery(id);
    if (copy) {
      await loadGalleries();
      showToast(`Copia creada: «${copy.eventName}»`);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    // Open in-app modal instead of broken window.confirm
    setDeleteTarget({ id, name });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await storageService.deleteGallery(deleteTarget.id);
      await loadGalleries();
      showToast(`Galería «${deleteTarget.name}» eliminada`);
    } catch (err) {
      console.error('Error eliminando galería:', err);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const togglePublish = async (g: GalleryItem) => {
    const updated = { ...g, isPublished: !g.isPublished };
    await storageService.saveGallery(updated);
    await loadGalleries();
    showToast(updated.isPublished ? 'Galería publicada' : 'Galería guardada como borrador');
  };

  const copyGalleryLink = async (g: GalleryItem) => {
    const url = `${window.location.origin}?gallery=${g.slug || g.id}`;
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopiedLinkGalleryId(g.id);
      showToast(`¡Enlace copiado! Listo para enviar al cliente`);
      setTimeout(() => setCopiedLinkGalleryId(null), 2500);
    } else {
      // If direct clipboard copy failed or was restricted, open the link dialog
      setLinkTargetGallery(g);
    }
  };

  const openLinkModal = (g: GalleryItem) => {
    setLinkTargetGallery(g);
  };

  const filteredGalleries = galleries.filter((g) => {
    const matchSearch =
      g.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory = categoryFilter === 'Todas' || g.category === categoryFilter;

    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && g.isPublished) ||
      (statusFilter === 'draft' && !g.isPublished);

    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div className="space-y-8">
      {/* Top Banner & Metric Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <span className="text-xs uppercase tracking-widest text-amber-400 font-mono font-semibold">
            Panel del Fotógrafo Profesional
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            Lumina Studio Galerías
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Crea galerías en alta resolución 8K, 20 modalidades de presentación, 20 plantillas temáticas y entrega premium.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowHostingerModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 border border-zinc-700/60"
            title="Ver guía de instalación en Hostinger y descargar .htaccess"
          >
            <Server className="w-4 h-4 text-amber-400" />
            <span>Despliegue Hostinger</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/15 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nueva Galería</span>
          </button>
        </div>
      </div>

      {/* Main Tabs (Galerías vs Clientes) */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('galerias')}
            className={`flex items-center gap-2 pb-2 text-sm font-semibold transition border-b-2 cursor-pointer ${
              activeTab === 'galerias'
                ? 'border-amber-400 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Mis Galerías ({galleries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('clientes')}
            className={`flex items-center gap-2 pb-2 text-sm font-semibold transition border-b-2 cursor-pointer ${
              activeTab === 'clientes'
                ? 'border-amber-400 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Directorio de Clientes</span>
          </button>
        </div>

        <div className="hidden sm:block">
          <PWAInstallButton />
        </div>
      </div>

      {/* TAB 1: GALLERIES */}
      {activeTab === 'galerias' && (
        <div className="space-y-6">
          {/* Filters & Search Toolbar */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
            {/* Search Input */}
            <div className="relative w-full lg:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar por evento, cliente o ubicación..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-400"
              />
            </div>

            {/* Category and Status Dropdowns */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-amber-400"
              >
                <option value="Todas">Todas las Categorías</option>
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

              {/* Status Segmented Control */}
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                {(['all', 'published', 'draft'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer capitalize ${
                      statusFilter === st ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {st === 'all' ? 'Todas' : st === 'published' ? 'Publicadas' : 'Borradores'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Galleries Grid */}
          {loading ? (
            <div className="py-24 text-center text-zinc-500">
              <p className="text-xs">Cargando galerías del estudio...</p>
            </div>
          ) : filteredGalleries.length === 0 ? (
            <div className="text-center py-24 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-3">
              <Sparkles className="w-10 h-10 text-amber-400/40 mx-auto" />
              <h3 className="text-base font-semibold text-white">No se encontraron galerías</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                No hay proyectos que coincidan con tus criterios de búsqueda. Puedes crear una nueva galería con el botón superior.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGalleries.map((gallery) => {
                const tmpl = TEMPLATES_CONFIG[gallery.templateId] || TEMPLATES_CONFIG.bodas_elegance;
                const mod = MODALITIES_CONFIG[gallery.modalityId] || MODALITIES_CONFIG.classic_grid;

                return (
                  <div
                    key={gallery.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:border-zinc-700 transition flex flex-col justify-between group"
                  >
                    {/* Header info */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-amber-400 font-semibold border border-zinc-800">
                          {gallery.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {gallery.isPrivate && (
                            <span className="p-1 rounded bg-zinc-800 text-amber-400" title="Protegida con PIN">
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <button
                            onClick={() => togglePublish(gallery)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                              gallery.isPublished
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {gallery.isPublished ? 'Publicada' : 'Borrador'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-white text-base group-hover:text-amber-300 transition line-clamp-1">
                          {gallery.eventName}
                        </h3>
                        <p className="text-xs text-zinc-400 font-light mt-0.5 truncate">
                          {gallery.clientName}
                        </p>
                      </div>

                      {/* Metadata row */}
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 pt-1">
                        <span>{gallery.date}</span>
                        <span>·</span>
                        <span className="truncate">{gallery.location}</span>
                      </div>

                      {/* Template & Modality Badges */}
                      <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-zinc-950 text-zinc-300 border border-zinc-800">
                          🎨 {tmpl.name}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-zinc-950 text-amber-300/90 border border-zinc-800">
                          📐 {mod.badge}
                        </span>
                      </div>
                    </div>

                    {/* Stats & Actions Footer */}
                    <div className="p-4 bg-zinc-950/80 border-t border-zinc-800/80 space-y-3">
                      {/* Metric mini stats */}
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 font-mono">
                        <span>{gallery.stats?.views || 0} Visitas</span>
                        <span>{gallery.stats?.downloadsCount || 0} Descargas</span>
                        <span>{gallery.stats?.favoritesCount || 0} Favoritos</span>
                      </div>

                      {/* Primary action buttons */}
                      <div className="flex items-center justify-between gap-1 pt-1">
                        <div className="flex items-center gap-1">
                          {/* Edit Gallery */}
                          <button
                            onClick={() => onOpenGalleryEditor(gallery.id)}
                            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition cursor-pointer"
                            title="Editar Galería y Portada"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Preview as Client */}
                          <button
                            onClick={() => onPreviewGallery(gallery.id)}
                            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                            title="Previsualizar como cliente"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* QR Code */}
                          <button
                            onClick={() => setQrTargetGallery(gallery)}
                            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                            title="Ver Código QR"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* Analytics */}
                          <button
                            onClick={() => setAnalyticsTargetGallery(gallery)}
                            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                            title="Estadísticas y Comentarios"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>

                          {/* Duplicate */}
                          <button
                            onClick={() => handleDuplicate(gallery.id)}
                            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                            title="Duplicar proyecto"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Copy link or Delete */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openLinkModal(gallery)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 hover:text-white transition cursor-pointer"
                            title="Ver y compartir enlace de la galería"
                          >
                            {copiedLinkGalleryId === gallery.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                            <span className="text-[11px]">Enlace</span>
                          </button>

                          <button
                            onClick={() => handleDeleteClick(gallery.id, gallery.eventName)}
                            className="p-2 rounded-xl hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                            title="Eliminar galería"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLIENT DIRECTORY */}
      {activeTab === 'clientes' && <ClientManager galleries={galleries} />}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-zinc-900 border border-amber-400/50 rounded-xl text-xs font-semibold text-amber-200 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modal: Crear Nueva Galería con Nombre Elegido */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-zinc-100 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Crear Nueva Galería</h3>
                  <p className="text-[11px] text-zinc-400">Personaliza el nombre y los datos iniciales de tu evento</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGallerySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Nombre del Evento / Galería <span className="text-amber-400">*</span>:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="ej. Boda Valentina & Mateo / Graduación 2026"
                  value={newGalleryName}
                  onChange={(e) => setNewGalleryName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-xs outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Nombre del Cliente:</label>
                  <input
                    type="text"
                    placeholder="ej. Valentina Valenzuela"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Categoría:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-400"
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Fecha del Evento:</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Ubicación:</label>
                  <input
                    type="text"
                    placeholder="ej. Hacienda San José"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-zinc-800">
                <div>
                  <label className="block text-zinc-400 mb-1">Plantilla Temática Inicial:</label>
                  <select
                    value={newTemplateId}
                    onChange={(e) => setNewTemplateId(e.target.value as TemplateId)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-white text-xs outline-none focus:border-amber-400"
                  >
                    {Object.values(TEMPLATES_CONFIG).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Modalidad de Presentación:</label>
                  <select
                    value={newModalityId}
                    onChange={(e) => setNewModalityId(e.target.value as ModalityId)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-white text-xs outline-none focus:border-amber-400"
                  >
                    {Object.values(MODALITIES_CONFIG).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  Crear y Empezar a Editar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmación para Eliminar Galería */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-zinc-900 border border-rose-500/30 rounded-3xl p-6 text-zinc-100 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-white">¿Eliminar esta galería?</h3>
              <p className="text-xs text-zinc-300 font-semibold text-rose-300">
                «{deleteTarget.name}»
              </p>
              <p className="text-[11px] text-zinc-400 pt-1 leading-relaxed">
                Esta acción eliminará la galería y todas sus fotografías de forma permanente.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-rose-600/20 disabled:opacity-50"
              >
                {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ver y Copiar Enlace de Galería */}
      {linkTargetGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Enlace de Entrega al Cliente</h3>
                  <p className="text-[11px] text-zinc-400">{linkTargetGallery.eventName}</p>
                </div>
              </div>
              <button
                onClick={() => setLinkTargetGallery(null)}
                className="text-zinc-500 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Enlace directo de la galería:</label>
              <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}?gallery=${linkTargetGallery.slug || linkTargetGallery.id}`}
                  className="bg-transparent text-xs text-zinc-200 font-mono w-full outline-none select-all"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const url = `${window.location.origin}?gallery=${linkTargetGallery.slug || linkTargetGallery.id}`;
                    await copyToClipboard(url);
                    setCopiedLinkGalleryId(linkTargetGallery.id);
                    showToast('¡Enlace copiado al portapapeles!');
                    setTimeout(() => setCopiedLinkGalleryId(null), 2500);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs transition cursor-pointer shrink-0"
                >
                  {copiedLinkGalleryId === linkTargetGallery.id ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onOpenClientView(linkTargetGallery.id);
                  setLinkTargetGallery(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Abrir en Vista de Cliente</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setQrTargetGallery(linkTargetGallery);
                  setLinkTargetGallery(null);
                }}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>Ver Código QR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrTargetGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative">
            <button
              onClick={() => setQrTargetGallery(null)}
              className="absolute -top-10 right-0 text-zinc-400 hover:text-white p-2"
            >
              Cerrar
            </button>
            <QRCodeGenerator
              url={`${window.location.origin}?gallery=${qrTargetGallery.slug || qrTargetGallery.id}`}
              title={qrTargetGallery.eventName}
            />
          </div>
        </div>
      )}

      {analyticsTargetGallery && (
        <AnalyticsModal
          gallery={analyticsTargetGallery}
          isOpen={true}
          onClose={() => setAnalyticsTargetGallery(null)}
        />
      )}

      <HostingerDeployModal
        isOpen={showHostingerModal}
        onClose={() => setShowHostingerModal(false)}
      />
    </div>
  );
};
