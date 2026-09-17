export const MAX_TAGS = 3;

export const DEFAULT_RULES = [
    'Solo productos verificados y auténticos, nada de réplicas sin declarar',
    'Respeta a otros coleccionistas: sin acoso ni lenguaje ofensivo',
    'Sin spam ni promoción excesiva de tiendas externas',
];

export const labelClasses = 'text-[13px] font-medium text-mynted-ink';
export const hintClasses = 'text-xs text-mynted-gray';
export const errorClasses = 'text-xs text-red-500';

export const inputClasses = (hasError: boolean) =>
    `w-full rounded-[10px] border bg-white px-3.5 py-2.5 text-sm text-mynted-ink outline-none 
     transition-shadow placeholder:text-mynted-gray-light focus:ring-2 focus:ring-mynted-orange/20 ${
        hasError ? 'border-red-400' : 'border-mynted-border focus:border-mynted-orange'
    }`;

export const MY_COMMUNITIES_QUERY = { limit: 100 } as const;

export const EXPLORE_COMMUNITIES_QUERY = { limit: 100, sort: 'popularity' } as const;

export const MY_COMMUNITIES_BENTO_LIMIT = 3;

export const EXPLORE_LIMIT = 6;

/** Colores de los puntitos de "Explorar comunidades", en el orden del mockup. */
export const EXPLORE_DOT_COLORS = [
    'bg-mynted-orange',
    'bg-mynted-orange',
    'bg-pink-400',
    'bg-pink-400',
    'bg-mynted-blue',
    'bg-mynted-blue',
];

/** Colores del avatar del autor de un post, rotando por posicion (el backend no guarda uno). */
export const AVATAR_COLORS = [
  'bg-mynted-orange text-white',
  'bg-mynted-blue text-white',
  'bg-mynted-yellow text-mynted-ink',
  'bg-violet-500 text-white',
]

/** Variantes de color de las tarjetas de "Mis comunidades" y sus textos. */
export const variantClasses = {
  blue: {
    card: 'bg-mynted-blue',
    title: 'text-white',
    description: 'text-white/80',
  },
  yellow: {
    card: 'bg-mynted-yellow',
    title: 'text-mynted-ink',
    description: 'text-mynted-ink/70',
  },
}