import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ArrowUpRight, MessageCircle, X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { SignedOutState } from '@/components/errors/QueryErrorState'
import { DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'
import { useUnreadBadge } from '../hooks/useUnreadBadge'
import { formatBadgeCount } from '../utils/chatFormat'
import { chatIconButtonClass } from './ChatHeader'
import { ChatPanel } from './ChatPanel'
import { InboxList } from './InboxList'

/**
 * Rutas donde NO va el botón flotante: /messages ya es el chat, y en las
 * pantallas de cuenta (login, recuperar contraseña…) no hay nada que chatear.
 */
const HIDDEN_ON = [/^\/messages(\/|$)/, /^\/login$/, /^\/forgot-password$/, /^\/reset-password$/, /^\/confirm-email-change$/]

/**
 * Botón flotante de mensajes (abajo a la derecha) en todas las pantallas salvo
 * las de HIDDEN_ON. Abre una hoja desde la derecha —la misma del detalle de
 * producto— con la bandeja; al elegir una conversación el chat se abre ahí
 * mismo, con "volver" a la lista. "Ver todo" lleva a /messages.
 *
 * Se oculta también en el detalle de producto mientras ese chat está abierto
 * (?chat=), para no tapar la caja de texto del chat acoplado.
 *
 * Va una sola vez en App.
 */
export function ChatLauncher() {
  const { t } = useLanguage()
  const reduceMotion = useReducedMotion()
  const unread = useUnreadBadge()
  const [isOpen, setIsOpen] = useState(false)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const location = useRouterState({ select: (state) => state.location })
  const productChatOpen = location.pathname.startsWith('/products/') && (location.search as { chat?: unknown }).chat !== undefined

  // Si desde la hoja se navega a otra pantalla (perfil, producto, "Ver todo"), se cierra.
  const [openedOn, setOpenedOn] = useState(location.pathname)
  if (isOpen && openedOn !== location.pathname) {
    setIsOpen(false)
    setConversationId(null)
  }

  if (HIDDEN_ON.some((pattern) => pattern.test(location.pathname)) || productChatOpen) return null

  function close() {
    setIsOpen(false)
  }

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (open) setOpenedOn(location.pathname)
        // Al volver a abrirla empieza en la bandeja.
        if (!open) setConversationId(null)
      }}
    >
      <motion.div
        className="fixed right-4 bottom-4 z-30 sm:right-6 sm:bottom-6"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={reduceMotion ? undefined : { scale: 1.06 }}
        whileTap={reduceMotion ? undefined : { scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.4 }}
      >
        <DialogPrimitive.Trigger
          aria-label={unread > 0 ? `${t('shop.chat')} · ${t('nav.messagesUnread', { count: unread })}` : t('shop.chat')}
          className="relative flex size-[60px] cursor-pointer items-center justify-center rounded-full bg-mynted-blue text-white shadow-[0_6px_18px_-2px_rgba(47,95,255,0.35)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid"
        >
          <MessageCircle className="size-[26px]" aria-hidden="true" />
          {unread > 0 && (
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-1 flex min-w-6 items-center justify-center rounded-full bg-mynted-orange px-1.5 text-xs leading-6 font-bold text-white tabular-nums ring-2 ring-mynted-bg"
            >
              {formatBadgeCount(unread)}
            </span>
          )}
        </DialogPrimitive.Trigger>
      </motion.div>

      <DialogPortal>
        <DialogOverlay className="bg-mynted-ink/40 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex h-dvh flex-col overflow-hidden bg-white outline-none duration-200 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right sm:inset-y-3 sm:right-3 sm:left-auto sm:h-auto sm:w-[420px] sm:rounded-2xl sm:border sm:border-mynted-border sm:shadow-xl"
        >
          <DialogTitle className="sr-only">{t('chat.inbox.title')}</DialogTitle>
          {conversationId !== null ? (
            <ChatPanel
              key={conversationId}
              conversationId={conversationId}
              variant="page"
              onBack={() => setConversationId(null)}
              onClose={close}
            />
          ) : (
            <LauncherInbox onSelect={setConversationId} onClose={close} />
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  )
}

function LauncherInbox({ onSelect, onClose }: { onSelect: (id: number) => void; onClose: () => void }) {
  const { t } = useLanguage()
  const { isLoggedIn, isLoading } = useCurrentUser()

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-2 border-b border-mynted-border px-5 py-4">
        <h2 className="flex-1 font-heading text-xl font-semibold text-mynted-ink">{t('chat.inbox.title')}</h2>
        {isLoggedIn && (
          <Link
            to="/messages"
            onClick={onClose}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-mynted-blue outline-none hover:underline focus-visible:outline-2 focus-visible:outline-mynted-blue-mid"
          >
            {t('chat.launcher.seeAll')}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        )}
        <DialogPrimitive.Close aria-label={t('chat.header.close')} className={`${chatIconButtonClass} bg-mynted-bg`}>
          <X className="size-[18px]" aria-hidden="true" />
        </DialogPrimitive.Close>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
        {isLoading ? (
          <div className="m-3 h-40 animate-pulse rounded-xl bg-mynted-bg" aria-busy="true" />
        ) : isLoggedIn ? (
          <InboxList onSelect={onSelect} />
        ) : (
          <div className="p-3">
            <SignedOutState variant="compact" description={t('chat.inbox.loginPrompt')} />
          </div>
        )}
      </div>
    </div>
  )
}
