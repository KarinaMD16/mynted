import { AuthShell } from '@/features/auth/components/AuthShell'
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm'
import { DecorativeBackground } from '../components/ui/DecorativeBackground'

export default function ForgotPasswordPage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center bg-mynted-bg px-4 py-8">
      <DecorativeBackground />
      <AuthShell>
        <ForgotPasswordForm />
      </AuthShell>
    </div>
  )
}
