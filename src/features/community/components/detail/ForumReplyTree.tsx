import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { MessageSquare } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { useLanguage } from '@/i18n/LanguageContext'
import { useForumActions } from '@/features/community/hooks/useForum'
import type { ForumReply } from '@/features/community/models/forumDTOs'
import { ForumAuthorLine } from '@/features/community/components/ui/ForumAuthorLine'
import { ForumMetricsBar } from '@/features/community/components/ui/ForumMetricsBar'
import { errorClasses, inputClasses } from '@/features/community/types/DEFAULT_VALUES'
import { formatRelativeTime } from '@/utils/relativeTime'

interface ForumReplyTreeProps {
  postId: number
  replies: ForumReply[]
  /** Perfil de quien abrio la publicacion, para marcar "Autor" en sus respuestas. */
  authorProfileId?: number
}

/**
 * Respuestas de una publicacion. El backend las devuelve planas con
 * `parentReplyId`, asi que aca se arma el arbol y cada nivel se indenta.
 */
export function ForumReplyTree({ postId, replies, authorProfileId }: ForumReplyTreeProps) {
  const { t } = useLanguage()

  const childrenByParent = new Map<number | null, ForumReply[]>()
  replies.forEach((reply) => {
    const siblings = childrenByParent.get(reply.parentReplyId) ?? []
    siblings.push(reply)
    childrenByParent.set(reply.parentReplyId, siblings)
  })

  const roots = childrenByParent.get(null) ?? []

  if (replies.length === 0) {
    return <p className="text-sm text-mynted-gray">{t('forum.replies.empty')}</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {roots.map((reply, index) => (
        <ReplyNode
          key={reply.id}
          postId={postId}
          reply={reply}
          index={index}
          childrenByParent={childrenByParent}
          authorProfileId={authorProfileId}
        />
      ))}
    </ul>
  )
}

interface ReplyNodeProps {
  postId: number
  reply: ForumReply
  index: number
  childrenByParent: Map<number | null, ForumReply[]>
  authorProfileId?: number
}

function ReplyNode({ postId, reply, index, childrenByParent, authorProfileId }: ReplyNodeProps) {
  const { t, language } = useLanguage()
  const { voteOnReply, favoriteReply } = useForumActions()
  const [isReplying, setIsReplying] = useState(false)

  const children = childrenByParent.get(reply.id) ?? []

  return (
    <li>
      <div className="flex flex-col gap-2.5 rounded-2xl border border-mynted-border bg-white p-4">
        <ForumAuthorLine
          displayName={reply.author?.displayName ?? t('community.detail.deletedAuthor')}
          role={reply.author?.role}
          postedAt={reply.postedAt}
          relativeTime={formatRelativeTime(reply.postedAt, language)}
          index={index}
          isOriginalPoster={authorProfileId !== undefined && reply.communityProfileId === authorProfileId}
        />

        <p className="text-sm whitespace-pre-line text-mynted-ink">{reply.body}</p>

        <ForumMetricsBar
          metrics={reply}
          disabled={voteOnReply.isPending || favoriteReply.isPending}
          onVote={(voteType) => voteOnReply.mutate({ replyId: reply.id, voteType })}
          onToggleFavorite={() => favoriteReply.mutate({ replyId: reply.id, isSaved: !reply.isSaved })}
          leading={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReplying((current) => !current)}
              className="px-2 text-xs text-mynted-blue"
            >
              <MessageSquare className="size-3.5" aria-hidden="true" />
              {t('forum.replies.reply')}
            </Button>
          }
        />

        {isReplying && (
          <ReplyForm postId={postId} parentReplyId={reply.id} onDone={() => setIsReplying(false)} />
        )}
      </div>

      {children.length > 0 && (
        <ul className="mt-3 ml-4 flex flex-col gap-3 border-l-2 border-mynted-border pl-4">
          {children.map((child, childIndex) => (
            <ReplyNode
              key={child.id}
              postId={postId}
              reply={child}
              index={index + childIndex + 1}
              childrenByParent={childrenByParent}
              authorProfileId={authorProfileId}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

/** Caja para escribir una respuesta; sin `parentReplyId` responde a la publicacion. */
export function ReplyForm({
  postId,
  parentReplyId,
  onDone,
}: {
  postId: number
  parentReplyId?: number
  onDone?: () => void
}) {
  const { t } = useLanguage()
  const { reply } = useForumActions()
  const [body, setBody] = useState('')

  const handleSubmit = () => {
    const text = body.trim()
    if (!text) return
    reply.mutate(
      { postId, body: text, parentReplyId },
      {
        onSuccess: () => {
          setBody('')
          onDone?.()
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        rows={3}
        aria-label={t('forum.replies.placeholder')}
        placeholder={t('forum.replies.placeholder')}
        className={`${inputClasses(false)} resize-y`}
        value={body}
        onChange={(event) => setBody(event.target.value)}
      />

      <div className="flex items-center gap-2">
        <Button onClick={handleSubmit} disabled={body.trim().length === 0} isLoading={reply.isPending}>
          {t('forum.replies.send')}
        </Button>

        {onDone && (
          <Button variant="ghost" onClick={onDone}>
            {t('forum.replies.cancel')}
          </Button>
        )}
      </div>

      {reply.isError && (
        <p className={errorClasses} role="alert">
          {getApiErrorMessage(reply.error)}
        </p>
      )}
    </div>
  )
}
