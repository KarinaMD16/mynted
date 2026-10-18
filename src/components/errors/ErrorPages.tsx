import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { Button } from '@/components/ui/Button'
import { useLanguage, type TranslateFn } from '@/i18n/LanguageContext'
import { es, type TranslationKey } from '@/i18n/translations/es'
import { ErrorState, ErrorStateView } from './ErrorState'

/** Estilo de los enlaces de salida, igual al botón primario del resto de la app. */
export const errorPrimaryLinkClass =
  'rounded-[10px] bg-mynted-orange px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-mynted-orange-hover'

/** Ir al inicio + volver a la pantalla anterior (si hay historial). */
function DefaultActions() {
  const { t } = useLanguage()
  const router = useRouter()
  const canGoBack = typeof window !== 'undefined' && window.history.length > 1

  return (
    <>
      <Link to="/" className={errorPrimaryLinkClass}>
        {t('errors.actions.home')}
      </Link>
      {canGoBack && (
        <Button type="button" variant="secondary" onClick={() => router.history.back()}>
          {t('errors.actions.back')}
        </Button>
      )}
    </>
  )
}

/** 404 de una ruta que no existe (notFoundComponent del router). */
export function NotFoundPage() {
  return (
    <div className="min-h-svh bg-mynted-bg">
      <SiteHeader />
      <main className="mx-auto flex max-w-[1320px] justify-center px-4 sm:px-6">
        <ErrorState kind="notFound" variant="page">
          <DefaultActions />
        </ErrorState>
      </main>
    </div>
  )
}

interface ForbiddenPageProps {
  title?: string
  description?: string
}

/** 403 a pantalla completa: hay sesión, pero la cuenta no tiene permiso (p. ej. /admin sin ser superadmin). */
export function ForbiddenPage({ title, description }: ForbiddenPageProps) {
  return (
    <div className="min-h-svh bg-mynted-bg">
      <SiteHeader />
      <main className="mx-auto flex max-w-[1320px] justify-center px-4 sm:px-6">
        <ErrorState kind="forbidden" variant="page" title={title} description={description}>
          <DefaultActions />
        </ErrorState>
      </main>
    </div>
  )
}

/**
 * Traductor que no revienta fuera del LanguageProvider: si el error ocurrió
 * en la ruta raíz (App), esta pantalla se dibuja sin proveedor de idioma y se
 * usa el español por defecto.
 */
function useSafeTranslate(): TranslateFn {
  try {
    return useLanguage().t
  } catch {
    return (key: TranslationKey, params) =>
      Object.entries(params ?? {}).reduce<string>(
        (text, [name, value]) => text.replaceAll(`{{${name}}}`, String(value)),
        es[key] ?? key,
      )
  }
}

/**
 * Error inesperado al renderizar una ruta (defaultErrorComponent del router).
 * No usa SiteHeader a propósito: si el error vino del header, mostrarlo de
 * nuevo volvería a fallar.
 */
export function RouteErrorPage({ error, reset }: ErrorComponentProps) {
  const t = useSafeTranslate()
  const router = useRouter()

  const retry = () => {
    reset()
    void router.invalidate()
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-mynted-bg px-4">
      <ErrorStateView kind="error" variant="page" title={t('errors.generic.title')} description={t('errors.generic.description')}>
        <Button type="button" onClick={retry}>
          {t('errors.actions.retry')}
        </Button>
        <a href="/" className="rounded-[10px] px-5 py-2.5 text-sm font-semibold text-mynted-ink hover:bg-mynted-white">
          {t('errors.actions.home')}
        </a>
      </ErrorStateView>
      {import.meta.env.DEV && error instanceof Error && (
        <pre className="fixed right-4 bottom-4 left-4 max-h-40 overflow-auto rounded-lg bg-mynted-ink/90 p-3 text-left text-xs text-white">
          {error.message}
        </pre>
      )}
    </div>
  )
}
