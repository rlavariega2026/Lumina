import { useState } from 'react';
import type { GalleryItem, GalleryPublication } from '../../types/gallery';
import { publishGallery, syncGallery } from '../../services/cloud';

function folder(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function PublishGallery({ gallery, onPublished, onClose }: {
  gallery: GalleryItem; onPublished: (publication: GalleryPublication) => Promise<void>; onClose: () => void;
}) {
  const [client, setClient] = useState(gallery.publication?.client || folder(gallery.clientName));
  const [slug, setSlug] = useState(gallery.publication?.slug || folder(gallery.slug || gallery.eventName));
  const [publication, setPublication] = useState(gallery.publication);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function publish(mode: 'demo' | 'final') {
    if (!folder(client) || !folder(slug)) { setMessage('Escribe ambas carpetas de publicación.'); return; }
    const confirm = mode === 'demo' && publication?.mode === 'final';
    if (confirm && !window.confirm('¿Reemplazar la versión definitiva por una DEMO?')) return;
    setBusy(true);
    setMessage('');
    try {
      await syncGallery(gallery);
      const result = await publishGallery(gallery.id, folder(client), folder(slug), mode, confirm);
      setPublication(result.publication);
      await onPublished(result.publication);
      setMessage(mode === 'demo' ? 'DEMO publicada.' : 'Versión definitiva publicada.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo publicar.');
    } finally { setBusy(false); }
  }
  return <div role="dialog" aria-modal="true" aria-label="Publicar galería en Hostinger" className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4">
    <section className="w-full max-w-lg space-y-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-5 text-zinc-100">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Publicar galería en Hostinger</h2>
        <button onClick={onClose} disabled={busy} className="underline">Cerrar</button>
      </div>
      <label className="block text-sm">Carpeta del cliente<input value={client} onChange={e=>setClient(e.target.value)} className="mt-1 w-full rounded-lg bg-zinc-800 px-3 py-2" /></label>
      <label className="block text-sm">Carpeta de la publicación<input value={slug} onChange={e=>setSlug(e.target.value)} className="mt-1 w-full rounded-lg bg-zinc-800 px-3 py-2" /></label>
      <div className="flex flex-wrap gap-2">
        <button disabled={busy} onClick={()=>void publish('demo')} className="rounded-xl bg-violet-700 px-3 py-2 font-semibold">Publicar DEMO en Hostinger</button>
        <button disabled={busy} onClick={()=>void publish('final')} className="rounded-xl bg-amber-400 px-3 py-2 font-semibold text-zinc-950">Publicar definitiva</button>
      </div>
      {busy && <p role="status">Guardando archivos y publicando…</p>}
      {message && <p role="status" className="break-words text-sm">{message}</p>}
      {publication && <>
        <input aria-label="Enlace para clientes" value={publication.url} readOnly onFocus={event=>event.target.select()} className="w-full rounded-lg bg-zinc-800 px-2 py-2 text-sm" />
        <div className="flex gap-4 text-sm">
          <a href={publication.url} target="_blank" rel="noopener noreferrer" className="underline">Abrir publicación</a>
          <button className="underline" onClick={async ()=>{try { await navigator.clipboard.writeText(publication.url); setMessage('Enlace copiado.'); } catch { setMessage('Selecciona el enlace para copiarlo.'); }}}>Copiar enlace</button>
        </div>
      </>}
    </section>
  </div>;
}
