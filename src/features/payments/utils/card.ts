/**
 * Validación y formato de tarjetas, en el navegador.
 *
 * Es la misma lógica que `payments/gateway/card-validation.ts` en el backend
 * (Luhn, vencimiento futuro, CVV de 3–4 dígitos, marca por los primeros
 * dígitos). Se repite acá a propósito: así el formulario avisa del error de
 * tipeo antes de mandar la tarjeta a ningún lado. El backend igual vuelve a
 * validar — esto no lo reemplaza.
 */

export type CardBrand = 'visa' | 'mastercard' | 'unknown'

/** Largos aceptados por la pasarela (mismo rango que el backend). */
const MIN_CARD_DIGITS = 12
const MAX_CARD_DIGITS = 19

/** Deja solo los dígitos: el input se escribe con espacios. */
export function cardDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/** Agrupa de a 4 mientras se escribe ("4242424242424242" -> "4242 4242 4242 4242"). */
export function formatCardNumber(value: string): string {
  return cardDigits(value).slice(0, MAX_CARD_DIGITS).replace(/(\d{4})(?=\d)/g, '$1 ')
}

/** Marca de la tarjeta por sus primeros dígitos (igual que `detectCardBrand` del backend). */
export function detectCardBrand(value: string): CardBrand {
  const digits = cardDigits(value)
  if (digits.startsWith('4')) return 'visa'

  const firstTwo = Number(digits.slice(0, 2))
  const firstFour = Number(digits.slice(0, 4))
  if ((firstTwo >= 51 && firstTwo <= 55) || (firstFour >= 2221 && firstFour <= 2720)) {
    return 'mastercard'
  }
  return 'unknown'
}

/** Algoritmo de Luhn: detecta un dígito mal tecleado, no que la tarjeta exista. */
export function isValidLuhn(value: string): boolean {
  const digits = cardDigits(value)
  if (digits.length === 0) return false

  let sum = 0
  let double = false
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index])
    if (double) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    double = !double
  }
  return sum % 10 === 0
}

/** Número con largo válido y Luhn correcto. */
export function isValidCardNumber(value: string): boolean {
  const digits = cardDigits(value)
  return digits.length >= MIN_CARD_DIGITS && digits.length <= MAX_CARD_DIGITS && isValidLuhn(digits)
}

/** "MM/AA" -> mes y año de 4 dígitos; null si el texto no tiene esa forma. */
export function parseExpiry(value: string): { month: number; year: number } | null {
  const digits = cardDigits(value)
  if (digits.length !== 4) return null

  const month = Number(digits.slice(0, 2))
  // Las tarjetas se imprimen con dos dígitos de año: 27 es 2027.
  const year = 2000 + Number(digits.slice(2))
  if (!Number.isInteger(month) || month < 1 || month > 12) return null
  return { month, year }
}

/** Agrupa el vencimiento mientras se escribe ("1227" -> "12/27"). */
export function formatExpiry(value: string): string {
  const digits = cardDigits(value).slice(0, 4)
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`
}

/**
 * El vencimiento no puede haber pasado. El mes del vencimiento cuenta como
 * válido completo: una tarjeta que vence 12/27 sirve todo diciembre de 2027.
 */
export function isFutureExpiry(month: number, year: number, now = new Date()): boolean {
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  return year > currentYear || (year === currentYear && month >= currentMonth)
}

export function isValidCvv(value: string): boolean {
  return /^\d{3,4}$/.test(value)
}

/**
 * Tarjetas de prueba de la pasarela simulada (ver SimulatedPaymentGateway en
 * el backend). Se muestran en el checkout para poder probar cada desenlace;
 * no son tarjetas reales y no existe ningún cobro detrás.
 *
 * Cualquier otro número que pase Luhn también se rechaza, con `card_declined`.
 */
export const TEST_CARDS = [
  { number: '4242424242424242', outcome: 'approved' },
  { number: '4000000000000002', outcome: 'card_declined' },
  { number: '4000000000009995', outcome: 'insufficient_funds' },
  { number: '4000000000000069', outcome: 'expired_card' },
] as const satisfies ReadonlyArray<{ number: string; outcome: string }>

export type TestCardOutcome = (typeof TEST_CARDS)[number]['outcome']
