import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { useLanguage } from '@/i18n/LanguageContext'
import type { CommunityListItem } from '@/features/community/models/communityDTOs'
import { ExploreCommunityCard } from '@/features/community/components/cards/ExploreCommunityCard'
import { EXPLORE_DOT_COLORS } from '@/features/community/types/DEFAULT_VALUES'

interface CommunityGridPageProps {
  title: string
  subtitle: string
  communities: CommunityListItem[]
  isLoading: boolean
  /** Aviso cuando no hay sesion, hay error o la lista viene vacia. */
  notice?: ReactNode
}

/**
 * Pantalla con todas las comunidades de una lista, en una grilla pareja (las
 * dos pantallas "ver todas" comparten esto: mis comunidades y explorar).
 */
export function CommunityGridPage({ title, subtitle, communities, isLoading, notice }: CommunityGridPageProps) {
  const { t } = useLanguage()

  return (
    <section className="min-h-svh bg-mynted-bg">
      <div className="px-4 pt-5 sm:px-6">
        <SiteHeader />
      </div>

      <main className="flex flex-col gap-6 px-6 py-10 sm:px-14">
        <div className="flex flex-col gap-2">
          <Link
            to="/communities"
            className="flex w-fit items-center gap-1.5 text-sm font-semibold text-mynted-gray hover:text-mynted-ink"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t('communities.grid.back')}
          </Link>

          <h1 className="font-heading text-2xl font-semibold text-mynted-ink">{title}</h1>
          <p className="text-sm text-mynted-gray">{subtitle}</p>
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }, (_, index) => (
              <div key={index} className="aspect-square animate-pulse rounded-xl bg-white" />
            ))}
          </div>
        )}

        {notice}

        {communities.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {communities.map((community, index) => (
              <ExploreCommunityCard
                key={community.id}
                community={community}
                dotClassName={EXPLORE_DOT_COLORS[index % EXPLORE_DOT_COLORS.length]}
              />
            ))}
          </div>
        )}
      </main>
    </section>
  )
}
