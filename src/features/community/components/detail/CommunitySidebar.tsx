import { CalendarDays } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import { formatShortDate } from '@/utils/relativeTime'
import type { CommunityDetail } from '@/features/community/models/communityDTOs'

export function CommunitySidebar({ community }: { community: CommunityDetail }) {
  const { t, language } = useLanguage()

  return (
    <aside className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-2xl border border-mynted-border bg-white p-5">
        <h2 className="font-heading text-base font-semibold text-mynted-ink">
          {t('community.detail.about', { slug: community.slug })}
        </h2>

        <p className="text-sm font-semibold text-mynted-ink">{community.name}</p>
        <p className="text-sm text-mynted-gray">{community.description}</p>

        {community.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {community.tags.map((tag) => (
              <li
                key={tag.tagId}
                className="rounded-full border border-mynted-border px-2.5 py-1 text-xs font-medium text-mynted-ink"
              >
                {tag.name}
              </li>
            ))}
          </ul>
        )}

        <p className="flex items-center gap-1.5 text-xs text-mynted-gray">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          {t('community.detail.createdAt', { date: formatShortDate(community.createdAt, language) })}
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-mynted-border bg-white p-5">
        <h2 className="font-heading text-base font-semibold text-mynted-ink">{t('community.detail.rules')}</h2>

        {community.rules.length > 0 ? (
          <ol className="flex flex-col gap-2.5">
            {community.rules.map((rule, index) => (
              <li key={rule.communityRuleId} className="flex gap-2 text-sm text-mynted-gray">
                <span className="font-semibold text-mynted-orange">{index + 1}.</span>
                {rule.description}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-mynted-gray">{t('community.detail.noRules')}</p>
        )}
      </section>
    </aside>
  )
}
