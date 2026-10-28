import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { BadgeCheck, CalendarDays, Clock, MapPin, Package, Settings2, ShoppingBag, UserRound } from 'lucide-react'
import { Rating } from '@/components/ui/Rating'
import { AvatarFrame } from '@/features/pro/components/AvatarFrame'
import { ProBadge } from '@/features/pro/components/ProBadge'
import type { CosmeticAsset } from '@/features/pro/models/cosmetics'
import { CoverBanner, HeaderStat as Stat } from '@/features/profile/components/ProfileParts'
import { formatMemberSince, getInitials } from '@/features/profile/utils/profileFormat'
import { useLanguage } from '@/i18n/LanguageContext'
import { INTL_LOCALES } from '@/utils/locale'
import type { SellerStore } from '../models/store'
import { formatResponseTime } from '../utils/responseTime'

/**
 * Cabecera de la tienda: foto, nombre, verificación, ubicación, calificación,
 * números de confianza (ventas, productos activos, desde cuándo vende, tiempo
 * de respuesta), descripción y el enlace a la persona detrás de la tienda.
 */
export function StoreHeader({ store, isOwnStore }: { store: SellerStore; isOwnStore: boolean }) {
  const { t, language } = useLanguage()
  const number = (value: number) => value.toLocaleString(INTL_LOCALES[language])

  return (
    <div>
      {/* El banner efectivo del dueño: `cosmetics.banner` (banner propio o del catálogo); si no viene, `bannerUrl`. */}
      <CoverBanner banner={store.cosmetics?.banner} fallbackUrl={store.bannerUrl} />

      <div className="relative -mt-10 rounded-2xl border border-mynted-border bg-mynted-white pt-16 pb-6 shadow-[0_16px_40px_-8px_rgba(13,13,20,0.08)] sm:pb-8">
        <div className="absolute -top-5 right-4 z-10 flex items-center gap-2 sm:right-6">
          {isOwnStore ? (
            <Link
              to="/my-products"
              className="flex h-10 items-center gap-2 rounded-xl bg-mynted-orange px-4 text-sm font-semibold text-white shadow-xs outline-none hover:bg-mynted-orange-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid"
            >
              <Settings2 className="size-4" aria-hidden="true" />
              {t('store.manage')}
            </Link>
          ) : (
            <Link
              to="/users/$userId"
              params={{ userId: store.userId }}
              className="flex h-10 items-center gap-2 rounded-xl border border-mynted-border bg-white px-4 text-sm font-semibold text-mynted-ink outline-none hover:bg-mynted-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid"
            >
              <UserRound className="size-4" aria-hidden="true" />
              {t('store.viewSellerProfile')}
            </Link>
          )}
        </div>

        <StoreAvatar name={store.displayName} photoUrl={store.photoUrl} frame={store.frame ?? store.cosmetics?.frame} />

        <div className="flex flex-col items-center px-6 text-center">
          <p className="text-xs font-semibold tracking-wide text-mynted-gray uppercase">{t('store.eyebrow')}</p>
          <h1 className="mt-1 flex items-center gap-2 font-heading text-2xl font-semibold text-mynted-ink">
            {store.displayName}
            {store.isPro && <ProBadge size="md" />}
          </h1>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
            {store.isVerified && (
              <span className="flex items-center gap-1.5 rounded-full bg-[#e8faf2] px-3 py-1 text-xs font-semibold text-[#0d8c66]">
                <BadgeCheck className="size-3.5" aria-hidden="true" />
                {t('itemDetail.verifiedSeller')}
              </span>
            )}
            {store.ratingAverage !== null ? (
              <span className="flex items-center gap-2 text-sm text-mynted-gray">
                <Rating value={store.ratingAverage} size={14} />
                {store.ratingAverage.toFixed(1)} · {t('reviews.count', { count: store.reviewsCount })}
              </span>
            ) : (
              <span className="text-sm text-mynted-gray">{t('itemDetail.sellerNoReviews')}</span>
            )}
            {store.location?.trim() && (
              <span className="flex items-center gap-1.5 text-sm text-mynted-gray">
                <MapPin className="size-4" aria-hidden="true" />
                {store.location}
              </span>
            )}
          </div>

          {store.description?.trim() && (
            <p className="mt-4 max-w-2xl text-sm whitespace-pre-line text-mynted-ink">{store.description}</p>
          )}
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden border-t border-mynted-border bg-mynted-border sm:grid-cols-4">
          <Stat icon={<ShoppingBag className="size-4" />} label={t('store.stats.sales')} value={number(store.completedSalesCount)} />
          <Stat icon={<Package className="size-4" />} label={t('store.stats.activeProducts')} value={number(store.activeProductsCount)} />
          <Stat
            icon={<CalendarDays className="size-4" />}
            label={t('store.stats.sellerSince')}
            value={store.sellerSince ? formatMemberSince(store.sellerSince, language) : '—'}
          />
          <Stat icon={<Clock className="size-4" />} label={t('store.stats.responseTime')} value={formatResponseTime(store.responseTime, t)} />
        </dl>
      </div>
    </div>
  )
}


function StoreAvatar({ name, photoUrl, frame }: { name: string; photoUrl: string | null; frame?: CosmeticAsset }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  return (
    <AvatarFrame frame={frame} size="lg" className="absolute -top-14 left-1/2 z-20 size-28 -translate-x-1/2">
      <span className="flex size-full items-center justify-center overflow-hidden rounded-full border-4 border-mynted-white bg-mynted-orange font-heading text-3xl font-semibold text-white shadow-md">
        {photoUrl && photoUrl !== failedUrl ? (
          // Las fotos de Google se sirven solo sin Referer.
          <img src={photoUrl} alt="" referrerPolicy="no-referrer" onError={() => setFailedUrl(photoUrl)} className="size-full object-cover" />
        ) : (
          getInitials(name)
        )}
      </span>
    </AvatarFrame>
  )
}
