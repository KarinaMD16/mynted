import { useState } from 'react'
import { Logo } from '../../components/ui/Logo'
import { LoginForm } from './LoginForm'
import { MascotPanel } from './MascotPanel'
import { RegisterForm } from './RegisterForm'

type AuthMode = 'login' | 'register'

interface AuthCardProps {
  /** Modo inicial de la tarjeta. Por defecto arranca en "register", igual que el mockup. */
  initialMode?: AuthMode
}

/** Tarjeta de autenticación (login / crear cuenta) del mockup "Login — Neutral Redesign". */
export function AuthCard({ initialMode = 'register' }: AuthCardProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)

  return (
    <div className="relative flex w-full max-w-[860px] overflow-hidden rounded-[20px] border border-mynted-border bg-white shadow-[0_16px_40px_-8px_rgba(13,13,20,0.1)] sm:h-[600px] lg:max-w-[920px] lg:h-[600px] xl:max-w-[980px] xl:h-[650px]">
      <div className="flex w-full flex-col justify-center gap-3 overflow-y-auto px-6 py-6 sm:w-[460px] sm:shrink-0 sm:px-10">
        <div className="flex h-[56px] items-center justify-center">
          <Logo />
        </div>

        {mode === 'register' ? (
          <RegisterForm onSwitchToLogin={() => setMode('login')} />
        ) : (
          <LoginForm onSwitchToRegister={() => setMode('register')} />
        )}
      </div>

      <MascotPanel />
    </div>
  )
}
