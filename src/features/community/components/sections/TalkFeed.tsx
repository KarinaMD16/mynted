import { ErrorState } from '@/components/errors/ErrorState'
import { QueryErrorState } from '@/components/errors/QueryErrorState'
import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StaggerItem } from '@/components/ui/ScrollReveal'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'
import { flattenUniquePosts, useExplorePosts, useGlobalPosts } from '@/features/community/hooks/useForum'
import type { FeedPost } from '@/features/community/models/communityDTOs'
import { GlobalPostCard } from '@/features/community/components/cards/GlobalPostCard'
import { GlobalPostComposer } from '@/features/community/components/create/GlobalPostComposer'
import { TalkFilters } from '@/features/community/components/ui/TalkFilters'
import { TalkSidebar } from '@/features/community/components/sections/TalkSidebar'

/**
 * Pestaña Foro de /explore. Funciona con o sin sesión:
 *
 * - Sin filtros: el "para ti" (GET /explore/forums/posts), que mezcla los intereses
 *   del usuario, los votos y la frescura, y empuja comunidades donde todavía no está.
 * - Con tags o búsqueda: el feed global filtrable (GET /posts), porque el "para ti"
 *   no acepta filtros.
 */
export function TalkFeed() {
  const { t } = useLanguage()
  const { isLoggedIn } = useCurrentUser()
  const [tagIds, setTagIds] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filters = {
    ...(tagIds.length > 0 && { tagIds }),
    ...(search.trim().length > 0 && { search: search.trim() }),
  }
  const activeCount = Object.keys(filters).length
  const hasFilters = activeCount > 0

  function clearFilters() {
    setTagIds([])
    setSearch('')
  }
  const forYouPosts = useExplorePosts(!hasFilters)
  const filteredPosts = useGlobalPosts(filters, hasFilters)
  const posts = hasFilters ? filteredPosts : forYouPosts
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = posts

  const items: FeedPost[] = hasFilters
    ? flattenUniquePosts(filteredPosts.data?.pages)
    : flattenUniquePosts(forYouPosts.data?.pages)
  // false sin sesión o sin intereses: el orden es solo votos + frescura.
  const isPersonalized = forYouPosts.data?.pages[0]?.meta.personalized

  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasNextPage) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage()
      },
      { rootMargin: '400px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, posts.data?.pages.length])

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="secondary"
        size="md"
        className="w-fit lg:hidden"
        aria-expanded={filtersOpen}
        onClick={() => setFiltersOpen((open) => !open)}
      >
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        {t('explore.filters.title')}
        {activeCount > 0 && (
          <span className="grid size-5 place-items-center rounded-full bg-mynted-orange text-[11px] text-white">
            {activeCount}
          </span>
        )}
      </Button>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[264px_minmax(0,1fr)] lg:items-start lg:gap-6 xl:grid-cols-[264px_minmax(0,1fr)_304px]">
        <div className={`${filtersOpen ? 'block' : 'hidden'} lg:sticky lg:top-28 lg:block`}>
          <TalkFilters
            search={search}
            onSearchChange={setSearch}
            tagIds={tagIds}
            onTagIdsChange={setTagIds}
            activeCount={activeCount}
            onClear={clearFilters}
          />
        </div>

        <section aria-label={t('talk.title')} className="flex min-w-0 flex-col gap-4">
          {isLoggedIn && <GlobalPostComposer />}

          {!hasFilters && isPersonalized === false && (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-mynted-border bg-mynted-white px-4 py-3 text-sm text-mynted-gray">
              {t(isLoggedIn ? 'talk.forYou.noInterests' : 'talk.forYou.signedOut')}
              {isLoggedIn ? (
                <Link to="/profile" className="font-semibold text-mynted-blue hover:underline">
                  {t('talk.forYou.pickInterests')}
                </Link>
              ) : (
                <Link to="/login" className="font-semibold text-mynted-blue hover:underline">
                  {t('errors.actions.signIn')}
                </Link>
              )}
            </p>
          )}

          {posts.isPending ? (
            <div className="flex flex-col gap-4" aria-busy="true">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-44 animate-pulse rounded-2xl bg-white" />
              ))}
            </div>
          ) : posts.isError ? (
            <QueryErrorState error={posts.error} onRetry={() => void posts.refetch()} texts={{ error: { description: t('talk.loadError') } }} />
          ) : items.length === 0 ? (
            <ErrorState
              kind={hasFilters ? 'noResults' : 'empty'}
              title={t('talk.empty.title')}
              description={t('talk.empty.body')}
            >
              {hasFilters && (
                <Button variant="secondary" size="sm" className="mt-2" onClick={clearFilters}>
                  {t('explore.filters.clear')}
                </Button>
              )}
            </ErrorState>
          ) : (
            <>
              <ul className="flex flex-col gap-4">
                {items.map((post, index) => (
                  <StaggerItem key={post.id} index={index}>
                    <GlobalPostCard post={post} index={index} />
                  </StaggerItem>
                ))}
              </ul>

              {hasNextPage && (
                <div ref={sentinelRef} className="flex justify-center py-4" aria-live="polite">
                  <span className="text-sm text-mynted-gray">{isFetchingNextPage ? t('talk.loadingMore') : ''}</span>
                </div>
              )}
            </>
          )}
        </section>

        <aside
          aria-label={t('talk.sidebar.label')}
          className="max-lg:block lg:sticky lg:top-28 lg:max-xl:hidden"
        >
          <TalkSidebar />
        </aside>
      </div>
    </div>
  )
}
