import { useState } from 'react'
import { Check } from 'lucide-react'
import { Checkbox } from 'react-aria-components'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLanguage } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'

/**
 * Aviso antes de quitar un favorito. Con "No volver a mostrar" marcado, al
 * confirmar se avisa a quien lo abrió (`onConfirm(true)`) para que guarde la
 * preferencia; el interruptor de /settings la vuelve a activar.
 */
export function UnfavoriteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (dontShowAgain: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {/* Se monta de cero en cada apertura: el checkbox siempre arranca desmarcado. */}
        <ConfirmBody onCancel={() => onOpenChange(false)} onConfirm={onConfirm} />
      </DialogContent>
    </Dialog>
  )
}

function ConfirmBody({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: (dontShowAgain: boolean) => void
}) {
  const { t } = useLanguage()
  const [dontShowAgain, setDontShowAgain] = useState(false)

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl">{t('favorites.confirm.title')}</DialogTitle>
        <DialogDescription>{t('favorites.confirm.description')}</DialogDescription>
      </DialogHeader>

      <Checkbox
        isSelected={dontShowAgain}
        onChange={setDontShowAgain}
        className="group mt-5 flex w-fit cursor-pointer items-center gap-2.5 outline-none"
      >
        {({ isSelected, isFocusVisible }) => (
          <>
            <span
              aria-hidden="true"
              className={cx(
                'flex size-5 items-center justify-center rounded-md border transition-colors',
                isSelected ? 'border-mynted-orange bg-mynted-orange text-white' : 'border-mynted-border bg-white',
                isFocusVisible && 'outline-2 outline-offset-2 outline-mynted-blue-mid',
              )}
            >
              {isSelected && <Check className="size-3.5" strokeWidth={3} />}
            </span>
            <span className="text-sm text-mynted-ink">{t('favorites.confirm.dontShowAgain')}</span>
          </>
        )}
      </Checkbox>

      <DialogFooter>
        <Button type="button" onClick={onCancel} variant="secondary" size="md">
          {t('favorites.confirm.cancel')}
        </Button>
        <Button type="button" onClick={() => onConfirm(dontShowAgain)} variant="destructive" size="md">
          {t('favorites.confirm.confirm')}
        </Button>
      </DialogFooter>
    </>
  )
}
