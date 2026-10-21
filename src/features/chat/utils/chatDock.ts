/**
 * Animación del chat acoplado (xl+) en el detalle de producto. El panel crece
 * de 0 a su ancho mientras el contenido del producto se angosta; los dos usan
 * la MISMA duración y curva para que se vea como un solo movimiento: Motion
 * anima el panel (ChatDock) y una transición CSS anima el padding del <main>.
 */
export const CHAT_DOCK_DURATION_S = 0.5
/** Curva "ease-out" suave, sin rebote (la misma de las hojas de iOS). */
export const CHAT_DOCK_EASE = [0.32, 0.72, 0, 1] as const
/** Equivalente en Tailwind para lo que se anima con CSS (padding, gap). */
export const CHAT_DOCK_CSS_TRANSITION = 'duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]'

/** Ancho del panel acoplado: 400px en xl, 440px desde 2xl. */
export const CHAT_DOCK_WIDTH = { xl: 400, '2xl': 440 } as const
/** Separación entre el contenido y el panel (se anima junto con el ancho). */
export const CHAT_DOCK_GAP = 24
