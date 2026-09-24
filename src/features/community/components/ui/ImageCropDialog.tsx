import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLanguage } from '@/i18n/LanguageContext'
import { Button } from '@/components/ui/Button'

export interface CropSource {
  file: File
  /** Object URL del archivo original (lo crea y lo libera quien abre el dialogo). */
  url: string
}

interface ImageCropDialogProps {
  source: CropSource | null
  /**
   * Si se pasa, controla la apertura por separado de `source`: permite seguir
   * mostrando la imagen durante la animación de cierre (ver useLastDefined).
   * Sin él, el diálogo está abierto mientras haya `source`.
   */
  isOpen?: boolean
  /** Ancho / alto del recorte (4 para la portada 1600x400, 1 para la foto). */
  aspect: number
  /** 'round' muestra el marco circular, igual que el avatar de la comunidad. */
  shape: 'rect' | 'round'
  /** Ancho final de la imagen que se sube; el alto sale del aspect. */
  outputWidth: number
  title: string
  onCancel: () => void
  onConfirm: (cropped: File) => void
}

/** Margen oscurecido alrededor del marco, para ver que parte queda afuera. */
const STAGE_PADDING = 28
/** Alto maximo del marco, para que la foto cuadrada no ocupe toda la pantalla. */
const MAX_FRAME_HEIGHT = 250
const MIN_ZOOM = 1
const MAX_ZOOM = 4

type Quality = 'good' | 'ok' | 'low'

/**
 * Recortador simple para la portada y la foto de la comunidad: arrastrar para
 * mover, zoom con el slider o la rueda del mouse, y un aviso de si la imagen
 * alcanza la resolucion recomendada.
 *
 * La imagen siempre cubre el marco (no quedan bordes vacios) y el resultado se
 * exporta ya recortado y reducido a `outputWidth`, asi lo que se ve aca es lo
 * que se sube.
 */
export function ImageCropDialog({ source, isOpen, aspect, shape, outputWidth, title, onCancel, onConfirm }: ImageCropDialogProps) {
  const { t } = useLanguage()
  // Callback ref (y no useRef): el contenido del Dialog de Radix se monta un
  // render despues, asi el observer se engancha recien cuando el nodo existe
  const [stageNode, setStageNode] = useState<HTMLDivElement | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null)

  const [stageWidth, setStageWidth] = useState(0)
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null)
  // Zoom y posicion van juntos en un solo estado: la rueda del mouse dispara
  // muchos eventos seguidos, y con dos estados separados cada evento calculaba
  // con valores viejos y la imagen se iba corriendo hacia una esquina.
  // offset null = centrada; si no, es la esquina de la imagen relativa al marco.
  const [view, setView] = useState<{ zoom: number; offset: { x: number; y: number } | null }>({
    zoom: MIN_ZOOM,
    offset: null,
  })
  const [isExporting, setIsExporting] = useState(false)
  const [loadError, setLoadError] = useState(false)

  // El marco depende del ancho disponible del dialogo
  useEffect(() => {
    if (!stageNode) return
    const observer = new ResizeObserver(([entry]) => setStageWidth(entry.contentRect.width))
    observer.observe(stageNode)
    return () => observer.disconnect()
  }, [stageNode])

  const frameWidth = Math.max(0, Math.min(stageWidth - STAGE_PADDING * 2, MAX_FRAME_HEIGHT * aspect))
  const frameHeight = frameWidth / aspect
  const frameLeft = (stageWidth - frameWidth) / 2

  // Escala para que la imagen cubra el marco con zoom 1
  const baseScale = natural ? Math.max(frameWidth / natural.width, frameHeight / natural.height) : 1

  // En la foto (circulo) el arrastre es libre: cualquier parte de la imagen se
  // puede llevar al centro y se puede alejar hasta que entre completa. Si no,
  // una imagen ancha apenas se movia y lo de los costados nunca entraba al
  // circulo. En la portada la imagen siempre cubre todo el marco.
  const freePan = shape === 'round'
  const minZoom =
    freePan && natural
      ? Math.min(1, Math.min(frameWidth / natural.width, frameHeight / natural.height) / baseScale)
      : MIN_ZOOM

  /** Tamano y posicion (ya limitada para que la imagen cubra el marco) para un zoom/offset dados. */
  const layoutFor = (zoom: number, offset: { x: number; y: number } | null) => {
    const scale = baseScale * zoom
    const width = natural ? natural.width * scale : 0
    const height = natural ? natural.height * scale : 0
    // Libre: el borde de la imagen puede llegar hasta el centro del marco.
    // Cubriendo: la imagen nunca deja huecos dentro del marco.
    const clampX = freePan
      ? (x: number) => Math.min(frameWidth / 2, Math.max(frameWidth / 2 - width, x))
      : (x: number) => Math.min(0, Math.max(frameWidth - width, x))
    const clampY = freePan
      ? (y: number) => Math.min(frameHeight / 2, Math.max(frameHeight / 2 - height, y))
      : (y: number) => Math.min(0, Math.max(frameHeight - height, y))
    return {
      scale,
      width,
      height,
      clampX,
      clampY,
      position: {
        x: clampX(offset?.x ?? (frameWidth - width) / 2),
        y: clampY(offset?.y ?? (frameHeight - height) / 2),
      },
    }
  }

  const { zoom } = view
  const { scale, width: displayWidth, height: displayHeight, position } = layoutFor(view.zoom, view.offset)

  // Parte de la imagen original (en pixeles reales) que queda dentro del marco
  // Hasta que se mide el dialogo el marco mide 0 y los calculos no sirven
  const isReady = natural !== null && frameWidth > 0

  const crop = {
    x: -position.x / scale,
    y: -position.y / scale,
    width: frameWidth / scale,
    height: frameHeight / scale,
  }

  const outputHeight = Math.round(outputWidth / aspect)
  const exportWidth = Math.round(Math.min(outputWidth, crop.width))
  const exportHeight = Math.round(exportWidth / aspect)

  const quality: Quality =
    crop.width >= outputWidth ? 'good' : crop.width >= outputWidth * 0.6 ? 'ok' : 'low'

  const qualityStyles: Record<Quality, string> = {
    good: 'bg-emerald-50 text-emerald-700',
    ok: 'bg-amber-50 text-amber-700',
    low: 'bg-red-50 text-red-600',
  }

  const qualityText: Record<Quality, string> = {
    good: t('communities.crop.qualityGood'),
    ok: t('communities.crop.qualityOk'),
    low: t('communities.crop.qualityLow'),
  }

  /** Cambia el zoom manteniendo fijo el punto que esta en el centro del marco. */
  const applyZoom = (getNextZoom: (currentZoom: number) => number) => {
    // Sin la imagen cargada y el marco medido la posicion saldria (0,0) y
    // quedaria pegada a la esquina aunque despues cargue bien
    if (!isReady) return
    setView((current) => {
      const nextZoom = Math.min(MAX_ZOOM, Math.max(minZoom, getNextZoom(current.zoom)))
      const { position: currentPosition } = layoutFor(current.zoom, current.offset)
      const ratio = nextZoom / current.zoom
      const centerX = frameWidth / 2
      const centerY = frameHeight / 2
      return {
        zoom: nextZoom,
        offset: {
          x: centerX - (centerX - currentPosition.x) * ratio,
          y: centerY - (centerY - currentPosition.y) * ratio,
        },
      }
    })
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isReady) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { pointerX: event.clientX, pointerY: event.clientY, x: position.x, y: position.y }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const deltaX = event.clientX - drag.pointerX
    const deltaY = event.clientY - drag.pointerY
    setView((current) => {
      const { clampX, clampY } = layoutFor(current.zoom, current.offset)
      return { ...current, offset: { x: clampX(drag.x + deltaX), y: clampY(drag.y + deltaY) } }
    })
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleReset = () => {
    setView({ zoom: MIN_ZOOM, offset: null })
  }

  const handleConfirm = () => {
    const imageElement = imageRef.current
    if (!source || !imageElement || !isReady) return

    setIsExporting(true)
    // Con fotos muy grandes el recorte bloquea un momento el navegador: se
    // espera un frame para que primero se pinte el "Aplicando..."
    requestAnimationFrame(() => {
      const canvas = document.createElement('canvas')
      canvas.width = exportWidth
      canvas.height = exportHeight
      const context = canvas.getContext('2d')
      if (!context) {
        setIsExporting(false)
        return
      }

      // PNG conserva transparencias; el resto se exporta como JPEG, que pesa menos
      const type = source.file.type === 'image/png' ? 'image/png' : 'image/jpeg'

      // JPEG no tiene transparencia: lo que quede fuera de la imagen sale blanco
      if (type === 'image/jpeg') {
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, exportWidth, exportHeight)
      }

      const ratio = exportWidth / frameWidth
      context.imageSmoothingQuality = 'high'
      context.drawImage(
        imageElement,
        position.x * ratio,
        position.y * ratio,
        displayWidth * ratio,
        displayHeight * ratio,
      )
      canvas.toBlob(
        (blob) => {
          setIsExporting(false)
          if (!blob) return
          const extension = type === 'image/png' ? 'png' : 'jpg'
          const baseName = source.file.name.replace(/\.[^.]+$/, '')
          onConfirm(new File([blob], `${baseName}-recorte.${extension}`, { type }))
        },
        type,
        0.9,
      )
    })
  }

  return (
    <Dialog
      open={isOpen ?? source !== null}
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription>{t('communities.crop.hint')}</DialogDescription>
        </DialogHeader>

        <div
          ref={setStageNode}
          className="relative mt-4 w-full touch-none overflow-hidden rounded-xl bg-mynted-ink select-none"
          style={{ height: frameHeight + STAGE_PADDING * 2 }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={(event) => {
            const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08
            applyZoom((current) => current * factor)
          }}
        >
          {source && (
            <img
              ref={imageRef}
              src={source.url}
              alt=""
              draggable={false}
              onLoad={(event) => {
                setLoadError(false)
                setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })
              }}
              onError={() => setLoadError(true)}
              className="pointer-events-none absolute max-w-none cursor-grab"
              style={{
                width: displayWidth || undefined,
                height: displayHeight || undefined,
                left: frameLeft + position.x,
                top: STAGE_PADDING + position.y,
                visibility: natural ? 'visible' : 'hidden',
              }}
            />
          )}

          {/* Marco: lo de afuera queda oscurecido con la sombra gigante */}
          <div
            className={`pointer-events-none absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] ${
              shape === 'round' ? 'rounded-full' : 'rounded-lg'
            }`}
            style={{ left: frameLeft, top: STAGE_PADDING, width: frameWidth, height: frameHeight }}
          >
            {/* Guias de tercios */}
            <div className="absolute inset-y-0 left-1/3 w-px bg-white/40" />
            <div className="absolute inset-y-0 left-2/3 w-px bg-white/40" />
            <div className="absolute inset-x-0 top-1/3 h-px bg-white/40" />
            <div className="absolute inset-x-0 top-2/3 h-px bg-white/40" />
          </div>

          {loadError && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-white">
              {t('communities.crop.loadError')}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button
            type="button"
            onClick={() => applyZoom((current) => current / 1.2)}
            aria-label={t('communities.crop.zoomOut')}
            variant="ghost"
            size="icon-sm"
            shape="pill"
          >
            <ZoomOut className="size-4" />
          </Button>
          <input
            type="range"
            min={minZoom}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(event) => {
              const value = Number(event.target.value)
              applyZoom(() => value)
            }}
            aria-label={t('communities.crop.zoom')}
            className="flex-1 accent-mynted-orange"
          />
          <Button
            type="button"
            onClick={() => applyZoom((current) => current * 1.2)}
            aria-label={t('communities.crop.zoomIn')}
            variant="ghost"
            size="icon-sm"
            shape="pill"
          >
            <ZoomIn className="size-4" />
          </Button>
          <Button
            type="button"
            onClick={handleReset}
            variant="ghost"
            size="sm"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            {t('communities.crop.reset')}
          </Button>
        </div>

        {isReady && (
          <div className="mt-4 flex flex-col gap-2 text-xs">
            <p className="text-mynted-gray">
              {t('communities.crop.size', {
                width: Math.round(crop.width),
                height: Math.round(crop.height),
                targetWidth: outputWidth,
                targetHeight: outputHeight,
              })}
            </p>
            <p className={`w-fit rounded-lg px-2.5 py-1.5 font-medium ${qualityStyles[quality]}`}>
              {qualityText[quality]}
              {crop.width > outputWidth && ` · ${t('communities.crop.downscaled', { width: outputWidth, height: outputHeight })}`}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            size="md"
          >
            {t('communities.crop.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!isReady || isExporting}
            variant="primary"
            size="md"
            isLoading={isExporting}
          >
            {isExporting ? t('communities.crop.applying') : t('communities.crop.apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
