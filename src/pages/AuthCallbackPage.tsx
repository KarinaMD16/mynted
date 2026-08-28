import { useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Button } from '@/components/ui/Button'
import { LinkAccountForm } from '@/features/auth/components/LinkAccountForm'
import { useCurrentUserQuery } from '@/features/auth/hooks/useAuthMutations'
import { LINK_REQUIRES_PASSWORD } from '@/features/auth/models/auth'
import { DecorativeBackground } from '../components/ui/DecorativeBackground'
import { Loader } from '../components/ui/Loader'
import { Logo } from '../components/ui/Logo'

/**
 * Aterrizaje después de un login/registro con Google o Facebook.
 *
 * El backend nunca manda el token por la URL: la sesión ya quedó en una cookie
 * httpOnly antes de este redirect. Los query params son solo señales de qué
 * pasó, así que acá preguntamos por /auth/me para saber quién entró.
 *
 * Tres desenlaces posibles:
 * - sesión abierta            -> al home (o al paso de intereses si es cuenta nueva);
 * - LINK_REQUIRES_PASSWORD    -> pedimos la contraseña de la cuenta local;
 * - cualquier otro error      -> lo mostramos y volvemos al login.
 */
export default function AuthCallbackPage() {
  const search = useSearch({ from: '/auth/callback' })
  const navigate = useNavigate()

  const needsLink =
    search.error === LINK_REQUIRES_PASSWORD && Boolean(search.email) && Boolean(search.provider)
  const failed = Boolean(search.error) && !needsLink

  const { data: user, isError } = useCurrentUserQuery({ enabled: !needsLink && !failed })

  useEffect(() => {
    if (needsLink || failed || !user) return

    if (search.newUser === 'true') {
      void navigate({ to: '/login', search: { mode: 'interests' } })
      return
    }
    void navigate({ to: '/' })
  }, [needsLink, failed, user, search.newUser, navigate])

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-mynted-bg px-4 py-8">
      <DecorativeBackground />

      <div className="relative flex w-full max-w-[440px] flex-col gap-3 rounded-[20px] border border-mynted-border bg-white px-6 py-8 shadow-[0_16px_40px_-8px_rgba(13,13,20,0.1)] sm:px-10">
        <div className="flex h-[56px] shrink-0 items-center justify-center">
          <Logo />
        </div>

        {needsLink && (
          <LinkAccountForm email={search.email!} provider={search.provider!} />
        )}

        {(failed || isError) && !needsLink && (
          <div className="flex flex-col gap-3.5 text-center">
            <h1 className="font-heading text-[24px] font-semibold text-mynted-ink">
              We couldn't sign you in
            </h1>
            <p className="text-sm text-mynted-gray" role="alert">
              {search.message ?? 'The sign-in with your provider did not complete. Please try again.'}
            </p>
            <Button
              type="button"
              className="hover:cursor-pointer"
              onClick={() => void navigate({ to: '/login' })}
            >
              Back to sign in
            </Button>
          </div>
        )}

        {!needsLink && !failed && !isError && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader label="Signing you in…" size={120} />
          </div>
        )}
      </div>
    </div>
  )
}
