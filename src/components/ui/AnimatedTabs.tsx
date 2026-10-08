import { useId, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

export interface AnimatedTabItem<T extends string> {
  id: T
  label: string
  icon?: ReactNode
  /** Clases extra del botón (por ejemplo `lg:hidden`). */
  className?: string
}

interface AnimatedTabsProps<T extends string> {
  items: AnimatedTabItem<T>[]
  value: T
  onChange: (id: T) => void
  /** `tabs`: role="tablist" + aria-selected. `pressed`: botones con aria-pressed. */
  semantics?: 'tabs' | 'pressed'
  ariaLabel?: string
  /** Clases del contenedor. */
  className?: string
  /** Radio del resaltado y del botón (por defecto el mismo que el menú principal). */
  roundedClassName?: string
}

/**
 * Pestañas con el mismo resaltado animado que los links del menú principal
 * (`Navigation`): una píldora naranja que se desliza al pasar el mouse o el
 * foco por cada pestaña y vuelve a la activa al salir.
 */
export function AnimatedTabs<T extends string>({
  items,
  value,
  onChange,
  semantics = 'tabs',
  ariaLabel,
  className = 'flex flex-wrap items-center gap-1.5',
  roundedClassName = 'rounded-[10px]',
}: AnimatedTabsProps<T>) {
  // Cada instancia necesita su propio layoutId: en el perfil conviven dos barras.
  const layoutId = useId()
  const reduceMotion = useReducedMotion()
  const [hoveredId, setHoveredId] = useState<T | null>(null)
  const highlightedId = hoveredId ?? value
  const transition = { duration: reduceMotion ? 0 : 0.4 }

  return (
    <div
      role={semantics === 'tabs' ? 'tablist' : 'group'}
      aria-label={ariaLabel}
      className={className}
      onMouseLeave={() => setHoveredId(null)}
      onBlur={() => setHoveredId(null)}
    >
      {items.map((item) => {
        const isActive = item.id === value
        const isHighlighted = item.id === highlightedId
        return (
          <button
            key={item.id}
            type="button"
            role={semantics === 'tabs' ? 'tab' : undefined}
            aria-selected={semantics === 'tabs' ? isActive : undefined}
            aria-pressed={semantics === 'pressed' ? isActive : undefined}
            onClick={() => onChange(item.id)}
            onMouseEnter={() => setHoveredId(item.id)}
            onFocus={() => setHoveredId(item.id)}
            className={`relative isolate inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap px-4 py-[9px] text-[15px] transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue ${roundedClassName} ${
              isHighlighted ? 'font-semibold text-mynted-white' : 'font-medium text-mynted-gray'
            } ${item.className ?? ''}`}
          >
            {item.icon}
            {item.label}
            <AnimatePresence>
              {isHighlighted && (
                <motion.div
                  animate={{ opacity: 1, scale: 1 }}
                  className={`absolute inset-0 -z-10 bg-mynted-orange ${roundedClassName}`}
                  exit={{ opacity: 0, scale: 0.9 }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  layout={true}
                  layoutId={layoutId}
                  transition={transition}
                />
              )}
            </AnimatePresence>
          </button>
        )
      })}
    </div>
  )
}
