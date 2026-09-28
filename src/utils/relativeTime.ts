import { INTL_LOCALES, type AppLanguage } from './locale'

const UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'year', ms: 1000 * 60 * 60 * 24 * 365 },
  { unit: 'month', ms: 1000 * 60 * 60 * 24 * 30 },
  { unit: 'day', ms: 1000 * 60 * 60 * 24 },
  { unit: 'hour', ms: 1000 * 60 * 60 },
  { unit: 'minute', ms: 1000 * 60 },
]

/** "Hace 5 minutos" / "5 minutes ago" / "vor 5 Minuten" / "5분 전"... a partir de una fecha ISO del backend. */
export function formatRelativeTime(isoDate: string, language: AppLanguage): string {
  const elapsed = Date.now() - new Date(isoDate).getTime()
  const formatter = new Intl.RelativeTimeFormat(INTL_LOCALES[language], { numeric: 'auto' })

  for (const { unit, ms } of UNITS) {
    if (elapsed >= ms) {
      return formatter.format(-Math.floor(elapsed / ms), unit)
    }
  }

  return formatter.format(-Math.max(1, Math.floor(elapsed / 1000)), 'second')
}

/** Fecha corta para "Creada el ..." (ver CommunityAboutCard). */
export function formatShortDate(isoDate: string, language: AppLanguage): string {
  return new Intl.DateTimeFormat(INTL_LOCALES[language], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate))
}
