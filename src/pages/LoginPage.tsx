import { DecorativeBackground } from '../components/ui/DecorativeBackground'
import { AuthCard } from '../features/auth/AuthCard'

export default function LoginPage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center bg-mynted-bg px-4 py-8">
      <DecorativeBackground />
      <AuthCard />
    </div>
  )
}
