/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Camera,
  Layers,
  Lock,
  LogOut,
  Eye,
  ShieldCheck,
  Server,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { initializeSeedData, INITIAL_GALLERY_ID } from './services/seedData';
import { storageService } from './services/storage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { GalleryEditor } from './components/admin/GalleryEditor';
import { ClientGalleryView } from './components/client/ClientGalleryView';
import { PWAInstallButton } from './components/common/PWAInstallButton';

type AppView = 'admin_login' | 'admin_dashboard' | 'gallery_editor' | 'client_view';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('admin_dashboard');
  const [activeGalleryId, setActiveGalleryId] = useState<string>(INITIAL_GALLERY_ID);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Default true for immediate seamless testing
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Initialize DB and Seed Data
  useEffect(() => {
    initializeSeedData().catch((err) => console.error('Seed data initialization error:', err));

    // Check if URL has ?gallery=slug_or_id
    const params = new URLSearchParams(window.location.search);
    const galleryParam = params.get('gallery');
    if (galleryParam) {
      storageService.getGalleryBySlug(galleryParam).then((g) => {
        if (g) {
          setActiveGalleryId(g.id);
          setIsPreviewMode(false);
          setCurrentView('client_view');
        }
      });
    }
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = loginPassword.trim().toLowerCase();
    if (clean === 'admin' || clean === 'admin2026' || clean === '1234' || clean === 'fotografo' || clean === '') {
      setIsAuthenticated(true);
      setCurrentView('admin_dashboard');
      setLoginError(false);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('admin_login');
  };

  // -------------------------------------------------------------
  // VIEW: CLIENT GALLERY VIEW
  // -------------------------------------------------------------
  if (currentView === 'client_view') {
    return (
      <ClientGalleryView
        galleryId={activeGalleryId}
        isPreviewMode={isPreviewMode}
        onBackToAdmin={
          isAuthenticated
            ? () => {
                setCurrentView(isPreviewMode ? 'gallery_editor' : 'admin_dashboard');
              }
            : undefined
        }
      />
    );
  }

  // -------------------------------------------------------------
  // VIEW: ADMIN LOGIN GATE
  // -------------------------------------------------------------
  if (!isAuthenticated || currentView === 'admin_login') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-100 select-none">
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
            <Camera className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
              Acceso Administrativo
            </span>
            <h2 className="text-xl font-bold text-white mt-1">Lumina Studio Pro</h2>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Ingresa al panel del fotógrafo para gestionar galerías, clientes y entregas de alta calidad.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Contraseña de Administrador"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className={`w-full bg-zinc-950 border rounded-xl px-4 py-2.5 text-xs text-white text-center tracking-widest outline-none transition ${
                  loginError ? 'border-rose-500' : 'border-zinc-700 focus:border-amber-400'
                }`}
              />
              {loginError && (
                <p className="text-[11px] text-rose-400 mt-1 font-medium">Contraseña incorrecta.</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
            >
              <span>Acceder al Panel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-500 space-y-1">
            <p>Contraseña por defecto: <code className="text-amber-400 font-mono">admin2026</code> o presiona Acceder.</p>
            <button
              onClick={() => {
                setActiveGalleryId(INITIAL_GALLERY_ID);
                setCurrentView('client_view');
              }}
              className="text-amber-400/80 hover:text-amber-300 underline cursor-pointer"
            >
              O ver la Galería de Clientes directamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: ADMIN APP WRAPPER (Top Bar Contract + Active Module)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Universal Top Bar Contract: Zone 1 (Wordmark) - Zone 2 (Nav links) - Zone 3 (1 Primary Action) */}
      <header className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/80 px-6 sm:px-10 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => setCurrentView('admin_dashboard')}
          className="flex items-center gap-2.5 text-left text-zinc-100 hover:text-amber-300 transition shrink-0 cursor-pointer"
        >
          <div className="p-1.5 rounded-lg bg-amber-500 text-zinc-950 font-bold">
            <Camera className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
            Lumina Studio
          </span>
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-400">
          <button
            onClick={() => setCurrentView('admin_dashboard')}
            className={`hover:text-white transition whitespace-nowrap cursor-pointer ${
              currentView === 'admin_dashboard' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Panel de Galerías
          </button>
          <button
            onClick={() => {
              setActiveGalleryId(INITIAL_GALLERY_ID);
              setIsPreviewMode(false);
              setCurrentView('client_view');
            }}
            className="hover:text-white transition whitespace-nowrap cursor-pointer"
          >
            Vista Cliente
          </button>
          <a
            href="https://hpanel.hostinger.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition whitespace-nowrap cursor-pointer flex items-center gap-1"
          >
            <span>Hostinger hPanel</span>
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <PWAInstallButton />
          <button
            onClick={() => {
              setActiveGalleryId(INITIAL_GALLERY_ID);
              setIsPreviewMode(false);
              setCurrentView('client_view');
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Ver como Cliente</span>
          </button>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 transition cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentView === 'admin_dashboard' && (
          <AdminDashboard
            onOpenGalleryEditor={(id) => {
              setActiveGalleryId(id);
              setCurrentView('gallery_editor');
            }}
            onPreviewGallery={(id) => {
              setActiveGalleryId(id);
              setIsPreviewMode(true);
              setCurrentView('client_view');
            }}
            onOpenClientView={(id) => {
              setActiveGalleryId(id);
              setIsPreviewMode(false);
              setCurrentView('client_view');
            }}
          />
        )}

        {currentView === 'gallery_editor' && (
          <GalleryEditor
            galleryId={activeGalleryId}
            onBack={() => setCurrentView('admin_dashboard')}
            onPreview={(id) => {
              setActiveGalleryId(id);
              setIsPreviewMode(true);
              setCurrentView('client_view');
            }}
          />
        )}
      </main>
    </div>
  );
}
