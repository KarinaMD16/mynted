import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

/**
 * Animaciones de scroll de la app (Motion, antes Framer Motion). Cada
 * elemento se anima UNA sola vez, cuando ya está bien adentro del viewport
 * (no apenas asoma el borde, si no se terminaría de animar antes de verse), y
 * respeta la preferencia del sistema "reducir movimiento" (solo fade).
 */

// `margin` negativo abajo: el elemento cuenta como "visible" cuando ya subió
// ~120px sobre el borde inferior de la pantalla.
const VIEWPORT = { once: true, amount: 0.2, margin: '0px 0px -120px 0px' } as const
const EASE = [0.22, 1, 0.36, 1] as const

/** Aparece (fade + sube) cuando entra al viewport. `delay` en segundos. */
export function ScrollReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Elemento de una grilla: se anima cuando ÉL entra al viewport (no toda la
 * lista junta), y `index` escalona las tarjetas de una misma fila.
 */
export function StaggerItem({
  children,
  className,
  index = 0,
}: {
  children: ReactNode
  className?: string
  /** Posición en la lista; el retraso se repite cada 4 (columnas de la grilla). */
  index?: number
}) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.li
      className={className}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 56, scale: reduceMotion ? 1 : 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.8, ease: EASE, delay: reduceMotion ? 0 : (index % 4) * 0.12 }}
    >
      {children}
    </motion.li>
  )
}
