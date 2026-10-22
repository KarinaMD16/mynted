import { Link } from '@tanstack/react-router'
import { useLanguage } from '@/i18n/LanguageContext'
import { formatPrice } from '@/utils/price'
import type { SaleItem } from '../models/payment'
import { formatPaymentDateShort, formatRate } from '../utils/paymentFormat'

/**
 * Historial de ventas con el detalle de la comisión de cada una: fecha,
 * producto, comprador, bruto, nivel, rango de precio, tasa, comisión y neto.
 *
 * Desde md es una tabla; en pantallas angostas, nueve columnas no caben, así
 * que cada venta pasa a ser una tarjeta con los mismos datos.
 */
export function SalesTable({ sales }: { sales: SaleItem[] }) {
  const { t } = useLanguage()

  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-mynted-border bg-white md:block">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <caption className="sr-only">{t('sales.table.caption')}</caption>
          <thead>
            <tr className="border-b border-mynted-border">
              <HeaderCell>{t('sales.column.date')}</HeaderCell>
              <HeaderCell>{t('sales.column.product')}</HeaderCell>
              <HeaderCell>{t('sales.column.buyer')}</HeaderCell>
              <HeaderCell align="right">{t('sales.column.gross')}</HeaderCell>
              <HeaderCell>{t('sales.column.tier')}</HeaderCell>
              <HeaderCell>{t('sales.column.priceTier')}</HeaderCell>
              <HeaderCell align="right">{t('sales.column.rate')}</HeaderCell>
              <HeaderCell align="right">{t('sales.column.commission')}</HeaderCell>
              <HeaderCell align="right">{t('sales.column.net')}</HeaderCell>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <SaleRow key={sale.id} sale={sale} />
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {sales.map((sale) => (
          <li key={sale.id}>
            <SaleCard sale={sale} />
          </li>
        ))}
      </ul>
    </>
  )
}

function HeaderCell({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      scope="col"
      className={`px-3 py-2.5 text-xs font-semibold text-mynted-gray ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      {children}
    </th>
  )
}

function SaleRow({ sale }: { sale: SaleItem }) {
  const { language } = useLanguage()
  const money = (value: number) => formatPrice(value, sale.currency, language)

  return (
    <tr className="border-b border-mynted-border last:border-0">
      <td className="px-3 py-2.5 whitespace-nowrap text-mynted-gray">{formatPaymentDateShort(sale.completedAt, language)}</td>
      <td className="max-w-[220px] px-3 py-2.5">
        <Link
          to="/compras/$transactionId"
          params={{ transactionId: sale.id }}
          className="line-clamp-1 font-medium text-mynted-ink hover:underline"
        >
          {sale.product.title}
        </Link>
      </td>
      <td className="px-3 py-2.5">
        <Link to="/users/$userId" params={{ userId: sale.buyer.id }} className="text-mynted-gray hover:text-mynted-ink hover:underline">
          {sale.buyer.username}
        </Link>
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-mynted-ink">{money(sale.amount)}</td>
      <td className="px-3 py-2.5 text-mynted-gray">{sale.salesTierName}</td>
      <td className="px-3 py-2.5 text-mynted-gray">{sale.priceTierName}</td>
      <td className="px-3 py-2.5 text-right tabular-nums text-mynted-gray">{formatRate(sale.commissionRate, language)}</td>
      <td className="px-3 py-2.5 text-right tabular-nums text-mynted-gray">−{money(sale.commissionAmount)}</td>
      <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-mynted-ink">{money(sale.sellerNet)}</td>
    </tr>
  )
}

/** La misma venta en pantallas angostas, donde la tabla no cabe. */
function SaleCard({ sale }: { sale: SaleItem }) {
  const { t, language } = useLanguage()
  const money = (value: number) => formatPrice(value, sale.currency, language)

  return (
    <article className="flex flex-col gap-2 rounded-2xl border border-mynted-border bg-white p-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <Link
          to="/compras/$transactionId"
          params={{ transactionId: sale.id }}
          className="line-clamp-1 font-heading text-sm font-semibold text-mynted-ink hover:underline"
        >
          {sale.product.title}
        </Link>
        <span className="shrink-0 text-xs text-mynted-gray">{formatPaymentDateShort(sale.completedAt, language)}</span>
      </div>

      <p className="text-xs text-mynted-gray">{t('sales.card.buyer', { name: sale.buyer.username })}</p>

      <dl className="flex flex-col gap-1 border-t border-mynted-border pt-2 text-xs">
        <CardRow label={t('sales.column.gross')} value={money(sale.amount)} />
        <CardRow label={t('sales.card.tiers')} value={`${sale.salesTierName} · ${sale.priceTierName}`} />
        <CardRow
          label={t('sales.column.commission')}
          value={`−${money(sale.commissionAmount)} (${formatRate(sale.commissionRate, language)})`}
        />
        <CardRow label={t('sales.column.net')} value={money(sale.sellerNet)} strong />
      </dl>
    </article>
  )
}

function CardRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-mynted-gray">{label}</dt>
      <dd className={strong ? 'font-semibold text-mynted-ink' : 'text-mynted-ink'}>{value}</dd>
    </div>
  )
}
