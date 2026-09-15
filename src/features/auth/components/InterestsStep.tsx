import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/Button'
import { getApiErrorMessage } from '@/api/apiError'
import { useInterestsQuery, useSaveInterestsMutation } from '../hooks/useInterestsMutations'

const MIN_INTERESTS = 3

export function InterestsStep() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<number[]>([])

  const interestsQuery = useInterestsQuery()
  const saveInterestsMutation = useSaveInterestsMutation()

  function toggleInterest(interestId: number) {
    const next = selected.includes(interestId) ? selected.filter((id) => id !== interestId) : [...selected, interestId]

    setSelected(next)

    // El backend exige un mínimo de 3 intereses y reemplaza la selección
    // completa en cada guardado, así que basta con re-enviar el arreglo
    // actualizado apenas se alcanza (o se mantiene por encima de) el mínimo.
    if (next.length >= MIN_INTERESTS) {
      saveInterestsMutation.mutate(next)
    }
  }

  const canContinue = selected.length >= MIN_INTERESTS

  return (
    <div className="flex w-full flex-col gap-3.5">
      <div>
        <p className="text-sm font-semibold text-mynted-orange">Step 2 of 2</p>
        <h1 className="mt-1 font-heading text-[24px] font-semibold text-mynted-ink">Choose your interests</h1>
        <p className="mt-1.5 text-sm text-mynted-gray">We'll show you communities and products based on what you like.</p>
      </div>

      {interestsQuery.isLoading && <p className="text-sm text-mynted-gray">Loading interests…</p>}

      {interestsQuery.isError && (
        <p className="text-center text-xs text-red-500" role="alert">
          {getApiErrorMessage(interestsQuery.error, "Couldn't load interests. Please try again.")}
        </p>
      )}

      {interestsQuery.data && (
        <div className="scrollbar-thin scrollbar-thumb-mynted-orange scrollbar-track-transparent -mr-1 flex max-h-[220px] flex-wrap content-start gap-2 overflow-y-auto pr-1">
          {interestsQuery.data.map((interest) => {
            const isSelected = selected.includes(interest.id)
            return (
              <button
                key={interest.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleInterest(interest.id)}
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
        {selected.length} selected · choose at least {MIN_INTERESTS} to continue
        {saveInterestsMutation.isPending && ' · Saving…'}
      </p>

      {saveInterestsMutation.isError && (
        <p className="text-center text-xs text-red-500" role="alert">
          {getApiErrorMessage(saveInterestsMutation.error)}
        </p>
      )}

      <Button
        type="button"
        className="hover:cursor-pointer"
        disabled={!canContinue || saveInterestsMutation.isPending}
        onClick={() => void navigate({ to: '/' })}
      >
        Continue
      </Button>

      <button
        type="button"
        onClick={() => void navigate({ to: '/' })}
        className="w-full text-center text-[13px] font-semibold text-mynted-gray hover:cursor-pointer hover:underline"
      >
        Skip for now
      </button>
    </div>
  )
}
