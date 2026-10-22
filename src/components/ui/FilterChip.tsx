import type { ReactNode } from 'react'

/**
 * Píldora de un filtro (Explorar, tienda del vendedor). `aria-pressed` indica
 * si está elegida; va dentro de un FilterGroup.
 */
export function FilterChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors outline-none hover:cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid ${
        selected
          ? 'border-mynted-orange bg-mynted-orange/10 text-mynted-orange'
          : 'border-mynted-border text-mynted-ink hover:border-mynted-orange/60'
      }`}
    >
      {children}
    </button>
  )
}
