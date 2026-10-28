import { useId, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { cx } from '@/utils/cx'

export interface AccordionItem {
  id: string
  title: ReactNode
  content: ReactNode
}

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Acordeón (preguntas frecuentes y similares). Se abre una sección a la vez:
 * al abrir otra, la anterior se cierra. El contenido entra y sale animando la
 * altura y la opacidad (Motion), y el chevron gira; con "reducir movimiento"
 * del sistema solo hay fundido.
 *
 * Accesible: cada título es un <button> con aria-expanded / aria-controls, y
 * el panel es una región etiquetada por su título.
 */
export function Accordion({ items, className }: { items: AccordionItem[]; className?: string }) {
  const baseId = useId()
  const reduceMotion = useReducedMotion()
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className={cx('flex flex-col divide-y divide-mynted-border rounded-2xl border border-mynted-border bg-white', className)}>
      {items.map((item) => {
        const isOpen = openId === item.id
        const buttonId = `${baseId}-${item.id}-button`
        const panelId = `${baseId}-${item.id}-panel`

        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="group flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-mynted-ink outline-none transition-colors hover:text-mynted-orange focus-visible:text-mynted-orange focus-visible:underline"
              >
                {item.title}
                <motion.span
                  aria-hidden="true"
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE }}
                  className={cx(
                    'flex size-7 shrink-0 items-center justify-center rounded-full transition-colors',
                    isOpen ? 'bg-mynted-orange/10 text-mynted-orange' : 'bg-mynted-bg text-mynted-gray group-hover:text-mynted-orange',
                  )}
                >
                  <ChevronDown className="size-4" />
                </motion.span>
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="panel"
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  animate={reduceMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="overflow-hidden"
                >
                  <motion.div
                    initial={reduceMotion ? false : { y: -6 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="px-5 pb-4 text-sm text-mynted-gray"
                  >
                    {item.content}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
