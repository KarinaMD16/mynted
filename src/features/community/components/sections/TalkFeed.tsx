import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { getApiErrorMessage } from '@/api/apiError'
import { Button } from '@/components/ui/Button'
import { StaggerItem } from '@/components/ui/ScrollReveal'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'
import { useTags } from '@/features/community/hooks/useCommunitiesQueries'
import { useGlobalPosts } from '@/features/community/hooks/useForum'
import { GlobalPostCard } from '@/features/community/components/cards/GlobalPostCard'
import { GlobalPostComposer } from '@/features/community/components/create/GlobalPostComposer'
import { TalkSidebar } from '@/features/community/components/sections/TalkSidebar'

/**
 * Pestana "Talk" del home: las publicaciones de todas las comunidades publicas
 * activas (GET /posts), filtrables por tag. El backend aplica OR entre los
 * tags, asi que los chips se pueden combinar; "Todo" los limpia.
 *
 * A diferencia de "Shop", el endpoint pide sesion, asi que sin ella se invita
 * a entrar en vez de mostrar el feed vacio.
 */
export function TalkFeed() {
  const { t } = useLanguage()
  const { isLoggedIn, isLoading: isLoadingSession } = useCurrentUser()
  const [tagIds, setTagIds] = useState<number[]>([])

  const filters = tagIds.length > 0 ? { tagIds } : {}
  const posts = useGlobalPosts(filters, isLoggedIn)
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
    <div className="flex flex-col gap-6">
      <TagFilters selected={tagIds} onChange={setTagIds} />

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_304px] lg:items-start lg:gap-6">
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
              <p className="max-w-sm text-sm text-mynted-gray">{t('talk.empty.body')}</p>
              {tagIds.length > 0 && (
                <Button variant="secondary" size="sm" className="mt-2" onClick={() => setTagIds([])}>
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

        <aside aria-label={t('talk.sidebar.label')} className="lg:sticky lg:top-6">
          <TalkSidebar />
        </aside>
      </div>
    </div>
  )
}

/**
 * Chips de tags. Van en una sola fila con scroll horizontal porque el catalogo
 * de tags crece con el tiempo y envolverlos empujaria el feed hacia abajo.
 */
function TagFilters({ selected, onChange }: { selected: number[]; onChange: (tagIds: number[]) => void }) {
  const { t } = useLanguage()
  const tags = useTags()

  function toggle(tagId: number) {
    onChange(selected.includes(tagId) ? selected.filter((id) => id !== tagId) : [...selected, tagId])
  }

  return (
    <div role="group" aria-label={t('talk.filters.label')} className="flex gap-2 overflow-x-auto pb-1">
      <Button
        variant={selected.length === 0 ? 'primary' : 'secondary'}
        size="sm"
        shape="pill"
        aria-pressed={selected.length === 0}
        onClick={() => onChange([])}
      >
        {t('talk.filters.all')}
      </Button>

      {tags.isPending &&
        Array.from({ length: 5 }, (_, index) => (
          <span key={index} className="h-8 w-24 shrink-0 animate-pulse rounded-full bg-white" />
        ))}

      {tags.data?.map((tag) => {
        const isSelected = selected.includes(tag.tagId)
        return (
          <Button
            key={tag.tagId}
            variant={isSelected ? 'primary' : 'secondary'}
            size="sm"
            shape="pill"
            aria-pressed={isSelected}
            onClick={() => toggle(tag.tagId)}
          >
            #{tag.name}
          </Button>
        )
      })}
    </div>
  )
}
