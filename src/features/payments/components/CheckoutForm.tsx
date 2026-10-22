import { useForm } from '@tanstack/react-form'
import { ChevronDown, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { getFieldErrorMessage } from '@/utils/form'
import { hintClass } from '@/features/products/components/productFormShared'
import type { PaymentCardPayload } from '../models/payment'
import {
  EMPTY_CARD_FORM,
  toCardPayload,
  validateCardForm,
  type CardFormValues,
} from '../schema/cardSchema'
import { TEST_CARDS, detectCardBrand, formatCardNumber, formatExpiry, type CardBrand } from '../utils/card'

const BRAND_LABEL: Record<Exclude<CardBrand, 'unknown'>, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
}

/** Qué le pasa a cada tarjeta de prueba, para el desplegable del aviso. */
const TEST_CARD_LABEL: Record<(typeof TEST_CARDS)[number]['outcome'], TranslationKey> = {
  approved: 'checkout.testCards.approved',
  card_declined: 'checkout.failure.cardDeclined',
  insufficient_funds: 'checkout.failure.insufficientFunds',
  expired_card: 'checkout.failure.expiredCard',
}

/**
 * Mensaje de error de un campo: se muestra cuando ya se tocó, o cuando se
 * intentó enviar el formulario (un campo vacío que nunca se tocó también
 * tiene que explicarse al apretar "Pagar").
 */
function fieldError(meta: { isTouched: boolean; errors: unknown[] }, attempted: boolean) {
  return meta.isTouched || attempted ? getFieldErrorMessage(meta.errors) : undefined
}

interface CheckoutFormProps {
  /** Cobra la tarjeta. La pantalla decide qué hacer con el resultado. */
  onPay: (card: PaymentCardPayload) => void
  /** El cobro está en curso: el botón se bloquea para que no se envíe dos veces. */
  isPaying: boolean
  /**
   * Deshabilita el formulario entero (producto ya vendido, sesión vencida):
   * no tiene sentido reintentar con otra tarjeta.
   */
  disabled?: boolean
  /** Mensajes de estado del pago (rechazo, producto vendido…), bajo el botón. */
  children?: React.ReactNode
}

/**
 * Formulario de tarjeta del checkout.
 *
 * Valida en el navegador antes de enviar nada (Luhn, vencimiento futuro, CVV)
 * con las mismas reglas de la pasarela, y al rechazarse un pago NO se limpia:
 * el nombre del titular y el vencimiento se conservan para reintentar, que es
 * lo que pide el flujo de estados. Lo único que no se guarda en ningún lado es
 * la tarjeta: vive en el estado del formulario mientras la pantalla está
 * abierta y se manda una sola vez.
 */
export function CheckoutForm({ onPay, isPaying, disabled = false, children }: CheckoutFormProps) {
  const { t } = useLanguage()

  const form = useForm({
    defaultValues: EMPTY_CARD_FORM as CardFormValues,
    validators: {
      onChange: ({ value }) => validateCardForm(t, value),
      onSubmit: ({ value }) => validateCardForm(t, value),
    },
    onSubmit: ({ value }) => {
      const card = toCardPayload(value)
      if (card) onPay(card)
    },
  })

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
      className="flex flex-col gap-5 rounded-2xl border border-mynted-border bg-white p-5 sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-semibold text-mynted-ink">{t('checkout.form.title')}</h2>
        <p className={hintClass}>{t('checkout.form.subtitle')}</p>
      </div>

      <SimulatedNotice />

      {/*
        Un error se muestra cuando el campo ya se tocó o cuando se intentó
        enviar: si no, apretar "Pagar" con un campo vacío que nunca se tocó no
        diría nada y el formulario parecería no hacer nada.
      */}
      <form.Subscribe selector={(state) => state.submissionAttempts > 0}>
        {(attempted) => (
          <div className="flex flex-col gap-5">
            <form.Field name="cardNumber">
              {(field) => {
                const brand = detectCardBrand(field.state.value)
                return (
                  <div className="flex flex-col gap-1.5">
                    <TextField
                      label={t('checkout.form.cardNumber')}
                      placeholder="4242 4242 4242 4242"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      disabled={disabled}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(formatCardNumber(event.target.value))}
                      onBlur={field.handleBlur}
                      error={fieldError(field.state.meta, attempted)}
                    />
                    {brand !== 'unknown' && <span className={hintClass}>{BRAND_LABEL[brand]}</span>}
                  </div>
                )
              }}
            </form.Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <form.Field name="expiry">
                {(field) => (
                  <TextField
                    label={t('checkout.form.expiry')}
                    placeholder={t('checkout.form.expiryPlaceholder')}
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    disabled={disabled}
                    value={field.state.value}
                    onChange={(event) => field.handleChange(formatExpiry(event.target.value))}
                    onBlur={field.handleBlur}
                    error={fieldError(field.state.meta, attempted)}
                  />
                )}
              </form.Field>

              <form.Field name="cvv">
                {(field) => (
                  <TextField
                    label={t('checkout.form.cvv')}
                    placeholder="123"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    maxLength={4}
                    disabled={disabled}
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value.replace(/\D/g, '').slice(0, 4))}
                    onBlur={field.handleBlur}
                    error={fieldError(field.state.meta, attempted)}
                  />
                )}
              </form.Field>
            </div>

            <form.Field name="holderName">
              {(field) => (
                <TextField
                  label={t('checkout.form.holder')}
                  placeholder={t('checkout.form.holderPlaceholder')}
                  autoComplete="cc-name"
                  disabled={disabled}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  error={fieldError(field.state.meta, attempted)}
                />
              )}
            </form.Field>
          </div>
        )}
      </form.Subscribe>

      <Button type="submit" size="lg" fullWidth isLoading={isPaying} disabled={disabled}>
        {isPaying ? t('checkout.form.processing') : t('checkout.form.submit')}
      </Button>

      {children}
    </form>
  )
}

/**
 * Aviso de que el pago es simulado, con las tarjetas de prueba para llegar a
 * cada desenlace. Va dentro del formulario y arriba de los campos: tiene que
 * verse antes de escribir una tarjeta, no después.
 */
function SimulatedNotice() {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-[#fff4d6] px-3.5 py-3">
      <p className="flex items-start gap-2 text-sm font-medium text-[#8a5a00]">
        <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {t('checkout.simulated.notice')}
      </p>

      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-[#8a5a00] outline-none focus-visible:underline">
          {t('checkout.testCards.toggle')}
          <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <ul className="mt-2 flex flex-col gap-1.5">
          {TEST_CARDS.map((card) => (
            <li key={card.number} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-xs text-[#8a5a00]">
              <code className="font-mono">{formatCardNumber(card.number)}</code>
              <span>{t(TEST_CARD_LABEL[card.outcome])}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-[#8a5a00]/80">{t('checkout.testCards.hint')}</p>
      </details>
    </div>
  )
}
