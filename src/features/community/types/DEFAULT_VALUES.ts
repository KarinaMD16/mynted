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