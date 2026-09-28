import { z } from 'zod'
import type { TranslateFn } from '@/i18n/LanguageContext'
import { PRODUCT_CONDITIONS, PRODUCT_TYPES, REQUIRED_PRODUCT_TAGS } from '../models/product'

/**
 * Espeja CreateProductDto del backend: título y descripción no vacíos,
 * precio positivo con hasta 2 decimales (se pide también en intercambios,
 * como valor de referencia), type/condition del enum y exactamente 3 tags.
 * Las imágenes se validan aparte en el formulario (no son texto del form).
 * Ver makeLoginSchema en authSchemas.ts para el motivo de armarlo con `t`.
 */
export function makeCreateProductSchema(t: TranslateFn) {
  return z.object({
    communityId: z
      .number({ message: t('validation.product.communityRequired') })
      .int()
      .positive({ message: t('validation.product.communityRequired') }),
    // 255 = largo de la columna title (varchar) en la base; el backend no pone otro límite.
    title: z.string().trim().min(1, t('validation.product.titleRequired')).max(255, t('validation.product.titleMaxLength')),
    description: z.string().trim().min(1, t('validation.product.descriptionRequired')),
    price: z
      .string()
      .trim()
      .min(1, t('validation.product.priceRequired'))
      .regex(/^\d+(\.\d{1,2})?$/, t('validation.product.priceFormat'))
      .refine((value) => Number(value) > 0, t('validation.product.pricePositive')),
    type: z.enum(PRODUCT_TYPES),
    // string (y no z.enum) porque el form arranca sin estado elegido ('').
    condition: z
      .string()
      .refine((value) => (PRODUCT_CONDITIONS as readonly string[]).includes(value), t('validation.product.conditionRequired')),
    tagIds: z.array(z.number().int().positive()).length(REQUIRED_PRODUCT_TAGS, {
      message: t('validation.product.tagsExact', { count: REQUIRED_PRODUCT_TAGS }),
    }),
  })
}

export type CreateProductValues = z.infer<ReturnType<typeof makeCreateProductSchema>>
