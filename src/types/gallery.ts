/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TemplateId =
  | 'bodas_elegance'
  | 'bodas_botanica'
  | 'graduacion_gold'
  | 'graduacion_moderna'
  | 'lifestyle'
  | 'friends_memories'
  | 'business_corporate'
  | 'business_luxury'
  | 'xv_princess'
  | 'xv_royal'
  | 'infantil_dreams'
  | 'infantil_adventure'
  | 'escolar_yearbook'
  | 'escolar_memories'
  | 'birthday_party'
  | 'sweet_sixteen'
  | 'travel_explorer'
  | 'travel_cinematic'
  | 'family_moments'
  | 'maternity_baby';

export type ModalityId =
  | 'classic_grid'
  | 'asymmetric_mosaic'
  | 'horizontal_carousel'
  | 'vertical_feed'
  | 'editorial_album'
  | 'digital_book'
  | 'filmstrip'
  | 'masonry'
  | 'fullscreen_immersive'
  | 'artistic_collage'
  | 'polaroid'
  | 'contact_sheet'
  | 'timeline'
  | 'slideshow'
  | 'pinterest'
  | 'horizontal_rail'
  | 'minimalist_portfolio'
  | 'cinematic_dark'
  | 'visual_memory'
  | 'combined_experience';

export interface PhotoItem {
  id: string;
  galleryId: string;
  name: string;
  originalUrl: string; // Blob URL or stored data URL of original
  previewUrl: string;  // Optimized WebP/JPEG for fast scrolling
  thumbnailUrl: string; // Small thumbnail
  size: number;
  width: number;
  height: number;
  aspectRatio: number;
  format: string;
  orientation?: number;
  order: number;
  title?: string;
  caption?: string;
  chapter?: string; // For 'visual_memory' chapter tabs e.g. "Preparativos", "Ceremonia", etc.
  dateTaken?: string;
  exif?: {
    camera?: string;
    lens?: string;
    iso?: string;
    aperture?: string;
    shutter?: string;
    focalLength?: string;
  };
  isFavorite?: boolean;
  isPrintSelected?: boolean;
  printNotes?: string;
  tags?: string[];
  featured?: boolean;
}

export interface FieldTextStyle {
  text: string;
  visible: boolean;
  fontFamily: 'serif' | 'cormorant' | 'cinzel' | 'sans' | 'outfit' | 'grotesk';
  fontSize: number; // in pixels (base desktop)
  color: string;
  alignment: 'left' | 'center' | 'right';
  bold: boolean;
  italic: boolean;
  letterSpacing: number; // em
  lineHeight: number; // ratio e.g. 1.2
  opacity: number; // 0 to 1
  shadow: 'none' | 'subtle' | 'glow' | 'retro' | 'strong';
  outline: boolean;
  positionX: number; // percentage 0-100
  positionY: number; // percentage 0-100
  rotation: number; // degrees -45 to 45
}

export interface CoverTextConfig {
  eventName: FieldTextStyle;
  clientName: FieldTextStyle;
  title: FieldTextStyle;
  subtitle: FieldTextStyle;
  date: FieldTextStyle;
  location: FieldTextStyle;
  description: FieldTextStyle;
  dedication: FieldTextStyle;
  photographerSignature: FieldTextStyle;
  photoCredits: FieldTextStyle;
}

export interface StickerElement {
  id: string;
  stickerId: string;
  name: string;
  svgContent?: string;
  imageUrl?: string;
  category: 'bodas' | 'graduacion' | 'xv' | 'infantil' | 'travel' | 'marcos' | 'ornamentos';
  x: number; // %
  y: number; // %
  width: number; // px
  height: number; // px
  rotation: number; // degrees
  scale: number; // 0.5 to 3
  opacity: number; // 0 to 1
  zIndex: number;
  isLocked: boolean;
}

export interface LogoConfig {
  enabled: boolean;
  imageUrl: string;
  size: number; // px width
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  rotation: number;
  margin: number;
  applyToAllPhotos: boolean;
  applyToSelectedOnly: boolean;
}

export interface WatermarkConfig {
  enabled: boolean;
  type: 'text' | 'logo';
  text: string;
  logoUrl?: string;
  opacity: number;
  rotation: number;
  tileSize: 'single' | 'diagonal_repeat' | 'corner';
  protectPreview: boolean;
  allowCleanOriginalDownload: boolean;
}

export interface MusicConfig {
  enabled: boolean;
  title: string;
  artist?: string;
  audioUrl?: string;
  presetKey?: 'ambient_acoustic' | 'romantic_piano' | 'cinematic_strings' | 'celebration_joy' | 'warm_heirloom' | 'synth_pop';
  volume: number; // 0 to 1
  loop: boolean;
  autoplay: boolean;
}

export interface DownloadPermissions {
  allowOriginal: boolean;
  allowOptimized: boolean;
  allowZipAlbum: boolean;
  allowZipSelection: boolean;
  requirePinForDownload: boolean;
  downloadPin?: string;
}

export interface GalleryStats {
  views: number;
  uniqueVisitors: number;
  downloadsCount: number;
  zipDownloadsCount: number;
  sharesCount: number;
  favoritesCount: number;
  lastVisited?: string;
}

export interface GalleryComment {
  id: string;
  photoId?: string;
  authorName: string;
  comment: string;
  createdAt: string;
}

export interface GalleryItem {
  id: string;
  slug: string;
  eventName: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  category: 'Bodas' | 'Graduaciones' | 'XV Años' | 'Infantil' | 'Escolar' | 'Lifestyle' | 'Corporativo' | 'Viajes' | 'Familia' | 'Maternidad';
  date: string;
  location: string;
  description: string;
  
  templateId: TemplateId;
  modalityId: ModalityId;
  
  isPublished: boolean;
  isPrivate: boolean;
  pinCode?: string;
  hasExpiration: boolean;
  expirationDate?: string;
  
  heroPhotoId?: string;
  
  coverTexts: CoverTextConfig;
  stickers: StickerElement[];
  logo: LogoConfig;
  watermark: WatermarkConfig;
  music: MusicConfig;
  downloads: DownloadPermissions;
  
  stats: GalleryStats;
  comments: GalleryComment[];
  
  createdAt: string;
  updatedAt: string;
}

export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

export interface PrintOrderItem {
  photoId: string;
  photoName: string;
  thumbnailUrl: string;
  size: '10x15' | '15x20' | '20x30' | '30x40' | 'Canvas 40x60';
  quantity: number;
  notes?: string;
}

export interface PrintOrder {
  id: string;
  galleryId: string;
  clientName: string;
  clientEmail: string;
  items: PrintOrderItem[];
  totalPrice: number;
  status: 'pendiente' | 'en_proceso' | 'completado';
  createdAt: string;
}
