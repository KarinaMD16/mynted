import type { ReactNode } from 'react'

/**
 * Un bloque del panel de filtros: la etiqueta y sus controles. Lo comparten
 * los filtros de "Shop" y los de "Talk" para que los dos paneles se lean igual.
 */
export function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-mynted-gray">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}
