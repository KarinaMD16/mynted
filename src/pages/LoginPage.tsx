import { useSearch } from '@tanstack/react-router'
import { AuthCard } from '@/features/auth/components/AuthCard'
import { DecorativeBackground } from '../components/ui/DecorativeBackground'

export default function LoginPage() {
  // `?mode=interests` llega desde /auth/callback cuando el registro con un
  // proveedor creó la cuenta y falta elegir intereses.
  const { mode } = useSearch({ from: '/login' })

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-mynted-bg px-4 py-8">
      <DecorativeBackground />
      <AuthCard initialMode={mode === 'interests' ? 'interests' : undefined} />
    </div>
  )
}
