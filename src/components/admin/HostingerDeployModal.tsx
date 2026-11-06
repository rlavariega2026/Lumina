/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Server,
  Download,
  Copy,
  Check,
  FileCode,
  FolderTree,
  ShieldCheck,
  HelpCircle,
  X,
  ExternalLink,
} from 'lucide-react';
import JSZip from 'jszip';
import { storageService } from '../../services/storage';
import { ZipDownloadService } from '../../services/zipService';

interface HostingerDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HostingerDeployModal: React.FC<HostingerDeployModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [subfolderPath, setSubfolderPath] = useState('');
  const [copiedHtaccess, setCopiedHtaccess] = useState(false);
  const [downloadingPack, setDownloadingPack] = useState(false);

  if (!isOpen) return null;

  const baseRewrite = subfolderPath.trim()
    ? `/${subfolderPath.trim().replace(/^\/+|\/+$/g, '')}/`
    : '/';

  const htaccessContent = `# ========================================================
# ARCHIVO DE CONFIGURACIÓN APACHE / HOSTINGER (hPanel)
# Plataforma Lumina Studio - Galerías Fotográficas Digitales
# ========================================================

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase ${baseRewrite}

  # Forzar conexión segura HTTPS
  RewriteCond %{HTTPS} !=on
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # Evitar reescribir si el archivo, directorio o enlace físico existe
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Redireccionar todas las rutas de la SPA hacia index.html
  RewriteRule ^ index.html [L]
</IfModule>

# Habilitar compresión Gzip para carga ultrarrápida de fotografías y scripts
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json image/svg+xml
</IfModule>

# Encabezados de caché para optimizar el rendimiento del servidor
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
`;

  const copyHtaccess = async () => {
    try {
      await navigator.clipboard.writeText(htaccessContent);
      setCopiedHtaccess(true);
      setTimeout(() => setCopiedHtaccess(false), 2500);
    } catch {
      // ignore
    }
  };

  const downloadHtaccess = () => {
    const blob = new Blob([htaccessContent], { type: 'text/plain;charset=utf-8' });
    ZipDownloadService.triggerDownload(blob, '.htaccess');
  };

  const downloadFullDeployPackage = async () => {
    setDownloadingPack(true);
    try {
      const zip = new JSZip();

      // 1. .htaccess
      zip.file('.htaccess', htaccessContent);

      // 2. Comprehensive manual in Spanish
      const instructions = `================================================================================
GUÍA COMPLETA DE INSTALACIÓN Y PUBLICACIÓN EN HOSTINGER
LUMINA STUDIO - PLATAFORMA PROFESIONAL DE GALERÍAS FOTOGRÁFICAS
================================================================================

A. ARQUITECTURA Y CARPETA DE PUBLICACIÓN
--------------------------------------------------------------------------------
1. Tecnología: React + Vite + TypeScript.
2. Carpeta de producción lista para subir: "dist" (obtenida tras ejecutar "npm run build").
3. Modo de almacenamiento: Almacenamiento local de alta capacidad (IndexedDB / Blobs en cliente)
   que permite funcionamiento 100% independiente en Hosting Compartido de Hostinger sin necesidad
   de contratar un servidor Node.js o VPS costoso, ni configurar bases de datos complejas.
   Las fotos de alta resolución se procesan y almacenan con máxima fidelidad.

B. PASO A PASO PARA SUBIR A HOSTINGER MEDIANTE EL ADMINISTRADOR DE ARCHIVOS
--------------------------------------------------------------------------------
Paso 1: Accede al panel de control de Hostinger (hPanel: https://hpanel.hostinger.com).
Paso 2: En la sección "Sitios web" o "Hosting", haz clic en "Administrar" en tu dominio.
Paso 3: Busca la herramienta "Administrador de archivos" (File Manager) y ábrela.
Paso 4: Entra a la carpeta de tu dominio: generalmente "public_html/".
Paso 5: Decide dónde alojar la plataforma:
   - Opción A (Raíz del dominio, ej: https://tudominio.com): Trabaja dentro de "public_html/".
   - Opción B (Subcarpeta, ej: https://tudominio.com/galerias/): Crea la carpeta "galerias"
     dentro de "public_html/" y entra en ella.
Paso 6: En tu computadora local, ejecuta en la terminal:
     npm run build
   Esto creará la carpeta "dist/" con todos los archivos compilados optimizados (HTML, JS, CSS, iconos).
Paso 7: Comprime el contenido de la carpeta "dist" en un archivo ZIP y súbelo al Administrador
   de Archivos de Hostinger con el botón "Subir" (Upload).
Paso 8: Haz clic derecho sobre el archivo ZIP subido en Hostinger y selecciona "Extraer" (Extract).
   Verifica que "index.html" quede directamente en la carpeta donde quieres que abra la web.
Paso 9: Sube el archivo ".htaccess" incluido en este paquete a la misma carpeta donde está "index.html".
   (Este archivo garantiza que al recargar páginas como /galeria/... no se produzca error 404).
Paso 10: Activa el Certificado SSL gratuito en hPanel -> Seguridad -> SSL -> "Forzar HTTPS".
Paso 11: Abre tu dominio en el navegador (en PC, iPhone y Android) y comprueba el funcionamiento.

C. PUBLICACIÓN MEDIANTE CLIENTE FTP (FILEZILLA)
--------------------------------------------------------------------------------
Si prefieres usar FTP:
1. En hPanel, ve a "Cuentas FTP" y copia: Servidor/Host, Usuario FTP y Puerto (normalmente 21).
2. Abre FileZilla en tu computadora y conéctate.
3. En el panel remoto, navega hasta "/public_html".
4. En el panel local, selecciona todos los archivos que están DENTRO de "dist/" y el ".htaccess".
5. Arrástralos a la carpeta remota y espera a que termine la transferencia.

D. RESPALDO Y ACTUALIZACIONES
--------------------------------------------------------------------------------
- Para actualizar: simplemente ejecuta "npm run build" y reemplaza los archivos en Hostinger.
- Para respaldar tus galerías: utiliza el botón "Exportar Copia de Seguridad" en el Panel de Lumina Studio.

Soporte y Garantía: Lumina Studio Digital Galleries.
`;
      zip.file('GUIA_HOSTINGER_PASO_A_PASO.txt', instructions);

      // 3. Database backup
      const backupJson = await storageService.exportBackup();
      zip.file('RESPALDO_GALERIAS_DATABASE.json', backupJson);

      const blob = await zip.generateAsync({ type: 'blob' });
      ZipDownloadService.triggerDownload(blob, 'LuminaStudio_Paquete_Hostinger.zip');
    } finally {
      setDownloadingPack(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">
                Guía y Paquete de Despliegue en Hostinger (hPanel / FTP)
              </h3>
              <p className="text-xs text-zinc-400">
                Instrucciones paso a paso, configuración .htaccess de rutas limpias y descarga del paquete de producción.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Architecture banner */}
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-zinc-300 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300 mb-1">
                Compatibilidad total con Planes Compartidos de Hostinger
              </p>
              <p className="text-zinc-400 leading-relaxed">
                La aplicación compila a una suite estática ultrarrápida (HTML5, JavaScript ES2022, CSS3 y Web Workers)
                con almacenamiento de datos y fotografías de alta resolución en el cliente mediante IndexedDB y Blobs.
                No requiere configurar Node.js en Hostinger compartido, permitiéndote alojarla en cualquier plan básico o premium.
              </p>
            </div>
          </div>

          {/* Quick download action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <div>
              <h4 className="font-semibold text-zinc-200 text-sm">Descargar Paquete de Despliegue para Hostinger</h4>
              <p className="text-xs text-zinc-400">
                Incluye el archivo .htaccess preconfigurado, el manual completo en texto y el archivo de respaldo de tus galerías.
              </p>
            </div>
            <button
              onClick={downloadFullDeployPackage}
              disabled={downloadingPack}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg text-xs transition shadow cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>{downloadingPack ? 'Generando ZIP...' : 'Descargar Paquete Hostinger'}</span>
            </button>
          </div>

          {/* Configuration for root or subfolder */}
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-200 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-amber-400" />
              <span>1. ¿Dónde publicarás la aplicación en tu dominio?</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSubfolderPath('')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  subfolderPath === ''
                    ? 'border-amber-400 bg-amber-500/10 text-white'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="font-semibold text-xs mb-1">En la raíz del dominio</div>
                <div className="text-[11px] font-mono text-zinc-400">https://tudominio.com/</div>
                <div className="text-[10px] text-zinc-500 mt-1">Carpeta: public_html/</div>
              </button>

              <button
                type="button"
                onClick={() => setSubfolderPath('galerias')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  subfolderPath !== ''
                    ? 'border-amber-400 bg-amber-500/10 text-white'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="font-semibold text-xs mb-1">En una subcarpeta</div>
                <div className="text-[11px] font-mono text-zinc-400">https://tudominio.com/galerias/</div>
                <div className="text-[10px] text-zinc-500 mt-1">Carpeta: public_html/galerias/</div>
              </button>
            </div>
          </div>

          {/* .htaccess code preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-zinc-200 text-xs flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-400" />
                <span>2. Archivo .htaccess para Hostinger (Apache)</span>
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyHtaccess}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 hover:text-white transition cursor-pointer"
                >
                  {copiedHtaccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
                <button
                  onClick={downloadHtaccess}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded border border-amber-500/30 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .htaccess</span>
                </button>
              </div>
            </div>
            <pre className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-300 overflow-x-auto max-h-48 leading-relaxed">
              {htaccessContent}
            </pre>
          </div>

          {/* Step by step summary */}
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-200 text-xs flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>3. Pasos para instalar en Hostinger</span>
            </h4>
            <div className="space-y-2 text-xs text-zinc-300">
              <div className="flex gap-2.5">
                <span className="font-bold text-amber-400">1.</span>
                <span>Ejecuta <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-amber-300">npm run build</code> en la terminal de tu proyecto. Se generará la carpeta <strong className="text-white">dist/</strong>.</span>
              </div>
              <div className="flex gap-2.5">
                <span className="font-bold text-amber-400">2.</span>
                <span>Ingresa al panel de Hostinger <strong className="text-white">(hPanel)</strong> y abre el <strong className="text-white">Administrador de archivos</strong>.</span>
              </div>
              <div className="flex gap-2.5">
                <span className="font-bold text-amber-400">3.</span>
                <span>Abre la carpeta <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-200">public_html/</code> (o crea la subcarpeta deseada).</span>
              </div>
              <div className="flex gap-2.5">
                <span className="font-bold text-amber-400">4.</span>
                <span>Sube todos los archivos contenidos DENTRO de <strong className="text-white">dist/</strong> y coloca el archivo <strong className="text-white">.htaccess</strong> en el mismo directorio.</span>
              </div>
              <div className="flex gap-2.5">
                <span className="font-bold text-amber-400">5.</span>
                <span>Comprueba que <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-200">index.html</code> esté en el nivel correcto. ¡Tu aplicación ya estará funcionando en vivo!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-zinc-800 bg-zinc-950/60">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Cerrar Guía
          </button>
        </div>
      </div>
    </div>
  );
};
