import { ArrowDown, ArrowUp, MessageCircle, Star } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import type { FeedPost } from '@/features/community/models/communityDTOs'

/** Votos, respuestas y guardados de un post. `onImage` pinta todo en blanco para usarlo sobre una foto o un fondo oscuro. */
export function PostStats({
  post,
  onImage = false,
  accent = false,
  className = '',
}: {
  post: FeedPost
  onImage?: boolean
  /** Contadores en azul (como en el wireframe de Favoritos); el de guardados queda en gris. */
  accent?: boolean
  className?: string
}) {
  const { t } = useLanguage()
  const base = onImage ? 'text-white/90' : accent ? 'text-mynted-blue' : 'text-mynted-gray'
  const savedBase = accent && !onImage ? 'text-mynted-gray' : ''
  const active = onImage ? 'font-semibold text-white' : 'font-semibold text-mynted-orange'

  return (
    <div className={`flex items-center gap-3.5 text-xs ${base} ${className}`}>
      <span
        className={`flex items-center gap-1 ${post.myVote === 'UP' ? active : ''}`}
        title={t('community.detail.upVotes')}
      >
        <ArrowUp className="size-3.5" aria-hidden="true" />
        {post.upVotes}
      </span>
      <span
        className={`flex items-center gap-1 ${post.myVote === 'DOWN' ? active : ''}`}
        title={t('community.detail.downVotes')}
      >
        <ArrowDown className="size-3.5" aria-hidden="true" />
        {post.downVotes}
      </span>
      <span className="flex items-center gap-1" title={t('forum.post.replies')}>
        <MessageCircle className="size-3.5" aria-hidden="true" />
        {post.replyCount}
      </span>
      <span
        className={`flex items-center gap-1 ${savedBase} ${post.isSaved ? active : ''}`}
        title={t('community.detail.timesSaved')}
      >
        <Star className="size-3.5" aria-hidden="true" />
        {post.timesSaved}
      </span>
    </div>
  )
}
