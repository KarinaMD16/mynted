import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/Button'
import { FacebookIcon, GoogleIcon } from '@/components/ui/SocialIcons'
import { getApiErrorMessage } from '@/api/apiError'
import { useFacebookLoginMutation, useGoogleLoginMutation } from '../hooks/useAuthMutations'
import {
  isFacebookConfigured,
  isGoogleConfigured,
  loginWithFacebookPopup,
  preloadFacebookSdk,
  renderGoogleButton,
  type FacebookSdk,
} from '../services/socialSdk'

interface SocialButtonsProps {
  /**
   * Qué hacer cuando el proveedor abre la sesión. Por defecto va al home;
   * el registro lo usa para saltar al paso de intereses.
   */
  onAuthenticated?: () => void
}

/**
 * Login con Google y Facebook contra el backend propio.
 *
 * El backend espera el token que el proveedor entrega en el navegador
 * (POST /auth/google, POST /auth/facebook), así que el trabajo acá es
 * conseguir ese token y mandarlo; la sesión vuelve en cookie httpOnly.
 *
 * Google solo suelta el ID token desde su propio botón, por eso el botón
 * oficial se renderiza transparente encima del nuestro.
 */
export function SocialButtons({ onAuthenticated }: SocialButtonsProps) {
  const navigate = useNavigate()
  const googleLogin = useGoogleLoginMutation()
  const facebookLogin = useFacebookLoginMutation()

  const googleSlotRef = useRef<HTMLDivElement>(null)
  const facebookSdkRef = useRef<FacebookSdk | null>(null)
  const [sdkError, setSdkError] = useState<string | null>(null)

  const finish = () => {
    if (onAuthenticated) {
      onAuthenticated()
      return
    }
    void navigate({ to: '/' })
  }

  // El callback de Google se registra una sola vez, así que la versión fresca
  // de `finish` viaja por un ref en lugar de re-montar el botón.
  const finishRef = useRef(finish)
  useEffect(() => {
    finishRef.current = finish
  })

  // Google: monta su botón real (invisible) sobre el nuestro.
  useEffect(() => {
    const slot = googleSlotRef.current
    if (!isGoogleConfigured || !slot) return

    let cancelled = false
    void renderGoogleButton(
      slot,
      (idToken) => {
        if (cancelled) return
        setSdkError(null)
        googleLogin.mutate(idToken, { onSuccess: () => finishRef.current() })
      },
      (message) => {
        if (!cancelled) setSdkError(message)
      },
    ).catch((error: unknown) => {
      if (!cancelled) setSdkError(getApiErrorMessage(error))
    })

    return () => {
      cancelled = true
    }
    // El botón se monta una sola vez: `googleLogin.mutate` es estable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Facebook: precarga el SDK para que el click pueda abrir el popup sin await.
  useEffect(() => {
    if (!isFacebookConfigured) return

    let cancelled = false
    void preloadFacebookSdk()
      .then((fb) => {
        if (!cancelled) facebookSdkRef.current = fb
      })
      .catch((error: unknown) => {
        if (!cancelled) setSdkError(getApiErrorMessage(error))
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleFacebook = () => {
    const fb = facebookSdkRef.current
    if (!fb) {
      setSdkError(
        isFacebookConfigured
          ? 'Todavía estamos cargando Facebook. Intenta de nuevo en un momento.'
          : 'El inicio de sesión con Facebook no está configurado.',
      )
      return
    }

    setSdkError(null)
    loginWithFacebookPopup(fb)
      .then((accessToken) => {
        facebookLogin.mutate(accessToken, { onSuccess: () => finish() })
      })
      .catch((error: unknown) => setSdkError(getApiErrorMessage(error)))
  }

  const errorMessage =
    sdkError ??
    (googleLogin.isError ? getApiErrorMessage(googleLogin.error) : null) ??
    (facebookLogin.isError ? getApiErrorMessage(facebookLogin.error) : null)

  const isBusy = googleLogin.isPending || facebookLogin.isPending

  return (
    <div className="flex w-full flex-col gap-3.5">
      <div className="flex w-full items-center gap-3">
        <div className="h-px flex-1 bg-mynted-border" />
        <span className="text-[12px] font-medium text-mynted-gray">Or sign in with</span>
        <div className="h-px flex-1 bg-mynted-border" />
      </div>

      <div className="flex w-full gap-3">
        <Button
          type="button"
          variant="facebook"
          className="!w-auto flex-1 hover:cursor-pointer"
          onClick={handleFacebook}
          disabled={isBusy || !isFacebookConfigured}
        >
          <FacebookIcon />
          {facebookLogin.isPending ? 'Signing in…' : 'Facebook'}
        </Button>

        <div className="relative flex-1">
          <Button
            type="button"
            variant="google"
            className="hover:cursor-pointer"
            disabled={isBusy || !isGoogleConfigured}
            // El click real lo recibe el botón de Google que está encima.
            tabIndex={-1}
          >
            <GoogleIcon />
            {googleLogin.isPending ? 'Signing in…' : 'Google'}
          </Button>
          <div
            ref={googleSlotRef}
            className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-0"
            aria-label="Sign in with Google"
          />
        </div>
      </div>

      {errorMessage && (
        <p className="text-center text-xs text-red-500" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
