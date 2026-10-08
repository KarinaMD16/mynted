import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { Button } from '@/components/ui/Button'
import { StaggerItem } from '@/components/ui/ScrollReveal'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'
import { useGlobalPosts, useRecommendedPosts } from '@/features/community/hooks/useForum'
import { GlobalPostCard } from '@/features/community/components/cards/GlobalPostCard'
import { GlobalPostComposer } from '@/features/community/components/create/GlobalPostComposer'
import { TalkFilters } from '@/features/community/components/ui/TalkFilters'
import { TalkSidebar } from '@/features/community/components/sections/TalkSidebar'

interface TalkFeedProps {
  /**
   * `interests`: lo del home, las publicaciones que coinciden con los intereses
   * del usuario (GET /users/me/recommended-posts). Ese endpoint no filtra, asi
   * que no lleva chips de tags.
   *
   * `all`: lo de explorar, todas las comunidades publicas activas (GET /posts),
   * con los chips de tags (el backend aplica OR entre ellos).
   */
  source: 'interests' | 'all'
}

/**
 * Feed de publicaciones, en sus dos caras: el del home y el de explorar.
 *
 * A diferencia de "Shop", los dos endpoints piden sesion, asi que sin ella se
 * invita a entrar en vez de mostrar el feed vacio.
 */
export function TalkFeed({ source }: TalkFeedProps) {
  const { t } = useLanguage()
  const { isLoggedIn, isLoading: isLoadingSession } = useCurrentUser()
  const [tagIds, setTagIds] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const showsFilters = source === 'all'
  const filters = {
    ...(tagIds.length > 0 && { tagIds }),
    ...(search.trim().length > 0 && { search: search.trim() }),
  }
  const activeCount = Object.keys(filters).length

  function clearFilters() {
    setTagIds([])
    setSearch('')
  }
  const globalPosts = useGlobalPosts(filters, isLoggedIn && showsFilters)
  const recommendedPosts = useRecommendedPosts(isLoggedIn && !showsFilters)
  const posts = showsFilters ? globalPosts : recommendedPosts
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = posts

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

  const items = posts.data?.pages.flatMap((page) => page.data) ?? []

  if (isLoadingSession) {
    return <div className="h-64 animate-pulse rounded-2xl bg-white" aria-busy="true" />
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-mynted-border bg-white px-6 py-14 text-center">
        <p className="text-sm text-mynted-gray">{t('talk.loginPrompt')}</p>
        <Link
          to="/login"
          className="rounded-[10px] bg-mynted-orange px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-mynted-orange-hover"
        >
          {t('home.goToLogin')}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {showsFilters && (
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
      )}

      <div
        className={`flex flex-col gap-6 lg:grid lg:items-start lg:gap-6 ${
          showsFilters
            ? 'lg:grid-cols-[264px_minmax(0,1fr)] xl:grid-cols-[264px_minmax(0,1fr)_304px]'
            : 'lg:grid-cols-[minmax(0,1fr)_304px]'
        }`}
      >
        {showsFilters && (
          <div className={`${filtersOpen ? 'block' : 'hidden'} lg:sticky lg:top-6 lg:block`}>
            <TalkFilters
              search={search}
              onSearchChange={setSearch}
              tagIds={tagIds}
              onTagIdsChange={setTagIds}
              activeCount={activeCount}
              onClear={clearFilters}
            />
          </div>
        )}

        <section aria-label={t('talk.title')} className="flex min-w-0 flex-col gap-4">
          <GlobalPostComposer />

          {posts.isPending ? (
            <div className="flex flex-col gap-4" aria-busy="true">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-44 animate-pulse rounded-2xl bg-white" />
              ))}
            </div>
          ) : posts.isError ? (
            <div
              className="flex flex-col items-center gap-2 rounded-2xl border border-mynted-border bg-white px-6 py-14 text-center"
              role="alert"
            >
              <p className="text-sm font-semibold text-mynted-ink">{t('talk.loadError')}</p>
              <p className="text-sm text-mynted-gray">{getApiErrorMessage(posts.error)}</p>
              <Button variant="secondary" size="sm" className="mt-2" onClick={() => void posts.refetch()}>
                {t('communities.list.retry')}
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-mynted-border bg-white px-6 py-14 text-center">
              <p className="text-sm font-semibold text-mynted-ink">{t('talk.empty.title')}</p>
              <p className="max-w-sm text-sm text-mynted-gray">
                {t(showsFilters ? 'talk.empty.body' : 'talk.empty.interests')}
              </p>
              {activeCount > 0 && (
                <Button variant="secondary" size="sm" className="mt-2" onClick={clearFilters}>
                  {t('explore.filters.clear')}
                </Button>
              )}
            </div>
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
          className={`lg:sticky lg:top-6 ${showsFilters ? 'max-lg:block lg:max-xl:hidden' : ''}`}
        >
          <TalkSidebar />
        </aside>
      </div>
    </div>
  )
}
