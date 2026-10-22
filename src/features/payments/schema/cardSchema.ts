import { z } from 'zod'
import type { TranslateFn } from '@/i18n/LanguageContext'
import { cardDigits, isFutureExpiry, isValidCardNumber, isValidCvv, parseExpiry } from '../utils/card'

/**
 * Valores del formulario de tarjeta. Se guardan como se ven en pantalla
 * (con espacios y con la barra del vencimiento) y se normalizan al enviar.
 */
export interface CardFormValues {
  /** Agrupado de a 4: "4242 4242 4242 4242". */
  cardNumber: string
  /** "MM/AA". */
  expiry: string
  cvv: string
  /** Nombre del titular, como aparece en la tarjeta. */
  holderName: string
}

/**
 * Lo mismo que hace el backend antes de validar (ver normalizeCardHolderName
 * en payment-card.dto.ts): junta las tildes compuestas, recorta y deja un
 * solo espacio entre palabras. Se aplica acá también para que el error que se
 * muestra sea el del nombre que de verdad se va a enviar.
 */
export function normalizeHolderName(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ')
}

/**
 * Letras (con tildes y ñ), espacios, apóstrofes, guiones y puntos, empezando
 * por una letra. Es el CARD_HOLDER_NAME_PATTERN del backend.
 */
const HOLDER_NAME_PATTERN = /^\p{L}[\p{L}\p{M} '’.-]*$/u

const HOLDER_NAME_MIN = 2
const HOLDER_NAME_MAX = 80

export const EMPTY_CARD_FORM: CardFormValues = {
  cardNumber: '',
  expiry: '',
  cvv: '',
  holderName: '',
}

/**
 * Las mismas reglas que aplica la pasarela (ver utils/card.ts), para avisar
 * del error de tipeo antes de mandar nada. Se arma con `t` para que los
 * mensajes salgan en el idioma activo, igual que makeProductFormSchema.
 */
export function makeCardSchema(t: TranslateFn) {
  return z.object({
    cardNumber: z
      .string()
      .min(1, t('validation.card.numberRequired'))
      .refine(isValidCardNumber, t('validation.card.numberInvalid')),
    expiry: z
      .string()
      .min(1, t('validation.card.expiryRequired'))
      .refine((value) => parseExpiry(value) !== null, t('validation.card.expiryFormat'))
      .refine((value) => {
        const parsed = parseExpiry(value)
        return parsed === null || isFutureExpiry(parsed.month, parsed.year)
      }, t('validation.card.expiryPast')),
    cvv: z.string().min(1, t('validation.card.cvvRequired')).refine(isValidCvv, t('validation.card.cvvInvalid')),
    holderName: z
      .string()
      .transform(normalizeHolderName)
      .refine((value) => value !== '', t('validation.card.holderRequired'))
      .refine(
        (value) => value === '' || (value.length >= HOLDER_NAME_MIN && value.length <= HOLDER_NAME_MAX),
        t('validation.card.holderLength', { min: HOLDER_NAME_MIN, max: HOLDER_NAME_MAX }),
      )
      .refine((value) => value === '' || HOLDER_NAME_PATTERN.test(value), t('validation.card.holderFormat')),
  })
}

/** Valida el formulario completo; devuelve `undefined` si está bien. */
export function validateCardForm(t: TranslateFn, value: CardFormValues) {
  const result = makeCardSchema(t).safeParse(value)
  if (result.success) return undefined

  const fields: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? '')
    if (key && !(key in fields)) fields[key] = issue.message
  }
  return { fields }
}

/**
 * Pasa los valores del formulario al formato de PaymentCardDto: solo dígitos,
 * el mes y el año de 4 cifras. Devuelve null si el vencimiento no se puede
 * leer (no debería llegar acá: el schema ya lo validó).
 */
export function toCardPayload(values: CardFormValues) {
  const expiry = parseExpiry(values.expiry)
  if (expiry === null) return null

  return {
    cardNumber: cardDigits(values.cardNumber),
    expiryMonth: expiry.month,
    expiryYear: expiry.year,
    cvv: values.cvv,
    cardHolderName: normalizeHolderName(values.holderName),
  }
}
