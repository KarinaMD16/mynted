import type { TranslationKey } from '@/i18n/translations/es'
import type { ProductCondition } from '../models/product'

export const CONDITION_LABEL: Record<ProductCondition, TranslationKey> = {
  new: 'products.condition.new',
  like_new: 'products.condition.likeNew',
  good_condition: 'products.condition.good',
  used_with_details: 'products.condition.usedWithDetails',
}

export const labelClass = 'text-[13px] font-medium text-mynted-ink'
export const hintClass = 'text-xs text-mynted-gray'
export const errorClass = 'text-xs text-red-500'
