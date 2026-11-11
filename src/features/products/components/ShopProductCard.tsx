import { Link } from '@tanstack/react-router'
import { useContactSeller } from '@/features/chat/hooks/useContactSeller'
import { ProductFavoriteButton } from '@/features/favorites/components/FavoriteButton'
import { ProBadge } from '@/features/pro/components/ProBadge'
import { useLanguage } from '@/i18n/LanguageContext'
import type { ProductStatus, ProductType, StockFields } from '@/features/products/models/product'
import { cx } from '@/utils/cx'
import type { DisplayPriceFields } from '@/utils/price'
import { getStockState, LOW_STOCK_THRESHOLD, STOCK_LABEL } from '../utils/stock'
import { FeaturedTag } from './FeaturedControls'
import { ProductPrice } from './ProductPrice'

export interface ShopProductCardData extends DisplayPriceFields, StockFields {
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
  /**
   * Destacado de un vendedor Pro (solo GET /products y GET /sellers/:id/products):
   * etiqueta "Destacado" sobre la foto y borde de acento.
   */
  isFeatured?: boolean
  /** El vendedor tiene Pro vigente (solo GET /products/shop trae al vendedor). */
  sellerIsPro?: boolean
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
  const { contact, isOpening } = useContactSeller()
  // Si el listado trae el estado y no está activo, no se puede abrir una conversación nueva (el backend da 400).
  // Agotado (status sold / quantity 0) o no disponible (isAvailable false): no se contacta ni se destaca.
  const stock = getStockState(product)
  const canContact = stock === 'available' && (product.status === undefined || product.status === 'active')
  const isFeatured = product.isFeatured === true && stock === 'available'
  const isLowStock = stock === 'available' && product.quantity !== undefined && product.quantity <= LOW_STOCK_THRESHOLD

  return (
    <article
      className={cx(
        'relative flex h-full flex-col gap-1.5 overflow-hidden rounded-[14px] border bg-white p-2 pb-2.5 shadow-[0_2px_8px_0_rgba(13,13,20,0.06)] sm:gap-2 sm:px-3 sm:pt-3 sm:pb-3.5',
        isFeatured ? 'border-mynted-orange/60' : 'border-mynted-border',
      )}
    >
      <Link
        to="/products/$productId"
        params={{ productId: String(product.id) }}
        className="group flex flex-col gap-1.5 outline-none sm:gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue"
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-[10px] bg-mynted-bg sm:aspect-auto sm:h-[170px]">
          <img
            src={product.imageUrl}
            alt={product.title}
            loading="lazy"
            className={cx(
              'size-full object-cover transition-transform duration-300 group-hover:scale-105',
              // Agotado / no disponible: la foto se apaga para que se lea de un vistazo.
              stock !== 'available' && 'opacity-60 grayscale',
            )}
          />
          {isFeatured && <FeaturedTag className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2" />}
          {/* Pocas unidades: "Solo quedan 2" (ayuda a decidir sin abrir el detalle). */}
          {isLowStock && !isFeatured && (
            <span className="absolute bottom-1.5 left-1.5 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-[#b54708] shadow-xs sm:bottom-2 sm:left-2 sm:px-2 sm:py-1 sm:text-[11px]">
              {product.quantity === 1 ? t('products.stock.lastUnit') : t('products.stock.few', { count: product.quantity ?? 0 })}
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 font-heading text-[13px] leading-snug font-semibold text-mynted-ink sm:text-sm">{product.title}</h3>
      </Link>

      <ProductFavoriteButton
        productId={product.id}
        isSold={stock === 'soldOut'}
        className="absolute top-3.5 right-3.5 size-8 sm:top-[18px] sm:right-[18px] sm:size-9"
      />

      {/* Agotado / no disponible: reemplaza la etiqueta de venta/intercambio, que ya no significa nada. */}
      {stock !== 'available' ? (
        <span className="absolute top-3.5 left-3.5 rounded-md bg-mynted-ink/85 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-xs sm:top-[18px] sm:left-[18px] sm:px-2 sm:py-1 sm:text-[11px]">
          {t(STOCK_LABEL[stock])}
        </span>
      ) : (
        /* Venta / Intercambio sobre la foto: el intercambio es lo que diferencia a Mynted de una tienda común. */
        product.type && (
          <span
            className={`absolute top-3.5 left-3.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-mynted-ink shadow-xs sm:top-[18px] sm:left-[18px] sm:px-2 sm:py-1 sm:text-[11px] ${
              product.type === 'exchange' ? 'bg-mynted-yellow' : 'bg-white/95'
            }`}
          >
            {t(product.type === 'exchange' ? 'products.type.exchange' : 'products.type.sale')}
          </span>
        )
      )}

      {(product.tags.length > 0 || product.isVerified || product.sellerIsPro) && (
        <div className="hidden items-center justify-between gap-2 sm:flex">
          <p className="line-clamp-1 min-w-0 text-xs text-mynted-gray">
            {product.tags.map((tag) => `#${tag.name}`).join(' ')}
          </p>
          <span className="flex shrink-0 items-center gap-1">
            {product.sellerIsPro && <ProBadge size="xs" />}
            {product.isVerified && (
              <span className="shrink-0 rounded-full bg-[#e8faf2] px-[9px] py-1 text-[10px] font-semibold text-[#0d8c66]">
                ✓ {t('product.verified')}
              </span>
            )}
          </span>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 sm:pt-1">
        <ProductPrice
          price={product.price}
          finalPrice={product.finalPrice}
          discountPercent={product.discountPercent}
          currency={product.currency}
          display={product}
          className="font-heading text-[15px] font-semibold text-mynted-ink sm:text-[17px]"
        />
        {canContact && (
          // Igual que el CTA del detalle: abre el chat con el vendedor en la hoja de mensajes (ver useContactSeller).
          <button
            type="button"
            onClick={() => contact(product.id)}
            disabled={isOpening}
            aria-busy={isOpening || undefined}
            aria-haspopup="dialog"
            className="hidden cursor-pointer rounded-full bg-mynted-blue px-[13px] py-1.5 text-[11px] font-semibold whitespace-nowrap text-white transition-opacity outline-none hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue disabled:cursor-wait disabled:opacity-70 sm:block"
          >
            {isOpening ? t('chat.contact.opening') : t('product.contact')}
          </button>
        )}
      </div>
    </article>
  )
}
