import { motion } from 'motion/react'
import type { ReactNode } from 'react'

interface BlurAppearProps {
  children: ReactNode
  className?: string
  /** Delay opcional en segundos, para escalonar varios BlurAppear en cadena. */
  delay?: number
}

/**
 * Wrapper de aparición con blur + fade + traslado vertical, para contenido
 * que se monta condicionalmente (modales, popovers). El padre debe envolver
 * el render condicional en <AnimatePresence> para que también se anime la
 * salida (si el contenedor externo ya maneja su propio timing de salida —
 * como los Popover de react-aria-components —, alcanza con la animación de
 * entrada y no hace falta AnimatePresence).
 */
export function BlurAppear({ children, className, delay = 0 }: BlurAppearProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, filter: 'blur(10px)', y: -16 }}
      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      exit={{ opacity: 0, filter: 'blur(16px)', y: -16 }}
      transition={{ duration: 0.25, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  )
}
