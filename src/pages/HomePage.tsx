import { Link } from '@tanstack/react-router'
import ProductCard from '@/features/app/components/ProductCard'
import { SiteHeader } from '../components/layout/SiteHeader'
import { Logo } from '../components/ui/Logo'
import type { Product } from '@/features/app/types/appTypes'

// TODO(backend): reemplazar por datos reales del marketplace cuando exista el endpoint.
// Placeholder solo para poder ver la ProductCard renderizada mientras se arma esa pantalla
// (la imagen es un placeholder genérico, no un asset final).
const DEMO_PRODUCT: Product = {
  id: 'demo-1',
  name: 'Funko Rainbow Dash',
  description: 'Funko Pop de Fluttershy, edición My Little Pony.',
  price: 18,
  image: 'https://i.etsystatic.com/19343947/r/il/f741f9/7160011667/il_fullxfull.7160011667_tdi5.jpg',
  tags: ['mylittlepony', 'fluttershy', 'funko'],
  rating: 5,
  verified: true,
}

export default function HomePage() {
  return (
    <div className="min-h-svh bg-mynted-bg">
      <div className="px-4 pt-5 sm:px-6">
        <SiteHeader />
      </div>

      <main className="flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <Logo className="text-[40px]" />
        <ProductCard product={DEMO_PRODUCT} />
        <Link
          to="/login"
          className="mt-2 rounded-[10px] bg-mynted-orange px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-mynted-orange-hover"
        >
          Ir a Login
        </Link>
      </main>
    </div>
  )
}
