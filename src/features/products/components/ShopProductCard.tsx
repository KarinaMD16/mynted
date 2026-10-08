import { Link } from '@tanstack/react-router'
import { ProductFavoriteButton } from '@/features/favorites/components/FavoriteButton'
import { useLanguage } from '@/i18n/LanguageContext'
import type { ProductType } from '@/features/products/models/product'
import { INTL_LOCALES, type AppLanguage } from '@/utils/locale'

function formatPrice(price: string | number, currency: string, language: AppLanguage): string {
  const value = typeof price === 'number' ? price : Number(price)
  try {
    return new Intl.NumberFormat(INTL_LOCALES[language], { style: 'currency', currency }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

export interface ShopProductCardData {
  id: number
  title: string
  imageUrl: string
  price: string | number
  currency: string
  tags: { tagId: number; name: string }[]
  /** Venta o intercambio; si no se pasa, la tarjeta no muestra la etiqueta. */
  type?: ProductType
  /** Solo viene en GET /products/shop; en otros listados no se sabe y no se muestra el badge. */
  isVerified?: boolean
}

/** Tarjeta de producto de la tienda (Neutral Redesign): foto, título, tags, verificación, precio y contacto. */
export function ShopProductCard({ product }: { product: ShopProductCardData }) {
  const { t, language } = useLanguage()

  return (
    <article className="relative flex h-full flex-col gap-2 overflow-hidden rounded-[14px] border border-mynted-border bg-white px-3 pt-3 pb-3.5 shadow-[0_2px_8px_0_rgba(13,13,20,0.06)]">
      <Link
        to="/products/$productId"
        params={{ productId: String(product.id) }}
        className="group flex flex-col gap-2 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue"
      >
        <div className="h-[170px] w-full overflow-hidden rounded-[10px] bg-mynted-bg">
          <img
            src={product.imageUrl}
            alt={product.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <h3 className="line-clamp-2 font-heading text-sm font-semibold text-mynted-ink">{product.title}</h3>
      </Link>

      <ProductFavoriteButton productId={product.id} className="absolute top-[18px] right-[18px]" />

      {/* Venta / Intercambio sobre la foto: el intercambio es lo que diferencia a Mynted de una tienda común. */}
      {product.type && (
        <span
          className={`absolute top-[18px] left-[18px] rounded-md px-2 py-1 text-[11px] font-semibold text-mynted-ink shadow-xs ${
            product.type === 'exchange' ? 'bg-mynted-yellow' : 'bg-white/95'
          }`}
        >
          {t(product.type === 'exchange' ? 'products.type.exchange' : 'products.type.sale')}
        </span>
      )}

      {(product.tags.length > 0 || product.isVerified) && (
        <div className="flex items-center justify-between gap-2">
          <p className="line-clamp-1 min-w-0 text-xs text-mynted-gray">
            {product.tags.map((tag) => `#${tag.name}`).join(' ')}
          </p>
          {product.isVerified && (
            <span className="shrink-0 rounded-full bg-[#e8faf2] px-[9px] py-1 text-[10px] font-semibold text-[#0d8c66]">
              ✓ {t('product.verified')}
            </span>
          )}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className="font-heading text-[17px] font-semibold text-mynted-ink">
          {formatPrice(product.price, product.currency, language)}
        </span>
        <button
          type="button"
          className="cursor-pointer rounded-full bg-mynted-blue px-[13px] py-1.5 text-[11px] font-semibold text-white transition-opacity outline-none hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue"
        >
          {t('product.contact')}
        </button>
      </div>
    </article>
  )
}
