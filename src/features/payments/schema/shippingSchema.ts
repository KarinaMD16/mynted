import { z } from 'zod'
import type { TranslateFn } from '@/i18n/LanguageContext'
import type { ShippingAddressPayload } from '../models/payment'

/** Valores del formulario de dirección, como se escriben (los opcionales vacíos van en ''). */
export interface ShippingFormValues {
  fullName: string
  phone: string
  country: string
  province: string
  city: string
  line1: string
  line2: string
  postalCode: string
  notes: string
}

export const EMPTY_SHIPPING_FORM: ShippingFormValues = {
  fullName: '',
  phone: '',
  country: '',
  province: '',
  city: '',
  line1: '',
  line2: '',
  postalCode: '',
  notes: '',
}

/** Los largos de ShippingAddressDto, para que el error salga acá y no como un 400. */
export const SHIPPING_LIMITS = {
  fullName: { min: 2, max: 120 },
  phone: { min: 3, max: 30 },
  province: { max: 100 },
  city: { max: 100 },
  line1: { max: 200 },
  line2: { max: 200 },
  postalCode: { max: 30 },
  notes: { max: 500 },
} as const

export function makeShippingSchema(t: TranslateFn, allowedCountries: readonly string[]) {
  const required = (max: number) =>
    z
      .string()
      .trim()
      .min(1, t('validation.shipping.required'))
      .max(max, t('validation.shipping.tooLong', { max }))
  const optional = (max: number) => z.string().trim().max(max, t('validation.shipping.tooLong', { max }))

  return z.object({
    fullName: z
      .string()
      .trim()
      .min(1, t('validation.shipping.required'))
      .min(SHIPPING_LIMITS.fullName.min, t('validation.shipping.tooShort', { min: SHIPPING_LIMITS.fullName.min }))
      .max(SHIPPING_LIMITS.fullName.max, t('validation.shipping.tooLong', { max: SHIPPING_LIMITS.fullName.max })),
    phone: z
      .string()
      .trim()
      .min(1, t('validation.shipping.required'))
      .min(SHIPPING_LIMITS.phone.min, t('validation.shipping.tooShort', { min: SHIPPING_LIMITS.phone.min }))
      .max(SHIPPING_LIMITS.phone.max, t('validation.shipping.tooLong', { max: SHIPPING_LIMITS.phone.max })),
    country: z
      .string()
      .min(1, t('validation.shipping.countryRequired'))
      .refine((value) => allowedCountries.includes(value), t('validation.shipping.countryNotAllowed')),
    province: required(SHIPPING_LIMITS.province.max),
    city: required(SHIPPING_LIMITS.city.max),
    line1: required(SHIPPING_LIMITS.line1.max),
    line2: optional(SHIPPING_LIMITS.line2.max),
    // El backend lo acepta vacío, pero sin él muchos envíos no llegan: se pide siempre.
    postalCode: required(SHIPPING_LIMITS.postalCode.max),
    notes: optional(SHIPPING_LIMITS.notes.max),
  })
}

/** Errores por campo, con el mismo formato que validateCardForm. */
export function shippingFieldErrors(t: TranslateFn, value: ShippingFormValues, allowedCountries: readonly string[]) {
  const result = makeShippingSchema(t, allowedCountries).safeParse(value)
  const fields: Record<string, string> = {}
  if (result.success) return fields
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? '')
    if (key && !(key in fields)) fields[key] = issue.message
  }
  return fields
}

/** Al formato de ShippingAddressDto: recortado y con los opcionales vacíos en null. */
export function toShippingPayload(values: ShippingFormValues): ShippingAddressPayload {
  const optional = (value: string) => value.trim() || null
  return {
    fullName: values.fullName.trim(),
    phone: values.phone.trim(),
    country: values.country,
    province: values.province.trim(),
    city: values.city.trim(),
    line1: values.line1.trim(),
    line2: optional(values.line2),
    postalCode: values.postalCode.trim(),
    notes: optional(values.notes),
  }
}
