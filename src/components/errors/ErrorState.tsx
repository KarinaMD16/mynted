import type { ReactNode } from 'react'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { cx } from '@/utils/cx'

/**
 * Estados con ilustración del ganso. No todos son errores: también cubren
 * "sin sesión", "vacío", "sin resultados" y "próximamente", para que todas las
 * pantallas de la app hablen el mismo idioma visual.
 */
export type ErrorKind =
  | 'notFound'
  | 'forbidden'
  | 'error'
  | 'signedOut'
  | 'offline'
  | 'noResults'
  | 'empty'
  | 'comingSoon'
  | 'expired'

/** Ilustraciones en /public, una por tipo. */
const ILLUSTRATIONS: Record<ErrorKind, string> = {
  notFound: 'not-quaound.webp',
  forbidden: 'quackbidden.webp',
  error: 'honk.webp',
  signedOut: 'cant-access.webp',
  offline: 'wheres-my-wifi.webp',
  noResults: 'mynted-state.webp',
  empty: 'just-a-goose.webp',
  comingSoon: 'honk.webp',
  expired: 'not-quaound.webp',
}

/** Prefijo de las claves i18n de cada tipo: errors.<prefijo>.title / .description. */
const TEXT_KEYS: Record<ErrorKind, string> = {
  notFound: 'notFound',
  forbidden: 'forbidden',
  error: 'generic',
  signedOut: 'signedOut',
  offline: 'offline',
  noResults: 'noResults',
  empty: 'empty',
  comingSoon: 'comingSoon',
  expired: 'expired',
}

const HTTP_CODES: Partial<Record<ErrorKind, number>> = { notFound: 404, forbidden: 403 }

/** Tipos que avisan de un problema: se anuncian a lectores de pantalla. */
const ALERT_KINDS: ReadonlySet<ErrorKind> = new Set(['error', 'offline'])

function getIllustrationUrl(kind: ErrorKind): string {
  return `${import.meta.env.BASE_URL}${ILLUSTRATIONS[kind]}`
}

export type ErrorStateVariant = 'page' | 'inline' | 'compact'

interface ErrorStateProps {
  kind: ErrorKind
  /** Título propio (p. ej. "No encontramos este producto"); si no, el genérico del tipo. */
  title?: string
  description?: string
  /** Etiqueta sobre el título (p. ej. el nombre de la sección). Reemplaza al "Error 404/403". */
  eyebrow?: string
  /** Texto chico extra, p. ej. el mensaje del backend en un error de carga. */
  details?: string
  /** Botones o enlaces de salida (ir al inicio, volver, reintentar…). */
  children?: ReactNode
  /**
   * page: pantalla completa, sin tarjeta (404 de una ruta, 403 del admin).
   * inline: tarjeta dentro de una página que ya tiene su propio layout.
   * compact: tarjeta chica para listas y pestañas (vacíos, sin resultados).
   */
  variant?: ErrorStateVariant
  className?: string
}

export function ErrorState({ kind, title, description, eyebrow, details, children, variant = 'inline', className }: ErrorStateProps) {
  const { t } = useLanguage()
  const code = HTTP_CODES[kind]
  const prefix = TEXT_KEYS[kind]

  return (
    <ErrorStateView
      kind={kind}
      code={eyebrow ?? (code !== undefined && variant !== 'compact' ? t('errors.code', { code }) : undefined)}
      title={title ?? t(`errors.${prefix}.title` as TranslationKey)}
      description={description ?? t(`errors.${prefix}.description` as TranslationKey)}
      details={details}
      variant={variant}
      className={className}
    >
      {children}
    </ErrorStateView>
  )
}

interface ErrorStateViewProps extends Omit<ErrorStateProps, 'title' | 'description' | 'eyebrow'> {
  code?: string
  title: string
  description: string
}

const VARIANT_STYLES: Record<ErrorStateVariant, { box: string; image: string; title: string }> = {
  page: {
    box: 'gap-2 px-4 py-10 sm:py-14',
    image: 'size-56 sm:size-72',
    title: 'font-heading text-2xl font-semibold text-mynted-ink sm:text-3xl',
  },
  inline: {
    box: 'gap-2 rounded-2xl border border-mynted-border bg-mynted-white px-6 py-10',
    image: 'size-40 sm:size-48',
    title: 'font-heading text-lg font-semibold text-mynted-ink sm:text-xl',
  },
  compact: {
    box: 'gap-1.5 rounded-2xl border border-dashed border-mynted-border bg-mynted-white px-6 py-8',
    image: 'size-24 sm:size-28',
    title: 'font-heading text-base font-semibold text-mynted-ink',
  },
}

/**
 * Solo presentación, sin useLanguage(): la usa también la pantalla de error
 * del router, que puede renderizarse fuera del LanguageProvider.
 */
export function ErrorStateView({
  kind,
  code,
  title,
  description,
  details,
  children,
  variant = 'inline',
  className,
}: ErrorStateViewProps) {
  const styles = VARIANT_STYLES[variant]
  const Heading = variant === 'page' ? 'h1' : 'h2'

  return (
    <section
      role={ALERT_KINDS.has(kind) ? 'alert' : undefined}
      className={cx('flex flex-col items-center text-center', styles.box, className)}
    >
      <img
        src={getIllustrationUrl(kind)}
        alt=""
        aria-hidden="true"
        width={512}
        height={512}
        decoding="async"
        loading={variant === 'page' ? 'eager' : 'lazy'}
        draggable={false}
        className={cx('pointer-events-none select-none object-contain', styles.image)}
      />

      {code && (
        <span className="rounded-full bg-mynted-orange/10 px-3 py-1 text-xs font-semibold tracking-wide text-mynted-orange">
          {code}
        </span>
      )}

      <Heading className={styles.title}>{title}</Heading>
      <p className="max-w-md text-sm text-mynted-gray">{description}</p>
      {details && <p className="max-w-md text-xs text-mynted-gray/80">{details}</p>}

      {children && <div className="mt-3 flex flex-wrap items-center justify-center gap-2">{children}</div>}
    </section>
  )
}
