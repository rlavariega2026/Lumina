/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Printer, Send, Check, Download, Trash2 } from 'lucide-react';
import { PhotoItem, GalleryItem, PrintOrderItem } from '../../types/gallery';
import { storageService } from '../../services/storage';

interface PrintSelectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPhotos: PhotoItem[];
  gallery: GalleryItem;
  onTogglePrintSelected: (photoId: string) => void;
}

export const PrintSelectionDrawer: React.FC<PrintSelectionDrawerProps> = ({
  isOpen,
  onClose,
  selectedPhotos,
  gallery,
  onTogglePrintSelected,
}) => {
  const [itemsConfig, setItemsConfig] = useState<
    Record<string, { size: PrintOrderItem['size']; quantity: number; notes: string }>
  >({});
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const getSizePrice = (size: string) => {
    switch (size) {
      case '10x15':
        return 25;
      case '15x20':
        return 45;
      case '20x30':
        return 90;
      case '30x40':
        return 180;
      case 'Canvas 40x60':
        return 450;
      default:
        return 30;
    }
  };

  const calculateTotal = () => {
    return selectedPhotos.reduce((sum, p) => {
      const cfg = itemsConfig[p.id] || { size: '15x20', quantity: 1 };
      return sum + getSizePrice(cfg.size) * (cfg.quantity || 1);
    }, 0);
  };

  const handleUpdateItem = (
    photoId: string,
    field: 'size' | 'quantity' | 'notes',
    value: unknown
  ) => {
    setItemsConfig((prev) => ({
      ...prev,
      [photoId]: {
        size: prev[photoId]?.size || '15x20',
        quantity: prev[photoId]?.quantity || 1,
        notes: prev[photoId]?.notes || '',
        [field]: value,
      },
    }));
  };

  const handleSendOrder = async () => {
    const orderItems: PrintOrderItem[] = selectedPhotos.map((p) => {
      const cfg = itemsConfig[p.id] || { size: '15x20', quantity: 1, notes: '' };
      return {
        photoId: p.id,
        photoName: p.title || p.name,
        thumbnailUrl: p.thumbnailUrl || p.previewUrl,
        size: cfg.size,
        quantity: cfg.quantity,
        notes: cfg.notes,
      };
    });

    const order = {
      id: 'ord_' + Math.random().toString(36).substring(2, 8),
      galleryId: gallery.id,
      clientName: clientName.trim() || gallery.clientName,
      clientEmail: clientContact.trim() || 'cliente@ejemplo.com',
      items: orderItems,
      totalPrice: calculateTotal(),
      status: 'pendiente' as const,
      createdAt: new Date().toISOString(),
    };

    await storageService.saveOrder(order);
    setSubmitted(true);

    // Optional direct WhatsApp formatting
    const summaryLines = orderItems.map(
      (item, i) =>
        `${i + 1}. ${item.photoName} - ${item.size} (Cant: ${item.quantity})${item.notes ? ` [Nota: ${item.notes}]` : ''}`
    );
    const message = encodeURIComponent(
      `¡Hola! Envío mi selección de impresión para "${gallery.eventName}":\n\n${summaryLines.join(
        '\n'
      )}\n\nTotal estimado: $${order.totalPrice} MXN\nCliente: ${order.clientName}`
    );

    if (gallery.clientPhone) {
      window.open(`https://wa.me/?text=${message}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-zinc-900 border-l border-zinc-800 h-full flex flex-col text-zinc-100 shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Selección para Impresión & Álbum</h3>
              <p className="text-xs text-zinc-400">{selectedPhotos.length} fotos seleccionadas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {submitted ? (
            <div className="text-center py-16 space-y-3 p-6 bg-zinc-950 rounded-2xl border border-zinc-800">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-base text-white">¡Selección Enviada con Éxito!</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                El fotógrafo ha recibido tu listado de fotografías para impresión con sus especificaciones de tamaño y cantidades.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="mt-4 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold"
              >
                Volver a la galería
              </button>
            </div>
          ) : selectedPhotos.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 space-y-2">
              <Printer className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-xs">No has seleccionado fotografías para impresión.</p>
              <p className="text-[11px] text-zinc-600">Toca el icono de impresora en las fotos para agregarlas aquí.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {selectedPhotos.map((photo) => {
                  const cfg = itemsConfig[photo.id] || { size: '15x20', quantity: 1, notes: '' };
                  return (
                    <div
                      key={photo.id}
                      className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                          <img src={photo.thumbnailUrl || photo.previewUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-white truncate">{photo.title || photo.name}</h4>
                          <span className="text-[10px] text-zinc-400">{photo.width} × {photo.height} px</span>
                        </div>
                        <button
                          onClick={() => onTogglePrintSelected(photo.id)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 transition"
                          title="Eliminar de la lista"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Print config */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-zinc-400 block mb-1">Tamaño:</label>
                          <select
                            value={cfg.size}
                            onChange={(e) => handleUpdateItem(photo.id, 'size', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-xs"
                          >
                            <option value="10x15">10x15 cm ($25)</option>
                            <option value="15x20">15x20 cm ($45)</option>
                            <option value="20x30">20x30 cm ($90)</option>
                            <option value="30x40">30x40 cm ($180)</option>
                            <option value="Canvas 40x60">Lienzo Canvas 40x60 ($450)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-400 block mb-1">Cantidad:</label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={cfg.quantity}
                            onChange={(e) => handleUpdateItem(photo.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-xs"
                          />
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Nota especial (ej. Portada, Retoque específico...)"
                        value={cfg.notes}
                        onChange={(e) => handleUpdateItem(photo.id, 'notes', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-300 placeholder-zinc-600 outline-none"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Client information for the order */}
              <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2.5 text-xs">
                <h4 className="font-semibold text-white">Datos de Contacto del Cliente</h4>
                <input
                  type="text"
                  placeholder="Tu nombre completo"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white"
                />
                <input
                  type="text"
                  placeholder="Teléfono / WhatsApp o Correo electrónico"
                  value={clientContact}
                  onChange={(e) => setClientContact(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {selectedPhotos.length > 0 && !submitted && (
          <div className="p-5 border-t border-zinc-800 bg-zinc-950/60 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Total estimado ({selectedPhotos.length} fotos):</span>
              <span className="text-sm font-bold text-amber-400 font-mono">${calculateTotal()} MXN</span>
            </div>
            <button
              onClick={handleSendOrder}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
            >
              <Send className="w-4 h-4" />
              <span>Confirmar y Enviar Pedido al Fotógrafo</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
