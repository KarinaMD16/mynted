import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/cuicui/utils/cn'

/**
 * Dialog base de shadcn/ui (sobre @radix-ui/react-dialog), adaptado a los
 * tokens visuales de mynted (bg-white, mynted-border, mynted-ink, etc. en vez
 * de los tokens semánticos genéricos de shadcn). Radix se encarga de:
 * - Bloquear el scroll del body mientras el diálogo está abierto, compensando
 *   el ancho de la scrollbar (evita el "salto" de layout que pasaba con el
 *   overflow:hidden manual que usábamos antes).
 * - El foco, el cierre con Escape y el cierre al hacer click afuera.
 * - Animaciones de entrada/salida vía data-state + tailwindcss-animate,
 *   esperando a que la animación de salida termine antes de desmontar.
 */
function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          // El overflow-clip + rounded-2xl van acá (en el contenedor exterior, sin
          // scroll propio) para que el scrollbar del div interior quede recortado por
          // las esquinas redondeadas en vez de sobresalir con bordes cuadrados (el div
          // interior de abajo, con overflow-y-auto, es el que realmente scrollea).
          //
          // grid-rows-[minmax(0,1fr)] es lo que hace que ese scroll funcione: sin
          // él, la única fila del grid mide lo que mida el contenido ("auto"), el
          // div interior crece igual de alto y no scrollea, y lo que no entra en
          // max-h queda recortado. Con la fila limitada al alto disponible, el div
          // interior se ajusta a ese alto y el resto se recorre con scroll.
          // 85dvh (y no vh) para que en mobile no quede tapado por la barra del navegador.
          //
          // overflow-clip (y no overflow-hidden): un contenedor con overflow-hidden
          // igual se puede desplazar por código. Cuando el navegador devolvía el
          // foco a un <input type="file"> oculto (al cerrar el explorador de
          // archivos), lo "llevaba a la vista" desplazando este contenedor, que
          // el usuario ya no podía volver a subir. Con clip no hay scroll posible
          // acá; solo scrollea el div interior (que además es `relative`, para que
          // los elementos absolutos del contenido queden dentro de él).
          //
          // La animación de salida (fade + zoom) la corre Radix antes de
          // desmontar; para que se vea, el contenido no debe desaparecer al
          // cerrar (no envolverlo en `{isOpen && ...}`: Radix ya lo desmonta al
          // terminar, y al reabrir se monta de cero).
          'fixed top-[50%] left-[50%] z-50 grid max-h-[85dvh] grid-rows-[minmax(0,1fr)] w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-0 overflow-clip rounded-2xl border border-mynted-border bg-white shadow-xl duration-200 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-bottom-2 data-[state=open]:slide-in-from-bottom-2',
          className,
        )}
        {...props}
      >
        <div className="relative min-h-0 overflow-y-auto p-5 sm:p-8">{children}</div>
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-4 right-4 rounded-full bg-white/90 p-1.5 text-mynted-gray outline-none transition-colors hover:cursor-pointer hover:bg-mynted-bg hover:text-mynted-ink"
          >
            <X className="size-5" />
            <span className="sr-only">Cerrar</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="dialog-header" className={cn('flex flex-col pr-8', className)} {...props} />
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('font-heading text-2xl font-semibold text-mynted-ink', className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('mt-1 text-sm text-mynted-gray', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
