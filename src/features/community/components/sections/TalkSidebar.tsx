import type { ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/Button'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'
import { useCommunities, useRecommendedCommunities } from '@/features/community/hooks/useCommunitiesQueries'
import { useJoinCommunity } from '@/features/community/hooks/useCommunitiesMutations'
import { CommunityPattern } from '@/features/community/components/ui/CommunityPattern'
import type { CommunityListItem } from '@/features/community/models/communityDTOs'
import { useExploreProducts } from '@/features/products/hooks/useProductQueries'
import { formatPrice } from '@/utils/price'

const SIDEBAR_PRODUCTS = 2
const SIDEBAR_COMMUNITIES = 3

/** Columna derecha de "Talk": productos sugeridos y comunidades recomendadas. */
export function TalkSidebar() {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col gap-4">
      <SidebarCard title={t('talk.sidebar.products')}>
        <SuggestedProducts />
      </SidebarCard>

      <SidebarCard title={t('talk.sidebar.communities')}>
        <SuggestedCommunities />
      </SidebarCard>
    </div>
  )
}

function SidebarCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-mynted-border bg-white p-4">
      <h2 className="font-heading text-sm font-semibold text-mynted-ink">{title}</h2>
      {children}
    </section>
  )
}

function SuggestedProducts() {
  const { t, language } = useLanguage()
  const products = useExploreProducts({})

  const items = (products.data?.pages[0]?.data ?? []).slice(0, SIDEBAR_PRODUCTS)

  if (products.isPending) return <SidebarSkeleton rows={SIDEBAR_PRODUCTS} />
  if (items.length === 0) return <p className="text-xs text-mynted-gray">{t('talk.sidebar.noProducts')}</p>

  return (
    <ul className="flex flex-col gap-3">
      {items.map((product) => (
        <li key={product.id}>
          <Link
            to="/products/$productId"
            params={{ productId: String(product.id) }}
            className="group flex items-center gap-3 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid"
          >
            <img
              src={product.imageUrl}
              alt=""
              loading="lazy"
              className="size-11 shrink-0 rounded-lg bg-mynted-bg object-cover"
            />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-semibold text-mynted-ink group-hover:underline">
                {product.title}
              </span>
              <span className="text-xs text-mynted-gray">
                {formatPrice(product.price, product.currency, language)}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function SuggestedCommunities() {
  const { t } = useLanguage()
  const { isLoggedIn, isLoading: isLoadingSession } = useCurrentUser()
  // Sin sesión no hay intereses con qué recomendar: se muestran las más populares (GET /communities es público).
  const recommended = useRecommendedCommunities({ limit: SIDEBAR_COMMUNITIES }, isLoggedIn)
  const popular = useCommunities({ sort: 'popularity', limit: SIDEBAR_COMMUNITIES }, !isLoggedIn && !isLoadingSession)
  const communities = isLoggedIn ? recommended : popular

  const items: CommunityListItem[] = communities.data?.data ?? []

  if (isLoadingSession || communities.isPending) return <SidebarSkeleton rows={SIDEBAR_COMMUNITIES} />
  if (items.length === 0) return <p className="text-xs text-mynted-gray">{t('talk.sidebar.noCommunities')}</p>

  return (
    <ul className="flex flex-col gap-3">
      {items.map((community) => (
        <li key={community.id}>
          <SuggestedCommunityRow community={community} />
        </li>
      ))}
    </ul>
  )
}

function SuggestedCommunityRow({ community }: { community: CommunityListItem }) {
  const { t } = useLanguage()
  const join = useJoinCommunity(community.id)
  const { isLoggedIn } = useCurrentUser()
  const navigate = useNavigate()

  // Igual que en el detalle: en una comunidad privada el backend deja una
  // solicitud pendiente en vez de unir, y eso solo se sabe al responder.
  const joinResult = join.data?.result
  const hasPendingRequest = joinResult === 'requested' || joinResult === 'already_requested'
  const isMember = joinResult === 'joined' || joinResult === 'already_member'

  const label = isMember
    ? t('community.detail.joined')
    : hasPendingRequest
      ? t('community.detail.requestSent')
      : community.isPrivate
        ? t('community.detail.requestJoin')
        : t('community.detail.join')

  return (
    <div className="flex items-center gap-3">
      <Link
        to="/communities/$slug"
        params={{ slug: community.slug }}
        className="group flex min-w-0 flex-1 items-center gap-3 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid"
      >
        <span className="size-10 shrink-0 overflow-hidden rounded-lg bg-mynted-bg">
          {community.imageUrl ? (
            <img src={community.imageUrl} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            <CommunityPattern seed={community.id} className="size-full" />
          )}
        </span>
        <span className="truncate text-[13px] font-semibold text-mynted-ink group-hover:underline">
          {community.name}
        </span>
      </Link>

      <Button
        variant="secondary"
        size="sm"
        shape="pill"
        isLoading={join.isPending}
        disabled={join.isPending || join.isSuccess}
        onClick={() => (isLoggedIn ? join.mutate() : void navigate({ to: '/login' }))}
        className="border-mynted-orange text-mynted-orange hover:bg-mynted-orange/10"
      >
        {label}
      </Button>
    </div>
  )
}

function SidebarSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-11 animate-pulse rounded-lg bg-mynted-bg" />
      ))}
    </div>
  )
}
