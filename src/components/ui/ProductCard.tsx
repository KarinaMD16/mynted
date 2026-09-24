import { CheckIcon } from 'lucide-react'
import { cn } from '@/cuicui/utils/cn'
import type { Product } from '@/features/users/types/appTypes'
import { useLanguage } from '@/i18n/LanguageContext'
import { AdvancedColorfulBadges } from './Badge'
import { Rating } from './Rating'
import { Button } from '@/components/ui/Button'

/** Tarjeta de publicación del marketplace (foto, título, rating, hashtags, verificación, precio y botón de contacto). */
export function ProductCard({ product }: { product: Product }) {
  const { t } = useLanguage()
  return (
    <div
      className={cn(
        'group w-full max-w-sm overflow-hidden rounded-2xl border border-mynted-border bg-white',
        'transform-gpu transition-transform hover:scale-[1.01]',
      )}
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-mynted-bg">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-mynted-ink">{product.name}</h3>
          <Rating value={product.rating} size={18} className="shrink-0 pt-0.5" />
        </div>

        {product.tags.length > 0 && (
          <p className="text-sm text-mynted-gray">{product.tags.map((tag) => `#${tag}`).join(' ')}</p>
        )}

        {product.verified && (
          <AdvancedColorfulBadges color="green" rounded="full" size="sm">
            <CheckIcon className="size-3.5" />
            {t('product.verified')}
          </AdvancedColorfulBadges>
        )}

        <div className="mt-1 flex items-center justify-between">
          <span className="text-2xl font-bold text-mynted-ink">${product.price.toFixed(2)}</span>
          <Button
            type="button"
            variant="accent"
            size="md"
            shape="pill"
          >
            {t('product.contact')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
