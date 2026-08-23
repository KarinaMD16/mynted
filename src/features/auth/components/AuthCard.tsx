import { Logo } from '@/components/ui/Logo'
import { useState } from 'react'
import { RegisterForm } from './RegisterForm'
import { LoginForm } from './LoginForm'
import { InterestsStep } from './InterestsStep'
import { MascotPanel } from './MascotPanel'

type AuthMode = 'login' | 'register' | 'interests'

interface AuthCardProps {
  initialMode?: AuthMode
}

export function AuthCard({ initialMode = 'register' }: AuthCardProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)

  return (
    <div className="relative flex w-full max-w-[860px] overflow-hidden rounded-[20px] border border-mynted-border bg-white shadow-[0_16px_40px_-8px_rgba(13,13,20,0.1)] sm:h-[600px] lg:max-w-[920px] lg:h-[600px] xl:max-w-[980px] xl:h-[650px]">
      <div className="flex w-full flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-mynted-orange scrollbar-track-transparent px-6 py-6 sm:w-[460px] sm:shrink-0 sm:px-10">
        <div className="m-auto flex w-full flex-col gap-3">
          <div className="flex h-[56px] shrink-0 items-center justify-center">
            <Logo />
          </div>

          {/* `key={mode}` fuerza el remount al cambiar de paso, así la animación de
              entrada (deslizar de derecha a izquierda) se dispara cada vez. */}
          <div key={mode} className="w-full animate-in fade-in slide-in-from-right-8 duration-300 ease-out">
            {mode === 'register' && (
              <RegisterForm onSwitchToLogin={() => setMode('login')} onRegistered={() => setMode('interests')} />
            )}
            {mode === 'login' && <LoginForm onSwitchToRegister={() => setMode('register')} />}
            {mode === 'interests' && <InterestsStep />}
          </div>
        </div>
      </div>

      <MascotPanel />
    </div>
  )
}
