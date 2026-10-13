import { INTL_LOCALES, type AppLanguage } from '@/utils/locale'

export function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase()
}

export function formatMemberSince(createdAt: string, language: AppLanguage): string {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(INTL_LOCALES[language], { month: 'long', year: 'numeric' })
}
