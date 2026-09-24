import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/Button'
import { getApiErrorMessage } from '@/api/apiError'
import { useLanguage } from '@/i18n/LanguageContext'
import { buildLocaleTag, detectCurrency, detectLocale } from '@/utils/locale'
import { CURRENT_PRIVACY_POLICY_VERSION, PRIVACY_POLICY_PATH } from '../legal/privacyPolicy'
import { useInterestsQuery, useSaveInterestsMutation } from '../hooks/useInterestsMutations'
import type { SaveInterestsPayload } from '../services/interestsServices'

const MIN_INTERESTS = 3

interface InterestsStepProps {
  /** Si viene, se llama al terminar este paso en vez de navegar a "/" (ver AuthCard: encadena con el paso de comunidades). */
  onContinue?: () => void
}

export function InterestsStep({ onContinue }: InterestsStepProps) {
  const navigate = useNavigate()
  const { t, language, isManuallySet } = useLanguage()
  const [selected, setSelected] = useState<number[]>([])
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)

  const interestsQuery = useInterestsQuery()
  const saveInterestsMutation = useSaveInterestsMutation()

  const goNext = () => {
    if (onContinue) {
      onContinue()
      return
    }
    void navigate({ to: '/' })
  }

  function toggleInterest(tagId: number) {
    setSelected((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  function buildPayload(tagIds: number[]): SaveInterestsPayload {
    return {
      tagIds,
      privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
      // Si la persona eligió el idioma a mano (ver LanguageSwitcher), esa
      // elección manda sobre lo que reporte el navegador: mantenemos la
      // región de su locale (de ahí sale la moneda) pero con el idioma que
      // realmente está usando, para que quede guardado igual de acertado
      // que la política de privacidad que acaba de aceptar en ese idioma.
      locale: isManuallySet ? buildLocaleTag(language) : detectLocale(),
      currency: detectCurrency(),
    }
  }

  function handleContinue() {
    saveInterestsMutation.mutate(buildPayload(selected), { onSuccess: goNext })
  }

  function handleSkip() {
    // "Omitir" también manda la llamada (con tagIds vacío) en vez de solo
    // navegar: es la única forma de dejar registrada la aceptación de la
    // política de privacidad (y el locale/moneda detectados) para cualquier
    // usuario, elija o no intereses. Ver SaveUserTagsDto en el backend.
    saveInterestsMutation.mutate(buildPayload([]), { onSuccess: goNext })
  }

  const canSubmit = acceptedPrivacy && !saveInterestsMutation.isPending
  const canContinue = canSubmit && selected.length >= MIN_INTERESTS

  return (
    <div className="flex w-full flex-col gap-3.5">
      <div>
        <p className="text-sm font-semibold text-mynted-orange">{t('onboarding.stepInterests')}</p>
        <h1 className="mt-1 font-heading text-[24px] font-semibold text-mynted-ink">{t('onboarding.interestsTitle')}</h1>
        <p className="mt-1.5 text-sm text-mynted-gray">{t('onboarding.interestsSubtitle')}</p>
      </div>

      {interestsQuery.isLoading && <p className="text-sm text-mynted-gray">{t('onboarding.loadingInterests')}</p>}

      {interestsQuery.isError && (
        <p className="text-center text-xs text-red-500" role="alert">
          {getApiErrorMessage(interestsQuery.error, t('onboarding.loadInterestsError'))}
        </p>
      )}

      {interestsQuery.data && (
        <div className="scrollbar-thin scrollbar-thumb-mynted-orange scrollbar-track-transparent -mr-1 flex max-h-[220px] flex-wrap content-start gap-2 overflow-y-auto pr-1">
          {interestsQuery.data.map((interest) => {
            const isSelected = selected.includes(interest.tagId)
            return (
              <button
                key={interest.tagId}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleInterest(interest.tagId)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:cursor-pointer ${
                  isSelected
                    ? 'border-mynted-yellow bg-mynted-yellow text-mynted-ink'
                    : 'border-mynted-border bg-white text-mynted-ink hover:border-mynted-orange'
                }`}
              >
                {interest.name}
              </button>
            )
          })}
        </div>
      )}

      <p className="text-xs text-mynted-gray">
        {t('onboarding.selectedCount', { count: selected.length, min: MIN_INTERESTS })}
      </p>

      <label className="flex items-start gap-2 text-xs text-mynted-gray">
        <input
          type="checkbox"
          checked={acceptedPrivacy}
          onChange={(event) => setAcceptedPrivacy(event.target.checked)}
          className="mt-0.5 hover:cursor-pointer"
        />
        <span>
          {t('onboarding.acceptPrivacyPrefix')}{' '}
          <Link to={PRIVACY_POLICY_PATH} target="_blank" className="font-semibold text-mynted-orange hover:underline">
            {t('onboarding.privacyPolicyLinkText')}
          </Link>
        </span>
      </label>

      {saveInterestsMutation.isPending && <p className="text-xs text-mynted-gray">{t('onboarding.saving')}</p>}

      {saveInterestsMutation.isError && (
        <p className="text-center text-xs text-red-500" role="alert">
          {getApiErrorMessage(saveInterestsMutation.error)}
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
