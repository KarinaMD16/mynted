import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'facebook' | 'google'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
}

const baseClasses =
  'inline-flex w-full items-center justify-center gap-2 rounded-[10px] py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-mynted-orange text-white shadow-[0_4px_10px_-2px_rgba(47,95,255,0.25)] hover:bg-mynted-orange-hover',
  facebook: 'border border-mynted-blue-dark bg-mynted-blue-mid text-white hover:brightness-105',
  google: 'border border-mynted-border bg-white text-mynted-ink hover:bg-mynted-bg',
}

/** Botón reutilizable de la app. `variant="primary"` es el naranja de marca. */
export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
