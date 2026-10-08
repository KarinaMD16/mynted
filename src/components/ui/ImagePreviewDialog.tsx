import { useRef, useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from './dialog'

interface ImagePreviewDialogProps {
  /** URL de la imagen a mostrar; si es null el diálogo no abre. */
  src: string | null
  alt: string
  title: string
  isOpen: boolean
  onClose: () => void
}

export function ImagePreviewDialog({ src, alt, title, isOpen, onClose }: ImagePreviewDialogProps) {
  const { t } = useLanguage()

  if (!src) return null

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogPortal>
        <DialogOverlay className="bg-black/80" />
        <DialogPrimitive.Content
          className="fixed top-[50%] left-[50%] z-50 w-[calc(100%-2rem)] max-w-4xl translate-x-[-50%] translate-y-[-50%] outline-none duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>

          <ZoomableImage src={src} alt={alt} />

          <DialogPrimitive.Close
            aria-label={t('imagePreview.close')}
            className="absolute -top-2 right-0 rounded-full bg-black/60 p-2 text-white outline-none transition-colors hover:cursor-pointer hover:bg-black/80 sm:-top-12"
          >
            <X className="size-5" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}

const MIN_ZOOM = 1
const MAX_ZOOM = 4
const ZOOM_STEP = 0.5

/**
 * Imagen con botones de zoom (+, −, restablecer). Con zoom > 100% la imagen se
 * agranda dentro de un contenedor con scroll, así se recorre arrastrando o
 * con la rueda. Vive dentro del contenido del diálogo: al cerrarlo se
 * desmonta y el zoom vuelve a 100% la próxima vez que se abra.
 */
function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const { t } = useLanguage()
  const [zoom, setZoom] = useState(MIN_ZOOM)
  const isZoomed = zoom > MIN_ZOOM
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Arrastrar para recorrer la imagen ampliada (mouse/lápiz; en táctil ya funciona el scroll nativo).
  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const el = containerRef.current
    if (!isZoomed || !el || event.pointerType === 'touch') return
    dragRef.current = { x: event.clientX, y: event.clientY, left: el.scrollLeft, top: el.scrollTop }
    el.setPointerCapture(event.pointerId)
    setIsDragging(true)
  }
  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const el = containerRef.current
    const start = dragRef.current
    if (!el || !start) return
    el.scrollLeft = start.left - (event.clientX - start.x)
    el.scrollTop = start.top - (event.clientY - start.y)
  }
  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return
    dragRef.current = null
    containerRef.current?.releasePointerCapture(event.pointerId)
    setIsDragging(false)
  }

  const controlClass =
    'flex size-9 cursor-pointer items-center justify-center rounded-full text-white outline-none transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent'

  return (
    <div className="relative">
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={`max-h-[85vh] overflow-auto rounded-xl ${isZoomed ? (isDragging ? 'cursor-grabbing select-none' : 'cursor-grab') : ''}`}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={isZoomed ? { width: `${zoom * 100}%`, maxWidth: 'none', maxHeight: 'none' } : undefined}
          className={`mx-auto block rounded-xl object-contain transition-[width] duration-200 ${
            isZoomed ? '' : 'max-h-[85vh] w-auto max-w-full'
          }`}
        />
      </div>

      <div
        role="group"
        aria-label={t('imagePreview.zoomGroup')}
        className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-black/65 p-1 backdrop-blur-sm"
      >
        <button
          type="button"
          onClick={() => setZoom((current) => Math.max(MIN_ZOOM, current - ZOOM_STEP))}
          disabled={zoom <= MIN_ZOOM}
          aria-label={t('imagePreview.zoomOut')}
          className={controlClass}
        >
          <ZoomOut className="size-4.5" aria-hidden="true" />
        </button>
        <span className="min-w-12 text-center text-xs font-semibold text-white tabular-nums" aria-live="polite">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setZoom((current) => Math.min(MAX_ZOOM, current + ZOOM_STEP))}
          disabled={zoom >= MAX_ZOOM}
          aria-label={t('imagePreview.zoomIn')}
          className={controlClass}
        >
          <ZoomIn className="size-4.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setZoom(MIN_ZOOM)}
          disabled={!isZoomed}
          aria-label={t('imagePreview.zoomReset')}
          className={controlClass}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
