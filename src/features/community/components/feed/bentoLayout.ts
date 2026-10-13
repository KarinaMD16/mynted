export type TileSize = 'hero' | 'wide' | 'tall' | 'small'

/**
 * Patrón del bento grid de la pestaña "Publicaciones" del perfil (3 columnas
 * en desktop). Se repite cada 7 tarjetas y cada mitad (3 + 4) cierra 2 filas
 * completas, sin huecos:
 *
 *   ┌───────┬───┐   ┌───────┬───┐
 *   │       │ 1 │   │   3   │   │
 *   │   0   ├───┤   ├───┬───┤ 4 │
 *   │       │ 2 │   │ 5 │ 6 │   │
 *   └───────┴───┘   └───┴───┴───┘
 *
 * Por debajo de `lg` el grid pasa a 1–2 columnas iguales y los spans no aplican.
 * Los nombres de clase van completos (no se arman con strings) para que Tailwind los detecte.
 */
export const BENTO_PATTERN: { size: TileSize; span: string }[] = [
  { size: 'hero', span: 'lg:col-span-2 lg:row-span-2' },
  { size: 'small', span: '' },
  { size: 'small', span: '' },
  { size: 'wide', span: 'lg:col-span-2' },
  { size: 'tall', span: 'lg:row-span-2' },
  { size: 'small', span: '' },
  { size: 'small', span: '' },
]

export const BENTO_GRID_CLASS =
  'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:auto-rows-[220px] lg:grid-cols-3 lg:grid-flow-dense'
export const TILE_MIN_HEIGHT = 'min-h-[220px] lg:min-h-0'

export function getBentoSlot(index: number) {
  return BENTO_PATTERN[index % BENTO_PATTERN.length]
}
