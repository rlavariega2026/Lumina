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
import { AccountPanel, Login } from './components/admin/Access';
import { Account, sessionAction } from './services/session';
import { loadCloudWorkspace, migrateLocalGalleries } from './services/cloud';

type AppView = 'admin_login' | 'admin_dashboard' | 'gallery_editor' | 'client_view';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('admin_dashboard');
  const [activeGalleryId, setActiveGalleryId] = useState<string>(INITIAL_GALLERY_ID);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [user, setUser] = useState<Account | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [showAccounts, setShowAccounts] = useState(false);
  const [notice, setNotice] = useState('');
  const [migrating, setMigrating] = useState(false);
  const [workspaceRevision, setWorkspaceRevision] = useState(0);
  const publishedRoute = window.location.pathname.match(/\/Lumina\/portafolios\/([a-z0-9-]+\/[a-z0-9-]+)\/?$/)?.[1]
    || new URLSearchParams(window.location.search).get('gallery');

  const openWorkspace = async (account: Account) => {
    setLoadingWorkspace(true);
    try {
      await loadCloudWorkspace();
      await initializeSeedData();
      setUser(account);
      setCurrentView('admin_dashboard');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No se pudo abrir el panel');
    } finally {
      setLoadingWorkspace(false);
    }
  };

  useEffect(() => {
    if (publishedRoute) return;
    const expire = () => { setUser(null); setShowAccounts(false); setCurrentView('admin_login'); };
    window.addEventListener('lav-session-expired', expire);
    void sessionAction('status')
      .then(result => result.user ? openWorkspace(result.user) : setLoadingWorkspace(false))
      .catch(() => setLoadingWorkspace(false));
    return () => window.removeEventListener('lav-session-expired', expire);
  }, [publishedRoute]);

  const handleLogout = async () => {
    try {
      await sessionAction('logout', {});
      window.dispatchEvent(new Event('lav-session-expired'));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No se pudo cerrar sesión');
    }
  };

  if (publishedRoute) return <ClientGalleryView galleryId={publishedRoute} publicRoute={publishedRoute} />;
  if (loadingWorkspace) return <main className="p-8 text-zinc-100">Cargando Lumina…</main>;
  if (!user) return <><Login onLogin={account => void openWorkspace(account)} />{notice && <p role="alert">{notice}</p>}</>;
  if (currentView === 'client_view') {
    return <ClientGalleryView galleryId={activeGalleryId} isPreviewMode={isPreviewMode}
      onBackToAdmin={() => setCurrentView(isPreviewMode ? 'gallery_editor' : 'admin_dashboard')} />;
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

      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 pt-4 text-xs">
        <button disabled={migrating} onClick={async () => {
          setMigrating(true);
          try {
            const result = await migrateLocalGalleries(setNotice);
            setNotice(`Galerías copiadas: ${result.copied}. Ya guardadas: ${result.skipped}.`);
            setCurrentView('admin_dashboard');
            setWorkspaceRevision(value => value + 1);
          } catch (error) {
            setNotice(error instanceof Error ? error.message : 'No se pudo completar la copia');
          } finally { setMigrating(false); }
        }} className="rounded-xl border border-zinc-700 px-3 py-2">Copiar galerías de este navegador</button>
        {user.role === 'superadmin' && <button onClick={() => setShowAccounts(true)} className="rounded-xl border border-zinc-700 px-3 py-2">Administración de usuarios</button>}
        {notice && <p role="status">{notice}</p>}
      </div>
      {showAccounts && user.role === 'superadmin' && <div className="text-zinc-900"><AccountPanel onClose={() => setShowAccounts(false)} /></div>}
      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentView === 'admin_dashboard' && (
          <AdminDashboard
            key={workspaceRevision}
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
