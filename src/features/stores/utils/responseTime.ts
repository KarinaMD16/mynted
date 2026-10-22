import type { TranslateFn } from '@/i18n/LanguageContext'
import type { ResponseTime } from '../models/store'

const HOUR = 60
const DAY = 24 * HOUR

/**
 * "Responde en ~20 min" / "~3 h" / "~1 día" a partir de la mediana del
 * backend (sección 5 de la guía). `null` = menos de 3 conversaciones
 * respondidas: no hay dato.
 */
export function formatResponseTime(responseTime: ResponseTime | null | undefined, t: TranslateFn): string {
  if (!responseTime) return t('store.responseTime.none')
  const minutes = Math.max(1, Math.round(responseTime.medianMinutes))
  if (minutes < HOUR) return t('store.responseTime.minutes', { count: minutes })
  if (minutes < DAY) return t('store.responseTime.hours', { count: Math.round(minutes / HOUR) })
  const days = Math.round(minutes / DAY)
  return t(days === 1 ? 'store.responseTime.day' : 'store.responseTime.days', { count: days })
}
