import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { getApiErrorMessage } from '@/api/apiError'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/i18n/LanguageContext'
import { ErrorState, type ErrorKind, type ErrorStateVariant } from './ErrorState'
import { getErrorKind } from './errorKind'

const primaryLinkClass =
  'rounded-[10px] bg-mynted-orange px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-mynted-orange-hover'

interface SignedOutStateProps {
  title?: string
  description?: string
  variant?: ErrorStateVariant
  className?: string
}

/** "Inicia sesión para ver esto" (cant-access) con el botón a /login. */
export function SignedOutState({ title, description, variant = 'inline', className }: SignedOutStateProps) {
  const { t } = useLanguage()
  return (
    <ErrorState kind="signedOut" title={title} description={description} variant={variant} className={className}>
      <Link to="/login" className={primaryLinkClass}>
        {t('errors.actions.signIn')}
      </Link>
    </ErrorState>
  )
}

type TextOverride = { title?: string; description?: string }

interface QueryErrorStateProps {
  error: unknown
  /** Botón "Reintentar" (normalmente `query.refetch`). Solo se muestra en offline / error. */
  onRetry?: () => void
  variant?: ErrorStateVariant
  /** Textos propios por tipo, p. ej. `{ notFound: { description: t('errors.notFound.post') } }`. */
  texts?: Partial<Record<ErrorKind, TextOverride>>
  /** Acciones extra (volver a la comunidad, ir a mis productos…). */
  children?: ReactNode
  className?: string
}

/**
 * Estado para una petición de React Query que falló: elige solo la
 * ilustración y el texto según el error (sin conexión, sin sesión, 403, 404 o
 * error genérico) y ofrece reintentar cuando tiene sentido.
 */
export function QueryErrorState({ error, onRetry, variant = 'inline', texts, children, className }: QueryErrorStateProps) {
  const { t } = useLanguage()
  const kind = getErrorKind(error)
  const override = texts?.[kind]

  if (kind === 'signedOut') {
    return <SignedOutState {...override} variant={variant} className={className} />
  }

  const canRetry = onRetry && (kind === 'offline' || kind === 'error')

  return (
    <ErrorState
      kind={kind}
      title={override?.title}
      description={override?.description}
      // El mensaje del backend solo aporta en un error "raro" (400, 409, 500…).
      details={kind === 'error' ? getApiErrorMessage(error) : undefined}
      variant={variant}
      className={className}
    >
      {canRetry && (
        <Button type="button" onClick={onRetry} variant={children ? 'secondary' : 'primary'}>
          {t('errors.actions.retry')}
        </Button>
      )}
      {children}
    </ErrorState>
  )
}
