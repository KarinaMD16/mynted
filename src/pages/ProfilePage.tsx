import { useState } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Calendar, Edit05, Heart as HeartOutline, Mail01 } from '@untitledui/icons'
import { Clock, Info, LayoutGrid, type LucideIcon, Link2, MapPin, MessageCircle, Plus, ShoppingBag, TrendingUp } from 'lucide-react'
import { EditProfileForm } from '@/features/auth/components/EditProfileForm'
import { BecomeSellerForm } from '@/features/auth/components/BecomeSellerForm'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useMyInterestsQuery } from '@/features/auth/hooks/useInterestsMutations'
import { CreateProductDialog } from '@/features/products/components/CreateProductDialog'
import { ProductGrid } from '@/features/products/components/ProductGrid'
import { useMyProducts } from '@/features/products/hooks/useProductQueries'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { INTL_LOCALES, type AppLanguage } from '@/utils/locale'
import type { AuthUser } from '@/features/auth/models/auth'
import type { Interest } from '@/features/auth/models/interests'
import { SiteHeader } from '../components/layout/SiteHeader'
import { Loader } from '../components/ui/Loader'
import { Button } from '@/components/ui/Button'

type ProfileTab = 'posts' | 'threads' | 'products' | 'favorites' | 'info'

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase()
}

function formatMemberSince(createdAt: string, language: AppLanguage): string {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(INTL_LOCALES[language], { month: 'long', year: 'numeric' })
}

export default function ProfilePage() {
  const { t, language } = useLanguage()
  const { isLoggedIn, data: user, isLoading, isError } = useCurrentUser()
  const interestsQuery = useMyInterestsQuery(isLoggedIn)
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts')
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isBecomeSellerOpen, setIsBecomeSellerOpen] = useState(false)
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false)

  const isSeller = user?.role === 'seller'

  return (
    <div className="min-h-svh bg-mynted-bg">
      <div className="px-4 pt-5 sm:px-6">
        <SiteHeader />
      </div>

      <main className="mx-auto max-w-[1320px] px-4 pt-6 pb-16 sm:px-6">
        {!isLoggedIn && <SignedOutState />}

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
              onEditProfile={() => setIsEditOpen(true)}
              onBecomeSeller={() => setIsBecomeSellerOpen(true)}
              onCreateProduct={() => setIsCreateProductOpen(true)}
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
                <BadgesCard />
                <InterestsCard interestsQuery={interestsQuery} />
              </div>

              <div className={`${activeTab === 'info' ? 'hidden' : ''} lg:order-2 lg:block`}>
                {activeTab === 'products' && isSeller ? (
                  <MyProductsTab onCreateProduct={() => setIsCreateProductOpen(true)} />
                ) : (
                  <TabContent activeTab={activeTab} />
                )}
              </div>
            </div>

            <EditProfileForm isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} user={user} />
            <BecomeSellerForm isOpen={isBecomeSellerOpen} onClose={() => setIsBecomeSellerOpen(false)} />
            {/* Solo los vendedores pueden publicar (el backend lo exige con SellerGuard). */}
            {isSeller && (
              <CreateProductDialog isOpen={isCreateProductOpen} onClose={() => setIsCreateProductOpen(false)} />
            )}
          </>
        )}
      </main>
    </div>
  )
}

function SignedOutState() {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-mynted-border bg-mynted-white py-24 text-center">
      <h1 className="font-heading text-xl font-semibold text-mynted-ink">{t('profile.signedOutTitle')}</h1>
      <p className="max-w-sm text-sm text-mynted-gray">{t('profile.signedOutSubtitle')}</p>
      <Link
        to="/login"
        className="mt-2 rounded-[10px] bg-mynted-orange px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-mynted-orange-hover"
      >
        {t('profile.goToLogin')}
      </Link>
    </div>
  )
}

function LoadErrorState() {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-mynted-border bg-mynted-white py-24 text-center">
      <h1 className="font-heading text-xl font-semibold text-mynted-ink">{t('profile.loadErrorTitle')}</h1>
      <p className="max-w-sm text-sm text-mynted-gray">{t('profile.loadErrorSubtitle')}</p>
    </div>
  )
}

function CoverBanner() {
  return (
    <div
      aria-hidden="true"
      className="relative h-[110px] overflow-hidden rounded-2xl bg-gradient-to-br from-mynted-blue-mid to-mynted-orange sm:h-[140px]"
    >
      <div className="absolute -top-10 right-[8%] size-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-12 left-[6%] size-32 rounded-full bg-white/10" />
      <div className="absolute top-1/3 left-[42%] size-16 rounded-full bg-white/10" />
    </div>
  )
}

function ProfileHeader({
  user,
  language,
  onEditProfile,
  onBecomeSeller,
  onCreateProduct,
}: {
  user: AuthUser
  language: AppLanguage
  onEditProfile: () => void
  onBecomeSeller: () => void
  onCreateProduct: () => void
}) {
  const { t } = useLanguage()
  const isSeller = user.role === 'seller'
  const isSellerRequestPending = user.sellerRequestStatus === 'pending'

  return (
    <div>
      <CoverBanner />

      <div className="relative -mt-10 rounded-2xl border border-mynted-border bg-mynted-white pt-16 pb-6 shadow-[0_16px_40px_-8px_rgba(13,13,20,0.08)] sm:pb-8">
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

          <span className="mt-3 flex items-center gap-1.5 text-sm text-mynted-gray">
            <Mail01 className="size-4" aria-hidden="true" />
            {user.email}
          </span>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-mynted-border px-6 pt-5 sm:px-8">
          <StatPlaceholder />
          <SocialLinksPlaceholder />
        </div>
      </div>
    </div>
  )
}

function StatPlaceholder() {
  const { t } = useLanguage()
  return (
    <div className="flex items-center gap-2" title={t('profile.comingSoon')}>
      <TrendingUp className="size-4 text-mynted-orange" aria-hidden="true" />
      <span className="font-heading text-lg leading-none font-semibold text-mynted-ink">—</span>
      <span className="text-xs font-medium tracking-wide text-mynted-gray uppercase">
        {t('profile.stats.placeholderLabel')}
      </span>
    </div>
  )
}

function SocialLinksPlaceholder() {
  const { t } = useLanguage()
  return (
    <div role="group" aria-label={t('profile.social.groupLabel')} className="flex items-center gap-2">
      {[0, 1, 2].map((slot) => (
        <span
          key={slot}
          title={t('profile.comingSoon')}
          className="flex size-9 cursor-not-allowed items-center justify-center rounded-full border border-mynted-border text-mynted-gray opacity-60"
        >
          <Link2 className="size-4" aria-hidden="true" />
        </span>
      ))}
    </div>
  )
}

const PROFILE_TABS: { id: ProfileTab; labelKey: TranslationKey; icon: LucideIcon; sellerOnly?: boolean; mobileOnly?: boolean }[] = [
  { id: 'posts', labelKey: 'profile.tabs.posts', icon: LayoutGrid },
  { id: 'threads', labelKey: 'profile.tabs.threads', icon: MessageCircle },
  { id: 'products', labelKey: 'profile.tabs.products', icon: ShoppingBag, sellerOnly: true },
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
    <div className="mt-6 flex items-center gap-2 overflow-x-auto border-b border-mynted-border pb-1 [scrollbar-width:thin]">
      {visibleTabs.map(({ id, labelKey, icon: Icon, mobileOnly }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-pressed={activeTab === id}
          className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
            mobileOnly ? 'lg:hidden' : ''
          } ${activeTab === id ? 'bg-mynted-orange text-white' : 'text-mynted-gray hover:text-mynted-ink'}`}
        >
          <Icon className="size-4" aria-hidden="true" />
          {t(labelKey)}
        </button>
      ))}
    </div>
  )
}

function TabContent({ activeTab }: { activeTab: ProfileTab }) {
  const { t } = useLanguage()
  const copy: Record<ProfileTab, { title: TranslationKey; subtitle: TranslationKey }> = {
    posts: { title: 'profile.tabs.postsEmptyTitle', subtitle: 'profile.tabs.postsEmptySubtitle' },
    threads: { title: 'profile.tabs.threadsEmptyTitle', subtitle: 'profile.tabs.threadsEmptySubtitle' },
    products: { title: 'profile.tabs.productsEmptyTitle', subtitle: 'profile.tabs.productsEmptySubtitle' },
    favorites: { title: 'profile.tabs.favoritesEmptyTitle', subtitle: 'profile.tabs.favoritesEmptySubtitle' },
    // 'info' no tiene tab propia en desktop (el sidebar ya está siempre visible ahí):
    // este fallback solo cubre el caso raro de pasar a desktop con activeTab='info'
    // todavía elegido desde una vista mobile anterior.
    info: { title: 'profile.tabs.postsEmptyTitle', subtitle: 'profile.tabs.postsEmptySubtitle' },
  }
  const { title, subtitle } = copy[activeTab]

  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-mynted-border bg-mynted-white px-6 py-16 text-center">
      <h2 className="font-heading text-lg font-semibold text-mynted-ink">{t(title)}</h2>
      <p className="max-w-sm text-sm text-mynted-gray">{t(subtitle)}</p>
    </div>
  )
}

function AboutCard({ user, language }: { user: AuthUser; language: AppLanguage }) {
  const { t } = useLanguage()
  return (
    <div className="rounded-2xl border border-mynted-border bg-mynted-white p-6">
      <h2 className="font-heading text-lg font-semibold text-mynted-ink">{t('profile.about.title')}</h2>
      <p className="mt-2 text-sm text-mynted-gray">{user.bio?.trim() ? user.bio : t('profile.about.noBio')}</p>

      <div className="mt-4 flex flex-col gap-2.5 border-t border-mynted-border pt-4 text-sm text-mynted-gray">
        <span className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0 text-mynted-orange" aria-hidden="true" />
          {user.location?.trim() ? user.location : t('profile.about.noLocation')}
        </span>
        <span className="flex items-center gap-2">
          <Calendar className="size-4 shrink-0 text-mynted-orange" aria-hidden="true" />
          {t('profile.about.memberSinceLabel', { date: formatMemberSince(user.createdAt, language) })}
        </span>
        <span className="flex items-center gap-2">
          <Clock className="size-4 shrink-0 text-mynted-orange" aria-hidden="true" />
          {t('profile.about.respondsInPlaceholder')}
        </span>
      </div>
    </div>
  )
}

const PLACEHOLDER_BADGES: { emoji: string; labelKey: TranslationKey; className: string }[] = [
  { emoji: '🏆', labelKey: 'profile.badges.topSeller', className: 'bg-mynted-orange/10 text-mynted-orange' },
  { emoji: '⚡', labelKey: 'profile.badges.fastResponder', className: 'bg-mynted-blue/10 text-mynted-blue' },
  { emoji: '📦', labelKey: 'profile.badges.sales100', className: 'bg-mynted-bg text-mynted-ink' },
  { emoji: '⭐', labelKey: 'profile.badges.rating5', className: 'bg-green-400/10 text-green-600' },
  { emoji: '🚚', labelKey: 'profile.badges.secureShipping', className: 'bg-mynted-blue/10 text-mynted-blue-dark' },
  { emoji: '🛡️', labelKey: 'profile.badges.trusted', className: 'bg-mynted-yellow/20 text-amber-600' },
]


function BadgesCard() {
  const { t } = useLanguage()
  return (
    <div className="rounded-2xl border border-mynted-border bg-mynted-white p-6">
      <h2 className="font-heading text-lg font-semibold text-mynted-ink">
        {t('profile.badges.title', { count: PLACEHOLDER_BADGES.length })}
      </h2>
      <p className="mt-1 text-xs text-mynted-gray">{t('profile.badges.previewNote')}</p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {PLACEHOLDER_BADGES.map((badge) => (
          <div key={badge.labelKey} className="flex flex-col items-center gap-1.5 text-center">
            <span className={`flex size-12 items-center justify-center rounded-full text-xl ${badge.className}`}>
              {badge.emoji}
            </span>
            <span className="text-xs font-medium text-mynted-gray">{t(badge.labelKey)}</span>
          </div>
        ))}
      </div>
    </div>
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
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-mynted-border bg-mynted-white px-6 py-16 text-center">
          <h2 className="font-heading text-lg font-semibold text-mynted-ink">{t('profile.tabs.productsEmptyTitle')}</h2>
          <p className="max-w-sm text-sm text-mynted-gray">{t('profile.tabs.productsEmptySubtitle')}</p>
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
        </div>
      }
    />
  )
}
