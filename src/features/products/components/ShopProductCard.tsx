import { Link } from '@tanstack/react-router'
import { ProductFavoriteButton } from '@/features/favorites/components/FavoriteButton'
import { useLanguage } from '@/i18n/LanguageContext'
import type { ProductStatus, ProductType } from '@/features/products/models/product'
import { ProductPrice } from './ProductPrice'

export interface ShopProductCardData {
  id: number
  title: string
  imageUrl: string
  price: string | number
  /** Precio con descuento; si falta se muestra `price`. */
  finalPrice?: number | null
  discountPercent?: number | string | null
  currency: string
  tags: { tagId: number; name: string }[]
  /** Venta o intercambio; si no se pasa, la tarjeta no muestra la etiqueta. */
  type?: ProductType
  /** Solo viene en GET /products/shop; en otros listados no se sabe y no se muestra el badge. */
  isVerified?: boolean
  /** Si el listado lo trae: un producto vendido no se puede agregar a favoritos. */
  status?: ProductStatus
}

/**
 * Tarjeta de producto de la tienda (Neutral Redesign): foto, título, tags, verificación, precio y contacto.
 *
 * En móvil (< sm) es compacta para que entren 2 por fila, como en Vinted, Depop o
 * Etsy: foto cuadrada, título, precio y el corazón sobre la foto. Los tags, el
 * "verificado" y el botón "Contactar" aparecen desde sm (toda la tarjeta ya
 * lleva al detalle, donde están el vendedor y "Contactar").
 */
export function ShopProductCard({ product }: { product: ShopProductCardData }) {
  const { t } = useLanguage()

  return (
    <article className="relative flex h-full flex-col gap-1.5 overflow-hidden rounded-[14px] border border-mynted-border bg-white p-2 pb-2.5 shadow-[0_2px_8px_0_rgba(13,13,20,0.06)] sm:gap-2 sm:px-3 sm:pt-3 sm:pb-3.5">
      <Link
        to="/products/$productId"
        params={{ productId: String(product.id) }}
        className="group flex flex-col gap-1.5 outline-none sm:gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue"
      >
        <div className="aspect-square w-full overflow-hidden rounded-[10px] bg-mynted-bg sm:aspect-auto sm:h-[170px]">
          <img
            src={product.imageUrl}
            alt={product.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <h3 className="line-clamp-2 font-heading text-[13px] leading-snug font-semibold text-mynted-ink sm:text-sm">{product.title}</h3>
      </Link>

      <ProductFavoriteButton
        productId={product.id}
        isSold={product.status === 'sold'}
        className="absolute top-3.5 right-3.5 size-8 sm:top-[18px] sm:right-[18px] sm:size-9"
      />

      {/* Venta / Intercambio sobre la foto: el intercambio es lo que diferencia a Mynted de una tienda común. */}
      {product.type && (
        <span
          className={`absolute top-3.5 left-3.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-mynted-ink shadow-xs sm:top-[18px] sm:left-[18px] sm:px-2 sm:py-1 sm:text-[11px] ${
            product.type === 'exchange' ? 'bg-mynted-yellow' : 'bg-white/95'
          }`}
        >
          {t(product.type === 'exchange' ? 'products.type.exchange' : 'products.type.sale')}
        </span>
      )}

      {(product.tags.length > 0 || product.isVerified) && (
        <div className="hidden items-center justify-between gap-2 sm:flex">
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

      <div className="mt-auto flex items-center justify-between gap-2 sm:pt-1">
        <ProductPrice
          price={product.price}
          finalPrice={product.finalPrice}
          discountPercent={product.discountPercent}
          currency={product.currency}
          className="font-heading text-[15px] font-semibold text-mynted-ink sm:text-[17px]"
        />
        <button
          type="button"
          className="hidden cursor-pointer rounded-full sm:block bg-mynted-blue px-[13px] py-1.5 text-[11px] font-semibold text-white transition-opacity outline-none hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue"
        >
          {t('product.contact')}
        </button>
      </div>
    </article>
  )
}
