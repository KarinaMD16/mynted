import { Link } from '@tanstack/react-router'
import { useLanguage } from '@/i18n/LanguageContext'

/**
 * Mensaje del resultado de un intento de pago, bajo el botón "Pagar"
 * (rechazo, pasarela caída, producto vendido…). Lo comparten el checkout de
 * productos y el de Mynted Pro.
 */
export function PaymentNotice({
  tone,
  message,
  hint,
  backToShop = false,
}: {
  tone: 'error' | 'warning'
  message: string
  hint?: string
  /** Agrega el enlace de vuelta al marketplace (producto vendido o inexistente). */
  backToShop?: boolean
}) {
  const { t } = useLanguage()
  const isError = tone === 'error'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex flex-col items-start gap-2 rounded-xl px-3.5 py-3 ${
        isError ? 'bg-[#fdecec] text-[#c62a2f]' : 'bg-[#fff4d6] text-[#8a5a00]'
      }`}
    >
      <p className="text-sm font-medium">{message}</p>
      {hint && <p className="text-xs opacity-90">{hint}</p>}
      {backToShop && (
        <Link
          to="/explore"
          className="mt-1 rounded-lg border border-current/25 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-white/70"
        >
          {t('checkout.failure.backToShop')}
        </Link>
      )}
    </div>
  )
}
