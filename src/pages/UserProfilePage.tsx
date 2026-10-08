import { isAxiosError } from 'axios'
import { useState } from 'react'
import { Link, Navigate, useParams } from '@tanstack/react-router'
import { Calendar } from '@untitledui/icons'
import { Heart as HeartOutline, LayoutGrid, MapPin, MessageCircle, ShoppingBag } from 'lucide-react'
import { AnimatedTabs } from '@/components/ui/AnimatedTabs'
import { Rating } from '@/components/ui/Rating'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useUserInterestsQuery } from '@/features/auth/hooks/useInterestsMutations'
import { useUserByIdQuery, useUserByUsernameQuery } from '@/features/auth/hooks/useAuthMutations'
import type { PublicUser } from '@/features/auth/models/auth'
import { ContentBentoGrid } from '@/features/community/components/feed/ContentBentoGrid'
import { ProfilePostCard } from '@/features/community/components/cards/ProfilePostCard'
import { ProfileFeedFrame } from '@/features/community/components/profile/ProfileFeedFrame'
import { useUserContent, useUserForumPosts, useUserProducts } from '@/features/community/hooks/useForumQueries'
import type { MyContentEntry } from '@/features/community/models/communityDTOs'
import { AboutCard, CoverBanner } from '@/features/profile/components/ProfileParts'
import { formatMemberSince, getInitials } from '@/features/profile/utils/profileFormat'
import { useLanguage } from '@/i18n/LanguageContext'
import type { AppLanguage } from '@/utils/locale'
import { SiteHeader } from '../components/layout/SiteHeader'
import { Loader } from '../components/ui/Loader'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type PublicTab = 'posts' | 'threads' | 'products'

/**
 * Perfil público de otra persona (/users/:userId). El parámetro puede ser su id
 * (uuid) o su username (/users/keishi). Mismo look que "Mi perfil" pero sin
 * edición, sin datos privados y con lo que es público: sus publicaciones,
 * hilos y productos (GET /users/:id/posts|forums|products) y sus intereses
 * (GET /users/:id/tags). Todo eso todavía pide sesión en el backend.
 */
export default function UserProfilePage() {
  const { t, language } = useLanguage()
  const { userId: param } = useParams({ from: '/users/$userId' })
  const { isLoggedIn, data: me, isLoading: isLoadingSession } = useCurrentUser()
  const isId = UUID_PATTERN.test(param)

  const byId = useUserByIdQuery(isLoggedIn && isId ? param : undefined)
  const byUsername = useUserByUsernameQuery(isLoggedIn && !isId ? param : undefined)
  const userQuery = isId ? byId : byUsername

  // El perfil de uno mismo es /profile (con edición y todo lo demás).
  const isMe = isId ? me?.id === param : me?.username.toLowerCase() === param.toLowerCase()
  if (isMe) return <Navigate to="/profile" replace />

  const user = userQuery.data
  const notFound =
    userQuery.isError && isAxiosError(userQuery.error) && [400, 404].includes(userQuery.error.response?.status ?? 0)

  return (
    <div className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className="mx-auto max-w-[1320px] px-4 pt-6 pb-16 sm:px-6">
        {isLoadingSession || (isLoggedIn && userQuery.isPending) ? (
          <div className="flex justify-center py-24">
            <Loader label={t('profile.loadingProfile')} />
          </div>
        ) : !isLoggedIn ? (
          <StateCard title={t('userProfile.signedOutTitle')} subtitle={t('userProfile.signedOutSubtitle')}>
            <Link
              to="/login"
              className="mt-2 rounded-[10px] bg-mynted-orange px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-mynted-orange-hover"
            >
              {t('profile.goToLogin')}
            </Link>
          </StateCard>
        ) : notFound ? (
          <StateCard title={t('userProfile.notFoundTitle')} subtitle={t('userProfile.notFoundSubtitle')} />
        ) : userQuery.isError || !user ? (
          <StateCard title={t('profile.loadErrorTitle')} subtitle={t('profile.loadErrorSubtitle')} />
        ) : (
          <PublicProfile key={user.id} user={user} language={language} />
        )}
      </main>
    </div>
  )
}

function PublicProfile({ user, language }: { user: PublicUser; language: AppLanguage }) {
  const { t } = useLanguage()
  const isSeller = user.role === 'seller'
  const [activeTab, setActiveTab] = useState<PublicTab>('posts')
  const interests = useUserInterestsQuery(user.id)

  const tabs: { id: PublicTab; label: string; icon: React.ReactNode }[] = [
    { id: 'posts', label: t('profile.tabs.posts'), icon: <LayoutGrid className="size-4" aria-hidden="true" /> },
    { id: 'threads', label: t('profile.tabs.threads'), icon: <MessageCircle className="size-4" aria-hidden="true" /> },
    ...(isSeller
      ? [{ id: 'products' as const, label: t('userProfile.tabs.products'), icon: <ShoppingBag className="size-4" aria-hidden="true" /> }]
      : []),
  ]

  return (
    <>
      <PublicProfileHeader user={user} language={language} />

      <AnimatedTabs
        items={tabs}
        value={activeTab}
        onChange={setActiveTab}
        semantics="pressed"
        className="mt-6 flex items-center gap-1.5 overflow-x-auto border-b border-mynted-border pb-1 [scrollbar-width:thin]"
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <div className="flex flex-col gap-6">
          <AboutCard user={user} language={language} />
          <div className="rounded-2xl border border-mynted-border bg-mynted-white p-6">
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-mynted-ink">
              <HeartOutline className="size-5 text-mynted-orange" aria-hidden="true" />
              {t('userProfile.interests')}
            </h2>
            {interests.isLoading && <p className="mt-3 text-sm text-mynted-gray">{t('profile.loadingInterests')}</p>}
            {interests.isError && <p className="mt-3 text-sm text-red-500">{t('profile.loadInterestsError')}</p>}
            {interests.data?.length === 0 && <p className="mt-3 text-sm text-mynted-gray">{t('userProfile.noInterests')}</p>}
            {interests.data && interests.data.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {interests.data.map((interest) => (
                  <span
                    key={interest.tagId}
                    className="rounded-full border border-mynted-border bg-mynted-bg px-3 py-1.5 text-xs font-semibold text-mynted-ink"
                  >
                    {interest.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          {activeTab === 'posts' && <PublicationsTab userId={user.id} />}
          {activeTab === 'threads' && <ThreadsTab userId={user.id} />}
          {activeTab === 'products' && isSeller && <ProductsTab userId={user.id} />}
        </div>
      </div>
    </>
  )
}

function PublicationsTab({ userId }: { userId: string }) {
  const query = useUserContent(userId)
  const entries = query.data?.pages.flatMap((page) => page.data) ?? []
  return (
    <ProfileFeedFrame
      query={query}
      isEmpty={entries.length === 0}
      emptyTitle="profile.tabs.postsEmptyTitle"
      emptySubtitle="userProfile.postsEmptySubtitle"
    >
      <ContentBentoGrid entries={entries} />
    </ProfileFeedFrame>
  )
}

function ThreadsTab({ userId }: { userId: string }) {
  const query = useUserForumPosts(userId)
  const posts = query.data?.pages.flatMap((page) => page.data) ?? []
  return (
    <ProfileFeedFrame
      query={query}
      isEmpty={posts.length === 0}
      emptyTitle="profile.tabs.threadsEmptyTitle"
      emptySubtitle="userProfile.threadsEmptySubtitle"
    >
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {posts.map((post) => (
          <li key={post.id}>
            <ProfilePostCard post={post} />
          </li>
        ))}
      </ul>
    </ProfileFeedFrame>
  )
}

function ProductsTab({ userId }: { userId: string }) {
  const query = useUserProducts(userId)
  // Los productos vienen sin fecha propia: se reutiliza la grilla de contenido, que solo la usa para ordenar.
  const entries: MyContentEntry[] =
    query.data?.pages.flatMap((page) => page.data).map((product) => ({ type: 'product', date: '', product })) ?? []
  return (
    <ProfileFeedFrame
      query={query}
      isEmpty={entries.length === 0}
      emptyTitle="userProfile.productsEmptyTitle"
      emptySubtitle="userProfile.productsEmptySubtitle"
    >
      <ContentBentoGrid entries={entries} />
    </ProfileFeedFrame>
  )
}

function StateCard({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-mynted-border bg-mynted-white py-24 text-center">
      <h1 className="font-heading text-xl font-semibold text-mynted-ink">{title}</h1>
      <p className="max-w-sm text-sm text-mynted-gray">{subtitle}</p>
      {children}
    </div>
  )
}

function PublicProfileHeader({ user, language }: { user: PublicUser; language: AppLanguage }) {
  const { t } = useLanguage()
  const seller = user.seller

  return (
    <div>
      <CoverBanner />

      <div className="relative -mt-10 rounded-2xl border border-mynted-border bg-mynted-white pt-16 pb-6 shadow-[0_16px_40px_-8px_rgba(13,13,20,0.08)] sm:pb-8">
        <span className="absolute -top-14 left-1/2 z-20 flex size-28 -translate-x-1/2 items-center justify-center overflow-hidden rounded-full border-4 border-mynted-white bg-mynted-orange font-heading text-3xl font-semibold text-white shadow-md">
          {user.photoUrl ? (
            <img src={user.photoUrl} alt={user.username} className="size-full object-cover" />
          ) : (
            getInitials(user.username)
          )}
        </span>

        <div className="flex flex-col items-center px-6 text-center">
          <h1 className="font-heading text-2xl font-semibold text-mynted-ink">{user.username}</h1>
          <p className="text-sm text-mynted-gray">@{user.username}</p>

          {seller && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              <span className="flex items-center gap-1.5 rounded-full bg-[#e8faf2] px-3 py-1 text-xs font-semibold text-[#0d8c66]">
                <ShoppingBag className="size-3.5" aria-hidden="true" />
                {seller.isVerified ? `${t('userProfile.sellerBadge')} · ${t('itemDetail.verifiedSeller')}` : t('userProfile.sellerBadge')}
              </span>
              {seller.ratingAverage !== null ? (
                <span className="flex items-center gap-2 text-sm text-mynted-gray">
                  <Rating value={seller.ratingAverage} size={14} />
                  {seller.ratingAverage.toFixed(1)} · {t('reviews.count', { count: seller.reviewsCount })}
                </span>
              ) : (
                <span className="text-sm text-mynted-gray">{t('itemDetail.sellerNoReviews')}</span>
              )}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-sm text-mynted-gray">
            {user.location?.trim() && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden="true" />
                {user.location}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4" aria-hidden="true" />
              {t('profile.about.memberSinceLabel', { date: formatMemberSince(user.createdAt, language) })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
