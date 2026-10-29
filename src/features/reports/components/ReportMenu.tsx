import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Flag, MoreVertical } from 'lucide-react'
import {
  Button as AriaButton,
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuTrigger as AriaMenuTrigger,
  Popover as AriaPopover,
  type PopoverProps,
} from 'react-aria-components'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'
import { ReportDialog } from './ReportDialog'
import type { ReportItemType } from '../models/report'

/**
 * Menú de tres puntos con la opción de reportar (tarea 1141). Se pone sobre
 * cualquier contenido ajeno: publicaciones, respuestas, productos y chats.
 *
 * No se dibuja nada si el contenido es propio, porque el backend rechaza
 * reportarse a uno mismo y no tiene sentido ofrecerlo. Sin sesión sí aparece:
 * al tocarlo se manda a iniciar sesión, igual que votar o guardar.
 *
 * En el foro no siempre se puede saber: el autor viene como perfil de
 * comunidad y el backend no dice cuál es el de quien mira, así que ahí el
 * menú aparece igual y el diálogo explica el rechazo (ver
 * backend-pendientes-frontend.md).
 */
export function ReportMenu({
  itemType,
  itemId,
  isOwnContent = false,
  className,
  /** Para apoyarlo sobre una imagen o una cabecera oscura. */
  tone = 'default',
  placement = 'top start',
}: {
  itemType: ReportItemType
  itemId: number
  /** Cuando se sabe que el contenido es de quien mira, no se ofrece reportarlo. */
  isOwnContent?: boolean
  className?: string
  tone?: 'default' | 'overlay'
  /** Hacia dónde abre el menú; en una cabecera conviene hacia abajo. */
  placement?: PopoverProps['placement']
}) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { isLoggedIn } = useCurrentUser()
  const [isReporting, setReporting] = useState(false)

  if (isOwnContent) return null

  return (
    <>
      <AriaMenuTrigger>
        <AriaButton
          aria-label={t('reports.menu.label')}
          className={cx(
            'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors outline-none focus-visible:outline-2 focus-visible:outline-mynted-blue-mid',
            tone === 'overlay'
              ? 'bg-black/35 text-white hover:bg-black/55'
              : 'text-mynted-gray hover:bg-mynted-bg hover:text-mynted-ink',
            className,
          )}
        >
          <MoreVertical className="size-4" aria-hidden="true" />
        </AriaButton>
        <AriaPopover
          placement={placement}
          className="rounded-xl border border-mynted-border bg-white p-1 shadow-lg outline-none"
        >
          <AriaMenu
            className="outline-none"
            onAction={() => (isLoggedIn ? setReporting(true) : void navigate({ to: '/login' }))}
          >
            <AriaMenuItem
              id="report"
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-mynted-ink outline-none data-[focused]:bg-mynted-bg"
            >
              <Flag className="size-4" aria-hidden="true" />
              {t('reports.menu.report')}
            </AriaMenuItem>
          </AriaMenu>
        </AriaPopover>
      </AriaMenuTrigger>

      <ReportDialog
        open={isReporting}
        itemType={itemType}
        itemId={itemId}
        onClose={() => setReporting(false)}
      />
    </>
  )
}
