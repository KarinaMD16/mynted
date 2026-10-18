import type { ReactNode } from 'react'
import { useLanguage } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'

export type ErrorKind = 'notFound' | 'forbidden' | 'error'

/** Ilustraciones del ganso en /public, una por tipo de error. */
const ILLUSTRATIONS: Record<ErrorKind, string> = {
  notFound: 'not-quaound.webp',
  forbidden: 'quackbidden.webp',
  error: 'honk.webp',
}

const HTTP_CODES: Partial<Record<ErrorKind, number>> = { notFound: 404, forbidden: 403 }

function getErrorIllustrationUrl(kind: ErrorKind): string {
  return `${import.meta.env.BASE_URL}${ILLUSTRATIONS[kind]}`
}

interface ErrorStateProps {
  kind: ErrorKind
  /** Título propio (p. ej. "No encontramos este producto"); si no, el genérico del tipo. */
  title?: string
  description?: string
  /** Botones o enlaces de salida (ir al inicio, volver, reintentar…). */
  children?: ReactNode
  /**
   * page: pantalla completa, sin tarjeta (404 de una ruta, 403 del admin).
   * inline: tarjeta dentro de una página que ya tiene su propio layout.
   */
  variant?: 'page' | 'inline'
  className?: string
}

/**
 * Estado de error con la ilustración del ganso: "not quaound" (404),
 * "quackbidden" (403) y "honk" (error inesperado). Es el bloque que usan las
 * pantallas de error del router y las páginas que detectan un 404/403 del backend.
 */
export function ErrorState({ kind, title, description, children, variant = 'inline', className }: ErrorStateProps) {
  const { t } = useLanguage()
  const code = HTTP_CODES[kind]
  const defaults = {
    notFound: { title: t('errors.notFound.title'), description: t('errors.notFound.description') },
    forbidden: { title: t('errors.forbidden.title'), description: t('errors.forbidden.description') },
    error: { title: t('errors.generic.title'), description: t('errors.generic.description') },
  }[kind]

  return (
    <ErrorStateView
      kind={kind}
      code={code !== undefined ? t('errors.code', { code }) : undefined}
      title={title ?? defaults.title}
      description={description ?? defaults.description}
      variant={variant}
      className={className}
    >
      {children}
    </ErrorStateView>
  )
}

interface ErrorStateViewProps extends Omit<ErrorStateProps, 'title' | 'description'> {
  code?: string
  title: string
  description: string
}

/**
 * Solo presentación, sin useLanguage(): la usa también la pantalla de error
 * del router, que puede renderizarse fuera del LanguageProvider.
 */
export function ErrorStateView({ kind, code, title, description, children, variant = 'inline', className }: ErrorStateViewProps) {
  const isPage = variant === 'page'

  return (
    <section
      role={kind === 'error' ? 'alert' : undefined}
      aria-labelledby={`error-state-${kind}-title`}
      className={cx(
        'flex flex-col items-center text-center',
        isPage ? 'gap-2 px-4 py-10 sm:py-14' : 'gap-2 rounded-2xl border border-mynted-border bg-mynted-white px-6 py-10',
        className,
      )}
    >
      <img
        src={getErrorIllustrationUrl(kind)}
        alt=""
        aria-hidden="true"
        width={512}
        height={512}
        decoding="async"
        draggable={false}
        className={cx('pointer-events-none select-none object-contain', isPage ? 'size-56 sm:size-72' : 'size-40 sm:size-48')}
      />

      {code && (
        <span className="rounded-full bg-mynted-orange/10 px-3 py-1 text-xs font-semibold tracking-wide text-mynted-orange">
          {code}
        </span>
      )}

      {isPage ? (
        <h1 id={`error-state-${kind}-title`} className="font-heading text-2xl font-semibold text-mynted-ink sm:text-3xl">
          {title}
        </h1>
      ) : (
        <h2 id={`error-state-${kind}-title`} className="font-heading text-lg font-semibold text-mynted-ink sm:text-xl">
          {title}
        </h2>
      )}

      <p className="max-w-md text-sm text-mynted-gray">{description}</p>

      {children && <div className="mt-3 flex flex-wrap items-center justify-center gap-2">{children}</div>}
    </section>
  )
}
