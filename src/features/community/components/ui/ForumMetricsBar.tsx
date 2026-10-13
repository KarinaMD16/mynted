import { ArrowDown, ArrowUp, MessageSquare, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/i18n/LanguageContext'
import type { ForumMetrics, VoteType } from '@/features/community/models/forumDTOs'

interface ForumMetricsBarProps {
  metrics: ForumMetrics
  /** Comentarios: solo en publicaciones; las respuestas no lo muestran. */
  replyCount?: number
  onVote: (voteType: VoteType) => void
  onToggleFavorite: () => void
  disabled?: boolean
  /** Accion a la izquierda (en las respuestas es "Responder"). */
  leading?: React.ReactNode
  className?: string
}

/**
 * Contadores de una publicacion o respuesta: comentarios, votos y favorito.
 * `myVote` e `isSaved` vienen del backend, asi que el estado marcado sale
 * directo de los datos y no hace falta llevarlo aparte.
 */
export function ForumMetricsBar({
  metrics,
  replyCount,
  onVote,
  onToggleFavorite,
  disabled = false,
  leading,
  className = '',
}: ForumMetricsBarProps) {
  const { t } = useLanguage()
  return (
    <div className={`flex items-center gap-3 text-xs text-mynted-gray ${className}`}>
      {leading}

      {replyCount !== undefined && (
        <span className="flex items-center gap-1 text-mynted-blue">
          <MessageSquare className="size-3.5" aria-hidden="true" />
          {replyCount}
        </span>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onVote('UP')}
        disabled={disabled}
        aria-pressed={metrics.myVote === 'UP'}
        aria-label={t('forum.upvote')}
        className={`px-2 text-xs font-normal ${metrics.myVote === 'UP' ? 'text-mynted-orange' : ''}`}
      >
        <ArrowUp className="size-3.5" aria-hidden="true" />
        {metrics.upVotes}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onVote('DOWN')}
        disabled={disabled}
        aria-pressed={metrics.myVote === 'DOWN'}
        aria-label={t('forum.downvote')}
        className={`px-2 text-xs font-normal ${metrics.myVote === 'DOWN' ? 'text-mynted-blue' : ''}`}
      >
        <ArrowDown className="size-3.5" aria-hidden="true" />
        {metrics.downVotes}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleFavorite}
        disabled={disabled}
        aria-pressed={metrics.isSaved}
        aria-label={metrics.isSaved ? t('forum.unsave') : t('forum.save')}
        className={`px-2 text-xs font-normal ${metrics.isSaved ? 'text-amber-500' : ''}`}
      >
        <Star className={`size-3.5 ${metrics.isSaved ? 'fill-current' : ''}`} aria-hidden="true" />
        {metrics.timesSaved}
      </Button>
    </div>
  )
}
