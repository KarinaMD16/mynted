import { useState } from 'react'
import { Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'
import {
  useCommunityDetailBySlug,
  useMyCommunities,
} from '@/features/community/hooks/useCommunitiesQueries'
import { CreatePostDialog } from '@/features/community/components/create/CreatePostDialog'
import { MY_COMMUNITIES_QUERY, labelClasses } from '@/features/community/types/DEFAULT_VALUES'

/**
 * Caja de "¿Que tienes en mente?" del feed global. Publicar siempre ocurre
 * dentro de una comunidad (POST /communities/:id/posts), asi que aca no se
 * escribe nada: abre el formulario de siempre con un selector de comunidad
 * arriba, limitado a las comunidades de las que el usuario es miembro.
 */
export function GlobalPostComposer() {
  const { t } = useLanguage()
  const { data: user } = useCurrentUser()
  const myCommunities = useMyCommunities(MY_COMMUNITIES_QUERY)

  const [isOpen, setIsOpen] = useState(false)
  const [slug, setSlug] = useState('')
  const [hasPhotoFailed, setHasPhotoFailed] = useState(false)

  const communities = myCommunities.data?.data ?? []
  const detail = useCommunityDetailBySlug(slug, isOpen)
  const canPublish = communities.length > 0

  function close() {
    setIsOpen(false)
    setSlug('')
  }

  return (
    <>
      <section className="flex flex-col gap-3 rounded-2xl border border-mynted-border bg-white p-4">
        <div className="flex items-center gap-3">
          {user?.photoUrl && !hasPhotoFailed ? (
            <img
              src={user.photoUrl}
              alt=""
              // Ver ForumAuthorLine: sin esto las fotos de Google dan 429.
              referrerPolicy="no-referrer"
              onError={() => setHasPhotoFailed(true)}
              className="size-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mynted-orange text-sm font-bold text-white"
              aria-hidden="true"
            >
              {(user?.username ?? '?').charAt(0).toUpperCase()}
            </span>
          )}

          {/* Parece un campo de texto, pero abre el formulario: el cuerpo se escribe ahi. */}
          <Button
            variant="secondary"
            disabled={!canPublish}
            onClick={() => setIsOpen(true)}
            className="min-w-0 flex-1 justify-start border-transparent bg-mynted-bg font-normal text-mynted-gray hover:bg-mynted-border/40"
          >
            {t('talk.composer.placeholder')}
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button variant="accent" size="sm" shape="pill" disabled={!canPublish} onClick={() => setIsOpen(true)}>
            <Paperclip className="size-4" aria-hidden="true" />
            {t('talk.composer.attach')}
          </Button>

          <Button size="sm" shape="pill" disabled={!canPublish} onClick={() => setIsOpen(true)}>
            {t('forum.create.publish')}
          </Button>
        </div>

        {!canPublish && !myCommunities.isPending && (
          <p className="text-xs text-mynted-gray">{t('talk.composer.noCommunities')}</p>
        )}
      </section>

      <CreatePostDialog
        isOpen={isOpen}
        onClose={close}
        community={detail.data}
        communityPicker={
          <div className="flex flex-col gap-1.5">
            <label htmlFor="composer-community" className={labelClasses}>
              {t('talk.composer.communityLabel')}
            </label>
            <Select
              id="composer-community"
              value={slug}
              options={communities.map((community) => ({ value: community.slug, label: community.name }))}
              placeholder={t('talk.composer.communityPlaceholder')}
              onChange={setSlug}
            />
          </div>
        }
      />
    </>
  )
}
