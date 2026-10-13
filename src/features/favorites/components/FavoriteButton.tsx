import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'
import { useToggleProductFavorite } from '../hooks/useFavoriteMutations'
import { useSavedProductIds } from '../hooks/useFavoritesQueries'
import { useUnfavoriteConfirmation } from '../hooks/useUnfavoriteConfirmation'
import { UnfavoriteConfirmDialog } from './UnfavoriteConfirmDialog'

type FavoriteButtonVariant = 'overlay' | 'outline'

const VARIANT_CLASS: Record<FavoriteButtonVariant, string> = {
  /** Sobre la foto de una tarjeta. */
  overlay: 'size-9 rounded-full bg-white/95 shadow-sm hover:bg-white',
  /** Junto a "Contactar al vendedor" en el detalle. */
  outline: 'size-12 rounded-[10px] border border-mynted-border bg-white hover:bg-mynted-bg',
}

/**
 * Corazón de favoritos de un producto. Guardar es inmediato; quitar pide
 * confirmación (diálogo con "No volver a mostrar") salvo que el usuario ya
 * la haya desactivado.
 */
export function FavoriteButton({
  productId,
  isSaved,
  isDisabled = false,
  variant = 'overlay',
  className,
}: {
  productId: number
  isSaved: boolean
  isDisabled?: boolean
  variant?: FavoriteButtonVariant
  className?: string
}) {
  const { t } = useLanguage()
  const toggle = useToggleProductFavorite()
  const { confirmUnfavorite, setConfirmUnfavorite } = useUnfavoriteConfirmation()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const handleClick = () => {
    if (!isSaved) {
      toggle.mutate({ productId, save: true })
    } else if (confirmUnfavorite) {
      setIsConfirmOpen(true)
    } else {
      toggle.mutate({ productId, save: false })
    }
  }

  const handleConfirm = (dontShowAgain: boolean) => {
    if (dontShowAgain) setConfirmUnfavorite(false)
    setIsConfirmOpen(false)
    toggle.mutate({ productId, save: false })
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        aria-pressed={isSaved}
        aria-label={t(isSaved ? 'favorites.button.remove' : 'favorites.button.add')}
        title={t(isSaved ? 'favorites.button.remove' : 'favorites.button.add')}
        className={cx(
          'flex shrink-0 cursor-pointer items-center justify-center transition-colors outline-none',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid',
          'disabled:cursor-not-allowed disabled:opacity-60',
          VARIANT_CLASS[variant],
          className,
        )}
      >
        <Heart
          className={cx('size-5', isSaved ? 'fill-mynted-orange text-mynted-orange' : 'text-mynted-ink')}
          aria-hidden="true"
        />
      </button>

      <UnfavoriteConfirmDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen} onConfirm={handleConfirm} />
    </>
  )
}

/**
 * FavoriteButton para tarjetas y páginas de producto donde no se sabe de
 * antemano si ya es favorito: lo consulta en la lista de guardados del
 * usuario. Sin sesión no se muestra (los endpoints piden login).
 */
export function ProductFavoriteButton({
  productId,
  variant,
  className,
}: {
  productId: number
  variant?: FavoriteButtonVariant
  className?: string
}) {
  const { isLoggedIn } = useCurrentUser()
  const saved = useSavedProductIds(isLoggedIn)

  if (!isLoggedIn) return null

  return (
    <FavoriteButton
      productId={productId}
      isSaved={saved.data?.has(productId) ?? false}
      // Hasta saber si ya era favorito, un clic podría guardar de más o quitar lo que no era.
      isDisabled={saved.isPending}
      variant={variant}
      className={className}
    />
  )
}
