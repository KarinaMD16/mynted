import { z } from 'zod'
import type { TranslateFn } from '@/i18n/LanguageContext'
import {
  MAX_RELATED_PRODUCTS,
  PRODUCT_CONDITIONS,
  PRODUCT_TYPES,
  REQUIRED_PRODUCT_TAGS,
  type ProductType,
} from '../models/product'

/** Valores del formulario de producto (crear y editar). Los números del form son texto hasta enviarlos. */
export interface ProductFormValues {
  /** 0 = sin comunidad. */
  communityId: number
  title: string
  description: string
  price: string
  type: ProductType
  /** '' mientras no se elige. */
  condition: string
  tagIds: number[]
  /** '' = sin descuento. */
  discountPercent: string
  isVisible: boolean
  /** Países de envío (ISO 3166-1 alfa-2). */
  shipsTo: string[]
  relatedProductIds: number[]
}

/** 'publish' exige todo lo que pide el backend para publicar; 'draft' solo el título. */
export type ProductFormMode = 'publish' | 'draft'

const PRICE_FORMAT = /^\d+(\.\d{1,2})?$/
const DISCOUNT_FORMAT = /^\d{1,3}(\.\d{1,2})?$/

/**
 * Espeja CreateProductDto / UpdateProductDto del backend. Al publicar: título y
 * descripción no vacíos, precio positivo con hasta 2 decimales (también en
 * intercambios, como valor de referencia), type/condition del enum y exactamente
 * 3 tags. Un borrador solo exige el título y valida el formato de lo que se haya
 * escrito. La comunidad es opcional (0 = sin comunidad). Las imágenes se validan
 * aparte en el formulario (no son texto del form).
 * Ver makeLoginSchema en authSchemas.ts para el motivo de armarlo con `t`.
 */
export function makeProductFormSchema(t: TranslateFn, mode: ProductFormMode) {
  const isDraft = mode === 'draft'

  return z.object({
    communityId: z.number().int().min(0),
    // 255 = largo de la columna title (varchar) en la base; el backend no pone otro límite.
    title: z.string().trim().min(1, t('validation.product.titleRequired')).max(255, t('validation.product.titleMaxLength')),
    description: isDraft ? z.string() : z.string().trim().min(1, t('validation.product.descriptionRequired')),
    price: isDraft
      ? z
          .string()
          .trim()
          .refine((value) => value === '' || (PRICE_FORMAT.test(value) && Number(value) > 0), t('validation.product.priceFormat'))
      : z
          .string()
          .trim()
          .min(1, t('validation.product.priceRequired'))
          .regex(PRICE_FORMAT, t('validation.product.priceFormat'))
          .refine((value) => Number(value) > 0, t('validation.product.pricePositive')),
    type: z.enum(PRODUCT_TYPES),
    // string (y no z.enum) porque el form arranca sin estado elegido ('').
    condition: z
      .string()
      .refine(
        (value) => (isDraft && value === '') || (PRODUCT_CONDITIONS as readonly string[]).includes(value),
        t('validation.product.conditionRequired'),
      ),
    tagIds: isDraft
      ? z.array(z.number().int().positive()).max(REQUIRED_PRODUCT_TAGS, {
          message: t('validation.product.tagsMax', { count: REQUIRED_PRODUCT_TAGS }),
        })
      : z.array(z.number().int().positive()).length(REQUIRED_PRODUCT_TAGS, {
          message: t('validation.product.tagsExact', { count: REQUIRED_PRODUCT_TAGS }),
        }),
    discountPercent: z
      .string()
      .trim()
      .refine((value) => value === '' || (DISCOUNT_FORMAT.test(value) && Number(value) <= 100), t('validation.product.discountFormat')),
    isVisible: z.boolean(),
    shipsTo: z.array(z.string().length(2)),
    relatedProductIds: z.array(z.number().int().positive()).max(MAX_RELATED_PRODUCTS),
  })
}

/**
 * Adapta los errores de zod al formato de un validador de formulario de
 * TanStack Form (`{ fields: { campo: mensaje } }`): se usa cuando el schema
 * depende de si se publica o se guarda un borrador.
 */
export function zodErrorsToFormErrors(error: z.ZodError): { fields: Record<string, string> } {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '')
    if (key && !(key in fields)) fields[key] = issue.message
  }
  return { fields }
}

/** Valida los valores del form según el modo; devuelve undefined si son válidos. */
export function validateProductForm(t: TranslateFn, mode: ProductFormMode, value: ProductFormValues) {
  const result = makeProductFormSchema(t, mode).safeParse(value)
  return result.success ? undefined : zodErrorsToFormErrors(result.error)
}
