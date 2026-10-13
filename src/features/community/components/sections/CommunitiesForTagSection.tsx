import { useQueries } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useLanguage } from '@/i18n/LanguageContext'
import { communityKeys } from '@/features/community/hooks/useCommunitiesQueries'
import { getCommunities } from '@/features/community/services/communityService'
import { ExploreCommunityCard } from '@/features/community/components/cards/ExploreCommunityCard'
import type { CommunityTagItem } from '@/features/community/models/communityDTOs'
import { EXPLORE_DOT_COLORS, EXPLORE_LIMIT } from '@/features/community/types/DEFAULT_VALUES'

interface CommunitiesForTagSectionProps {
  /** Los tags del producto, en orden. */
  tags: CommunityTagItem[]
}

const query = (tagName: string) =>
  ({ search: tagName, sort: 'popularity', limit: EXPLORE_LIMIT }) as const

/**
 * "Explorar comunidades sobre #tag", al pie del detalle de un producto.
 *
 * `GET /communities` no filtra por tag, asi que la busqueda va por el nombre
 * del tag ("My Little Pony" encuentra "My Little Pony Latam"). Se consulta un
 * tag a la vez y se muestra el primero que devuelva algo: el primer tag del
 * producto suele ser el mas generico y quedarse sin comunidades.
 */
export function CommunitiesForTagSection({ tags }: CommunitiesForTagSectionProps) {
  const { t } = useLanguage()

  const results = useQueries({
    queries: tags.map((tag) => ({
      queryKey: communityKeys.list(query(tag.name)),
      queryFn: () => getCommunities(query(tag.name)),
      staleTime: 1000 * 60 * 5,
    })),
  })

  const index = results.findIndex((result) => (result.data?.data.length ?? 0) > 0)
  if (index === -1) return null

  const tag = tags[index]!
  const communities = results[index]!.data!.data

  return (
    <section className="flex flex-col gap-[18px]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading text-[22px] font-semibold text-mynted-ink">
          {t('itemDetail.communitiesForTag', { tag: tag.name })}
        </h2>

        <Link
          to="/discover-communities"
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-mynted-blue hover:underline"
        >
          {t('communities.explore.showAll')}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {communities.map((community, position) => (
          <li key={community.id}>
            <ExploreCommunityCard
              community={community}
              dotClassName={EXPLORE_DOT_COLORS[position % EXPLORE_DOT_COLORS.length]}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
