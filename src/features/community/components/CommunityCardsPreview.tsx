import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useLanguage } from '@/i18n/LanguageContext'
import type { CommunityListItem } from '../models/communityDTOs'
import { EXPLORE_DOT_COLORS, EXPLORE_LIMIT, hintClasses, labelClasses } from '../types/DEFAULT_VALUES'
import { ExploreCommunityCard } from './ExploreCommunityCard'
import { MyCommunityCard } from './MyCommunityCard'

/**
 * Ancho real del contenido de /communities en una pantalla de escritorio
 * (1280px menos el padding horizontal de la pagina). La vista previa se arma
 * con este ancho y despues se achica, asi las proporciones son las reales.
 */
const REAL_PAGE_WIDTH = 1168

/**
 * Vista previa del formulario de crear comunidad: la comunidad que se esta
 * armando dibujada con las mismas tarjetas de /communities, para ver como
 * va a quedar antes de crearla.
 *
 * Son las tarjetas reales (no una copia), asi que si cambian alla cambian aca.
 * Van dentro de un contenedor `inert` porque son links y en la vista previa no
 * tienen que navegar ni recibir foco.
 */
export function CommunityCardsPreview({ community }: { community: CommunityListItem }) {
  const { t } = useLanguage()

  return (
    <section className="flex flex-col gap-1.5">
      <span className={labelClasses}>{t('communities.create.previewLabel')}</span>
      <p className={hintClasses}>{t('communities.create.previewHint')}</p>

      <div inert className="mt-2 flex flex-col gap-5 rounded-xl bg-mynted-bg p-4 select-none">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-mynted-gray">{t('communities.create.previewMine')}</span>
          <ScaledToFit realWidth={REAL_PAGE_WIDTH}>
            {/* Mismo bento que en "Mis comunidades": grande en azul, chico en amarillo y el lugar de otra */}
            <div className="grid grid-cols-2 grid-rows-2 gap-4">
              <div className="row-span-2">
                <MyCommunityCard community={community} featured variant="blue" />
              </div>
              <MyCommunityCard community={community} variant="yellow" />
              <div aria-hidden="true" className="min-h-40 rounded-2xl border-2 border-dashed border-mynted-border" />
            </div>
          </ScaledToFit>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-mynted-gray">{t('communities.create.previewExplore')}</span>
          <ScaledToFit realWidth={REAL_PAGE_WIDTH}>
            {/* Misma fila que "Explorar": la tarjeta nueva y el lugar de las demas */}
            <div className="grid grid-cols-6 gap-3">
              <ExploreCommunityCard community={community} dotClassName={EXPLORE_DOT_COLORS[0]} />
              {Array.from({ length: EXPLORE_LIMIT - 1 }, (_, index) => (
                <div key={index} aria-hidden="true" className="rounded-xl border-2 border-dashed border-mynted-border" />
              ))}
            </div>
          </ScaledToFit>
        </div>
      </div>
    </section>
  )
}

/**
 * Dibuja el contenido con `realWidth` y lo escala para que entre en el ancho
 * disponible. El alto del contenedor se ajusta al alto ya escalado, porque
 * `transform` no cambia el espacio que ocupa el elemento en el layout.
 */
function ScaledToFit({ realWidth, children }: { realWidth: number; children: ReactNode }) {
  // Callback refs: el formulario vive dentro de un Dialog que monta su contenido un render despues
  const [outer, setOuter] = useState<HTMLDivElement | null>(null)
  const [inner, setInner] = useState<HTMLDivElement | null>(null)
  const [availableWidth, setAvailableWidth] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    if (!outer) return
    const observer = new ResizeObserver(([entry]) => setAvailableWidth(entry.contentRect.width))
    observer.observe(outer)
    return () => observer.disconnect()
  }, [outer])

  // contentRect ignora el transform, asi que este es el alto real sin escalar
  useEffect(() => {
    if (!inner) return
    const observer = new ResizeObserver(([entry]) => setContentHeight(entry.contentRect.height))
    observer.observe(inner)
    return () => observer.disconnect()
  }, [inner])

  const scale = availableWidth > 0 ? Math.min(1, availableWidth / realWidth) : 0

  return (
    <div ref={setOuter} className="relative w-full overflow-hidden" style={{ height: contentHeight * scale }}>
      <div
        ref={setInner}
        className="absolute top-0 left-0 origin-top-left"
        style={{ width: realWidth, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  )
}
