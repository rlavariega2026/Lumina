import { sessionFetch } from './session';
import { legacyStorage, storageService } from './storage';
import type { GalleryItem, PhotoItem, GalleryPublication } from '../types/gallery';

export const apiUrl = (r: string, params: Record<string, string> = {}) =>
  `${import.meta.env.BASE_URL}api.php?${new URLSearchParams({ r, ...params })}`;

async function request<T>(route: string, params: Record<string, string> = {}, init?: RequestInit): Promise<T> {
  const response = await sessionFetch(apiUrl(route, params), init);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Hostinger respondió HTTP ${response.status}`);
  return result;
}

function json(method: string, data?: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) };
}

async function digest(data: ArrayBuffer) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)), n => n.toString(16).padStart(2, '0')).join('');
}

async function upload(blob: Blob) {
  const hash = await digest(await blob.arrayBuffer());
  const existing = await request<{ url: string | null }>('uploaded', { hash });
  if (existing.url) return existing.url;
  const blockSize = 512 * 1024;
  const count = Math.ceil(blob.size / blockSize);
  for (let index = 0; index < count; index++) {
    const data = await blob.slice(index * blockSize, (index + 1) * blockSize).arrayBuffer();
    const checksum = await digest(data);
    for (let attempt = 1; ; attempt++) {
      try {
        await request('chunk', { hash, checksum, index: String(index) }, { method: 'POST', body: data });
        break;
      } catch (error) {
        if (attempt >= 3) throw error;
      }
    }
  }
  return (await request<{ url: string }>('finish', {}, json('POST', { hash, count }))).url;
}

async function storedAsset(url: string) {
  if (/^\/Lumina\/api\.php\?r=asset&name=/.test(url)) return url;
  const response = await fetch(url);
  if (!response.ok) throw new Error('No se pudo recuperar una fotografía original.');
  return upload(await response.blob());
}

interface Project {
  gallery: GalleryItem;
  photos: PhotoItem[];
}

async function collect(gallery: GalleryItem, source: typeof storageService) {
  const photos = await source.getPhotosByGallery(gallery.id);
  const records: PhotoItem[] = [];
  for (const photo of photos) {
    const blobs = await source.getPhotoBlobs(photo.id);
    const hydrated = blobs ? photo : await source.loadPhotoBlobsIntoUrls(photo);
    const originalUrl = blobs ? await upload(blobs.originalBlob) : await storedAsset(hydrated.originalUrl);
    const previewUrl = blobs ? await upload(blobs.previewBlob) : await storedAsset(hydrated.previewUrl);
    const thumbnailUrl = blobs ? await upload(blobs.thumbBlob) : await storedAsset(hydrated.thumbnailUrl);
    records.push({ ...photo, originalUrl, previewUrl, thumbnailUrl });
  }
  return records;
}

export async function syncGallery(gallery: GalleryItem, source = storageService, migration = false) {
  const photos = await collect(gallery, source);
  // Browser object URLs expire, so other browsers need a portable gallery configuration.
  const clean = JSON.parse(await portableJson(gallery)) as GalleryItem;
  await request('projects', { id: gallery.id }, json('PUT', { gallery: clean, photos, migration }));
  return { gallery: clean, photos };
}

async function portableJson(value: GalleryItem) {
  const body = JSON.stringify(value);
  const urls = [...new Set(body.match(/blob:[^"\s]+/g) || [])];
  let output = body;
  for (const url of urls) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Vuelve a seleccionar el logo o audio para completar el guardado.');
    const blob = await response.blob();
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    output = output.replaceAll(url, data);
  }
  return output;
}

export async function loadCloudWorkspace() {
  const { projects } = await request<{ projects: Project[] }>('projects');
  for (const packet of projects) {
    const local = await storageService.getGalleryById(packet.gallery.id);
    if (local && local.updatedAt > packet.gallery.updatedAt && !packet.gallery.publication) continue;
    await storageService.restoreCloudProject(packet.gallery, packet.photos);
  }
}

export async function migrateLocalGalleries(report: (text: string) => void) {
  const local = await legacyStorage.getGalleries();
  const { projects } = await request<{ projects: Project[] }>('projects');
  const uploaded = new Set(projects.map(project => project.gallery.id));
  if (!local.length) return { copied: 0, skipped: 0 };
  let copied = 0;
  let skipped = 0;
  for (const gallery of local) {
    if (uploaded.has(gallery.id)) { skipped++; continue; }
    report(`Copiando ${gallery.eventName}…`);
    await syncGallery(gallery, legacyStorage, true);
    copied++;
  }
  await loadCloudWorkspace();
  return { copied, skipped };
}

export const deleteCloudGallery = (id: string) => request('projects', { id }, json('DELETE'));
export const publishGallery = (id: string, client: string, slug: string, mode: 'demo' | 'final', confirm: boolean) =>
  request<{ publication: GalleryPublication }>('publish', { id }, json('POST', { client, slug, mode, confirm }));

export async function readPublicGallery(route: string, pin?: string) {
  const response = await fetch(apiUrl('public', { gallery: route }), { cache: 'no-store', ...(pin === undefined ? {} : json('POST', { pin })) });
  const result = await response.json();
  if (response.status === 423) return result as { locked: true; name: string };
  if (!response.ok) throw new Error(result.error || 'Galería no disponible');
  return result as Project & { mode: 'demo' | 'final'; url: string };
}
