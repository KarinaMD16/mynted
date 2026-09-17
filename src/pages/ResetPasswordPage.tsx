import { getRouteApi } from '@tanstack/react-router'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm'
import { DecorativeBackground } from '../components/ui/DecorativeBackground'

const routeApi = getRouteApi('/reset-password')

export default function ResetPasswordPage() {
  const { token } = routeApi.useSearch()

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-mynted-bg px-4 py-8">
      <DecorativeBackground />
      <AuthShell>
        <ResetPasswordForm token={token} />
      </AuthShell>
    </div>
  )
}
