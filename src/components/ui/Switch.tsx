import { Switch as AriaSwitch, type SwitchProps as AriaSwitchProps } from 'react-aria-components'
import { cx } from '@/utils/cx'

interface SwitchProps extends Omit<AriaSwitchProps, 'children' | 'className'> {
  /** Texto visible del interruptor. */
  label: string
  /** Texto de apoyo debajo del label. */
  description?: string
  className?: string
}

/**
 * Interruptor on/off con los colores de mynted. Es un wrapper de
 * react-aria (teclado, foco y lectores de pantalla ya resueltos). El Toggle
 * de components/base usa los colores de Untitled UI, por eso este aparte.
 */
export function Switch({ label, description, className, ...props }: SwitchProps) {
  return (
    <AriaSwitch
      {...props}
      className={cx(
        'group flex w-full cursor-pointer items-start justify-between gap-4 outline-none disabled:cursor-not-allowed',
        className,
      )}
    >
      {({ isSelected, isFocusVisible, isDisabled }) => (
        <>
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-mynted-ink">{label}</span>
            {description && <span className="text-sm text-mynted-gray">{description}</span>}
          </span>

          <span
            aria-hidden="true"
            className={cx(
              'mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-150',
              isSelected ? 'bg-mynted-orange' : 'bg-mynted-border',
              isFocusVisible && 'outline-2 outline-offset-2 outline-mynted-blue-mid',
              isDisabled && 'opacity-50',
            )}
          >
            <span
              className={cx(
                'size-5 rounded-full bg-white shadow-sm transition-transform duration-150',
                isSelected && 'translate-x-5',
              )}
            />
          </span>
        </>
      )}
    </AriaSwitch>
  )
}
