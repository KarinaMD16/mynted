import { isAxiosError } from 'axios'
import { Link, Navigate, useParams } from '@tanstack/react-router'
import { Calendar } from '@untitledui/icons'
import { MapPin, ShoppingBag } from 'lucide-react'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useUserByIdQuery } from '@/features/auth/hooks/useAuthMutations'
import type { AuthUser } from '@/features/auth/models/auth'
import { AboutCard, CoverBanner } from '@/features/profile/components/ProfileParts'
import { formatMemberSince, getInitials } from '@/features/profile/utils/profileFormat'
import { useLanguage } from '@/i18n/LanguageContext'
import type { AppLanguage } from '@/utils/locale'
import { SiteHeader } from '../components/layout/SiteHeader'
import { Loader } from '../components/ui/Loader'

/**
 * Perfil público de otra persona (/users/:userId, por ahora solo se llega
 * escribiendo la ruta a mano). Mismo look que "Mi perfil" pero sin nada de
 * edición ni de publicar, y sin datos privados como el correo. Usa
 * GET /users/:id, que pide sesión.
 */
export default function UserProfilePage() {
  const { t, language } = useLanguage()
  const { userId } = useParams({ from: '/users/$userId' })
  const { isLoggedIn, data: me, isLoading: isLoadingSession } = useCurrentUser()
  const userQuery = useUserByIdQuery(isLoggedIn && me?.id !== userId ? userId : undefined)

  // El perfil de uno mismo es /profile (con edición y todo lo demás).
  if (me?.id === userId) return <Navigate to="/profile" replace />

  const user = userQuery.data
  const notFound =
    userQuery.isError && isAxiosError(userQuery.error) && [400, 404].includes(userQuery.error.response?.status ?? 0)

  return (
    <div className="min-h-svh bg-mynted-bg">
      <div className="px-4 pt-5 sm:px-6">
        <SiteHeader />
      </div>

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
          <>
            <PublicProfileHeader user={user} language={language} />

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
              <div className="flex flex-col gap-6">
                <AboutCard user={user} language={language} />
              </div>

              {/* Todavía no hay endpoints para listar lo que publica otra persona. */}
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-mynted-border bg-mynted-white px-6 py-16 text-center">
                <h2 className="font-heading text-lg font-semibold text-mynted-ink">{t('userProfile.contentSoonTitle')}</h2>
                <p className="max-w-sm text-sm text-mynted-gray">{t('userProfile.contentSoonSubtitle')}</p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
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

function PublicProfileHeader({ user, language }: { user: AuthUser; language: AppLanguage }) {
  const { t } = useLanguage()
  const isSeller = user.role === 'seller'

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

          {isSeller && (
            <span className="mt-3 flex items-center gap-1.5 rounded-full bg-[#e8faf2] px-3 py-1 text-xs font-semibold text-[#0d8c66]">
              <ShoppingBag className="size-3.5" aria-hidden="true" />
              {t('userProfile.sellerBadge')}
            </span>
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
