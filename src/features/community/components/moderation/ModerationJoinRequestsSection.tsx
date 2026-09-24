import { Check, LoaderCircle, X } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { useLanguage } from '@/i18n/LanguageContext'
import { useCommunityModeration } from '@/features/community/hooks/useCommunitiesMutations'
import { useCommunityJoinRequests } from '@/features/community/hooks/useCommunitiesQueries'
import type { CommunityDetail } from '@/features/community/models/communityDTOs'
import { errorClasses, hintClasses } from '@/features/community/types/DEFAULT_VALUES'
import { formatRelativeTime } from '@/utils/relativeTime'
import { Button } from '@/components/ui/Button'

/**
 * Solicitudes pendientes para entrar a una comunidad privada. El backend las
 * crea solas cuando alguien toca "Solicitar unirme" (ver joinCommunity) y deja
 * aceptarlas o rechazarlas al dueno y a los moderadores.
 */
export function ModerationJoinRequestsSection({ community }: { community: CommunityDetail }) {
  const { t, language } = useLanguage()
  const requestsQuery = useCommunityJoinRequests(community.id)
  const { acceptJoinRequest, rejectJoinRequest } = useCommunityModeration(community.id)

  const requests = requestsQuery.data ?? []
  const error = requestsQuery.error ?? acceptJoinRequest.error ?? rejectJoinRequest.error
  // Cual fila esta ocupada, para deshabilitar solo esos botones
  const busyRequestId = acceptJoinRequest.isPending
    ? acceptJoinRequest.variables
    : rejectJoinRequest.isPending
      ? rejectJoinRequest.variables
      : null

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-lg font-semibold text-mynted-ink">{t('moderation.requests.title')}</h2>
        <p className={hintClasses}>
          {community.isPrivate ? t('moderation.requests.hint') : t('moderation.requests.publicHint')}
        </p>
      </div>

      {requestsQuery.isPending && (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-xl bg-mynted-bg" />
          ))}
        </div>
      )}

      {requestsQuery.isSuccess && requests.length === 0 && (
        <p className="rounded-xl border border-dashed border-mynted-border px-6 py-10 text-center text-sm text-mynted-gray">
          {t('moderation.requests.empty')}
        </p>
      )}

      {requests.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {requests.map((request) => {
            const isBusy = busyRequestId === request.id

            return (
              <li
                key={request.id}
                className="flex items-center gap-3 rounded-xl border border-mynted-border bg-white px-3.5 py-2.5"
              >
                <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-mynted-yellow text-xs font-bold text-mynted-ink">
                  {request.user.photoUrl ? (
                    <img src={request.user.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    request.user.username.slice(0, 2).toUpperCase()
                  )}
                </span>

                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold text-mynted-ink">{request.user.username}</span>
                  <time dateTime={request.createdAt} className="text-xs text-mynted-gray">
                    {formatRelativeTime(request.createdAt, language)}
                  </time>
                </div>

                <Button
                  type="button"
                  onClick={() => acceptJoinRequest.mutate(request.id)}
                  disabled={isBusy}
                  variant="success"
                  size="sm"
                >
                  {isBusy && acceptJoinRequest.isPending ? (
                    <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Check className="size-3.5" aria-hidden="true" />
                  )}
                  {t('moderation.requests.accept')}
                </Button>

                <Button
                  type="button"
                  onClick={() => rejectJoinRequest.mutate(request.id)}
                  disabled={isBusy}
                  variant="secondary"
                  size="sm"
                >
                  {isBusy && rejectJoinRequest.isPending ? (
                    <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <X className="size-3.5" aria-hidden="true" />
                  )}
                  {t('moderation.requests.reject')}
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      {error && (
        <p className={errorClasses} role="alert">
          {getApiErrorMessage(error)}
        </p>
      )}
    </section>
  )
}
