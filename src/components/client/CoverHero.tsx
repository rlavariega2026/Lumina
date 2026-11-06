/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronDown, Music, Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import { GalleryItem, PhotoItem } from '../../types/gallery';
import { TEMPLATES_CONFIG } from '../../constants/templates';
import { BUILTIN_STICKERS } from '../../constants/stickers';

interface CoverHeroProps {
  gallery: GalleryItem;
  heroPhoto?: PhotoItem;
  onEnterGallery: () => void;
  isMusicPlaying?: boolean;
  onToggleMusic?: () => void;
}

export const CoverHero: React.FC<CoverHeroProps> = ({
  gallery,
  heroPhoto,
  onEnterGallery,
  isMusicPlaying = false,
  onToggleMusic,
}) => {
  const template = TEMPLATES_CONFIG[gallery.templateId] || TEMPLATES_CONFIG.bodas_elegance;
  const texts = gallery.coverTexts;

  const bgPhotoUrl =
    heroPhoto?.originalUrl ||
    heroPhoto?.previewUrl ||
    '/src/assets/images/hero_wedding_elegance_1793939981838.jpg';

  // Helper for font family class
  const getFontFamily = (f: string) => {
    switch (f) {
      case 'cormorant':
        return 'font-[Cormorant_Garamond]';
      case 'cinzel':
        return 'font-[Cinzel]';
      case 'serif':
        return 'font-[Playfair_Display]';
      case 'outfit':
        return 'font-[Outfit]';
      case 'grotesk':
        return 'font-[Space_Grotesk]';
      default:
        return 'font-[Plus_Jakarta_Sans]';
    }
  };

  const getShadowStyle = (shadow: string) => {
    switch (shadow) {
      case 'glow':
        return 'drop-shadow-[0_0_18px_rgba(212,175,55,0.4)]';
      case 'retro':
        return 'drop-shadow-[3px_3px_0_rgba(0,0,0,0.8)]';
      case 'strong':
        return 'drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]';
      case 'subtle':
        return 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]';
      default:
        return '';
    }
  };

  return (
    <div className="relative w-full min-h-[92vh] flex flex-col justify-between overflow-hidden select-none bg-zinc-950">
      {/* Background Image with Cinematic Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src={bgPhotoUrl}
          alt={gallery.eventName}
          className="w-full h-full object-cover object-center transform scale-105 filter brightness-75 transition-transform duration-1000 ease-out"
        />
        {/* Gradients tailored to template mood */}
        <div className={`absolute inset-0 ${template.headerThemeClass} opacity-85`} />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-black/80" />
      </div>

      {/* Decorative Stickers on Cover */}
      {gallery.stickers && gallery.stickers.length > 0 && (
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          {gallery.stickers.map((stk) => {
            const builtin = BUILTIN_STICKERS.find((b) => b.id === stk.stickerId);
            return (
              <div
                key={stk.id}
                style={{
                  position: 'absolute',
                  left: `${stk.x}%`,
                  top: `${stk.y}%`,
                  transform: `translate(-50%, -50%) rotate(${stk.rotation}deg) scale(${stk.scale})`,
                  opacity: stk.opacity,
                  color: template.primaryColor,
                  width: `${stk.width}px`,
                  height: `${stk.height}px`,
                }}
              >
                {builtin ? (
                  <div dangerouslySetInnerHTML={{ __html: builtin.svg }} className="w-full h-full" />
                ) : stk.imageUrl ? (
                  <img src={stk.imageUrl} alt="" className="w-full h-full object-contain" />
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Top Bar on Cover: Logo, Audio toggle, Client info */}
      <header className="relative z-20 flex items-center justify-between gap-4 px-6 sm:px-12 py-8">
        {/* Optional Logo */}
        <div>
          {gallery.logo.enabled && gallery.logo.imageUrl ? (
            <img
              src={gallery.logo.imageUrl}
              alt="Logo del fotógrafo"
              style={{
                width: `${gallery.logo.size}px`,
                opacity: gallery.logo.opacity,
                transform: `rotate(${gallery.logo.rotation}deg)`,
              }}
              className="max-h-16 object-contain"
            />
          ) : gallery.logo.enabled ? (
            <div className="flex items-center gap-2 text-xs tracking-widest uppercase font-semibold text-white/80">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{texts.photographerSignature.text || 'Lumina Studio'}</span>
            </div>
          ) : null}
        </div>

        {/* Music Player Button (if enabled) */}
        {gallery.music.enabled && (
          <button
            onClick={onToggleMusic}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/90 border border-white/20 backdrop-blur-md text-xs transition cursor-pointer shadow-lg"
            title="Activar o pausar música de fondo"
          >
            {isMusicPlaying ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="hidden sm:inline font-medium">Música activada</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden sm:inline text-zinc-300">Escuchar música</span>
              </>
            )}
          </button>
        )}
      </header>

      {/* Main Cover Typography Content */}
      <div className="relative z-20 max-w-4xl mx-auto px-6 text-center my-auto py-12 flex flex-col items-center justify-center space-y-4">
        {/* Title / Lead Kicker */}
        {texts.title.visible && (
          <p
            className={`${getFontFamily(texts.title.fontFamily)} ${getShadowStyle(texts.title.shadow)} uppercase tracking-widest text-xs sm:text-sm font-semibold`}
            style={{
              color: texts.title.color,
              opacity: texts.title.opacity,
              letterSpacing: `${texts.title.letterSpacing}em`,
            }}
          >
            {texts.title.text}
          </p>
        )}

        {/* Event Name (Hero) */}
        {texts.eventName.visible && (
          <h1
            className={`${getFontFamily(texts.eventName.fontFamily)} ${getShadowStyle(texts.eventName.shadow)} text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-none text-balance`}
            style={{
              color: texts.eventName.color,
              opacity: texts.eventName.opacity,
              transform: `rotate(${texts.eventName.rotation}deg)`,
            }}
          >
            {texts.eventName.text}
          </h1>
        )}

        {/* Client Name */}
        {texts.clientName.visible && (
          <p
            className={`${getFontFamily(texts.clientName.fontFamily)} ${getShadowStyle(texts.clientName.shadow)} text-lg sm:text-2xl font-light italic`}
            style={{
              color: texts.clientName.color,
              opacity: texts.clientName.opacity,
            }}
          >
            {texts.clientName.text}
          </p>
        )}

        {/* Subtitle */}
        {texts.subtitle.visible && (
          <p
            className={`${getFontFamily(texts.subtitle.fontFamily)} text-sm sm:text-base`}
            style={{
              color: texts.subtitle.color,
              opacity: texts.subtitle.opacity,
            }}
          >
            {texts.subtitle.text}
          </p>
        )}

        {/* Decorative Divider Line */}
        <div className="w-24 h-px my-2 mx-auto bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

        {/* Date and Location unboxed text with separator */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-zinc-300">
          {texts.date.visible && (
            <span
              className={getFontFamily(texts.date.fontFamily)}
              style={{ color: texts.date.color }}
            >
              {texts.date.text}
            </span>
          )}
          {texts.date.visible && texts.location.visible && (
            <span className="text-amber-400/60">·</span>
          )}
          {texts.location.visible && (
            <span
              className={getFontFamily(texts.location.fontFamily)}
              style={{ color: texts.location.color }}
            >
              {texts.location.text}
            </span>
          )}
        </div>

        {/* Description or Dedication */}
        {texts.description.visible && (
          <p
            className={`${getFontFamily(texts.description.fontFamily)} max-w-xl text-xs sm:text-sm text-zinc-300/90 leading-relaxed font-light mt-2`}
            style={{ color: texts.description.color }}
          >
            {texts.description.text}
          </p>
        )}

        {texts.dedication.visible && (
          <p
            className={`${getFontFamily(texts.dedication.fontFamily)} max-w-lg text-sm sm:text-base italic text-amber-200/90 mt-1`}
            style={{ color: texts.dedication.color }}
          >
            {texts.dedication.text}
          </p>
        )}
      </div>

      {/* Bottom CTA to Enter Gallery */}
      <footer className="relative z-20 flex flex-col items-center pb-8 pt-4">
        {texts.photographerSignature.visible && (
          <p
            className={`${getFontFamily(texts.photographerSignature.fontFamily)} text-[11px] uppercase tracking-widest text-zinc-400 mb-3`}
            style={{ color: texts.photographerSignature.color }}
          >
            {texts.photographerSignature.text}
          </p>
        )}

        <button
          onClick={onEnterGallery}
          className="group flex flex-col items-center gap-2 text-white hover:text-amber-300 transition duration-300 cursor-pointer"
        >
          <span className="text-xs uppercase tracking-widest font-medium opacity-85 group-hover:opacity-100">
            Explorar Galería
          </span>
          <div className="p-2 rounded-full bg-white/10 group-hover:bg-amber-400/20 border border-white/20 group-hover:border-amber-400/40 backdrop-blur-md transition-all transform group-hover:translate-y-1">
            <ChevronDown className="w-4 h-4" />
          </div>
        </button>
      </footer>
    </div>
  );
};
