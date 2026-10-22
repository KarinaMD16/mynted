import { useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { BadgeCheck, CalendarDays, Clock, MapPin, Package, Settings2, ShoppingBag, UserRound } from 'lucide-react'
import { Rating } from '@/components/ui/Rating'
import { CoverBanner } from '@/features/profile/components/ProfileParts'
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
      {/* bannerUrl siempre viene null por ahora (pendiente en el backend): se usa el degradado del perfil. */}
      {store.bannerUrl ? (
        <img src={store.bannerUrl} alt="" className="h-[110px] w-full rounded-2xl object-cover sm:h-[140px]" />
      ) : (
        <CoverBanner />
      )}

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

        <StoreAvatar name={store.displayName} photoUrl={store.photoUrl} />

        <div className="flex flex-col items-center px-6 text-center">
          <p className="text-xs font-semibold tracking-wide text-mynted-gray uppercase">{t('store.eyebrow')}</p>
          <h1 className="mt-1 font-heading text-2xl font-semibold text-mynted-ink">{store.displayName}</h1>

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

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-mynted-white px-3 pt-4 text-center">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-mynted-gray">
        <span className="text-mynted-orange" aria-hidden="true">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="font-heading text-base font-semibold text-mynted-ink">{value}</dd>
    </div>
  )
}

function StoreAvatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  return (
    <span className="absolute -top-14 left-1/2 z-20 flex size-28 -translate-x-1/2 items-center justify-center overflow-hidden rounded-full border-4 border-mynted-white bg-mynted-orange font-heading text-3xl font-semibold text-white shadow-md">
      {photoUrl && photoUrl !== failedUrl ? (
        // Las fotos de Google se sirven solo sin Referer.
        <img src={photoUrl} alt="" referrerPolicy="no-referrer" onError={() => setFailedUrl(photoUrl)} className="size-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </span>
  )
}
