import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import type { ReportCounts, ReportStatus } from '../models/report'

/** Las pestañas del listado. `''` es "Todos", que no filtra por estado. */
const TABS: { value: ReportStatus | ''; labelKey: TranslationKey }[] = [
  { value: '', labelKey: 'moderation.reports.tab.all' },
  { value: 'pending', labelKey: 'reports.status.pending' },
  { value: 'resolved', labelKey: 'reports.status.resolved' },
  { value: 'dismissed', labelKey: 'reports.status.dismissed' },
]

/**
 * Pestañas de estado con su contador. Las usan el listado global del panel y
 * el de una comunidad, para que filtrar se vea y funcione igual en los dos.
 * Los contadores salen de `counts`, que viene con cualquier página.
 */
export function ReportStatusTabs({
  value,
  counts,
  onChange,
}: {
  value: ReportStatus | ''
  counts: ReportCounts | undefined
  onChange: (value: ReportStatus | '') => void
}) {
  const { t, language } = useLanguage()

  /** "Todos" es la suma de los tres. */
  function tabCount(tab: ReportStatus | '') {
    if (!counts) return undefined
    if (!tab) return counts.pending + counts.resolved + counts.dismissed
    return counts[tab]
  }

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('moderation.tabs.reports')}>
      {TABS.map((tab) => {
        const isActive = value === tab.value
        const count = tabCount(tab.value)
        return (
          <button
            key={tab.value || 'all'}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors hover:cursor-pointer ${
              isActive ? 'bg-mynted-orange text-white' : 'bg-mynted-bg text-mynted-ink hover:bg-mynted-border/60'
            }`}
          >
            {t(tab.labelKey)}
            {count !== undefined && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white text-mynted-gray'
                }`}
              >
                {count.toLocaleString(language)}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
