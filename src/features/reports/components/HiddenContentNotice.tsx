import { EyeOff } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { useRestoreContentMutation } from '../hooks/useReports'
import type { ModerationItemType } from '../models/moderation'

const NOTICE_LABEL: Record<ModerationItemType, TranslationKey> = {
  post: 'moderation.hidden.post',
  reply: 'moderation.hidden.reply',
  product: 'moderation.hidden.product',
}

/**
 * Aviso de que algo está oculto por moderación (tarea 1142, punto 5).
 *
 * Solo lo ve quien puede ver el contenido oculto: su autor y el equipo de la
 * comunidad. El botón de restaurar es solo para el equipo, porque el endpoint
 * exige rol de moderación; al autor se le explica la situación y nada más.
 *
 * Sin comunidad no hay a quién pedirle la restauración (la ruta va por
 * comunidad), así que ahí solo queda el aviso.
 */
export function HiddenContentNotice({
  itemType,
  itemId,
  communityId,
  canRestore = false,
  reason,
}: {
  itemType: ModerationItemType
  itemId: number
  communityId: number | null | undefined
  canRestore?: boolean
  /** El motivo que dejó quien lo ocultó, si lo escribió. */
  reason?: string | null
}) {
  const { t } = useLanguage()
  const restore = useRestoreContentMutation(communityId ?? 0)

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm" role="note">
      <p className="flex items-start gap-2 text-amber-900">
        <EyeOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          {t(NOTICE_LABEL[itemType])}
          {reason && <span className="mt-0.5 block text-amber-800 italic">«{reason}»</span>}
        </span>
      </p>

      {canRestore && communityId != null && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={restore.isPending}
            onClick={() => restore.mutate({ itemType, itemId })}
          >
            {t(restore.isPending ? 'moderation.hidden.restoring' : 'moderation.hidden.restore')}
          </Button>
          {restore.isError && (
            <span className="text-xs text-red-700" role="alert">
              {getApiErrorMessage(restore.error, t('errors.generic.description'))}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
