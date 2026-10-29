import { useId, useState } from 'react'
import { getApiErrorMessage } from '@/api/apiError'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/Switch'
import { useLanguage } from '@/i18n/LanguageContext'
import {
  canHideContent,
  canWarnAuthor,
  REPORT_ITEM_LABEL,
  REPORT_REASON_LABEL,
  type Report,
  type ResolveReportPayload,
} from '../models/report'

/** Qué se reportó y por qué, en corto: lo mismo que la tarjeta, sin acciones. */
function ReportSummary({ report }: { report: Report }) {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-mynted-border px-3.5 py-2.5">
      <p className="text-xs text-mynted-gray">
        <span className="font-medium text-mynted-ink">{t(REPORT_ITEM_LABEL[report.itemType])}</span> ·{' '}
        {t(REPORT_REASON_LABEL[report.reason])}
      </p>
      {report.contentUnavailable || !report.excerpt ? (
        <p className="text-sm text-mynted-gray">{t('reports.contentUnavailable')}</p>
      ) : (
        <>
          {report.excerpt.title && <p className="truncate text-sm font-semibold text-mynted-ink">{report.excerpt.title}</p>}
          {report.excerpt.text && <p className="line-clamp-2 text-sm text-mynted-gray">{report.excerpt.text}</p>}
        </>
      )}
    </div>
  )
}

/**
 * Resolver un reporte: cerrarlo y, opcionalmente, ocultar el contenido y
 * avisarle a quien lo publicó.
 *
 * Hace falta **al menos una** de las tres: el backend rechaza resolver sin
 * hacer nada (400 "Debe seleccionarse al menos una acción"), y una nota
 * cuenta como acción. Por eso el botón espera a que haya algo elegido en vez
 * de mandar y comerse el error.
 *
 * Ocultar y avisar van por separado porque no siempre van juntas: a veces el
 * contenido se va sin advertencia, y a veces se avisa sin borrar nada. La
 * nota es interna: no la ve quien publicó ni quien reportó.
 *
 * Qué se ofrece depende de lo reportado: una conversación no se oculta y una
 * comunidad no se oculta ni tiene a quién advertir, así que ahí solo queda la
 * nota. Ofrecerlas igual sería un 400 seguro.
 */
export function ResolveReportDialog({
  open,
  report,
  isPending,
  error,
  onConfirm,
  onClose,
}: {
  open: boolean
  /**
   * El reporte que se resuelve: su tipo decide qué acciones se ofrecen, y su
   * extracto se muestra arriba para no resolver a ciegas.
   */
  report: Report | null
  isPending: boolean
  error: unknown
  onConfirm: (payload: ResolveReportPayload) => void
  onClose: () => void
}) {
  const { t } = useLanguage()
  const noteId = useId()
  const [hideContent, setHideContent] = useState(false)
  const [warnAuthor, setWarnAuthor] = useState(false)
  const [note, setNote] = useState('')

  // Al abrirlo para otro reporte arranca limpio: lo que se eligió para uno no
  // tiene por qué aplicarse al siguiente. Se ajusta durante el render para que
  // no se vea un instante la elección anterior.
  const [openedFor, setOpenedFor] = useState(open)
  if (open !== openedFor) {
    setOpenedFor(open)
    // Solo al abrir: limpiar también al cerrar mete un render de más en plena
    // animación de salida y el diálogo se queda colgado en pantalla.
    if (open) {
      setHideContent(false)
      setWarnAuthor(false)
      setNote('')
    }
  }

  // Al cerrar, quien lo usa suelta el reporte y llega null mientras todavía
  // corre la animación de salida. Se conserva el último para que el contenido
  // no cambie (a "solo nota") justo antes de desaparecer.
  const [shownReport, setShownReport] = useState(report)
  if (report !== null && report !== shownReport) setShownReport(report)
  const shownType = shownReport?.itemType

  const offersHide = shownType !== undefined && canHideContent(shownType)
  const offersWarn = shownType !== undefined && canWarnAuthor(shownType)
  // Si una acción no se ofrece, lo elegido antes no debe viajar igual.
  const willHide = hideContent && offersHide
  const willWarn = warnAuthor && offersWarn

  const trimmedNote = note.trim()
  // Cualquiera de las tres alcanza; sin ninguna, el backend responde 400.
  const hasAction = willHide || willWarn || trimmedNote !== ''

  function handleConfirm() {
    const trimmed = trimmedNote
    onConfirm({
      ...(willHide && { hideContent: true }),
      ...(willWarn && { warnAuthor: true }),
      // El backend rechaza una nota vacía, así que o va con texto o no va.
      ...(trimmed !== '' && { note: trimmed }),
    })
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isPending && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('reports.resolve.title')}</DialogTitle>
          <DialogDescription>{t('reports.resolve.description')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {shownReport && <ReportSummary report={shownReport} />}

          {!offersHide && !offersWarn && (
            <p className="rounded-xl bg-mynted-bg px-3.5 py-2.5 text-sm text-mynted-gray">
              {t('reports.resolve.noteOnly')}
            </p>
          )}

          {offersHide && (
            <Switch
              label={t('reports.resolve.hideContent')}
              description={t('reports.resolve.hideContentHint')}
              isSelected={hideContent}
              onChange={setHideContent}
              className="rounded-xl bg-mynted-bg px-3.5 py-2.5"
            />
          )}
          {offersWarn && (
            <Switch
              label={t('reports.resolve.warnAuthor')}
              description={t('reports.resolve.warnAuthorHint')}
              isSelected={warnAuthor}
              onChange={setWarnAuthor}
              className="rounded-xl bg-mynted-bg px-3.5 py-2.5"
            />
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor={noteId} className="text-[13px] font-medium text-mynted-ink">
              {t('reports.resolve.note')}
            </label>
            <textarea
              id={noteId}
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t('reports.resolve.notePlaceholder')}
              className="w-full resize-y rounded-[10px] border border-mynted-border bg-white px-3.5 py-2.5 text-sm text-mynted-ink outline-none transition-shadow placeholder:text-mynted-gray-light focus:border-mynted-orange focus:ring-2 focus:ring-mynted-orange/20"
            />
            <span className="text-xs text-mynted-gray">{t('reports.resolve.noteHint')}</span>
          </div>
        </div>

        {!hasAction && <p className="text-xs text-mynted-gray">{t('reports.resolve.needsAction')}</p>}

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            {t('profile.edit.cancel')}
          </Button>
          <Button type="button" onClick={handleConfirm} isLoading={isPending} disabled={!hasAction}>
            {t('reports.action.resolve')}
          </Button>
        </DialogFooter>

        {Boolean(error) && (
          <p className="mt-3 text-sm text-red-500" role="alert">
            {getApiErrorMessage(error)}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
