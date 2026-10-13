import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import { ImagePreviewDialog } from '@/components/ui/ImagePreviewDialog'
import { useLanguage } from '@/i18n/LanguageContext'

const HIDE_SCROLLBAR = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

/**
 * Galería del detalle de producto: imagen principal en carrusel (se cambia
 * deslizando/haciendo scroll horizontal, con las flechas < > —que solo salen al
 * pasar el mouse por encima— o con las flechas del teclado), tira de
 * miniaturas con scroll (la rueda del mouse la desplaza de lado) y vista
 * extendida al hacer clic en la imagen.
 */
export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const { t } = useLanguage()
  const [selected, setSelected] = useState(0)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const trackRef = useRef<HTMLDivElement>(null)
  const thumbsRef = useRef<HTMLUListElement>(null)
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([])
  // Índice al que estamos yendo con scroll programático: mientras llega, se
  // ignoran los índices intermedios para que la miniatura activa no parpadee.
  const pendingRef = useRef<number | null>(null)

  const count = images.length

  const goTo = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(count - 1, index))
      const track = trackRef.current
      if (!track) return
      pendingRef.current = next
      setSelected(next)
      track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' })
    },
    [count],
  )

  function handleScroll() {
    const track = trackRef.current
    if (!track || track.clientWidth === 0) return
    const index = Math.round(track.scrollLeft / track.clientWidth)
    if (pendingRef.current !== null) {
      if (index === pendingRef.current) pendingRef.current = null
      return
    }
    setSelected(index)
  }

  // La miniatura activa siempre queda a la vista dentro de su tira.
  useEffect(() => {
    thumbRefs.current[selected]?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' })
  }, [selected])

  // Rueda del mouse sobre las miniaturas => scroll horizontal. Listener no
  // pasivo (React registra onWheel como pasivo y no deja hacer preventDefault).
  useEffect(() => {
    const strip = thumbsRef.current
    if (!strip) return
    function onWheel(event: WheelEvent) {
      if (!strip || strip.scrollWidth <= strip.clientWidth || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      event.preventDefault()
      strip.scrollLeft += event.deltaY
    }
    strip.addEventListener('wheel', onWheel, { passive: false })
    return () => strip.removeEventListener('wheel', onWheel)
  }, [count])

  const arrowClass =
    'absolute top-1/2 z-10 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-mynted-ink shadow-md outline-none transition-opacity duration-200 hover:bg-white focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-mynted-blue opacity-0 group-hover:opacity-100'

  return (
    <div className="flex w-full shrink-0 flex-col gap-3 lg:w-[460px]">
      <div
        className="group relative h-[340px] overflow-hidden rounded-[18px] border border-mynted-border bg-white shadow-[0_6px_20px_-4px_rgba(13,13,20,0.08)] sm:h-[440px]"
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') goTo(selected - 1)
          if (event.key === 'ArrowRight') goTo(selected + 1)
        }}
      >
        <div ref={trackRef} onScroll={handleScroll} className={`flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain ${HIDE_SCROLLBAR}`}>
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              aria-label={t('itemDetail.expandImage')}
              className="relative size-full shrink-0 cursor-zoom-in snap-center outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-mynted-blue"
            >
              <img src={url} alt={index === 0 ? title : `${title} ${index + 1}`} draggable={false} className="size-full object-cover" />
            </button>
          ))}
        </div>

        <span className="pointer-events-none absolute right-3 bottom-3 flex size-9 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <Maximize2 className="size-4" aria-hidden="true" />
        </span>

        {count > 1 && selected > 0 && (
          <button type="button" onClick={() => goTo(selected - 1)} aria-label={t('itemDetail.prevImage')} className={`${arrowClass} left-3`}>
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
        )}
        {count > 1 && selected < count - 1 && (
          <button type="button" onClick={() => goTo(selected + 1)} aria-label={t('itemDetail.nextImage')} className={`${arrowClass} right-3`}>
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {count > 1 && (
        <ul ref={thumbsRef} className={`flex gap-2 overflow-x-auto overscroll-x-contain ${HIDE_SCROLLBAR}`}>
          {images.map((url, index) => (
            <li key={`${url}-${index}`} className="shrink-0">
              <button
                ref={(node) => {
                  thumbRefs.current[index] = node
                }}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`${title} ${index + 1}`}
                aria-pressed={selected === index}
                className={`size-16 cursor-pointer overflow-hidden rounded-[10px] border-2 transition-colors ${selected === index ? 'border-mynted-orange' : 'border-mynted-border hover:border-mynted-gray-light'}`}
              >
                <img src={url} alt="" draggable={false} className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ImagePreviewDialog
        src={images[selected] ?? null}
        alt={title}
        title={title}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  )
}
