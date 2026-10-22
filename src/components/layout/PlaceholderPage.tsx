import { ErrorState } from '@/components/errors/ErrorState'
import { SiteHeader } from './SiteHeader'

/**
 * Layout compartido para las pantallas del nav que todavía no tienen
 * contenido real (Explore, Communities, Favorites, Messages). Muestra
 * el header oficial + un mensaje de "en construcción", así el nav ya
 * redirige a algo mientras se construye cada módulo de verdad.
 */
export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className="mx-auto flex max-w-[1320px] justify-center px-4 sm:px-6">
        {/* El ganso con megáfono anuncia que la sección viene pronto; su nombre va como etiqueta. */}
        <ErrorState kind="comingSoon" variant="page" eyebrow={title} description={description} />
      </main>
    </div>
  )
}
