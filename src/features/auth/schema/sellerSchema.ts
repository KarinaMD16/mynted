import { z } from 'zod'
import type { TranslateFn } from '@/i18n/LanguageContext'

/**
 * Espeja RequestSellerDto del backend (sellers/dto/request-seller.dto.ts):
 * mismos límites de longitud, mismo enum de `type`. Ver makeLoginSchema en
 * authSchemas.ts para el motivo de armar el schema con una función `t`.
 */
export function makeRequestSellerSchema(t: TranslateFn) {
  return z.object({
    displayName: z
      .string()
      .min(1, t('validation.seller.displayNameRequired'))
      .max(100, t('validation.seller.displayNameMaxLength')),
    description: z
      .string()
      .min(1, t('validation.seller.descriptionRequired'))
      .max(1000, t('validation.seller.descriptionMaxLength')),
    location: z
      .string()
      .min(1, t('validation.seller.locationRequired'))
      .max(150, t('validation.seller.locationMaxLength')),
    ownerFullName: z
      .string()
      .min(1, t('validation.seller.ownerFullNameRequired'))
      .max(150, t('validation.seller.ownerFullNameMaxLength')),
    name: z
      .string()
      .min(1, t('validation.seller.paymentNameRequired'))
      .max(150, t('validation.seller.paymentNameMaxLength')),
    number: z
      .string()
      .min(1, t('validation.seller.paymentNumberRequired'))
      .max(50, t('validation.seller.paymentNumberMaxLength')),
    type: z.enum(['bank_account', 'paypal'], {
      message: t('validation.seller.paymentTypeRequired'),
    }),
  })
}

export type RequestSellerFormValues = z.infer<ReturnType<typeof makeRequestSellerSchema>>
