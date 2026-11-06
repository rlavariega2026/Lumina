/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BuiltinSticker {
  id: string;
  name: string;
  category: 'bodas' | 'graduacion' | 'xv' | 'infantil' | 'travel' | 'marcos' | 'ornamentos';
  svg: string;
}

export const STICKER_CATEGORIES = [
  { id: 'bodas', label: 'Bodas & Romance' },
  { id: 'graduacion', label: 'Graduación' },
  { id: 'xv', label: 'XV Años' },
  { id: 'infantil', label: 'Infantil & Bebé' },
  { id: 'travel', label: 'Viajes & Aventura' },
  { id: 'marcos', label: 'Marcos & Cinta' },
  { id: 'ornamentos', label: 'Sellos & Filigrana' },
] as const;

export const BUILTIN_STICKERS: BuiltinSticker[] = [
  // Bodas
  {
    id: 'boda_anillos',
    name: 'Anillos Entrelazados',
    category: 'bodas',
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="40" cy="55" r="24" stroke="currentColor"/>
      <circle cx="60" cy="45" r="24" stroke="currentColor"/>
      <path d="M58 20 L62 20 L64 16 L56 16 Z" fill="currentColor"/>
      <circle cx="60" cy="12" r="3" fill="currentColor"/>
    </svg>`,
  },
  {
    id: 'boda_corazon_floral',
    name: 'Corazón Botánico',
    category: 'bodas',
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <path d="M50 82 C20 60 12 40 22 25 C30 14 44 18 50 28 C56 18 70 14 78 25 C88 40 80 60 50 82 Z" stroke="currentColor" fill="none"/>
      <path d="M48 35 Q50 30 52 35" stroke="currentColor"/>
      <circle cx="34" cy="28" r="3" fill="currentColor"/>
      <circle cx="66" cy="28" r="3" fill="currentColor"/>
    </svg>`,
  },
  {
    id: 'boda_olivo',
    name: 'Rama de Olivo',
    category: 'bodas',
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M20 80 Q50 60 80 20" stroke="currentColor" stroke-width="2.5"/>
      <ellipse cx="40" cy="60" rx="8" ry="4" transform="rotate(-30 40 60)" fill="currentColor" fill-opacity="0.3"/>
      <ellipse cx="55" cy="48" rx="8" ry="4" transform="rotate(30 55 48)" fill="currentColor" fill-opacity="0.3"/>
      <ellipse cx="65" cy="35" rx="8" ry="4" transform="rotate(-25 65 35)" fill="currentColor" fill-opacity="0.3"/>
      <ellipse cx="78" cy="24" rx="7" ry="3.5" transform="rotate(20 78 24)" fill="currentColor" fill-opacity="0.3"/>
    </svg>`,
  },

  // Graduacion
  {
    id: 'grad_birrete',
    name: 'Birrete Académico',
    category: 'graduacion',
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="50,22 88,38 50,54 12,38" fill="currentColor" fill-opacity="0.2"/>
      <path d="M30 46 V65 C30 74 70 74 70 65 V46" fill="currentColor" fill-opacity="0.2"/>
      <path d="M80 42 V68 C80 72 84 72 84 68 V42" stroke="currentColor" stroke-width="2"/>
      <circle cx="82" cy="74" r="3" fill="currentColor"/>
    </svg>`,
  },
  {
    id: 'grad_diploma',
    name: 'Diploma con Listón',
    category: 'graduacion',
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <rect x="25" y="25" width="50" height="28" rx="3" transform="rotate(-15 50 39)" fill="currentColor" fill-opacity="0.15"/>
      <line x1="42" y1="26" x2="48" y2="48" stroke="currentColor" stroke-width="4"/>
      <path d="M48 48 L44 65 L49 60 L54 65 L50 48" fill="currentColor"/>
    </svg>`,
  },
  {
    id: 'grad_laurel',
    name: 'Corona de Laureles',
    category: 'graduacion',
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <path d="M30 75 C15 55 18 35 32 20" stroke="currentColor"/>
      <path d="M70 75 C85 55 82 35 68 20" stroke="currentColor"/>
      <ellipse cx="22" cy="40" rx="6" ry="3" transform="rotate(-30 22 40)" fill="currentColor"/>
      <ellipse cx="24" cy="55" rx="6" ry="3" transform="rotate(-15 24 55)" fill="currentColor"/>
      <ellipse cx="78" cy="40" rx="6" ry="3" transform="rotate(30 78 40)" fill="currentColor"/>
      <ellipse cx="76" cy="55" rx="6" ry="3" transform="rotate(15 76 55)" fill="currentColor"/>
    </svg>`,
  },

  // XV Años
  {
    id: 'xv_tiara',
    name: 'Tiara Real',
    category: 'xv',
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 68 Q50 64 82 68 L78 42 L64 54 L50 26 L36 54 L22 42 Z" fill="currentColor" fill-opacity="0.2"/>
      <circle cx="50" cy="22" r="3.5" fill="currentColor"/>
      <circle cx="36" cy="38" r="2.5" fill="currentColor"/>
      <circle cx="64" cy="38" r="2.5" fill="currentColor"/>
      <line x1="20" y1="72" x2="80" y2="72" stroke="currentColor" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'xv_mariposa',
    name: 'Mariposa de Cristal',
    category: 'xv',
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M50 35 V70" stroke="currentColor" stroke-width="3"/>
      <path d="M50 40 C35 15 15 25 20 48 C25 60 48 55 50 65" fill="currentColor" fill-opacity="0.2"/>
      <path d="M50 40 C65 15 85 25 80 48 C75 60 52 55 50 65" fill="currentColor" fill-opacity="0.2"/>
      <circle cx="46" cy="30" r="1.5" fill="currentColor"/>
      <circle cx="54" cy="30" r="1.5" fill="currentColor"/>
    </svg>`,
  },

  // Infantil
  {
    id: 'inf_nube',
    name: 'Nube Soñadora',
    category: 'infantil',
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M25 65 A14 14 0 0 1 20 40 A18 18 0 0 1 45 28 A22 22 0 0 1 76 34 A16 16 0 0 1 82 65 Z" fill="currentColor" fill-opacity="0.2"/>
      <circle cx="38" cy="48" r="2" fill="currentColor"/>
      <circle cx="62" cy="48" r="2" fill="currentColor"/>
      <path d="M46 54 Q50 58 54 54" stroke="currentColor"/>
    </svg>`,
  },
  {
    id: 'inf_estrella',
    name: 'Estrella Fugaz',
    category: 'infantil',
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round">
      <polygon points="50,15 61,38 86,41 67,58 72,83 50,70 28,83 33,58 14,41 39,38" fill="currentColor" fill-opacity="0.25"/>
    </svg>`,
  },

  // Travel
  {
    id: 'travel_brujula',
    name: 'Rosa de los Vientos',
    category: 'travel',
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <circle cx="50" cy="50" r="38" stroke="currentColor"/>
      <polygon points="50,16 55,45 84,50 55,55 50,84 45,55 16,50 45,45" fill="currentColor" fill-opacity="0.3"/>
      <circle cx="50" cy="50" r="4" fill="currentColor"/>
    </svg>`,
  },
  {
    id: 'travel_avion',
    name: 'Ruta de Avión',
    category: 'travel',
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <path d="M15 75 Q40 65 55 45 T85 20" stroke-dasharray="4 4" stroke="currentColor"/>
      <polygon points="85,15 92,26 80,24" fill="currentColor"/>
    </svg>`,
  },

  // Marcos y Cinta
  {
    id: 'marco_washi_tape',
    name: 'Cinta Washi Tape',
    category: 'marcos',
    svg: `<svg viewBox="0 0 120 40" fill="none" stroke="currentColor" stroke-width="1.5">
      <polygon points="5,5 115,5 110,35 10,35" fill="currentColor" fill-opacity="0.35"/>
      <line x1="20" y1="12" x2="35" y2="28" stroke="currentColor" stroke-opacity="0.4"/>
      <line x1="45" y1="12" x2="60" y2="28" stroke="currentColor" stroke-opacity="0.4"/>
      <line x1="70" y1="12" x2="85" y2="28" stroke="currentColor" stroke-opacity="0.4"/>
      <line x1="95" y1="12" x2="110" y2="28" stroke="currentColor" stroke-opacity="0.4"/>
    </svg>`,
  },
  {
    id: 'marco_esquina_dorada',
    name: 'Esquina Ornamental',
    category: 'marcos',
    svg: `<svg viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M10 50 V10 H50" stroke="currentColor"/>
      <path d="M18 42 V18 H42" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="28" cy="28" r="4" fill="currentColor" fill-opacity="0.3"/>
    </svg>`,
  },

  // Ornamentos
  {
    id: 'ornamento_sello_cera',
    name: 'Sello de Cera Artesanal',
    category: 'ornamentos',
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5">
      <circle cx="50" cy="50" r="38" fill="currentColor" fill-opacity="0.2"/>
      <circle cx="50" cy="50" r="30" stroke-dasharray="3 3"/>
      <path d="M42 40 L50 60 L58 40" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="50" cy="35" r="3" fill="currentColor"/>
    </svg>`,
  },
];
