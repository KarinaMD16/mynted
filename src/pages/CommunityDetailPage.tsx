import { ErrorState } from '@/components/errors/ErrorState'
import { QueryErrorState } from '@/components/errors/QueryErrorState'
import { useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Plus, Shield } from 'lucide-react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { CommunityDetailHeader } from '@/features/community/components/detail/CommunityDetailHeader'
import { CommunitySidebar } from '@/features/community/components/detail/CommunitySidebar'
import { CreatePostDialog } from '@/features/community/components/create/CreatePostDialog'
import { ForumPostCard } from '@/features/community/components/cards/ForumPostCard'
import { useCommunityDetailBySlug } from '@/features/community/hooks/useCommunitiesQueries'
import { useCommunityPosts } from '@/features/community/hooks/useForum'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { ProductGrid } from '@/features/products/components/ProductGrid'
import { useCommunityProducts } from '@/features/products/hooks/useProductQueries'
import { useLanguage } from '@/i18n/LanguageContext'
import { Button } from '@/components/ui/Button'
import { PAGE_CONTAINER } from '@/components/layout/pageContainer'
import { cx } from '@/utils/cx'

type CommunityTab = 'talk' | 'shop'

export default function CommunityDetailPage() {
  const { t } = useLanguage()
  const { slug } = useParams({ from: '/communities/$slug' })
  const navigate = useNavigate()
  const { data: currentUser } = useCurrentUser()
  const [activeTab, setActiveTab] = useState<CommunityTab>('talk')
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  // Publicar productos es exclusivo de vendedores (el backend lo exige con SellerGuard).
  const isSeller = currentUser?.role === 'seller'

  // Ver la comunidad y su foro no pide sesion (OptionalJwtAuthGuard). De una
  // privada se devuelve la vitrina —nombre, descripcion, reglas— pero el foro
  // responde 403: quien decide que podes leer es el servidor, no el frontend.
  const communityQuery = useCommunityDetailBySlug(slug)
  const community = communityQuery.data
  const productsQuery = useCommunityProducts(community?.id, activeTab === 'shop')
  // El foro ya no sale del detalle: tiene su propio endpoint paginado
  const postsQuery = useCommunityPosts(community?.id ?? 0, { limit: 20 }, activeTab === 'talk')
  const posts = postsQuery.data?.data ?? []

  return (
    <section className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className={cx(PAGE_CONTAINER, 'flex flex-col gap-6 py-8')}>
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/communities"
            className="flex items-center gap-1.5 text-sm font-semibold text-mynted-gray hover:text-mynted-ink"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t('community.detail.back')}
          </Link>

          <div className="flex items-center gap-3">

            {(community?.membershipRole === 'owner' || community?.membershipRole === 'moderator') && (
              <Link
                to="/communities/$slug/moderacion"
                params={{ slug }}
                className="flex items-center gap-1.5 rounded-lg border border-mynted-border bg-white px-3 py-1.5 text-sm font-semibold text-mynted-ink hover:bg-mynted-bg"
              >
                <Shield className="size-4" aria-hidden="true" />
                {t('moderation.openPanel')}
              </Link>
            )}

            <div className="flex gap-2" role="tablist" aria-label={t('community.detail.tabsLabel')}>
            {(['shop', 'talk'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors hover:cursor-pointer ${
                  activeTab === tab
                    ? 'bg-mynted-orange/15 text-mynted-orange'
                    : 'bg-white text-mynted-gray hover:text-mynted-ink'
                }`}
              >
                {tab === 'shop' ? t('community.detail.tabShop') : t('community.detail.tabTalk')}
              </button>
            ))}
            </div>
          </div>
        </div>

        {communityQuery.isPending && (
          <div className="flex flex-col gap-6">
            <div className="h-56 animate-pulse rounded-2xl bg-white" />
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="h-72 animate-pulse rounded-2xl bg-white" />
              <div className="h-72 animate-pulse rounded-2xl bg-white" />
            </div>
          </div>
        )}

        {communityQuery.isError && (
          <QueryErrorState
            error={communityQuery.error}
            onRetry={() => void communityQuery.refetch()}
            texts={{ notFound: { description: t('errors.notFound.community') }, error: { description: t('community.detail.loadError') } }}
          />
        )}

        {community && (
          <>
            <CommunityDetailHeader community={community} />

            {activeTab === 'talk' ? (
              <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="flex flex-col gap-4">
                  {/* Publicar exige ser miembro (lo valida CommunityRoleGuard) */}
                  {community.isMember && (
                    <Button
                      type="button"
                      onClick={() => setIsCreatePostOpen(true)}
                      variant="primary"
                      size="md"
                      className="w-fit self-end"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                      {t('forum.create.cta')}
                    </Button>
                  )}

                  {postsQuery.isPending && <div className="h-40 animate-pulse rounded-2xl bg-white" />}

                  {postsQuery.isError && (
                    <QueryErrorState
                      error={postsQuery.error}
                      onRetry={() => void postsQuery.refetch()}
                      variant="compact"
                      texts={{
                        // 403 = la comunidad es privada y no sos miembro.
                        forbidden: { description: t('community.detail.privateForum') },
                        error: { description: t('forum.loadError') },
                      }}
                    />
                  )}

                  {posts.length > 0
                    ? posts.map((post, index) => (
                        <ForumPostCard
                          key={post.id}
                          post={post}
                          communitySlug={community.slug}
                          index={index}
                          communityId={community.id}
                          canModerate={community.membershipRole === 'owner' || community.membershipRole === 'moderator'}
                        />
                      ))
                    : postsQuery.isSuccess && (
                        <ErrorState kind="empty" variant="compact" description={t('community.detail.noPosts')} />
                      )}
                </div>

                <CommunitySidebar community={community} />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {isSeller && (productsQuery.data?.pages[0]?.data.length ?? 0) > 0 && (
                  <Button
                    type="button"
                    onClick={() => void navigate({ to: '/products/new', search: { community: slug } })}
                    variant="primary"
                    size="md"
                    className="w-fit self-end"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    {t('products.create.inCommunityCta')}
                  </Button>
                )}
                <ProductGrid
                  query={productsQuery}
                  emptyState={
                    <ErrorState kind="empty" variant="compact" title={t('products.shop.emptyTitle')} description={t('products.shop.emptySubtitle')}>
                      {isSeller && (
                        <Button
                          type="button"
                          onClick={() => void navigate({ to: '/products/new', search: { community: slug } })}
                          variant="primary"
                          size="md"
                          className="mt-1"
                        >
                          <Plus className="size-4" aria-hidden="true" />
                          {t('products.create.inCommunityCta')}
                        </Button>
                      )}
                    </ErrorState>
                  }
                />
              </div>
            )}

            <CreatePostDialog
              community={community}
              isOpen={isCreatePostOpen}
              onClose={() => setIsCreatePostOpen(false)}
            />
          </>
        )}
      </main>
    </section>
  )
}
