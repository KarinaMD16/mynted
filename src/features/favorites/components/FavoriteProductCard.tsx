import { Link } from '@tanstack/react-router'
import { useLanguage } from '@/i18n/LanguageContext'
import { ProductPrice } from '@/features/products/components/ProductPrice'
import { getProductBadgeKey } from '@/features/products/utils/stock'
import type { MyContentProduct } from '@/features/community/models/communityDTOs'
import { FavoriteAlertsButton } from './FavoriteAlertsButton'
import { FavoriteButton } from './FavoriteButton'


/** Producto guardado (wireframe "Bento Product Card"): foto grande, título, tags, precio y verificado. */
export function FavoriteProductCard({ product }: { product: MyContentProduct }) {
  const { t } = useLanguage()
  // Agotado (isAvailable false, status sold), pausado o no disponible: los favoritos sí los muestran.
  const badgeKey = getProductBadgeKey(product)

  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-mynted-border bg-white transition-shadow hover:shadow-[0_16px_40px_-12px_rgba(13,13,20,0.15)]">
      <Link
        to="/products/$productId"
        params={{ productId: String(product.id) }}
        aria-label={product.title}
        className="absolute inset-0 z-0 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-mynted-blue"
      />

      <div className="pointer-events-none relative min-h-[180px] flex-1 overflow-hidden bg-mynted-bg">
        <img
          src={product.imageUrl}
          alt=""
          loading="lazy"
          className={`absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            badgeKey ? 'opacity-60 grayscale' : ''
          }`}
        />
        {badgeKey && (
          <span className="absolute top-3 left-3 rounded-full bg-mynted-ink/85 px-2.5 py-1 text-xs font-semibold text-white">
            {t(badgeKey)}
          </span>
        )}
      </div>

      <div className="pointer-events-none flex flex-col gap-1.5 px-4 pt-3 pb-3.5">
        <h3 className="line-clamp-2 font-heading text-sm font-semibold text-mynted-ink">{product.title}</h3>
        {product.tags.length > 0 && (
          <p className="line-clamp-1 text-[11px] text-mynted-gray">{product.tags.map((tag) => `#${tag.name}`).join(' ')}</p>
        )}
        <div className="flex items-center gap-2.5">
          <ProductPrice
            price={product.price}
            finalPrice={product.finalPrice}
            discountPercent={product.discountPercent}
            currency={product.currency}
            display={product}
            className="font-heading text-base font-semibold text-mynted-ink"
          />
          {product.seller.isVerified && (
            <span className="rounded-full bg-[#e8faf2] px-2 py-[3px] text-[10px] text-[#0d8c66]">
              ✓ {t('product.verified')}
            </span>
          )}
        </div>
      </div>

      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <FavoriteAlertsButton productId={product.id} />
        <FavoriteButton productId={product.id} isSaved />
      </div>
    </article>
  )
}
