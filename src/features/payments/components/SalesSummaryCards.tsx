import { useLanguage } from '@/i18n/LanguageContext'
import { formatPrice } from '@/utils/price'
import type { SalesSummary } from '../models/payment'

/**
 * Bruto, comisiones y neto del periodo elegido.
 *
 * El backend devuelve los totales en una sola moneda; si el vendedor vendió en
 * varias, convierte con el tipo de cambio y marca el resumen como aproximado.
 * En ese caso se muestra además el desglose por moneda, que sí es exacto.
 */
export function SalesSummaryCards({ summary }: { summary: SalesSummary }) {
  const { t, language } = useLanguage()
  const money = (value: number) => formatPrice(value, summary.currency, language)

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label={t('sales.summary.gross')} value={money(summary.totals.gross)} />
        <SummaryCard label={t('sales.summary.commissions')} value={`−${money(summary.totals.commissions)}`} />
        <SummaryCard label={t('sales.summary.net')} value={money(summary.totals.net)} highlight />
      </dl>

      {summary.approximate && (
        <p className="text-xs text-mynted-gray">{t('sales.summary.approximate', { currency: summary.currency })}</p>
      )}

      {summary.breakdown.length > 1 && (
        <ul className="flex flex-wrap gap-2">
          {summary.breakdown.map((row) => (
            <li key={row.currency} className="rounded-full bg-white px-3 py-1 text-xs text-mynted-gray ring-1 ring-mynted-border">
              {t('sales.summary.byCurrency', {
                currency: row.currency,
                count: row.transactionCount,
                net: formatPrice(row.net, row.currency, language),
              })}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SummaryCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-2xl border p-4 ${
        highlight ? 'border-mynted-orange/40 bg-mynted-orange/5' : 'border-mynted-border bg-white'
      }`}
    >
      <dt className="text-xs font-medium text-mynted-gray">{label}</dt>
      <dd className="font-heading text-xl font-semibold text-mynted-ink tabular-nums">{value}</dd>
    </div>
  )
}
