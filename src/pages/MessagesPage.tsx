import { useNavigate, useParams } from '@tanstack/react-router'
import { MessagesSquare } from 'lucide-react'
import { ErrorState } from '@/components/errors/ErrorState'
import { SignedOutState } from '@/components/errors/QueryErrorState'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { ChatPanel } from '@/features/chat/components/ChatPanel'
import { InboxList } from '@/features/chat/components/InboxList'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useLanguage } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'
import { SiteHeader } from '../components/layout/SiteHeader'

function parseConversationId(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 && id <= 2147483647 ? id : undefined
}

/**
 * Mensajes: /messages (bandeja) y /messages/$conversationId (un chat).
 *
 * - Escritorio (lg+): dos columnas dentro del ancho de la app, bandeja a la
 *   izquierda y chat a la derecha, ambas como tarjetas y del alto de la pantalla.
 * - Móvil y tablet: /messages es solo la lista; al abrir un chat, este ocupa
 *   toda la pantalla (tapa el header) con una flecha para volver a la lista,
 *   como en cualquier app de mensajería.
 */
export default function MessagesPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const isDesktop = useBreakpoint('lg')
  const { conversationId: rawId } = useParams({ strict: false })
  const conversationId = parseConversationId(rawId)
  const hasSelection = rawId !== undefined
  const { isLoggedIn, isLoading } = useCurrentUser()

  return (
    <div className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1368px] px-4 pt-6 pb-10 sm:px-6 lg:pb-6">
        {isLoading ? (
          <div className="h-[60svh] animate-pulse rounded-2xl bg-white" aria-busy="true" />
        ) : !isLoggedIn ? (
          <SignedOutState description={t('chat.inbox.loginPrompt')} />
        ) : (
          <div className="lg:grid lg:h-[calc(100svh-140px)] lg:min-h-[480px] lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] lg:gap-6">
            <section
              aria-labelledby="inbox-title"
              className={cx(
                'flex flex-col overflow-hidden rounded-2xl border border-mynted-border bg-white shadow-[0_2px_12px_rgba(13,13,20,0.04)] lg:h-full',
                hasSelection && 'hidden lg:flex',
              )}
            >
              <header className="border-b border-mynted-border px-5 pt-5 pb-4">
                <h1 id="inbox-title" className="font-heading text-[22px] font-semibold text-mynted-ink">
                  {t('chat.inbox.title')}
                </h1>
                <p className="mt-0.5 text-sm text-mynted-gray">{t('chat.inbox.subtitle')}</p>
              </header>
              <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:[scrollbar-width:thin]">
                <InboxList activeConversationId={conversationId} />
              </div>
            </section>

            {hasSelection ? (
              <div className="fixed inset-0 z-40 h-dvh bg-white lg:static lg:z-auto lg:h-full lg:overflow-hidden lg:rounded-2xl lg:border lg:border-mynted-border lg:shadow-[0_2px_12px_rgba(13,13,20,0.04)]">
                {conversationId !== undefined ? (
                  <ChatPanel
                    key={conversationId}
                    conversationId={conversationId}
                    variant="page"
                    onBack={isDesktop ? undefined : () => void navigate({ to: '/messages' })}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-4">
                    <ErrorState kind="notFound" variant="compact" description={t('chat.error.notFound')} />
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden h-full flex-col items-center justify-center gap-2 rounded-2xl border border-mynted-border bg-white px-6 text-center lg:flex">
                <span className="flex size-14 items-center justify-center rounded-full bg-mynted-bg text-mynted-blue">
                  <MessagesSquare className="size-7" aria-hidden="true" />
                </span>
                <p className="font-heading text-lg font-semibold text-mynted-ink">{t('chat.noSelection.title')}</p>
                <p className="max-w-xs text-sm text-mynted-gray">{t('chat.noSelection.description')}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
