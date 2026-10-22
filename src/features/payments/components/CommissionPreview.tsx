import { useEffect, useState } from 'react'
import { useLanguage } from '@/i18n/LanguageContext'
import { formatPrice } from '@/utils/price'
import { useCommissionEstimate } from '../hooks/usePaymentQueries'
import { formatRate } from '../utils/paymentFormat'

/** Pausa antes de consultar: se escribe un precio dígito a dígito. */
const DEBOUNCE_MS = 400

/**
 * "Recibirás aprox. ₡X" bajo el precio al publicar un producto.
 *
 * Consulta GET /sellers/me/commission/estimate con el precio ya escrito, tras
 * una pausa, y muestra el rango que aplica, la comisión y el neto. Si el
 * precio todavía no es un número válido no consulta nada; si la petición
 * falla, no muestra nada: es información de apoyo, no puede romper el
 * formulario.
 */
export function CommissionPreview({ price, currency }: { price: string; currency: string | null | undefined }) {
  const { t, language } = useLanguage()
  const [debounced, setDebounced] = useState<number | null>(null)

  useEffect(() => {
    const parsed = Number(price.trim())
    const amount = price.trim() !== '' && Number.isFinite(parsed) && parsed > 0 ? parsed : null
    const timer = window.setTimeout(() => setDebounced(amount), DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [price])

  const estimate = useCommissionEstimate(debounced)
  if (!estimate.data || debounced === null) return null

  const { commissionRate, commissionAmount, sellerNet, priceTierName, salesTierName } = estimate.data
  // La moneda de la estimación es la del vendedor, la misma en la que publica.
  const money = (value: number) => formatPrice(value, currency ?? estimate.data.currency, language)

  return (
    <div className="flex flex-col gap-1 rounded-xl bg-mynted-bg px-3.5 py-2.5">
      <p className="text-sm font-semibold text-mynted-ink">
        {t('commission.preview.net', { amount: money(sellerNet) })}
      </p>
      <p className="text-xs text-mynted-gray">
        {t('commission.preview.detail', {
          rate: formatRate(commissionRate, language),
          amount: money(commissionAmount),
        })}
      </p>
      <p className="text-xs text-mynted-gray">
        {t('commission.preview.tiers', { price: priceTierName, sales: salesTierName })}
      </p>
    </div>
  )
}
