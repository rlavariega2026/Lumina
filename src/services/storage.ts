/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GalleryItem, PhotoItem, ClientProfile, PrintOrder } from '../types/gallery';

const DB_NAME = 'lumina_studio_db';
const DB_VERSION = 1;

// Stores:
// 'galleries' -> key: id
// 'photos' -> key: id, index: galleryId
// 'photo_blobs' -> key: id, value: { id, originalBlob: Blob, previewBlob: Blob, thumbBlob: Blob }
// 'clients' -> key: id
// 'orders' -> key: id
// 'settings' -> key: key

class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private blobUrlCache: Map<string, { original: string; preview: string; thumb: string }> = new Map();

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('galleries')) {
          db.createObjectStore('galleries', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('photos')) {
          const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
          photoStore.createIndex('galleryId', 'galleryId', { unique: false });
          photoStore.createIndex('order', 'order', { unique: false });
        }

        if (!db.objectStoreNames.contains('photo_blobs')) {
          db.createObjectStore('photo_blobs', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('clients')) {
          db.createObjectStore('clients', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('orders')) {
          db.createObjectStore('orders', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // --- Galleries ---
  async getGalleries(): Promise<GalleryItem[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('galleries', 'readonly');
      const store = tx.objectStore('galleries');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getGalleryById(id: string): Promise<GalleryItem | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('galleries', 'readonly');
      const store = tx.objectStore('galleries');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async getGalleryBySlug(slug: string): Promise<GalleryItem | null> {
    const galleries = await this.getGalleries();
    return galleries.find((g) => g.slug === slug || g.id === slug) || null;
  }

  async saveGallery(gallery: GalleryItem): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('galleries', 'readwrite');
      const store = tx.objectStore('galleries');
      gallery.updatedAt = new Date().toISOString();
      const req = store.put(gallery);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteGallery(id: string): Promise<void> {
    const db = await this.getDB();
    // Delete associated photos & blobs first
    const photos = await this.getPhotosByGallery(id);
    for (const p of photos) {
      await this.deletePhoto(p.id);
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction('galleries', 'readwrite');
      const store = tx.objectStore('galleries');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async duplicateGallery(id: string, customName?: string, customSlug?: string): Promise<GalleryItem | null> {
    const original = await this.getGalleryById(id);
    if (!original) return null;

    const newId = 'gal_' + Math.random().toString(36).substring(2, 9);
    const finalName = customName?.trim() || `${original.eventName} (Copia)`;
    const newSlug = customSlug?.trim() || `${original.slug}-copia-${Date.now().toString(36)}`;
    const copy: GalleryItem = {
      ...original,
      id: newId,
      slug: newSlug,
      eventName: finalName,
      coverTexts: {
        ...original.coverTexts,
        eventName: {
          ...original.coverTexts.eventName,
          text: finalName,
        },
      },
      isPublished: false,
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

    await this.saveGallery(copy);

    // Duplicate photos as well
    const photos = await this.getPhotosByGallery(id);
    for (const p of photos) {
      const blobs = await this.getPhotoBlobs(p.id);
      const newPhotoId = 'pho_' + Math.random().toString(36).substring(2, 9);
      const newPhoto: PhotoItem = {
        ...p,
        id: newPhotoId,
        galleryId: newId,
        isFavorite: false,
        isPrintSelected: false,
      };

      if (blobs) {
        await this.savePhotoWithBlobs(newPhoto, blobs.originalBlob, blobs.previewBlob, blobs.thumbBlob);
      } else {
        await this.savePhotoRecord(newPhoto);
      }
    }

    return copy;
  }

  // --- Photos ---
  async getPhotosByGallery(galleryId: string): Promise<PhotoItem[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('photos', 'readonly');
      const store = tx.objectStore('photos');
      const index = store.index('galleryId');
      const req = index.getAll(galleryId);
      req.onsuccess = () => {
        const photos: PhotoItem[] = (req.result || []).sort((a, b) => a.order - b.order);
        // Hydrate object URLs from cache or create on demand
        for (const p of photos) {
          const cached = this.blobUrlCache.get(p.id);
          if (cached) {
            p.originalUrl = cached.original;
            p.previewUrl = cached.preview;
            p.thumbnailUrl = cached.thumb;
          }
        }
        resolve(photos);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getPhotoById(id: string): Promise<PhotoItem | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('photos', 'readonly');
      const store = tx.objectStore('photos');
      const req = store.get(id);
      req.onsuccess = () => {
        const photo: PhotoItem | null = req.result || null;
        if (photo) {
          const cached = this.blobUrlCache.get(photo.id);
          if (cached) {
            photo.originalUrl = cached.original;
            photo.previewUrl = cached.preview;
            photo.thumbnailUrl = cached.thumb;
          }
        }
        resolve(photo);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async savePhotoRecord(photo: PhotoItem): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('photos', 'readwrite');
      const store = tx.objectStore('photos');
      const req = store.put(photo);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async savePhotoWithBlobs(
    photo: PhotoItem,
    originalBlob: Blob,
    previewBlob: Blob,
    thumbBlob: Blob
  ): Promise<void> {
    const db = await this.getDB();

    // Store binary blobs in photo_blobs store
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('photo_blobs', 'readwrite');
      const store = tx.objectStore('photo_blobs');
      const req = store.put({
        id: photo.id,
        originalBlob,
        previewBlob,
        thumbBlob,
      });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Revoke previous URLs if any
    const oldCached = this.blobUrlCache.get(photo.id);
    if (oldCached) {
      URL.revokeObjectURL(oldCached.original);
      URL.revokeObjectURL(oldCached.preview);
      URL.revokeObjectURL(oldCached.thumb);
    }

    // Create fresh object URLs
    const originalUrl = URL.createObjectURL(originalBlob);
    const previewUrl = URL.createObjectURL(previewBlob);
    const thumbUrl = URL.createObjectURL(thumbBlob);

    this.blobUrlCache.set(photo.id, {
      original: originalUrl,
      preview: previewUrl,
      thumb: thumbUrl,
    });

    photo.originalUrl = originalUrl;
    photo.previewUrl = previewUrl;
    photo.thumbnailUrl = thumbUrl;

    await this.savePhotoRecord(photo);
  }

  async getPhotoBlobs(id: string): Promise<{
    originalBlob: Blob;
    previewBlob: Blob;
    thumbBlob: Blob;
  } | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('photo_blobs', 'readonly');
      const store = tx.objectStore('photo_blobs');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async loadPhotoBlobsIntoUrls(photo: PhotoItem): Promise<PhotoItem> {
    if (this.blobUrlCache.has(photo.id)) {
      const cached = this.blobUrlCache.get(photo.id)!;
      photo.originalUrl = cached.original;
      photo.previewUrl = cached.preview;
      photo.thumbnailUrl = cached.thumb;
      return photo;
    }

    const blobs = await this.getPhotoBlobs(photo.id);
    if (blobs) {
      const originalUrl = URL.createObjectURL(blobs.originalBlob);
      const previewUrl = URL.createObjectURL(blobs.previewBlob);
      const thumbUrl = URL.createObjectURL(blobs.thumbBlob);
      this.blobUrlCache.set(photo.id, {
        original: originalUrl,
        preview: previewUrl,
        thumb: thumbUrl,
      });
      photo.originalUrl = originalUrl;
      photo.previewUrl = previewUrl;
      photo.thumbnailUrl = thumbUrl;
    }
    return photo;
  }

  async deletePhoto(id: string): Promise<void> {
    const db = await this.getDB();
    const cached = this.blobUrlCache.get(id);
    if (cached) {
      URL.revokeObjectURL(cached.original);
      URL.revokeObjectURL(cached.preview);
      URL.revokeObjectURL(cached.thumb);
      this.blobUrlCache.delete(id);
    }

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['photos', 'photo_blobs'], 'readwrite');
      tx.objectStore('photos').delete(id);
      tx.objectStore('photo_blobs').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async reorderPhotos(galleryId: string, orderedPhotoIds: string[]): Promise<void> {
    const photos = await this.getPhotosByGallery(galleryId);
    const photoMap = new Map(photos.map((p) => [p.id, p]));

    for (let i = 0; i < orderedPhotoIds.length; i++) {
      const p = photoMap.get(orderedPhotoIds[i]);
      if (p) {
        p.order = i;
        await this.savePhotoRecord(p);
      }
    }
  }

  // --- Clients ---
  async getClients(): Promise<ClientProfile[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('clients', 'readonly');
      const store = tx.objectStore('clients');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async saveClient(client: ClientProfile): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('clients', 'readwrite');
      const store = tx.objectStore('clients');
      const req = store.put(client);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Orders ---
  async getOrders(): Promise<PrintOrder[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('orders', 'readonly');
      const store = tx.objectStore('orders');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async saveOrder(order: PrintOrder): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('orders', 'readwrite');
      const store = tx.objectStore('orders');
      const req = store.put(order);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- App Settings (e.g. Admin password, Studio Profile) ---
  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result?.value ?? defaultValue);
      req.onerror = () => resolve(defaultValue);
    });
  }

  async setSetting(key: string, value: unknown): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const req = store.put({ key, value });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Increment Stats Safely ---
  async incrementStat(galleryId: string, statName: keyof GalleryItem['stats']): Promise<void> {
    const gallery = await this.getGalleryById(galleryId);
    if (!gallery) return;

    if (!gallery.stats) {
      gallery.stats = {
        views: 0,
        uniqueVisitors: 0,
        downloadsCount: 0,
        zipDownloadsCount: 0,
        sharesCount: 0,
        favoritesCount: 0,
      };
    }

    if (typeof gallery.stats[statName] === 'number') {
      (gallery.stats[statName] as number)++;
    }
    gallery.stats.lastVisited = new Date().toISOString();
    await this.saveGallery(gallery);
  }

  // --- Full Database Export for Backup / Hostinger Migration ---
  async exportBackup(): Promise<string> {
    const galleries = await this.getGalleries();
    const clients = await this.getClients();
    const orders = await this.getOrders();
    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      galleries,
      clients,
      orders,
    };
    return JSON.stringify(backupData, null, 2);
  }
}

export const storageService = new StorageService();
