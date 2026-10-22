import { useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useLanguage } from '@/i18n/LanguageContext'
import { CHAT_DOCK_DURATION_S, CHAT_DOCK_EASE, CHAT_DOCK_GAP, CHAT_DOCK_WIDTH } from '../utils/chatDock'
import { ChatPanel, ChatPanelSkeleton } from './ChatPanel'

interface ChatSheetProps {
  /** Conversación abierta, o null si el panel está cerrado. */
  conversationId: number | null
  onClose: () => void
}

/**
 * Chat del detalle de producto ("Contactar vendedor").
 *
 * - Desde xl (1280px) va acoplado a la derecha de la página, como en el diseño
 *   (split screen): el detalle se angosta y se puede seguir mirando y
 *   scrolleando mientras se escribe. Es una tarjeta flotante con el mismo
 *   estilo que el header (borde, esquinas redondeadas, sombra suave).
 * - Por debajo no hay ancho para las dos cosas: es una hoja que entra desde la
 *   derecha (pantalla completa en móvil), con foco atrapado y Escape para cerrar.
 *
 * Quien lo usa decide dónde va la versión acoplada con `ChatDock`.
 */
export function ChatSheet({ conversationId, onClose }: ChatSheetProps) {
  const { t } = useLanguage()
  const isDesktop = useBreakpoint('xl')
  if (isDesktop) return null

  return (
    <DialogPrimitive.Root open={conversationId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-mynted-ink/40 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex h-dvh flex-col overflow-hidden bg-white outline-none duration-200 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right sm:inset-y-3 sm:right-3 sm:left-auto sm:h-auto sm:w-[420px] sm:rounded-2xl sm:border sm:border-mynted-border sm:shadow-xl"
        >
          <DialogTitle className="sr-only">{t('chat.sheet.title')}</DialogTitle>
          {conversationId !== null && <ChatPanel conversationId={conversationId} variant="sheet" onClose={onClose} />}
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  )
}

/**
 * Versión acoplada (xl+): se pinta dentro del layout de la página, pegada bajo
 * el header. Al abrir crece de 0 a su ancho (y el margen que la separa del
 * contenido, de 0 a 24px), así el detalle del producto se va comprimiendo de a
 * poco en vez de saltar; al cerrar hace lo inverso. Mientras sale, AnimatePresence
 * mantiene el último contenido (el chat sigue visible hasta desaparecer).
 *
 * El contenido interno tiene el ancho final fijo desde el principio: lo que se
 * anima es la "ventana" que lo recorta, así los mensajes no se reacomodan en
 * cada cuadro de la animación. Con "reducir movimiento" aparece sin animar.
 */
export function ChatDock({ conversationId, onClose }: ChatSheetProps) {
  const isDesktop = useBreakpoint('xl')
  const isWide = useBreakpoint('2xl')
  const width = isWide ? CHAT_DOCK_WIDTH['2xl'] : CHAT_DOCK_WIDTH.xl
  const isOpen = isDesktop && conversationId !== null

  // Si la página ya cargó con el chat abierto (?chat=) no hay animación, así que tampoco
  // hace falta diferir el contenido. Después de cerrarlo una vez, cada apertura se anima.
  const [openedOnLoad, setOpenedOnLoad] = useState(isOpen)
  if (!isOpen && openedOnLoad) setOpenedOnLoad(false)

  return (
    // initial={false}: si la página ya carga con el chat abierto, aparece sin animar.
    <AnimatePresence initial={false}>
      {isOpen && (
        <DockedChat
          key="chat-dock"
          conversationId={conversationId}
          onClose={onClose}
          width={width}
          deferContent={!openedOnLoad}
        />
      )}
    </AnimatePresence>
  )
}

function DockedChat({
  conversationId,
  onClose,
  width,
  deferContent,
}: {
  conversationId: number
  onClose: () => void
  width: number
  deferContent: boolean
}) {
  const reduceMotion = useReducedMotion()
  // Montar el chat entero (hilo, mensajes, imágenes) es lo más pesado; si se hace en el
  // mismo cuadro en que arranca la animación, se pierden los primeros cuadros y la
  // compresión "salta". Por eso, mientras el panel crece se ve un esqueleto liviano y el
  // chat real entra cuando la animación termina (o enseguida, si no hay animación).
  const [isSettled, setIsSettled] = useState(!deferContent || Boolean(reduceMotion))

  return (
    <motion.aside
      initial={{ width: 0, marginLeft: 0, opacity: 0 }}
      animate={{ width, marginLeft: CHAT_DOCK_GAP, opacity: 1 }}
      exit={{ width: 0, marginLeft: 0, opacity: 0 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              duration: CHAT_DOCK_DURATION_S,
              ease: CHAT_DOCK_EASE,
              // El fade va más rápido: que no se vea el borde de una tarjeta de 0px.
              opacity: { duration: CHAT_DOCK_DURATION_S * 0.6, ease: 'easeOut' },
            }
      }
      onAnimationComplete={() => setIsSettled(true)}
      className="sticky top-[118px] mt-7 h-[calc(100svh-150px)] shrink-0 overflow-hidden rounded-2xl border border-mynted-border bg-white shadow-[0_2px_12px_rgba(13,13,20,0.06)]"
    >
      <div className="h-full" style={{ width: width - 2 }}>
        {isSettled ? (
          <ChatPanel conversationId={conversationId} variant="sheet" onClose={onClose} />
        ) : (
          <ChatPanelSkeleton />
        )}
      </div>
    </motion.aside>
  )
}
