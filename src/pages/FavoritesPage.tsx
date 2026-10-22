import { SignedOutState } from '@/components/errors/QueryErrorState'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { MyFavoritesTab } from '@/features/favorites/components/MyFavoritesTab'
import { useLanguage } from '@/i18n/LanguageContext'
import { PAGE_CONTAINER } from '@/components/layout/pageContainer'
import { cx } from '@/utils/cx'

export default function FavoritesPage() {
  const { t } = useLanguage()
  const { isLoggedIn, isLoading: isLoadingSession } = useCurrentUser()

  return (
    <section className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className={cx(PAGE_CONTAINER, 'flex flex-col gap-6 py-10 sm:py-15')}>
        <h1 className="font-heading text-2xl font-semibold text-mynted-ink">{t('favorites.page.title')}</h1>

        {isLoadingSession && (
          <div aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-56 animate-pulse rounded-2xl bg-white" />
            <div className="h-56 animate-pulse rounded-2xl bg-white" />
            <div className="h-56 animate-pulse rounded-2xl bg-white" />
          </div>
        )}

        {!isLoadingSession && !isLoggedIn && (
          <SignedOutState description={t('favorites.signedOutDescription')} />
        )}

        {isLoggedIn && <MyFavoritesTab />}
      </main>
    </section>
  )
}
