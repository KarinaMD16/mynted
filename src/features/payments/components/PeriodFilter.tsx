import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/i18n/LanguageContext'
import type { PaymentPeriodFilters } from '../models/payment'

/**
 * Filtro por rango de fechas de los resúmenes de pagos (ventas del vendedor y
 * comisiones del panel de admin).
 *
 * Las fechas van en YYYY-MM-DD, que es lo que espera el backend y justo lo que
 * devuelve un `<input type="date">`. Los dos extremos son opcionales: sin
 * ninguno, el resumen es de todo el historial.
 */
export function PeriodFilter({
  value,
  onChange,
}: {
  value: PaymentPeriodFilters
  onChange: (filters: PaymentPeriodFilters) => void
}) {
  const { t } = useLanguage()
  const hasFilters = Boolean(value.from || value.to)
  // Un rango al revés no devuelve nada (el backend responde 400), así que se avisa antes.
  const isReversed = Boolean(value.from && value.to && value.from > value.to)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-3">
        <DateInput
          label={t('period.from')}
          value={value.from ?? ''}
          max={value.to}
          onChange={(from) => onChange({ ...value, from: from || undefined })}
        />
        <DateInput
          label={t('period.to')}
          value={value.to ?? ''}
          min={value.from}
          onChange={(to) => onChange({ ...value, to: to || undefined })}
        />
        {hasFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange({})}>
            {t('period.clear')}
          </Button>
        )}
      </div>

      {isReversed && (
        <p role="alert" className="text-xs text-red-500">
          {t('period.reversed')}
        </p>
      )}
    </div>
  )
}

function DateInput({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: string
  min?: string
  max?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-mynted-ink">{label}</span>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-[10px] border border-mynted-border bg-white px-3.5 py-2 text-sm text-mynted-ink outline-none transition-shadow focus:border-mynted-orange focus:ring-2 focus:ring-mynted-orange/20"
      />
    </label>
  )
}
