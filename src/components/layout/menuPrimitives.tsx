import type { FC } from 'react'

export function MenuItem({
  icon: Icon,
  label,
  tone = 'default',
  onPress,
  disabled = false,
}: {
  icon: FC<{ className?: string }>
  label: string
  tone?: 'default' | 'danger'
  onPress?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors outline-none hover:bg-mynted-bg focus-visible:bg-mynted-bg disabled:cursor-not-allowed disabled:opacity-60 ${
        tone === 'danger' ? 'text-red-600' : 'text-mynted-ink'
      }`}
    >
      <Icon className="size-[18px] shrink-0" aria-hidden="true" />
      {label}
    </button>
  )
}
