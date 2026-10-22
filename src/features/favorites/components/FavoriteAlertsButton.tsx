import { BellRing, BellPlus } from 'lucide-react'
import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Popover as AriaPopover,
} from 'react-aria-components'
import { Switch } from '@/components/ui/Switch'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'
import { popoverAnimationClass } from '@/utils/popoverAnimation'
import type { FavoriteAlerts } from '../models/favorites'
import { useUpdateFavoriteAlerts } from '../hooks/useFavoriteMutations'
import { useSavedProductAlerts } from '../hooks/useFavoritesQueries'

type FavoriteAlertsVariant = 'overlay' | 'outline'

const VARIANT_CLASS: Record<FavoriteAlertsVariant, string> = {
  /** Sobre la foto de una tarjeta, junto al corazón. */
  overlay: 'size-9 rounded-full bg-white/95 shadow-sm hover:bg-white',
  /** Junto al corazón en el detalle del producto. */
  outline: 'size-12 rounded-[10px] border border-mynted-border bg-white hover:bg-mynted-bg',
}

/**
 * Campanita de avisos de un producto guardado: "avísame si cambia el precio"
 * y "avísame si se vende, se pausa o vuelve a estar disponible". Cada
 * interruptor guarda al instante (PATCH /products/:id/favorite) y las
 * notificaciones llegan a la campana del header.
 *
 * Solo aparece con sesión y si el producto está en favoritos.
 */
export function FavoriteAlertsButton({
  productId,
  variant = 'overlay',
  className,
}: {
  productId: number
  variant?: FavoriteAlertsVariant
  className?: string
}) {
  const { t } = useLanguage()
  const { isLoggedIn } = useCurrentUser()
  const alerts = useSavedProductAlerts(productId, isLoggedIn).data
  const update = useUpdateFavoriteAlerts()

  if (!isLoggedIn || !alerts) return null

  const isOn = alerts.notifyPrice || alerts.notifyAvailability
  const Icon = isOn ? BellRing : BellPlus
  const label = t(isOn ? 'favorites.alerts.buttonOn' : 'favorites.alerts.button')

  const toggle = (field: keyof FavoriteAlerts, value: boolean) => {
    update.mutate({ productId, alerts: { [field]: value } })
  }

  return (
    <AriaDialogTrigger>
      <AriaButton
        aria-label={label}
        className={cx(
          'flex shrink-0 cursor-pointer items-center justify-center transition-colors outline-none',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid',
          VARIANT_CLASS[variant],
          className,
        )}
      >
        <Icon className={cx('size-5', isOn ? 'text-mynted-orange' : 'text-mynted-ink')} aria-hidden="true" />
      </AriaButton>

      <AriaPopover placement="bottom end" offset={8} className={popoverAnimationClass}>
        <AriaDialog
          aria-label={t('favorites.alerts.title')}
          className="flex w-[min(320px,calc(100vw-2rem))] flex-col gap-4 rounded-xl border border-mynted-border bg-mynted-white p-4 shadow-lg outline-none"
        >
          <div>
            <p className="text-sm font-semibold text-mynted-ink">{t('favorites.alerts.title')}</p>
            <p className="mt-0.5 text-xs text-mynted-gray">{t('favorites.alerts.description')}</p>
          </div>
          <Switch
            label={t('favorites.alerts.price')}
            description={t('favorites.alerts.priceDescription')}
            isSelected={alerts.notifyPrice}
            onChange={(value) => toggle('notifyPrice', value)}
          />
          <Switch
            label={t('favorites.alerts.availability')}
            description={t('favorites.alerts.availabilityDescription')}
            isSelected={alerts.notifyAvailability}
            onChange={(value) => toggle('notifyAvailability', value)}
          />
          {update.isError && (
            <p className="text-xs text-red-500" role="alert">
              {t('favorites.alerts.error')}
            </p>
          )}
        </AriaDialog>
      </AriaPopover>
    </AriaDialogTrigger>
  )
}
