import type { ReactNode } from 'react'
import { Logo } from '@/components/ui/Logo'
import { MascotPanel } from './MascotPanel'

interface AuthShellProps {
  children: ReactNode
}

/**
 * Contenedor visual de dos columnas (logo + tarjeta / panel de mascota)
 * compartido por todas las pantallas de autenticación: login, registro,
 * intereses, "olvidé mi contraseña" y "restablecer contraseña".
 */
export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="relative flex w-full max-w-[860px] overflow-hidden rounded-[20px] border border-mynted-border bg-white shadow-[0_16px_40px_-8px_rgba(13,13,20,0.1)] sm:h-[600px] lg:max-w-[920px] lg:h-[600px] xl:max-w-[980px] xl:h-[650px]">
      <div className="flex w-full flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-mynted-orange scrollbar-track-transparent px-6 py-6 sm:w-[460px] sm:shrink-0 sm:px-10">
        <div className="m-auto flex w-full flex-col gap-3">
          <div className="flex h-[56px] shrink-0 items-center justify-center">
            <Logo />
          </div>
          {children}
        </div>
      </div>

      <MascotPanel />
    </div>
  )
}
