import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/Button'
import { getApiErrorMessage } from '@/api/apiError'
import { useLanguage } from '@/i18n/LanguageContext'
import { useJoinCommunitiesMutation, useOnboardingCommunitiesQuery } from '../hooks/useCommunitiesOnboardingMutations'

interface CommunitiesStepProps {
  /** Si viene, se llama al terminar este paso en vez de navegar a "/". */
  onContinue?: () => void
}

/**
 * Último paso del onboarding: unirse a comunidades recomendadas según los
 * intereses elegidos en el paso anterior (ver InterestsStep). Estructura
 * idéntica a InterestsStep a propósito, para mantener la misma experiencia.
 *
 * A diferencia de intereses, acá no hay mínimo: POST /users/me/communities
 * acepta cualquier cantidad, incluyendo 0 (equivalente a "Omitir").
 */
export function CommunitiesStep({ onContinue }: CommunitiesStepProps) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<number[]>([])

  const communitiesQuery = useOnboardingCommunitiesQuery()
  const joinCommunitiesMutation = useJoinCommunitiesMutation()

  const goNext = () => {
    if (onContinue) {
      onContinue()
      return
    }
    void navigate({ to: '/' })
  }

  function toggleCommunity(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((communityId) => communityId !== id) : [...prev, id]))
  }

  function handleContinue() {
    joinCommunitiesMutation.mutate({ communityIds: selected }, { onSuccess: goNext })
  }

  function handleSkip() {
    joinCommunitiesMutation.mutate({ communityIds: [] }, { onSuccess: goNext })
  }

  const canSubmit = !joinCommunitiesMutation.isPending
  const canContinue = canSubmit && selected.length > 0

  return (
    <div className="flex w-full flex-col gap-3.5">
      <div>
        <p className="text-sm font-semibold text-mynted-orange">{t('onboarding.stepCommunities')}</p>
        <h1 className="mt-1 font-heading text-[24px] font-semibold text-mynted-ink">{t('onboarding.communitiesTitle')}</h1>
        <p className="mt-1.5 text-sm text-mynted-gray">{t('onboarding.communitiesSubtitle')}</p>
      </div>

      {communitiesQuery.isLoading && <p className="text-sm text-mynted-gray">{t('onboarding.loadingCommunities')}</p>}

      {communitiesQuery.isError && (
        <p className="text-center text-xs text-red-500" role="alert">
          {getApiErrorMessage(communitiesQuery.error, t('onboarding.loadCommunitiesError'))}
        </p>
      )}

      {communitiesQuery.data && communitiesQuery.data.length === 0 && (
        <p className="text-sm text-mynted-gray">{t('onboarding.noCommunitiesYet')}</p>
      )}

      {communitiesQuery.data && communitiesQuery.data.length > 0 && (
        <div className="scrollbar-thin scrollbar-thumb-mynted-orange scrollbar-track-transparent -mr-1 flex max-h-[220px] flex-wrap content-start gap-2 overflow-y-auto pr-1">
          {communitiesQuery.data.map((community) => {
            const isSelected = selected.includes(community.id)
            return (
              <button
                key={community.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleCommunity(community.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:cursor-pointer ${
                  isSelected
                    ? 'border-mynted-yellow bg-mynted-yellow text-mynted-ink'
                    : 'border-mynted-border bg-white text-mynted-ink hover:border-mynted-orange'
                }`}
              >
                {community.name}
              </button>
            )
          })}
        </div>
      )}

      <p className="text-xs text-mynted-gray">
        {t('onboarding.communitiesSelectedCount', { count: selected.length })}
        {joinCommunitiesMutation.isPending && t('onboarding.communitiesSavingSuffix')}
      </p>

      {joinCommunitiesMutation.isError && (
        <p className="text-center text-xs text-red-500" role="alert">
          {getApiErrorMessage(joinCommunitiesMutation.error)}
        </p>
      )}

      <Button type="button" size="lg" fullWidth disabled={!canContinue} onClick={handleContinue}>
        {t('onboarding.continue')}
      </Button>

      <button
        type="button"
        onClick={handleSkip}
        disabled={!canSubmit}
        className="w-full text-center text-[13px] font-semibold text-mynted-gray hover:cursor-pointer hover:underline disabled:cursor-not-allowed disabled:opacity-60"
      >
        {t('onboarding.skipForNow')}
      </button>
    </div>
  )
}
