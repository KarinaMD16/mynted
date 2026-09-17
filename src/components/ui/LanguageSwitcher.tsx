import { useLanguage } from '@/i18n/LanguageContext'

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div
      role="group"
      aria-label={t('languageSwitcher.label')}
      className={`flex shrink-0 items-center gap-0.5 rounded-full border border-mynted-border bg-mynted-bg p-0.5 text-xs font-semibold ${className}`}
    >
      <button
        type="button"
        onClick={() => setLanguage('es')}
        aria-pressed={language === 'es'}
        className={`cursor-pointer rounded-full px-2.5 py-1 transition-colors ${
          language === 'es' ? 'bg-mynted-orange text-white' : 'text-mynted-gray hover:text-mynted-ink'
        }`}
      >
        ES
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        aria-pressed={language === 'en'}
        className={`cursor-pointer rounded-full px-2.5 py-1 transition-colors ${
          language === 'en' ? 'bg-mynted-orange text-white' : 'text-mynted-gray hover:text-mynted-ink'
        }`}
      >
        EN
      </button>
    </div>
  )
}
