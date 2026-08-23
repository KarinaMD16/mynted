/** Animación compartida por los popovers del header (cuenta, notificaciones). */
export const popoverAnimationClass = ({ isEntering, isExiting }: { isEntering: boolean; isExiting: boolean }) =>
  [
    'w-max origin-top-right will-change-transform',
    isEntering && 'duration-150 ease-out animate-in fade-in slide-in-from-top-1',
    isExiting && 'duration-100 ease-in animate-out fade-out slide-out-to-top-1',
  ]
    .filter(Boolean)
    .join(' ')
