import { Link } from '@tanstack/react-router'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { CommunityNotice } from '@/features/community/components/ui/CommunityNotice'
import { MyFavoritesTab } from '@/features/favorites/components/MyFavoritesTab'
import { useLanguage } from '@/i18n/LanguageContext'

export default function FavoritesPage() {
  const { t } = useLanguage()
  const { isLoggedIn, isLoading: isLoadingSession } = useCurrentUser()

  return (
    <section className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className="flex flex-col gap-6 px-6 py-10 sm:px-14 sm:py-15">
        <h1 className="font-heading text-2xl font-semibold text-mynted-ink">{t('favorites.page.title')}</h1>

        {isLoadingSession && (
          <div aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-56 animate-pulse rounded-2xl bg-white" />
            <div className="h-56 animate-pulse rounded-2xl bg-white" />
            <div className="h-56 animate-pulse rounded-2xl bg-white" />
          </div>
        )}

        {!isLoadingSession && !isLoggedIn && (
          <CommunityNotice
            title={t('favorites.signedOutTitle')}
            description={t('favorites.signedOutDescription')}
          >
            <Link
              to="/login"
              className="rounded-lg bg-mynted-orange px-4 py-2 text-sm font-semibold text-mynted-ink hover:bg-mynted-orange-hover"
            >
              {t('favorites.signIn')}
            </Link>
          </CommunityNotice>
        )}

        {isLoggedIn && <MyFavoritesTab />}
      </main>
    </section>
  )
}
