import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import { cx } from '@/utils/cx'

/**
 * Escala de botones de mynted (grid de 8px, alineada con Material 3,
 * Carbon, Chakra y Primer):
 *
 * | size      | alto | uso                                               |
 * |-----------|------|---------------------------------------------------|
 * | `sm`      | 32px | tablas, filas, acciones inline, "reintentar"      |
 * | `md`      | 40px | default: formularios, diálogos, cabeceras         |
 * | `lg`      | 48px | CTA principal de auth / landing                   |
 * | `icon-sm` | 32px | botón de solo ícono (área táctil 44px en móvil)   |
 * | `icon-md` | 40px | botón de solo ícono                               |
 *
 * El alto se fija con `h-*` (no `py-*`) para que bordes, íconos o el
 * spinner de carga nunca cambien el tamaño del botón.
 */
const buttonVariants = cva(
  [
    'relative inline-flex shrink-0 cursor-pointer items-center justify-center font-semibold transition-colors',
    'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid',
    'disabled:cursor-not-allowed disabled:opacity-60',
    "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        primary: 'bg-mynted-orange text-white shadow-xs hover:bg-mynted-orange-hover',
        secondary: 'border border-mynted-border bg-white text-mynted-ink hover:bg-mynted-bg',
        ghost: 'text-mynted-gray hover:bg-mynted-bg hover:text-mynted-ink',
        accent: 'bg-mynted-blue-mid text-white shadow-xs hover:bg-mynted-blue-mid/90',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        'destructive-secondary': 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
        /** Sobre imágenes (banner, portada). */
        overlay: 'bg-black/60 text-white backdrop-blur-sm hover:bg-black/80',
      },
      size: {
        sm: 'h-8 gap-1.5 rounded-lg px-3 text-sm',
        md: 'h-10 gap-2 rounded-xl px-4 text-sm',
        lg: "h-12 gap-2 rounded-xl px-5 text-base [&_svg:not([class*='size-'])]:size-5",
        'icon-sm': 'size-8 rounded-lg pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5',
        'icon-md': 'size-10 rounded-xl',
      },
      /** `pill` = totalmente redondeado (círculo en los tamaños de ícono). */
      shape: {
        default: '',
        pill: 'rounded-full',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      shape: 'default',
      fullWidth: false,
    },
  },
)

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Muestra un spinner antes del contenido y deshabilita el botón. */
  isLoading?: boolean
  children?: ReactNode
}

/** Botón único de la app. Para botones de solo ícono pasa `aria-label`. */
export function Button({
  variant,
  size,
  shape,
  fullWidth,
  isLoading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cx(buttonVariants({ variant, size, shape, fullWidth }), className)}
      {...props}
    >
      {isLoading && <LoaderCircle className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
