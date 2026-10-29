import { ErrorState } from '@/components/errors/ErrorState'
import { useState } from 'react'
import { SignedOutState } from '@/components/errors/QueryErrorState'
import type { UseQueryResult } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Edit05, Heart as HeartOutline, Mail01 } from '@untitledui/icons'
import {
  Award,
  CalendarDays,
  Info,
  LayoutGrid,
  MessageCircle,
  Package,
  Palette,
  Plus,
  Receipt,
  ShoppingBag,
  Star,
  Store,
  UsersRound,
} from 'lucide-react'
import type { FC } from 'react'
import { AnimatedTabs } from '@/components/ui/AnimatedTabs'
import { BecomeSellerForm } from '@/features/auth/components/BecomeSellerForm'
import { BadgesCard } from '@/features/badges/components/BadgesCard'
import { useBadgeCatalog, useMyBadges } from '@/features/badges/hooks/useBadgesQueries'
import { MyFavoritesTab } from '@/features/favorites/components/MyFavoritesTab'
import { MyPurchasesTab } from '@/features/payments/components/MyPurchasesTab'
import { MyPublicationsTab } from '@/features/community/components/profile/MyPublicationsTab'
import { MyThreadsTab } from '@/features/community/components/profile/MyThreadsTab'
import { useMyCommunities } from '@/features/community/hooks/useCommunitiesQueries'
import { useMyContent } from '@/features/community/hooks/useForumQueries'
import { useStore } from '@/features/stores/hooks/useStoreQueries'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useMyInterestsQuery } from '@/features/auth/hooks/useInterestsMutations'
import { ProductGrid } from '@/features/products/components/ProductGrid'
import { useMyProducts } from '@/features/products/hooks/useProductQueries'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import type { AppLanguage } from '@/utils/locale'
import type { AuthUser } from '@/features/auth/models/auth'
import type { Interest } from '@/features/auth/models/interests'
import { AboutCard, CoverBanner, HeaderStat, HeaderStatSkeleton } from '@/features/profile/components/ProfileParts'
import { RatingSummary } from '@/components/ui/RatingSummary'
import { ReputationCard } from '@/features/reputation/components/ReputationCard'
import { AvatarFrame } from '@/features/pro/components/AvatarFrame'
import { ProBadge } from '@/features/pro/components/ProBadge'
import { SkinnedGoose } from '@/features/pro/components/SkinnedGoose'
import { formatMemberSince, getInitials } from '@/features/profile/utils/profileFormat'
import { INTL_LOCALES } from '@/utils/locale'
import { SiteHeader } from '../components/layout/SiteHeader'
import { Loader } from '../components/ui/Loader'
import { Button } from '@/components/ui/Button'
import { PAGE_CONTAINER } from '@/components/layout/pageContainer'
import { cx } from '@/utils/cx'

type ProfileTab = 'posts' | 'threads' | 'products' | 'purchases' | 'favorites' | 'info'

export default function ProfilePage() {
  const { t, language } = useLanguage()
  const { isLoggedIn, data: user, isLoading, isError } = useCurrentUser()
  const interestsQuery = useMyInterestsQuery(isLoggedIn)
  const badgesQuery = useMyBadges(isLoggedIn)
  // Catálogo de badges de cuenta: en el perfil propio también se muestran los que faltan por ganar.
  const badgeCatalogQuery = useBadgeCatalog('user', isLoggedIn)
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts')
  const navigate = useNavigate()
  const [isBecomeSellerOpen, setIsBecomeSellerOpen] = useState(false)

  const isSeller = user?.role === 'seller'

  return (
    <div className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className={cx(PAGE_CONTAINER, 'pt-6 pb-16')}>
        {!isLoggedIn && <SignedOutState description={t('profile.signedOutSubtitle')} />}

        {isLoggedIn && isLoading && (
          <div className="flex justify-center py-24">
            <Loader label={t('profile.loadingProfile')} />
          </div>
        )}

        {isLoggedIn && !isLoading && (isError || !user) && <LoadErrorState />}

        {isLoggedIn && user && (
          <>
            <ProfileHeader
              user={user}
              language={language}
              // Los formularios de edición viven en /settings (pestaña Perfil).
              onEditProfile={() => void navigate({ to: '/settings', search: { tab: 'profile' } })}
              onBecomeSeller={() => setIsBecomeSellerOpen(true)}
              onCreateProduct={() => void navigate({ to: '/products/new' })}
              onCustomize={() => void navigate({ to: '/settings', search: { tab: 'appearance' } })}
            />

            <ProfileTabsBar activeTab={activeTab} onChange={setActiveTab} isSeller={isSeller} />

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
              {/* En mobile/tablet la barra lateral (About/Badges/Intereses) deja de
                  convivir con el contenido de las tabs: pasa a ser ella misma una tab
                  más ("Info", ver PROFILE_TABS) para no empujar las publicaciones muy
                  abajo. En desktop (lg+) vuelve a mostrarse siempre, fija a la
                  izquierda, sin depender de qué tab esté activa. */}
              <div className={`${activeTab === 'info' ? 'flex' : 'hidden'} flex-col gap-6 lg:order-1 lg:flex`}>
                <AboutCard user={user} language={language} />
                {/* Reputación como vendedor (promedio, reparto por estrellas y ventas). */}
                {user.seller && <ReputationCard userId={user.id} />}
                <BadgesCard query={badgesQuery} catalogQuery={badgeCatalogQuery} emptyKey="profile.badges.empty" />
                <InterestsCard interestsQuery={interestsQuery} />
              </div>

              <div className={`${activeTab === 'info' ? 'hidden' : ''} lg:order-2 lg:block`}>
                {activeTab === 'posts' && <MyPublicationsTab />}
                {activeTab === 'threads' && <MyThreadsTab />}
                {activeTab === 'products' && isSeller && (
                  <MyProductsTab onCreateProduct={() => void navigate({ to: '/products/new' })} />
                )}
                {activeTab === 'purchases' && <MyPurchasesTab />}
                {activeTab === 'favorites' && <MyFavoritesTab />}
                {(activeTab === 'info' || (activeTab === 'products' && !isSeller)) && (
                  <TabContent activeTab={activeTab} />
                )}
              </div>
            </div>

            <BecomeSellerForm isOpen={isBecomeSellerOpen} onClose={() => setIsBecomeSellerOpen(false)} />
          </>
        )}
      </main>
    </div>
  )
}

function LoadErrorState() {
  const { t } = useLanguage()
  return <ErrorState kind="error" description={t('profile.loadErrorSubtitle')} />
}

function ProfileHeader({
  user,
  onEditProfile,
  onBecomeSeller,
  onCreateProduct,
  onCustomize,
}: {
  user: AuthUser
  language: AppLanguage
  onEditProfile: () => void
  onBecomeSeller: () => void
  onCreateProduct: () => void
  onCustomize: () => void
}) {
  const { t } = useLanguage()
  const isSeller = user.role === 'seller'
  const isSellerRequestPending = user.sellerRequestStatus === 'pending'

  return (
    <div>
      <CoverBanner banner={user.cosmetics?.banner} />

      <div className="relative -mt-10 rounded-2xl border border-mynted-border bg-mynted-white pt-16 pb-6 shadow-[0_16px_40px_-8px_rgba(13,13,20,0.08)] sm:pb-8">
        {/* El ganso con la skin elegida, como "sticker" del perfil. */}
        <span className="absolute -top-7 left-4 z-10 flex size-14 items-center justify-center rounded-full border-4 border-mynted-white bg-white shadow-sm sm:left-6">
          <SkinnedGoose skin={user.cosmetics?.gooseSkin} className="size-10" />
        </span>

        <div className="absolute -top-5 right-4 z-10 flex items-center gap-2 sm:right-6">
          {!isSeller &&
            (isSellerRequestPending ? (
              <span className="flex h-10 cursor-default items-center gap-1.5 rounded-xl border border-mynted-border bg-mynted-bg px-3 text-sm font-semibold text-mynted-gray sm:px-4">
                <ShoppingBag className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t('profile.becomeSeller.pendingPill')}</span>
              </span>
            ) : (
              <Button
                type="button"
                onClick={onBecomeSeller}
                aria-label={t('profile.becomeSeller.cta')}
                variant="primary"
                size="md"
                className="max-sm:w-10 max-sm:px-0"
              >
                <ShoppingBag className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t('profile.becomeSeller.cta')}</span>
              </Button>
            ))}

          {/* Su tienda pública: solo viene `seller` si el vendedor está aprobado. */}
          {user.seller && (
            <Link
              to="/sellers/$sellerId"
              params={{ sellerId: String(user.seller.sellerId) }}
              aria-label={t('store.mine')}
              className="flex h-10 items-center gap-2 rounded-xl border border-mynted-border bg-white px-4 text-sm font-semibold text-mynted-ink outline-none hover:bg-mynted-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid max-sm:w-10 max-sm:justify-center max-sm:px-0"
            >
              <Store className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t('store.mine')}</span>
            </Link>
          )}

          {isSeller && (
            <Button
              type="button"
              onClick={onCreateProduct}
              aria-label={t('products.create.cta')}
              variant="primary"
              size="md"
              className="max-sm:w-10 max-sm:px-0"
            >
              <Plus className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t('products.create.cta')}</span>
            </Button>
          )}

          <Button
            type="button"
            onClick={onCustomize}
            aria-label={t('profile.customize')}
            title={t('profile.customize')}
            variant="secondary"
            size="icon-md"
            // En móvil no entra junto a los demás botones: ahí se llega desde Configuración.
            className="max-sm:hidden"
          >
            <Palette className="size-4" aria-hidden="true" />
          </Button>

          <Button
            type="button"
            onClick={onEditProfile}
            aria-label={t('profile.editProfile')}
            variant="secondary"
            size="md"
            className="max-sm:w-10 max-sm:px-0"
          >
            <Edit05 className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t('profile.editProfile')}</span>
          </Button>
        </div>

        <AvatarFrame frame={user.cosmetics?.frame} size="lg" className="absolute -top-14 left-1/2 z-20 size-28 -translate-x-1/2">
          <span className="flex size-full items-center justify-center overflow-hidden rounded-full border-4 border-mynted-white bg-mynted-orange font-heading text-3xl font-semibold text-white shadow-md">
            {user.photoUrl ? (
              // Las fotos de Google se sirven solo sin Referer; con el de la app dan 429.
              <img
                src={user.photoUrl}
                alt={user.username}
                referrerPolicy="no-referrer"
                className="size-full object-cover"
              />
            ) : (
              getInitials(user.username)
            )}
          </span>
        </AvatarFrame>

        <div className="flex flex-col items-center px-6 text-center">
          <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold text-mynted-ink">
            {user.username}
            {user.isPro && <ProBadge size="md" />}
          </h1>
          <p className="text-sm text-mynted-gray">@{user.username}</p>

          <span className="mt-3 flex items-center gap-1.5 text-sm text-mynted-gray">
            <Mail01 className="size-4" aria-hidden="true" />
            {user.email}
          </span>
        </div>

        <ProfileStats user={user} />
      </div>
    </div>
  )
}

/**
 * Franja de cifras al pie de la cabecera, con el mismo formato que la de la
 * tienda. Todo sale de endpoints que ya existen:
 * - Vendedor aprobado: ventas y productos activos (GET /sellers/:id),
 *   calificación (`seller` de GET /users/me) y comunidades.
 * - Resto: publicaciones (GET /posts/me), comunidades (GET /users/me/communities),
 *   insignias (GET /users/me/badges) y desde cuándo es miembro.
 * Las consultas son las mismas que usan las pestañas y tarjetas del perfil,
 * así que comparten caché y no se piden dos veces.
 */
function ProfileStats({ user }: { user: AuthUser }) {
  const { t, language } = useLanguage()
  const seller = user.seller
  const store = useStore(seller?.sellerId)
  // Solo interesa el total: con limit=1 la respuesta es mínima.
  const communities = useMyCommunities({ limit: 1 })
  const content = useMyContent(!seller)
  const badges = useMyBadges(!seller)

  const number = (value: number) => value.toLocaleString(INTL_LOCALES[language])
  /** Valor de una cifra: el número, un hueco mientras carga o "—" si falló. */
  const show = (query: { isPending: boolean; isError: boolean }, value: number | undefined) =>
    query.isError ? '—' : query.isPending || value === undefined ? <HeaderStatSkeleton /> : number(value)

  const communitiesStat = (
    <HeaderStat
      icon={<UsersRound className="size-4" />}
      label={t('profile.stats.communities')}
      value={show(communities, communities.data?.pagination.total)}
    />
  )

  return (
    <dl
      aria-label={t('profile.stats.label')}
      className="mt-6 grid grid-cols-2 gap-px overflow-hidden border-t border-mynted-border bg-mynted-border sm:grid-cols-4"
    >
      {seller ? (
        <>
          <HeaderStat
            icon={<ShoppingBag className="size-4" />}
            label={t('store.stats.sales')}
            value={show(store, store.data?.completedSalesCount)}
          />
          <HeaderStat
            icon={<Package className="size-4" />}
            label={t('store.stats.activeProducts')}
            value={show(store, store.data?.activeProductsCount)}
          />
          <HeaderStat
            icon={<Star className="size-4" />}
            label={t('profile.stats.rating')}
            value={
              <RatingSummary
                average={seller.ratingAverage}
                count={seller.reviewsCount}
                variant="compact"
                size="lg"
                emptyLabel={t('profile.stats.noRating')}
              />
            }
          />
          {communitiesStat}
        </>
      ) : (
        <>
          <HeaderStat
            icon={<LayoutGrid className="size-4" />}
            label={t('profile.tabs.posts')}
            value={show(content, content.data?.pages[0]?.pagination.total)}
          />
          {communitiesStat}
          <HeaderStat
            icon={<Award className="size-4" />}
            label={t('profile.badges.titleNoCount')}
            value={show(badges, badges.data?.length)}
          />
          <HeaderStat
            icon={<CalendarDays className="size-4" />}
            label={t('profile.stats.memberSince')}
            value={formatMemberSince(user.createdAt, language)}
          />
        </>
      )}
    </dl>
  )
}

const PROFILE_TABS: { id: ProfileTab; labelKey: TranslationKey; icon: FC<{ className?: string }>; sellerOnly?: boolean; mobileOnly?: boolean }[] = [
  { id: 'posts', labelKey: 'profile.tabs.posts', icon: LayoutGrid },
  { id: 'threads', labelKey: 'profile.tabs.threads', icon: MessageCircle },
  { id: 'products', labelKey: 'profile.tabs.products', icon: ShoppingBag, sellerOnly: true },
  { id: 'purchases', labelKey: 'profile.tabs.purchases', icon: Receipt },
  { id: 'favorites', labelKey: 'profile.tabs.favorites', icon: HeartOutline },
  // Solo en mobile/tablet: en desktop el About/Badges/Intereses ya está siempre visible a la izquierda.
  { id: 'info', labelKey: 'profile.tabs.info', icon: Info, mobileOnly: true },
]

function ProfileTabsBar({
  activeTab,
  onChange,
  isSeller,
}: {
  activeTab: ProfileTab
  onChange: (tab: ProfileTab) => void
  isSeller: boolean
}) {
  const { t } = useLanguage()
  const visibleTabs = PROFILE_TABS.filter((tab) => !tab.sellerOnly || isSeller)

  return (
    <AnimatedTabs
      items={visibleTabs.map(({ id, labelKey, icon: Icon, mobileOnly }) => ({
        id,
        label: t(labelKey),
        icon: <Icon className="size-4" aria-hidden="true" />,
        className: mobileOnly ? 'lg:hidden' : undefined,
      }))}
      value={activeTab}
      onChange={onChange}
      semantics="pressed"
      className="mt-6 flex items-center gap-1.5 overflow-x-auto border-b border-mynted-border pb-1 [scrollbar-width:thin]"
    />
  )
}

function TabContent({ activeTab }: { activeTab: ProfileTab }) {
  const { t } = useLanguage()
  const copy: Record<ProfileTab, { title: TranslationKey; subtitle: TranslationKey }> = {
    posts: { title: 'profile.tabs.postsEmptyTitle', subtitle: 'profile.tabs.postsEmptySubtitle' },
    threads: { title: 'profile.tabs.threadsEmptyTitle', subtitle: 'profile.tabs.threadsEmptySubtitle' },
    products: { title: 'profile.tabs.productsEmptyTitle', subtitle: 'profile.tabs.productsEmptySubtitle' },
    purchases: { title: 'purchases.empty.title', subtitle: 'purchases.empty.subtitle' },
    favorites: { title: 'profile.tabs.favoritesEmptyTitle', subtitle: 'profile.tabs.favoritesEmptySubtitle' },
    // 'info' no tiene tab propia en desktop (el sidebar ya está siempre visible ahí):
    // este fallback solo cubre el caso raro de pasar a desktop con activeTab='info'
    // todavía elegido desde una vista mobile anterior.
    info: { title: 'profile.tabs.postsEmptyTitle', subtitle: 'profile.tabs.postsEmptySubtitle' },
  }
  const { title, subtitle } = copy[activeTab]

  return (
    <ErrorState kind="empty" variant="compact" title={t(title)} description={t(subtitle)} />
  )
}

function InterestsCard({ interestsQuery }: { interestsQuery: UseQueryResult<Interest[]> }) {
  const { t } = useLanguage()
  return (
    <div className="rounded-2xl border border-mynted-border bg-mynted-white p-6">
      <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-mynted-ink">
        <HeartOutline className="size-5 text-mynted-orange" aria-hidden="true" />
        {t('profile.myInterests')}
      </h2>

      {interestsQuery.isLoading && <p className="mt-3 text-sm text-mynted-gray">{t('profile.loadingInterests')}</p>}

      {interestsQuery.isError && (
        <p className="mt-3 text-sm text-red-500">{t('profile.loadInterestsError')}</p>
      )}

      {interestsQuery.data && interestsQuery.data.length === 0 && (
        <p className="mt-3 text-sm text-mynted-gray">{t('profile.noInterestsYet')}</p>
      )}

      {interestsQuery.data && interestsQuery.data.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {interestsQuery.data.map((interest) => (
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
  )
}

/** Pestaña "Productos en venta" del vendedor: GET /users/me/products. */
function MyProductsTab({ onCreateProduct }: { onCreateProduct: () => void }) {
  const { t } = useLanguage()
  const productsQuery = useMyProducts()

  return (
    <ProductGrid
      query={productsQuery}
      showCommunity
      emptyState={
        <ErrorState kind="empty" variant="compact" title={t('profile.tabs.productsEmptyTitle')} description={t('profile.tabs.productsEmptySubtitle')}>
          <Button
            type="button"
            onClick={onCreateProduct}
            variant="primary"
            size="md"
            className="mt-3"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t('products.create.firstCta')}
          </Button>
        </ErrorState>
      }
    />
  )
}
