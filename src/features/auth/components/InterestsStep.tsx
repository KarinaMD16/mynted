import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/Button'

const INTEREST_OPTIONS = [
  'Pokémon',
  'Funko Pop',
  'Trading Cards',
  'My Little Pony',
  'Anime Figures',
  'Comic Books',
  'Sports Cards',
  'Board Games',
  'Retro Games',
  'Vinyl Records',
  'Action Figures',
  'Keychains',
  'Plushies',
  'Lego Sets',
  'Model Kits',
  'Stamps',
  'Manga',
  'Vintage Dolls',
]

const MIN_INTERESTS = 3

export function InterestsStep() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string[]>([])

  function toggleInterest(interest: string) {
    setSelected((prev) => (prev.includes(interest) ? prev.filter((item) => item !== interest) : [...prev, interest]))
  }

  const canContinue = selected.length >= MIN_INTERESTS

  return (
    <div className="flex w-full flex-col gap-3.5">
      <div>
        <p className="text-sm font-semibold text-mynted-orange">Step 2 of 2</p>
        <h1 className="mt-1 font-heading text-[24px] font-semibold text-mynted-ink">Choose your interests</h1>
        <p className="mt-1.5 text-sm text-mynted-gray">We'll show you communities and products based on what you like.</p>
      </div>

      <div className="flex flex-wrap gap-2 ">
        {INTEREST_OPTIONS.map((interest) => {
          const isSelected = selected.includes(interest)
          return (
            <button
              key={interest}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggleInterest(interest)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:cursor-pointer ${
                isSelected
                  ? 'border-mynted-yellow bg-mynted-yellow text-mynted-ink'
                  : 'border-mynted-border bg-white text-mynted-ink hover:border-mynted-orange'
              }`}
            >
              {interest}
            </button>
          )
        })}
      </div>

      <p className="text-xs text-mynted-gray">
        {selected.length} selected · choose at least {MIN_INTERESTS} to continue
      </p>

      <Button
        type="button"
        className="hover:cursor-pointer"
        disabled={!canContinue}
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
