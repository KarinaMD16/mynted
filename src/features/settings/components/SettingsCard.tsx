import type { ReactNode } from 'react'
import { CircleCheck } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { useLanguage } from '@/i18n/LanguageContext'

/** Tarjeta base de cada bloque de /settings: título, descripción y contenido. */
export function SettingsCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-mynted-border bg-white p-5 sm:p-6">
      <h2 className="font-heading text-lg font-semibold text-mynted-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-mynted-gray">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

/**
 * Pie de un formulario de ajustes: mensaje de error del backend o
 * "Cambios guardados" a la izquierda, y los botones a la derecha.
 */
export function SettingsFormFooter({
  error,
  showSaved,
  savedLabel,
  children,
}: {
  error?: unknown
  showSaved?: boolean
  savedLabel?: string
  children: ReactNode
}) {
  const { t } = useLanguage()

  return (
    <div className="mt-6 flex flex-col-reverse gap-3 border-t border-mynted-border pt-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-h-5 text-sm" aria-live="polite">
        {error ? (
          <p className="text-red-500" role="alert">
            {getApiErrorMessage(error)}
          </p>
        ) : showSaved ? (
          <p className="flex items-center gap-1.5 font-medium text-emerald-600">
            <CircleCheck className="size-4" aria-hidden="true" />
            {savedLabel ?? t('settings.saved')}
          </p>
        ) : null}
      </div>
      <div className="flex justify-end gap-2">{children}</div>
    </div>
  )
}

/** Fila "etiqueta: valor" de solo lectura. */
export function SettingsReadOnlyRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm text-mynted-gray">{label}</span>
      <span className="text-sm font-semibold text-mynted-ink sm:text-right">{value}</span>
    </div>
  )
}
