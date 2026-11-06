/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Users, Plus, Mail, Phone, Calendar, Search, Trash2 } from 'lucide-react';
import { ClientProfile, GalleryItem } from '../../types/gallery';
import { storageService } from '../../services/storage';

interface ClientManagerProps {
  galleries: GalleryItem[];
}

export const ClientManager: React.FC<ClientManagerProps> = ({ galleries }) => {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const loadClients = async () => {
    const list = await storageService.getClients();
    setClients(list);
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const newClient: ClientProfile = {
      id: 'cli_' + Math.random().toString(36).substring(2, 8),
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await storageService.saveClient(newClient);
    setName('');
    setEmail('');
    setPhone('');
    setNotes('');
    setShowAddModal(false);
    loadClients();
  };

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-400"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition cursor-pointer shadow shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nuevo Cliente</span>
        </button>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((client) => {
          const clientGalleries = galleries.filter(
            (g) =>
              g.clientEmail?.toLowerCase() === client.email.toLowerCase() ||
              g.clientName.toLowerCase().includes(client.name.toLowerCase())
          );

          return (
            <div
              key={client.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-white text-sm">{client.name}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {client.notes && (
                <p className="text-xs text-zinc-400 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 leading-relaxed">
                  {client.notes}
                </p>
              )}

              {/* Linked Galleries count */}
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                <span>Galerías vinculadas:</span>
                <span className="font-bold text-amber-400">{clientGalleries.length}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add Client */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-zinc-100 shadow-2xl animate-in fade-in">
            <h3 className="font-bold text-base text-white mb-4">Registrar Nuevo Cliente</h3>
            <form onSubmit={handleAddClient} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Mariana Gómez & Diego Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  required
                  placeholder="cliente@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Teléfono / WhatsApp:</label>
                <input
                  type="tel"
                  placeholder="+52 55 ..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Notas del Paquete o Evento:</label>
                <textarea
                  rows={2}
                  placeholder="Detalles del paquete contratado..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
