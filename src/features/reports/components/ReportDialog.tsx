import { useId, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { getApiErrorMessage, getHttpStatus } from '@/api/apiError'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { useCreateReportMutation } from '../hooks/useReports'
import { REPORT_REASONS, type ReportItemType, type ReportReason } from '../models/report'

const REASON_LABEL: Record<ReportReason, TranslationKey> = {
  spam: 'reports.reason.spam',
  fake_product: 'reports.reason.fakeProduct',
  offensive_language: 'reports.reason.offensiveLanguage',
  harassment: 'reports.reason.harassment',
  inappropriate_content: 'reports.reason.inappropriateContent',
  other: 'reports.reason.other',
}

const DESCRIPTION_MAX = 2000

/**
 * Formulario para denunciar contenido ajeno (tarea 1141). Pide una razón de la
 * lista y deja agregar una descripción, que es opcional.
 *
 * Al reportar una conversación se avisa que los moderadores van a poder leerla:
 * es lo que pasa de verdad y conviene decirlo antes, no después.
 */
export function ReportDialog({
  open,
  itemType,
  itemId,
  onClose,
}: {
  open: boolean
  itemType: ReportItemType
  itemId: number
  onClose: () => void
}) {
  const { t } = useLanguage()
  const reasonName = useId()
  const descriptionId = useId()
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [description, setDescription] = useState('')
  const mutation = useCreateReportMutation()

  // Al abrir, el formulario arranca limpio. Se ajusta durante el render y no
  // en un efecto, igual que ConfirmWithReasonDialog: con un efecto se ve un
  // instante lo del reporte anterior. Al cerrar no se toca nada, para no meter
  // un render de más en plena animación de salida.
  const [openedFor, setOpenedFor] = useState(open)
  if (open !== openedFor) {
    setOpenedFor(open)
    if (open) {
      setReason(null)
      setDescription('')
      mutation.reset()
    }
  }

  const isDone = mutation.isSuccess

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !mutation.isPending && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t(isDone ? 'reports.create.doneTitle' : 'reports.create.title')}</DialogTitle>
          <DialogDescription>
            {t(isDone ? 'reports.create.doneDescription' : 'reports.create.description')}
          </DialogDescription>
        </DialogHeader>

        {isDone ? (
          <>
            <p className="flex items-center gap-2 rounded-xl bg-teal-50 px-3.5 py-3 text-sm text-teal-900">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
              {t('reports.create.doneHint')}
            </p>
            <DialogFooter>
              <Button type="button" onClick={onClose}>
                {t('common.close')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (!reason) return
              const trimmed = description.trim()
              // El backend rechaza una descripción vacía, así que no se manda.
              mutation.mutate({ itemType, itemId, reason, ...(trimmed && { description: trimmed }) })
            }}
          >
            {itemType === 'conversation' && (
              <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900">
                {t('reports.create.conversationNotice')}
              </p>
            )}

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-semibold text-mynted-ink">{t('reports.create.reasonLabel')}</legend>
              {REPORT_REASONS.map((option) => (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition-colors ${
                    reason === option
                      ? 'border-mynted-orange bg-mynted-orange/5 text-mynted-ink'
                      : 'border-mynted-border text-mynted-gray hover:border-mynted-orange/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={reasonName}
                    value={option}
                    checked={reason === option}
                    onChange={() => setReason(option)}
                    className="accent-mynted-orange"
                  />
                  {t(REASON_LABEL[option])}
                </label>
              ))}
            </fieldset>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={descriptionId} className="text-sm font-semibold text-mynted-ink">
                {t('reports.create.descriptionLabel')}
              </label>
              <textarea
                id={descriptionId}
                value={description}
                onChange={(event) => setDescription(event.target.value.slice(0, DESCRIPTION_MAX))}
                rows={3}
                placeholder={t('reports.create.descriptionPlaceholder')}
                className="w-full resize-none rounded-xl border border-mynted-border px-3.5 py-2.5 text-sm outline-none focus:border-mynted-orange"
              />
              <p className="text-xs text-mynted-gray">
                {t('admin.reason.hint', { count: DESCRIPTION_MAX - description.length })}
              </p>
            </div>

            {mutation.isError && <ReportError error={mutation.error} />}

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
                {t('reports.create.cancel')}
              </Button>
              <Button type="submit" disabled={!reason || mutation.isPending}>
                {t(mutation.isPending ? 'reports.create.sending' : 'reports.create.submit')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Dos rechazos tienen texto propio porque son los esperables y los mensajes
 * del backend vienen solo en español: 409 es "ya lo reportaste" y 400, con una
 * petición que armamos nosotros, solo puede ser contenido propio.
 */
function ReportError({ error }: { error: unknown }) {
  const { t } = useLanguage()
  const status = getHttpStatus(error)
  const message =
    status === 409
      ? t('reports.create.duplicate')
      : status === 400
        ? t('reports.create.ownContent')
        : getApiErrorMessage(error, t('errors.generic.description'))

  return (
    <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700" role="alert">
      {message}
    </p>
  )
}
