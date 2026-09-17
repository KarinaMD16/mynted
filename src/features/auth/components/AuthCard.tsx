import { useState } from 'react'
import { RegisterForm } from './RegisterForm'
import { LoginForm } from './LoginForm'
import { InterestsStep } from './InterestsStep'
import { CommunitiesStep } from './CommunitiesStep'
import { AuthShell } from './AuthShell'

type AuthMode = 'login' | 'register' | 'interests' | 'communities'

interface AuthCardProps {
  initialMode?: AuthMode
}

export function AuthCard({ initialMode = 'login' }: AuthCardProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)

  return (
    <AuthShell>
      {/* `key={mode}` fuerza el remount al cambiar de paso, así la animación de
          entrada (deslizar de derecha a izquierda) se dispara cada vez. */}
      <div key={mode} className="w-full animate-in fade-in slide-in-from-right-8 duration-300 ease-out">
        {mode === 'register' && (
          <RegisterForm onSwitchToLogin={() => setMode('login')} onRegistered={() => setMode('interests')} />
        )}
        {mode === 'login' && <LoginForm onSwitchToRegister={() => setMode('register')} />}
        {mode === 'interests' && <InterestsStep onContinue={() => setMode('communities')} />}
        {mode === 'communities' && <CommunitiesStep />}
      </div>
    </AuthShell>
  )
}
