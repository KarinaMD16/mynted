import type { TranslateFn } from '@/i18n/LanguageContext'
import { INTL_LOCALES, type AppLanguage } from '@/utils/locale'

/** Mismo día calendario (hora local del navegador). */
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isYesterday(date: Date, now: Date): boolean {
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  return isSameDay(date, yesterday)
}

/** "10:05 a. m." / "10:05 AM" / "10:05" según el idioma. */
export function formatMessageTime(iso: string, language: AppLanguage): string {
  return new Intl.DateTimeFormat(INTL_LOCALES[language], { hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

/** Separador de día del hilo: "Hoy", "Ayer" o la fecha ("lunes, 19 de octubre"). */
export function formatDayLabel(iso: string, language: AppLanguage, t: TranslateFn): string {
  const date = new Date(iso)
  const now = new Date()
  if (isSameDay(date, now)) return t('chat.thread.today')
  if (isYesterday(date, now)) return t('chat.thread.yesterday')
  return new Intl.DateTimeFormat(INTL_LOCALES[language], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  }).format(date)
}

/** Hora de una fila de la bandeja: la hora si es de hoy, "Ayer", o una fecha corta. */
export function formatInboxTime(iso: string, language: AppLanguage, t: TranslateFn): string {
  const date = new Date(iso)
  const now = new Date()
  if (isSameDay(date, now)) return formatMessageTime(iso, language)
  if (isYesterday(date, now)) return t('chat.thread.yesterday')
  return new Intl.DateTimeFormat(INTL_LOCALES[language], {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() !== now.getFullYear() ? { year: '2-digit' } : {}),
  }).format(date)
}

/** "Ana Ruiz" → "AR", "funkocorner" → "FU". */
export function getChatInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.trim().slice(0, 2).toUpperCase() || '?'
}

/** Contador compacto para badges: 1…99 y después "99+". */
export function formatBadgeCount(count: number): string {
  return count > 99 ? '99+' : String(count)
}
