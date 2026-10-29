import { useForm } from '@tanstack/react-form'
import { ChevronDown, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { getFieldErrorMessage } from '@/utils/form'
import { errorClass, hintClass, labelClass } from '@/features/products/components/productFormShared'
import type { PaymentCardPayload, ShippingAddressPayload } from '../models/payment'
import {
  EMPTY_CARD_FORM,
  toCardPayload,
  validateCardForm,
  type CardFormValues,
} from '../schema/cardSchema'
import {
  EMPTY_SHIPPING_FORM,
  SHIPPING_LIMITS,
  shippingFieldErrors,
  toShippingPayload,
  type ShippingFormValues,
} from '../schema/shippingSchema'
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

/** Países a los que se puede enviar y el que se elige de entrada. */
export interface CheckoutShippingOptions {
  countries: { value: string; label: string }[]
  /** El país de quien compra si el vendedor envía ahí; si no, '' para que elija. */
  defaultCountry: string
}

type CheckoutFormValues = CardFormValues & ShippingFormValues

interface CheckoutFormProps {
  /**
   * Cobra la tarjeta. La pantalla decide qué hacer con el resultado. La
   * dirección llega solo si se pidió (`shipping`): el checkout de Pro no la usa.
   */
  onPay: (card: PaymentCardPayload, shippingAddress?: ShippingAddressPayload) => void
  /** Pide la dirección de envío, con estos países. */
  shipping?: CheckoutShippingOptions
  /** El cobro está en curso: el botón se bloquea para que no se envíe dos veces. */
  isPaying: boolean
  /**
   * Deshabilita el formulario entero (producto ya vendido, sesión vencida):
   * no tiene sentido reintentar con otra tarjeta.
   */
  disabled?: boolean
  /** Texto del botón (por defecto "Pagar"); el checkout de Pro muestra el monto: "Pagar US$41.99". */
  submitLabel?: string
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
export function CheckoutForm({ onPay, shipping, isPaying, disabled = false, submitLabel, children }: CheckoutFormProps) {
  const { t } = useLanguage()
  const allowedCountries = shipping?.countries.map((country) => country.value) ?? []

  // Tarjeta y dirección se validan juntas: un solo "Pagar" marca todo lo que falta.
  const validate = (value: CheckoutFormValues) => {
    const fields = {
      ...(shipping ? shippingFieldErrors(t, value, allowedCountries) : {}),
      ...(validateCardForm(t, value)?.fields ?? {}),
    }
    return Object.keys(fields).length > 0 ? { fields } : undefined
  }

  const form = useForm({
    defaultValues: {
      ...EMPTY_CARD_FORM,
      ...EMPTY_SHIPPING_FORM,
      country: shipping?.defaultCountry ?? '',
    } as CheckoutFormValues,
    validators: {
      onChange: ({ value }) => validate(value),
      onSubmit: ({ value }) => validate(value),
    },
    onSubmit: ({ value }) => {
      const card = toCardPayload(value)
      if (card) onPay(card, shipping ? toShippingPayload(value) : undefined)
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
      {shipping && (
        <form.Subscribe selector={(state) => state.submissionAttempts > 0}>
          {(attempted) => (
            <fieldset disabled={disabled} className="flex flex-col gap-5 border-b border-mynted-border pb-6">
              <div className="flex flex-col gap-1">
                <legend className="font-heading text-lg font-semibold text-mynted-ink">{t('checkout.shipping.title')}</legend>
                <p className={hintClass}>{t('checkout.shipping.subtitle')}</p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <form.Field name="fullName">
                  {(field) => (
                    <TextField
                      label={t('checkout.shipping.fullName')}
                      autoComplete="shipping name"
                      maxLength={SHIPPING_LIMITS.fullName.max}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      error={fieldError(field.state.meta, attempted)}
                    />
                  )}
                </form.Field>
                <form.Field name="phone">
                  {(field) => (
                    <TextField
                      label={t('checkout.shipping.phone')}
                      type="tel"
                      autoComplete="shipping tel"
                      maxLength={SHIPPING_LIMITS.phone.max}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      error={fieldError(field.state.meta, attempted)}
                    />
                  )}
                </form.Field>
              </div>

              {/* Solo los países a los que envía el vendedor: el backend rechaza el resto. */}
              <form.Field name="country">
                {(field) => {
                  const error = fieldError(field.state.meta, attempted)
                  return (
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="checkout-shipping-country" className={labelClass}>
                        {t('checkout.shipping.country')}
                      </label>
                      <Select
                        id="checkout-shipping-country"
                        value={field.state.value}
                        options={shipping.countries}
                        placeholder={t('checkout.shipping.countryPlaceholder')}
                        searchable={shipping.countries.length > 8}
                        searchPlaceholder={t('select.searchPlaceholder')}
                        emptyLabel={(query) => t('select.noOptions', { query })}
                        disabled={disabled}
                        invalid={Boolean(error)}
                        onChange={(value) => field.handleChange(value)}
                        onBlur={field.handleBlur}
                      />
                      {error && <span className={errorClass}>{error}</span>}
                    </div>
                  )
                }}
              </form.Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <form.Field name="province">
                  {(field) => (
                    <TextField
                      label={t('checkout.shipping.province')}
                      autoComplete="shipping address-level1"
                      maxLength={SHIPPING_LIMITS.province.max}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      error={fieldError(field.state.meta, attempted)}
                    />
                  )}
                </form.Field>
                <form.Field name="city">
                  {(field) => (
                    <TextField
                      label={t('checkout.shipping.city')}
                      autoComplete="shipping address-level2"
                      maxLength={SHIPPING_LIMITS.city.max}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      error={fieldError(field.state.meta, attempted)}
                    />
                  )}
                </form.Field>
              </div>

                <form.Field name="line1">
                  {(field) => (
                    <TextField
                      label={t('checkout.shipping.line1')}
                      placeholder={t('checkout.shipping.line1Placeholder')}
                      autoComplete="shipping address-line1"
                      maxLength={SHIPPING_LIMITS.line1.max}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      error={fieldError(field.state.meta, attempted)}
                    />
                  )}
                </form.Field>

              <div className="grid gap-5 sm:grid-cols-[1fr_160px]">
                <form.Field name="line2">
                  {(field) => (
                    <TextField
                      label={t('checkout.shipping.line2')}
                      autoComplete="shipping address-line2"
                      maxLength={SHIPPING_LIMITS.line2.max}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      error={fieldError(field.state.meta, attempted)}
                    />
                  )}
                </form.Field>
                <form.Field name="postalCode">
                  {(field) => (
                    <TextField
                      label={t('checkout.shipping.postalCode')}
                      autoComplete="shipping postal-code"
                      maxLength={SHIPPING_LIMITS.postalCode.max}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      error={fieldError(field.state.meta, attempted)}
                    />
                  )}
                </form.Field>
              </div>

                <form.Field name="notes">
                  {(field) => (
                    <TextField
                      label={t('checkout.shipping.notes')}
                      placeholder={t('checkout.shipping.notesPlaceholder')}
                      maxLength={SHIPPING_LIMITS.notes.max}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      error={fieldError(field.state.meta, attempted)}
                    />
                  )}
                </form.Field>
            </fieldset>
          )}
        </form.Subscribe>
      )}

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
        {isPaying ? t('checkout.form.processing') : (submitLabel ?? t('checkout.form.submit'))}
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
