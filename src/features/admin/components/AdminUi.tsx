import type { ComponentType, ReactNode } from 'react'
import { Info } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { GooseIcon } from '@/components/ui/GooseIcon'
import { useLanguage } from '@/i18n/LanguageContext'
import { Button } from '@/components/ui/Button'

/**
 * Piezas visuales compartidas por las secciones del panel de superadmin
 * (ver AdminPage). Siguen el mockup de referencia: tarjetas blancas con
 * borde suave, píldoras de estado con fondo pastel y acciones como íconos.
 */

// ---------------------------------------------------------------------------
// Tarjetas
// ---------------------------------------------------------------------------

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'orange',
}: {
  label: string
  value: number | string | undefined
  icon: ComponentType<{ className?: string }>
  tone?: PillTone
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-mynted-border bg-white px-5 py-4">
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${PILL_TONES[tone]}`}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="font-heading text-2xl font-semibold text-mynted-ink">
          {typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}
        </p>
        <p className="truncate text-sm text-mynted-gray">{label}</p>
      </div>
    </div>
  )
}

export function StatCardSkeleton() {
  return <div className="h-[84px] animate-pulse rounded-2xl border border-mynted-border bg-white" />
}

/** Contenedor blanco con título, para los bloques del tab "Resumen". */
export function Panel({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-mynted-border bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-heading text-base font-semibold text-mynted-ink">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

/** Barras horizontales simples para distribuciones (usuarios por rol, comunidades por categoría...). */
export function DistributionList({
  items,
  emptyLabel,
}: {
  items: { label: string; value: number }[]
  emptyLabel: string
}) {
  const max = Math.max(1, ...items.map((item) => item.value))
  if (items.length === 0) return <p className="py-6 text-center text-sm text-mynted-gray">{emptyLabel}</p>

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.label} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-mynted-ink">{item.label}</span>
            <span className="shrink-0 font-semibold text-mynted-ink tabular-nums">{item.value.toLocaleString()}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-mynted-bg">
            <div
              className="h-full rounded-full bg-mynted-orange"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------------
// Píldoras de estado
// ---------------------------------------------------------------------------

export type PillTone = 'violet' | 'teal' | 'amber' | 'red' | 'gray' | 'orange' | 'blue'

const PILL_TONES: Record<PillTone, string> = {
  violet: 'bg-violet-50 text-violet-600',
  teal: 'bg-teal-50 text-teal-600',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-600',
  gray: 'bg-mynted-bg text-mynted-gray',
  orange: 'bg-orange-50 text-mynted-orange',
  blue: 'bg-blue-50 text-mynted-blue-mid',
}

export function StatusPill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-medium whitespace-nowrap ${PILL_TONES[tone]}`}>
      {children}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Avatares y celdas
// ---------------------------------------------------------------------------

export function Avatar({
  src,
  name,
  square = false,
  size = 'md',
}: {
  src?: string | null
  name: string
  square?: boolean
  size?: 'md' | 'lg'
}) {
  const shape = square ? 'rounded-xl' : 'rounded-full'
  const dimensions = size === 'lg' ? 'size-20 text-2xl' : 'size-10 text-sm'
  if (src) {
    return <img src={src} alt="" className={`shrink-0 object-cover ${dimensions} ${shape}`} />
  }
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center bg-mynted-orange font-heading font-semibold text-white ${dimensions} ${shape}`}
    >
      {name ? name.charAt(0).toUpperCase() : <GooseIcon className="size-5" />}
    </span>
  )
}

/** Celda de dos líneas (nombre + dato secundario) con avatar, como la columna "Name" del mockup. */
export function IdentityCell({
  avatar,
  title,
  subtitle,
  badge,
}: {
  avatar: ReactNode
  /** Texto o un nombre interactivo (p. ej. UserHoverName en el tab "Resumen"). */
  title: ReactNode
  subtitle?: string
  badge?: ReactNode
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {avatar}
      <div className="min-w-0">
        <p className="flex items-center gap-2 truncate text-sm font-medium text-mynted-ink">
          <span className="truncate">{title}</span>
          {badge}
        </p>
        {subtitle && <p className="truncate text-sm text-mynted-gray">{subtitle}</p>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Acciones
// ---------------------------------------------------------------------------

/**
 * Botón de ícono para la columna "Acción". Si está deshabilitado se explica
 * el motivo con `title` (tooltip nativo) y también en el aria-label, así el
 * lector de pantalla lo anuncia igual que se ve.
 */
export function IconAction({
  icon: Icon,
  label,
  onPress,
  disabled = false,
  disabledReason,
  tone = 'default',
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  onPress?: () => void
  disabled?: boolean
  disabledReason?: string
  tone?: 'default' | 'danger' | 'success'
}) {
  const hint = disabled && disabledReason ? `${label} · ${disabledReason}` : label
  const toneClass =
    tone === 'danger'
      ? 'hover:bg-red-50 hover:text-red-600'
      : tone === 'success'
        ? 'hover:bg-teal-50 hover:text-teal-600'
        : 'hover:bg-mynted-bg hover:text-mynted-ink'

  return (
    <Button
      onClick={onPress}
      disabled={disabled}
      title={hint}
      aria-label={hint}
      variant="ghost"
      size="icon-sm"
      className={disabled ? 'disabled:opacity-40 hover:bg-transparent hover:text-mynted-gray' : toneClass}
    >
      <Icon className="size-4" aria-hidden="true" />
    </Button>
  )
}

export function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-mynted-ink">
      <span className="shrink-0">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-9 cursor-pointer rounded-lg border border-mynted-border bg-white px-2.5 text-sm text-mynted-ink outline-none focus-visible:border-mynted-blue-mid"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

// ---------------------------------------------------------------------------
// Avisos y confirmaciones
// ---------------------------------------------------------------------------

/** Error al cargar los datos del tab "Resumen" (en "Gestionar" lo muestra la tabla). */
export function LoadErrorPanel({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useLanguage()
  return (
    <div className="rounded-2xl border border-mynted-border bg-white px-6 py-14 text-center" role="alert">
      <p className="text-sm font-semibold text-mynted-ink">{t('admin.table.loadError')}</p>
      <p className="mt-1 text-sm text-mynted-gray">{getApiErrorMessage(error)}</p>
      <Button
        type="button"
        onClick={onRetry}
        variant="secondary"
        size="sm"
        className="mt-4"
      >
        {t('communities.list.retry')}
      </Button>
    </div>
  )
}

/** Aviso para funciones que el backend todavía no soporta (Comunidades, Categorías). */
export function ReadOnlyNotice({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm" role="note">
      <Info className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden="true" />
      <div>
        <p className="font-semibold text-amber-900">{title}</p>
        <p className="mt-0.5 text-amber-800">{description}</p>
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = 'danger',
  isPending,
  error,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  tone?: 'danger' | 'primary'
  isPending: boolean
  error: unknown
  onConfirm: () => void
  onClose: () => void
}) {
  const { t } = useLanguage()

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isPending && onClose()}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            onClick={onClose}
            disabled={isPending}
            variant="secondary"
            size="md"
          >
            {t('profile.edit.cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            variant={tone === 'danger' ? 'destructive' : 'primary'}
            size="md"
            isLoading={isPending}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>

        {Boolean(error) && (
          <p className="mt-3 text-sm text-red-500" role="alert">
            {getApiErrorMessage(error)}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
