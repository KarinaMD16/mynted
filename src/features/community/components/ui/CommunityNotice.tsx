import type { ReactNode } from 'react'

interface CommunityNoticeProps {
  title: string
  description: string
  /** Accion principal del aviso (crear comunidad, iniciar sesion, reintentar...). */
  children?: ReactNode
}

/**
 * Bloque centrado con borde punteado que usan las dos pantallas de comunidades
 * para "sin sesion", "sin comunidades" y los errores de carga.
 */
export function CommunityNotice({ title, description, children }: CommunityNoticeProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-mynted-border bg-white px-6 py-14 text-center">
      <h2 className="font-heading text-lg font-semibold text-mynted-ink">{title}</h2>
      <p className="max-w-md text-sm text-mynted-gray">{description}</p>
      {children}
    </div>
  )
}
