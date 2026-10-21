import { Check } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'

/** Check verde de vendedor verificado (mismo verde que "Vendedor verificado" del detalle). */
export function VerifiedMark() {
  const { t } = useLanguage()
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-[#e8faf2] p-[3px] text-[#0d8c66]" title={t('chat.header.verified')}>
      <Check className="size-3" strokeWidth={3} aria-hidden="true" />
      <span className="sr-only">{t('chat.header.verified')}</span>
    </span>
  )
}
