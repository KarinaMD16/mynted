import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Camera, Crop, Globe, ImagePlus, LoaderCircle, Lock, Undo2 } from 'lucide-react'
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
import { useCommunityModeration } from '@/features/community/hooks/useCommunitiesMutations'
import { useCategories } from '@/features/community/hooks/useCommunitiesQueries'
import type { CommunityDetail } from '@/features/community/models/communityDTOs'
import { errorClasses, hintClasses, inputClasses, labelClasses } from '@/features/community/types/DEFAULT_VALUES'
import type { SelectedImage } from '@/features/community/types/CommunityTypes'
import { BANNER_CROP, IMAGE_CROP } from '@/features/community/types/DEFAULT_VALUES'
import { CommunityPattern } from '@/features/community/components/ui/CommunityPattern'
import { ImageCropDialog } from '@/features/community/components/ui/ImageCropDialog'
import type { CropSource } from '@/features/community/components/ui/ImageCropDialog'
import { PrivacyOption } from '@/features/community/components/ui/PrivacyOption'
import { TagPicker } from '@/features/community/components/ui/TagPicker'


export function ModerationSettingsSection({
  community,
  isOwner,
}: {
  community: CommunityDetail
  isOwner: boolean
}) {
  const { t } = useLanguage()
  const categoriesQuery = useCategories()
  const { saveSettings, changePrivacy, deactivate } = useCommunityModeration(community.id)

  const [name, setName] = useState(community.name)
  const [description, setDescription] = useState(community.description)
  const [categoryId, setCategoryId] = useState(community.category?.categoryId ?? 0)
  const [tagIds, setTagIds] = useState(community.tags.map((tag) => tag.tagId))
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false)

  const [banner, setBanner] = useState<SelectedImage | null>(null)
  const [image, setImage] = useState<SelectedImage | null>(null)
  const [cropTarget, setCropTarget] = useState<{ kind: 'banner' | 'image'; source: CropSource } | null>(null)

  useEffect(() => () => { if (banner) URL.revokeObjectURL(banner.previewUrl) }, [banner])
  useEffect(() => () => { if (image) URL.revokeObjectURL(image.previewUrl) }, [image])
  useEffect(() => () => { if (cropTarget) URL.revokeObjectURL(cropTarget.source.url) }, [cropTarget])

  const openCropper = (kind: 'banner' | 'image', file: File) => {
    setCropTarget({ kind, source: { file, url: URL.createObjectURL(file) } })
  }

  const handleFileChange = (kind: 'banner' | 'image') => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    openCropper(kind, file)
  }

  const handleCropConfirm = (cropped: File) => {
    if (!cropTarget) return
    const selected: SelectedImage = {
      file: cropped,
      previewUrl: URL.createObjectURL(cropped),
      original: cropTarget.source.file,
    }
    if (cropTarget.kind === 'banner') setBanner(selected)
    else setImage(selected)
    setCropTarget(null)
  }

  const cropSettings = cropTarget?.kind === 'image' ? IMAGE_CROP : BANNER_CROP

  const handleSave = () => {
    const formData = new FormData()
    formData.append('name', name.trim())
    formData.append('description', description.trim())
    if (categoryId > 0) formData.append('categoryId', String(categoryId))
    if (tagIds.length > 0) formData.append('tagIds', JSON.stringify(tagIds))
    if (image) formData.append('image', image.file)
    if (banner) formData.append('banner', banner.file)
    saveSettings.mutate(formData, {
      onSuccess: () => {
        setBanner(null)
        setImage(null)
      },
    })
  }

  const canSave = name.trim().length > 0 && description.trim().length > 0 && !saveSettings.isPending

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-lg font-semibold text-mynted-ink">{t('moderation.settings.title')}</h2>
      </div>

      {/* Portada e imagen de la comunidad */}
      <div className="relative mb-12">
        <div className="h-32 w-full overflow-hidden rounded-xl bg-mynted-bg sm:h-40">
          {banner ? (
            <img src={banner.previewUrl} alt="" className="h-full w-full object-cover" />
          ) : community.bannerUrl ? (
            <img src={community.bannerUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <CommunityPattern seed={community.id} />
          )}
        </div>

        <div className="absolute top-3 right-3 flex gap-2">
          <label
            htmlFor="settings-banner"
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-black/80"
          >
            <ImagePlus className="size-3.5" aria-hidden="true" />
            {t('moderation.settings.changeBanner')}
          </label>

          {banner && (
            <>
              <button
                type="button"
                onClick={() => openCropper('banner', banner.original)}
                aria-label={t('communities.create.editBanner')}
                className="rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm hover:cursor-pointer hover:bg-black/80"
              >
                <Crop className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setBanner(null)}
                aria-label={t('moderation.settings.undoImage')}
                className="rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm hover:cursor-pointer hover:bg-black/80"
              >
                <Undo2 className="size-4" />
              </button>
            </>
          )}
        </div>
        <input
          id="settings-banner"
          type="file"
          accept="image/png,image/jpeg"
          className="sr-only"
          onChange={handleFileChange('banner')}
        />

        <label
          htmlFor="settings-image"
          aria-label={t('moderation.settings.changeImage')}
          className="absolute -bottom-10 left-5 flex size-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-white bg-mynted-yellow font-heading text-xl font-semibold text-mynted-ink shadow-sm transition-transform hover:scale-105"
        >
          {image ? (
            <img src={image.previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : community.imageUrl ? (
            <img src={community.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <Camera className="size-5" aria-hidden="true" />
          )}
        </label>
        <input
          id="settings-image"
          type="file"
          accept="image/png,image/jpeg"
          className="sr-only"
          onChange={handleFileChange('image')}
        />

        {image && (
          <div className="absolute -bottom-10 left-28 flex gap-2">
            <button
              type="button"
              onClick={() => openCropper('image', image.original)}
              aria-label={t('communities.create.editImage')}
              className="rounded-full bg-white p-1.5 text-mynted-ink shadow hover:cursor-pointer hover:bg-mynted-bg"
            >
              <Crop className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setImage(null)}
              aria-label={t('moderation.settings.undoImage')}
              className="rounded-full bg-white p-1.5 text-mynted-ink shadow hover:cursor-pointer hover:bg-mynted-bg"
            >
              <Undo2 className="size-4" />
            </button>
          </div>
        )}
      </div>

      <ImageCropDialog
        key={cropTarget?.source.url ?? 'closed'}
        source={cropTarget?.source ?? null}
        aspect={cropSettings.aspect}
        outputWidth={cropSettings.outputWidth}
        shape={cropTarget?.kind === 'image' ? 'round' : 'rect'}
        title={cropTarget?.kind === 'image' ? t('communities.crop.imageTitle') : t('communities.crop.bannerTitle')}
        onCancel={() => setCropTarget(null)}
        onConfirm={handleCropConfirm}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="settings-name" className={labelClasses}>
          {t('communities.create.nameLabel')}
        </label>
        <input
          id="settings-name"
          type="text"
          className={inputClasses(false)}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="settings-description" className={labelClasses}>
          {t('communities.create.descriptionLabel')}
        </label>
        <textarea
          id="settings-description"
          rows={3}
          className={`${inputClasses(false)} resize-y`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className={labelClasses}>{t('communities.create.categoryLabel')}</legend>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {categoriesQuery.data?.map((category) => {
            const isSelected = categoryId === category.categoryId
            return (
              <button
                key={category.categoryId}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  if (isSelected) return
                  setCategoryId(category.categoryId)
                  setTagIds([])
                }}
                className={`rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors hover:cursor-pointer ${
                  isSelected
                    ? 'border-mynted-orange bg-mynted-orange text-white'
                    : 'border-mynted-border bg-white text-mynted-ink hover:border-mynted-orange'
                }`}
              >
                {category.name}
              </button>
            )
          })}
        </div>
      </fieldset>

      {categoryId > 0 && <TagPicker categoryId={categoryId} selected={tagIds} onChange={setTagIds} />}

      <div className="flex flex-col items-start gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="inline-flex items-center gap-2 rounded-xl bg-mynted-orange px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:cursor-pointer hover:bg-mynted-orange-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saveSettings.isPending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
          {saveSettings.isPending ? t('moderation.settings.saving') : t('moderation.settings.save')}
        </button>

        {saveSettings.isSuccess && !saveSettings.isPending && (
          <p className="text-xs text-emerald-600">{t('moderation.settings.saved')}</p>
        )}
        {saveSettings.isError && (
          <p className={errorClasses} role="alert">
            {getApiErrorMessage(saveSettings.error)}
          </p>
        )}
      </div>

      {isOwner && (
        <>
          <div className="flex flex-col gap-1.5 border-t border-mynted-border pt-6">
            <span className={labelClasses}>{t('communities.create.privacyLabel')}</span>
            <div role="radiogroup" className="mt-1 grid gap-4 sm:grid-cols-2">
              <PrivacyOption
                icon={<Globe className="size-4.5" aria-hidden="true" />}
                title={t('communities.create.publicTitle')}
                description={t('communities.create.publicDescription')}
                selected={!community.isPrivate}
                onSelect={() => !community.isPrivate || changePrivacy.mutate(false)}
              />
              <PrivacyOption
                icon={<Lock className="size-4.5" aria-hidden="true" />}
                title={t('communities.create.privateTitle')}
                description={t('communities.create.privateDescription')}
                selected={community.isPrivate}
                onSelect={() => community.isPrivate || changePrivacy.mutate(true)}
              />
            </div>
            {changePrivacy.isError && (
              <p className={errorClasses} role="alert">
                {getApiErrorMessage(changePrivacy.error)}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 border-t border-mynted-border pt-6">
            <span className={labelClasses}>{t('moderation.settings.dangerTitle')}</span>
            <p className={hintClasses}>{t('moderation.settings.deactivateHint')}</p>
            <button
              type="button"
              onClick={() => setIsDeactivateOpen(true)}
              className="mt-2 w-fit rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:cursor-pointer hover:bg-red-50"
            >
              {t('moderation.settings.deactivate')}
            </button>
          </div>

          <Dialog open={isDeactivateOpen} onOpenChange={(open) => { if (!open) setIsDeactivateOpen(false) }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {t('moderation.settings.deactivateTitle', { name: community.name })}
                </DialogTitle>
                <DialogDescription>{t('moderation.settings.deactivateDescription')}</DialogDescription>
              </DialogHeader>

              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setIsDeactivateOpen(false)}
                  className="rounded-xl border border-mynted-border bg-white px-5 py-2.5 text-sm font-semibold text-mynted-ink transition-colors hover:cursor-pointer hover:bg-mynted-bg"
                >
                  {t('community.detail.leaveCancel')}
                </button>
                <button
                  type="button"
                  onClick={() => deactivate.mutate(undefined, { onSuccess: () => setIsDeactivateOpen(false) })}
                  disabled={deactivate.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:cursor-pointer hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deactivate.isPending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
                  {t('moderation.settings.deactivate')}
                </button>
              </DialogFooter>

              {deactivate.isError && (
                <p className="mt-3 text-sm text-red-500" role="alert">
                  {getApiErrorMessage(deactivate.error)}
                </p>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </section>
  )
}
