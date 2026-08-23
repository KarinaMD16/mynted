import type { ReactNode } from 'react'
import { SiteHeader } from './SiteHeader'

/**
 * Layout compartido para las pantallas del nav que todavía no tienen
 * contenido real (Explore, Communities, Favorites, Messages). Muestra
 * el header oficial + un mensaje de "en construcción", así el nav ya
 * redirige a algo mientras se construye cada módulo de verdad.
 */
export function PlaceholderPage({ title, description }: { title: string; description: ReactNode }) {
  return (
    <div className="min-h-svh bg-mynted-bg">
      <div className="px-4 pt-5 sm:px-6">
        <SiteHeader />
      </div>

      <main className="flex flex-col items-center justify-center gap-3 px-4 py-24 text-center">
        <h1 className="font-heading text-2xl font-semibold text-mynted-ink">{title}</h1>
        <p className="max-w-sm text-sm text-mynted-gray">{description}</p>
      </main>
    </div>
  )
}
