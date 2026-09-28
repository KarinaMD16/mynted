import { useEffect, useRef, type ReactNode } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { LoaderCircle } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { Button } from '@/components/ui/Button'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { useConfirmEmailChangeMutation } from '@/features/auth/hooks/useAuthMutations'
import { useLanguage } from '@/i18n/LanguageContext'
import { DecorativeBackground } from '../components/ui/DecorativeBackground'

const routeApi = getRouteApi('/confirm-email-change')

/**
 * Destino del enlace que manda AuthService.requestEmailChange al correo
 * NUEVO: `${FRONTEND_URL}/confirm-email-change?token=...`. El token por sí
 * solo autoriza el cambio (no hace falta sesión), así que se confirma apenas
 * se abre la página.
 */
export default function ConfirmEmailChangePage() {
  const { t } = useLanguage()
  const { token } = routeApi.useSearch()
  const navigate = useNavigate()
  const confirmEmailChange = useConfirmEmailChangeMutation()

  // En StrictMode los efectos corren dos veces en desarrollo: sin esto el
  // segundo intento fallaría porque el token ya se usó.
  const hasSubmitted = useRef(false)
  const { mutate } = confirmEmailChange
  useEffect(() => {
    if (!token || hasSubmitted.current) return
    hasSubmitted.current = true
    mutate({ token })
  }, [token, mutate])

  const goToSettings = () => void navigate({ to: '/settings', search: { tab: 'account' } })

  let content
  if (!token) {
    content = (
      <Message title={t('settings.confirmEmail.invalidTitle')} body={t('settings.confirmEmail.invalidBody')}>
        <Button type="button" size="lg" fullWidth onClick={goToSettings}>
          {t('settings.confirmEmail.goToSettings')}
        </Button>
      </Message>
    )
  } else if (confirmEmailChange.isSuccess) {
    content = (
      <Message title={t('settings.confirmEmail.doneTitle')} body={t('settings.confirmEmail.doneBody')}>
        <Button type="button" size="lg" fullWidth onClick={goToSettings}>
          {t('settings.confirmEmail.goToSettings')}
        </Button>
      </Message>
    )
  } else if (confirmEmailChange.isError) {
    content = (
      <Message title={t('settings.confirmEmail.errorTitle')} body={getApiErrorMessage(confirmEmailChange.error)}>
        <Button type="button" size="lg" fullWidth onClick={goToSettings}>
          {t('settings.confirmEmail.requestAgain')}
        </Button>
      </Message>
    )
  } else {
    content = (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <LoaderCircle className="size-8 animate-spin text-mynted-orange" aria-hidden="true" />
        <p className="text-sm text-mynted-gray">{t('settings.confirmEmail.confirming')}</p>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-mynted-bg px-4 py-8">
      <DecorativeBackground />
      <AuthShell>{content}</AuthShell>
    </div>
  )
}

function Message({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-3.5">
      <div>
        <h1 className="font-heading text-[24px] font-semibold text-mynted-ink">{title}</h1>
        <p className="mt-1.5 text-sm text-mynted-gray">{body}</p>
      </div>
      {children}
    </div>
  )
}
