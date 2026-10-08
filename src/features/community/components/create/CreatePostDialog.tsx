import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ImagePreviewDialog } from '@/components/ui/ImagePreviewDialog'
import type { ChangeEvent, ReactNode } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLanguage } from '@/i18n/LanguageContext'
import { useForumActions } from '@/features/community/hooks/useForum'
import type { CommunityDetail } from '@/features/community/models/communityDTOs'
import { MAX_TAGS, errorClasses, hintClasses, inputClasses, labelClasses } from '@/features/community/types/DEFAULT_VALUES'

/** Limites del backend (ver CreatePostDto y el interceptor de archivos). */
const MAX_TITLE = 200
const MAX_IMAGES = 10
const MIN_TAGS = 1

interface CreatePostDialogProps {
  /** Sin comunidad el formulario queda listo pero no deja publicar todavia. */
  community?: CommunityDetail
  isOpen: boolean
  onClose: () => void
  /**
   * Selector de comunidad, para cuando se publica desde el feed global: ahi la
   * comunidad no viene dada por la pantalla y hay que elegirla aca.
   */
  communityPicker?: ReactNode
}

/**
 * Crear una publicacion en el foro de la comunidad. Es multipart: titulo,
 * cuerpo, tags opcionales (de los de la comunidad) y hasta 10 imagenes.
 */
export function CreatePostDialog({ community, isOpen, onClose, communityPicker }: CreatePostDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl">
        {isOpen && (
          <CreatePostForm community={community} onClose={onClose} communityPicker={communityPicker} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function CreatePostForm({
  community,
  onClose,
  communityPicker,
}: {
  community?: CommunityDetail
  onClose: () => void
  communityPicker?: ReactNode
}) {
  const { t } = useLanguage()
  const { publishPost } = useForumActions()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tagIds, setTagIds] = useState<number[]>([])
  const [images, setImages] = useState<{ file: File; previewUrl: string }[]>([])
  // Indice de la imagen abierta en grande; null con el visor cerrado.
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  // Las vistas previas son object URLs: se liberan al cambiar la lista o cerrar
  useEffect(() => () => { images.forEach((image) => URL.revokeObjectURL(image.previewUrl)) }, [images])

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return
    setImages((current) => [
      ...current,
      ...files.slice(0, MAX_IMAGES - current.length).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ])
  }

  // Los tags son los de la comunidad, asi que al cambiarla los elegidos ya no
  // valen. Se ajusta durante el render (no en un efecto) para no renderizar
  // una vez con tags que ya no existen.
  const communityId = community?.id
  const [lastCommunityId, setLastCommunityId] = useState(communityId)
  if (communityId !== lastCommunityId) {
    setLastCommunityId(communityId)
    setTagIds([])
  }

  const handleSubmit = () => {
    if (!community) return

    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('body', body.trim())
    if (tagIds.length > 0) formData.append('tagIds', JSON.stringify(tagIds))
    images.forEach((image) => formData.append('images', image.file))

    publishPost.mutate({ communityId: community.id, body: formData }, { onSuccess: onClose })
  }

  const canSubmit =
    community !== undefined &&
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    tagIds.length >= MIN_TAGS &&
    !publishPost.isPending

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('forum.create.title')}</DialogTitle>
        <DialogDescription>
          {community
            ? t('forum.create.subtitle', { community: community.name })
            : t('forum.create.pickCommunityHint')}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-5 flex flex-col gap-5">
        {communityPicker}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="post-title" className={labelClasses}>
            {t('forum.create.titleLabel')}
          </label>
          <input
            id="post-title"
            type="text"
            maxLength={MAX_TITLE}
            placeholder={t('forum.create.titlePlaceholder')}
            className={inputClasses(false)}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <span className={hintClasses}>
            {title.length}/{MAX_TITLE}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="post-body" className={labelClasses}>
            {t('forum.create.bodyLabel')}
          </label>
          <textarea
            id="post-body"
            rows={5}
            placeholder={t('forum.create.bodyPlaceholder')}
            className={`${inputClasses(false)} resize-y`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </div>

        {community && community.tags.length > 0 && (
          <fieldset className="flex flex-col gap-1.5">
            <legend className={labelClasses}>{t('forum.create.tagsLabel')}</legend>
            <p className={hintClasses}>{t('forum.create.tagsHint', { max: MAX_TAGS })}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {community.tags.map((tag) => {
                const isSelected = tagIds.includes(tag.tagId)
                return (
                  <Button
                    key={tag.tagId}
                    variant={isSelected ? 'primary' : 'secondary'}
                    size="sm"
                    shape="pill"
                    aria-pressed={isSelected}
                    // Con el tope alcanzado hay que soltar uno antes de cambiarlo:
                    // el backend rechaza mas de tres y el error llegaria al publicar.
                    disabled={!isSelected && tagIds.length >= MAX_TAGS}
                    onClick={() =>
                      setTagIds((current) =>
                        isSelected ? current.filter((id) => id !== tag.tagId) : [...current, tag.tagId],
                      )
                    }
                    className="text-xs"
                  >
                    #{tag.name}
                  </Button>
                )
              })}
            </div>
          </fieldset>
        )}

        <div className="flex flex-col gap-2">
          <span className={labelClasses}>{t('forum.create.imagesLabel')}</span>

          {images.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {images.map((image, index) => (
                <li key={image.previewUrl} className="relative">
                  <button
                    type="button"
                    onClick={() => setPreviewIndex(index)}
                    aria-label={t('forum.create.viewImage')}
                    className="block size-20 overflow-hidden rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid"
                  >
                    <img src={image.previewUrl} alt="" className="size-full cursor-zoom-in object-cover" />
                  </button>
                  <Button
                    variant="overlay"
                    size="icon-sm"
                    shape="pill"
                    onClick={() => {
                      setImages((current) => current.filter((_, position) => position !== index))
                      setPreviewIndex(null)
                    }}
                    aria-label={t('forum.create.removeImage')}
                    className="absolute -top-1.5 -right-1.5 size-6"
                  >
                    <X className="size-3" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {images.length < MAX_IMAGES && (
            <>
              <label
                htmlFor="post-images"
                className="flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-mynted-border px-3 py-1.5 text-[13px] text-mynted-gray transition-colors hover:border-mynted-orange hover:text-mynted-orange"
              >
                <ImagePlus className="size-4" aria-hidden="true" />
                {t('forum.create.addImages')}
              </label>
              <input
                id="post-images"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="sr-only"
                onChange={handleFilesChange}
              />
            </>
          )}

          <span className={hintClasses}>{t('forum.create.imagesHint', { max: MAX_IMAGES })}</span>
        </div>

        {publishPost.isError && (
          <p className={errorClasses} role="alert">
            {getApiErrorMessage(publishPost.error)}
          </p>
        )}
      </div>

      <ImagePreviewDialog
        src={previewIndex === null ? null : (images[previewIndex]?.previewUrl ?? null)}
        alt=""
        title={t('forum.create.viewImage')}
        isOpen={previewIndex !== null}
        onClose={() => setPreviewIndex(null)}
      />

      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          {t('forum.create.cancel')}
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit} isLoading={publishPost.isPending}>
          {publishPost.isPending ? t('forum.create.publishing') : t('forum.create.publish')}
        </Button>
      </DialogFooter>
    </>
  )
}
