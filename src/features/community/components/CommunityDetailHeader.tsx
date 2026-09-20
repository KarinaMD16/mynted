import { useState } from 'react'
import { Check, LoaderCircle, Plus } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { ImagePreviewDialog } from '@/components/ui/ImagePreviewDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLanguage } from '@/i18n/LanguageContext'
import { useJoinCommunity, useLeaveCommunity } from '../hooks/useCommunitiesMutations'
import type { CommunityDetail } from '../models/communityDTOs'
import { CommunityPattern } from './CommunityPattern'

type PreviewTarget = 'banner' | 'image'

export function CommunityDetailHeader({ community }: { community: CommunityDetail }) {
  const { t } = useLanguage()
  const joinMutation = useJoinCommunity(community.id)
  const leaveMutation = useLeaveCommunity(community.id)
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [preview, setPreview] = useState<PreviewTarget | null>(null)

  const isPending = joinMutation.isPending || leaveMutation.isPending
  const error = joinMutation.error ?? leaveMutation.error

  const bannerAlt = t('communities.card.bannerAlt', { name: community.name })
  const imageAlt = t('communities.card.imageAlt', { name: community.name })

  const handleMembershipClick = () => {
    if (community.isMember) {
      setIsLeaveDialogOpen(true)
      return
    }
    joinMutation.mutate()
  }

  const handleLeaveConfirm = () => {
    leaveMutation.mutate(undefined, {
      onSuccess: () => setIsLeaveDialogOpen(false),
    })
  }

  return (
    <header className="flex flex-col items-center">
      <div className="relative w-full">
        <div className="h-40 w-full overflow-hidden rounded-2xl sm:h-56">
          {!community.bannerUrl && <CommunityPattern seed={community.id} />}
          {community.bannerUrl && (
            <button
              type="button"
              onClick={() => setPreview('banner')}
              aria-label={t('community.detail.viewBanner')}
              className="h-full w-full hover:cursor-zoom-in"
            >
              <img src={community.bannerUrl} alt={bannerAlt} className="h-full w-full object-cover" />
            </button>
          )}
        </div>

        <div className="absolute -bottom-12 left-1/2 flex size-24 -translate-x-1/2 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-mynted-yellow font-heading text-2xl font-semibold text-mynted-ink">
          {community.imageUrl ? (
            <button
              type="button"
              onClick={() => setPreview('image')}
              aria-label={t('community.detail.viewImage')}
              className="h-full w-full hover:cursor-zoom-in"
            >
              <img src={community.imageUrl} alt={imageAlt} className="h-full w-full object-cover" />
            </button>
          ) : (
            community.name.charAt(0).toUpperCase()
          )}
        </div>
      </div>

      <h1 className="mt-16 font-heading text-2xl font-semibold text-mynted-ink">@{community.slug}</h1>

      <p className="mt-1 text-sm text-mynted-gray">
        {t('community.detail.members', { count: community.memberCount })} ·{' '}
        {t('community.detail.recentPosts', { count: community.recentPostCount })}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleMembershipClick}
          disabled={isPending}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
            community.isMember
              ? 'border border-mynted-border bg-white text-mynted-ink hover:bg-mynted-bg'
              : 'bg-mynted-orange text-white hover:bg-mynted-orange-hover'
          }`}
        >
          {isPending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : community.isMember ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Plus className="size-4" aria-hidden="true" />
          )}
          {community.isMember ? t('community.detail.joined') : t('community.detail.join')}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500" role="alert">
          {getApiErrorMessage(error)}
        </p>
      )}

      <ImagePreviewDialog
        src={preview === 'banner' ? community.bannerUrl : community.imageUrl}
        alt={preview === 'banner' ? bannerAlt : imageAlt}
        title={preview === 'banner' ? t('community.detail.viewBanner') : t('community.detail.viewImage')}
        isOpen={preview !== null}
        onClose={() => setPreview(null)}
      />

      <Dialog
        open={isLeaveDialogOpen}
        onOpenChange={(open) => {
          if (!open) setIsLeaveDialogOpen(false)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {t('community.detail.leaveTitle', { name: community.name })}
            </DialogTitle>
            <DialogDescription>{t('community.detail.leaveDescription')}</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsLeaveDialogOpen(false)}
              className="rounded-xl border border-mynted-border bg-white px-5 py-2.5 text-sm font-semibold text-mynted-ink transition-colors hover:cursor-pointer hover:bg-mynted-bg"
            >
              {t('community.detail.leaveCancel')}
            </button>

            <button
              type="button"
              onClick={handleLeaveConfirm}
              disabled={leaveMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:cursor-pointer hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {leaveMutation.isPending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
              {leaveMutation.isPending ? t('community.detail.leaving') : t('community.detail.leaveConfirm')}
            </button>
          </DialogFooter>

          {leaveMutation.isError && (
            <p className="mt-3 text-sm text-red-500" role="alert">
              {getApiErrorMessage(leaveMutation.error)}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </header>
  )
}
