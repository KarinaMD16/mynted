import type { UseQueryResult } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Calendar, Edit05, Heart, Mail01 } from '@untitledui/icons'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useMyInterestsQuery } from '@/features/auth/hooks/useInterestsMutations'
import type { AuthUser } from '@/features/auth/models/auth'
import type { Interest } from '@/features/auth/models/interests'
import { SiteHeader } from '../components/layout/SiteHeader'
import { Loader } from '../components/ui/Loader'

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase()
}

function formatMemberSince(createdAt: string): string {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/**
 * "/profile" — adaptado del mockup de Figma "🧭 Seller Profile (Neutral
 * Redesign)" (node 135:519) para mostrar el perfil del usuario que tiene la
 * sesión abierta, en vez del de un vendedor cualquiera: la identidad sale de
 * GET /users/{id} (con el id que se guarda al iniciar sesión, ver
 * useCurrentUser) y sus intereses de GET /interests/me. El mockup original
 * también trae ventas/rating/insignias/comunidades/feed de productos, pero
 * el backend todavía no tiene esos endpoints — en vez de inventar números,
 * esas secciones quedan como "próximamente".
 */
export default function ProfilePage() {
  const { isLoggedIn, data: user, isLoading, isError } = useCurrentUser()
  const interestsQuery = useMyInterestsQuery(isLoggedIn)

  return (
    <div className="min-h-svh bg-mynted-bg">
      <div className="px-4 pt-5 sm:px-6">
        <SiteHeader />
      </div>

      <main className="mx-auto max-w-[1320px] px-4 pt-6 pb-16 sm:px-6">
        {!isLoggedIn && <SignedOutState />}

        {isLoggedIn && isLoading && (
          <div className="flex justify-center py-24">
            <Loader label="Loading your profile…" />
          </div>
        )}

        {isLoggedIn && !isLoading && (isError || !user) && <LoadErrorState />}

        {isLoggedIn && user && (
          <>
            <CoverBanner />
            <ProfileCard user={user} />

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
              <InterestsCard interestsQuery={interestsQuery} />
              <ComingSoonCard />
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function SignedOutState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-mynted-border bg-mynted-white py-24 text-center">
      <h1 className="font-heading text-xl font-semibold text-mynted-ink">Sign in to see your profile</h1>
      <p className="max-w-sm text-sm text-mynted-gray">You need an account to view and manage your mynted profile.</p>
      <Link
        to="/login"
        className="mt-2 rounded-[10px] bg-mynted-orange px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-mynted-orange-hover"
      >
        Go to login
      </Link>
    </div>
  )
}

function LoadErrorState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-mynted-border bg-mynted-white py-24 text-center">
      <h1 className="font-heading text-xl font-semibold text-mynted-ink">Couldn't load your profile</h1>
      <p className="max-w-sm text-sm text-mynted-gray">
        Something went wrong fetching your account. Try refreshing the page.
      </p>
    </div>
  )
}

/** Franjas decorativas de portada — mismo lenguaje visual que DecorativeBackground, contenidas a una banda. */
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

function ProfileCard({ user }: { user: AuthUser }) {
  return (
    <div className="relative -mt-10 rounded-2xl border border-mynted-border bg-mynted-white p-6 shadow-[0_16px_40px_-8px_rgba(13,13,20,0.08)] sm:p-8">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
        <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-mynted-white bg-mynted-orange font-heading text-2xl font-semibold text-white shadow-md">
          {user.photoUrl ? (
            <img src={user.photoUrl} alt={user.username} className="size-full object-cover" />
          ) : (
            getInitials(user.username)
          )}
        </span>

        <div className="flex-1">
          <h1 className="font-heading text-2xl font-semibold text-mynted-ink">{user.username}</h1>
          <p className="text-sm text-mynted-gray">@{user.username}</p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-sm text-mynted-gray sm:justify-start">
            <span className="flex items-center gap-1.5">
              <Mail01 className="size-4" aria-hidden="true" />
              {user.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4" aria-hidden="true" />
              Member since {formatMemberSince(user.createdAt)}
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled
          title="Coming soon"
          className="flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-[10px] border border-mynted-border px-4 py-2.5 text-sm font-semibold text-mynted-gray opacity-70"
        >
          <Edit05 className="size-4" aria-hidden="true" />
          Edit profile
        </button>
      </div>
    </div>
  )
}

function InterestsCard({ interestsQuery }: { interestsQuery: UseQueryResult<Interest[]> }) {
  return (
    <div className="rounded-2xl border border-mynted-border bg-mynted-white p-6">
      <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-mynted-ink">
        <Heart className="size-5 text-mynted-orange" aria-hidden="true" />
        My interests
      </h2>

      {interestsQuery.isLoading && <p className="mt-3 text-sm text-mynted-gray">Loading…</p>}

      {interestsQuery.isError && <p className="mt-3 text-sm text-red-500">Couldn't load your interests.</p>}

      {interestsQuery.data && interestsQuery.data.length === 0 && (
        <p className="mt-3 text-sm text-mynted-gray">You haven't picked any interests yet.</p>
      )}

      {interestsQuery.data && interestsQuery.data.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {interestsQuery.data.map((interest) => (
            <span
              key={interest.id}
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

/**
 * Reemplaza ventas/rating/insignias/comunidades/feed de productos del
 * mockup original: todavía no hay endpoints para esos datos, así que en vez
 * de inventar números se deja un estado honesto de "todavía no hay nada".
 */
function ComingSoonCard() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-mynted-border bg-mynted-white px-6 py-16 text-center">
      <h2 className="font-heading text-lg font-semibold text-mynted-ink">Your seller stats are on their way</h2>
      <p className="max-w-sm text-sm text-mynted-gray">
        Sales, ratings, achievements, and your product listings will show up here once those features are live.
      </p>
    </div>
  )
}
