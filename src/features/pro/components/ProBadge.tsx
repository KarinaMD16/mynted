import { Sparkles } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'
import { PRO_GRADIENT } from '../utils/cosmeticVisuals'

const SIZES = {
  /** Listas densas: chat, reseñas, filas de búsqueda. */
  xs: 'h-4 gap-0.5 px-1.5 text-[9px] [&_svg]:size-2.5',
  /** Tarjetas. */
  sm: 'h-5 gap-1 px-2 text-[10px] [&_svg]:size-3',
  /** Cabecera del perfil y de la tienda. */
  md: 'h-6 gap-1 px-2.5 text-xs [&_svg]:size-3.5',
}

/**
 * Distintivo de Mynted Pro. Se pinta solo con `isPro: true` (Pro vigente
 * ahora mismo, lo calcula el backend): quien lo usa decide si mostrarlo.
 */
export function ProBadge({ size = 'sm', className }: { size?: keyof typeof SIZES; className?: string }) {
  const { t } = useLanguage()
  return (
    <span
      title={t('pro.badge.title')}
      className={cx(
        'inline-flex shrink-0 items-center rounded-full font-bold tracking-wide text-white uppercase shadow-xs select-none',
        SIZES[size],
        className,
      )}
      style={{ backgroundImage: PRO_GRADIENT }}
    >
      <Sparkles aria-hidden="true" />
      <span aria-hidden="true">Pro</span>
      <span className="sr-only">{t('pro.badge.title')}</span>
    </span>
  )
}
