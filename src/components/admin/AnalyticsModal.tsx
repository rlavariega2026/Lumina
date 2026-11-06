/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  X,
  Eye,
  Download,
  Share2,
  Heart,
  MessageSquare,
  Printer,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { GalleryItem } from '../../types/gallery';

interface AnalyticsModalProps {
  gallery: GalleryItem;
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  gallery,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const stats = gallery.stats || {
    views: 0,
    uniqueVisitors: 0,
    downloadsCount: 0,
    zipDownloadsCount: 0,
    sharesCount: 0,
    favoritesCount: 0,
  };

  const statCards = [
    { label: 'Visitas a la Galería', value: stats.views, icon: Eye, color: 'text-amber-400' },
    { label: 'Visitantes Únicos', value: stats.uniqueVisitors, icon: Eye, color: 'text-amber-300' },
    { label: 'Descargas Individuales', value: stats.downloadsCount, icon: Download, color: 'text-emerald-400' },
    { label: 'Descargas de Álbum ZIP', value: stats.zipDownloadsCount, icon: Download, color: 'text-sky-400' },
    { label: 'Fotografías Compartidas', value: stats.sharesCount, icon: Share2, color: 'text-indigo-400' },
    { label: 'Fotos en Favoritos', value: stats.favoritesCount, icon: Heart, color: 'text-rose-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-zinc-100 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-semibold">
              Métricas de Entrega y Rendimiento
            </span>
            <h3 className="text-base font-bold text-white">{gallery.eventName}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800/80 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">{card.label}</span>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <p className="text-2xl font-bold font-mono text-white tabular-nums">{card.value}</p>
              </div>
            );
          })}
        </div>

        {/* Client Comments on Photos */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>Comentarios y Notas del Cliente ({gallery.comments?.length || 0})</span>
          </h4>
          {(!gallery.comments || gallery.comments.length === 0) ? (
            <p className="text-xs text-zinc-500 italic p-4 bg-zinc-950 rounded-xl border border-zinc-800">
              Aún no hay comentarios registrados en las fotografías de esta galería.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {gallery.comments.map((c) => (
                <div key={c.id} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                    <span className="font-semibold text-white">{c.authorName}</span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-zinc-300">{c.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
