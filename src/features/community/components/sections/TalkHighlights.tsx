import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/errors/ErrorState'
import { QueryErrorState } from '@/components/errors/QueryErrorState'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'
import { flattenUniquePosts, useHomePosts } from '@/features/community/hooks/useForum'
import { GlobalPostCard } from '@/features/community/components/cards/GlobalPostCard'
import type { FeedPost } from '@/features/community/models/communityDTOs'
import { cx } from '@/utils/cx'

/** Cuantas publicaciones entran en el home antes de mandar a /explore. */
const HIGHLIGHT_LIMIT = 5

/**
 * Carrusel horizontal, de una publicacion por vez (como el feed de Instagram):
 * cada tarjeta ocupa el ancho completo y el anclaje obligatorio hace que
 * siempre quede una alineada, nunca media.
 *
 * `items-start` a proposito: sin eso las tarjetas se estiran todas al alto de
 * la mas alta, y una publicacion que dice "hola" queda como una caja enorme
 * casi vacia. Cada tarjeta mide lo que mide su contenido.
 *
 * `snap-mandatory` necesita que no haya separacion entre tarjetas: el espacio
 * va como padding dentro de cada una, no como `gap`, porque si no el anclaje
 * se corre.
 *
 * La barra se oculta con la utilidad `scrollbar-hide` del proyecto (ver
 * styles/globals.css): index.css le pone `scrollbar-width: thin` a TODO con
 * el selector universal, asi que una clase suelta no alcanzaba. Se avanza con
 * las flechas, con los puntos o deslizando con el dedo.
 */
const CARRUSEL =
  'flex snap-x snap-mandatory items-start overflow-x-auto overflow-y-hidden scrollbar-hide transition-[height] duration-300'
// `snap-always` evita que un deslizon con impulso se salte publicaciones:
// el desplazamiento se detiene si o si en cada tarjeta.
const TARJETA = 'w-full shrink-0 snap-start snap-always'
// La imagen de una publicacion llega hasta max-h-96, que en un adelanto es
// media pantalla. Se recorta solo aca: en el foro se sigue viendo entera.
const TARJETA_POST = `${TARJETA} [&_img]:max-h-56`

/**
 * Lo ultimo de "Talk" en el home (GET /home/posts): con sesion, lo mas reciente
 * de las comunidades a las que pertenece el usuario; sin sesion, o si todavia no
 * esta en ninguna, lo mas reciente de comunidades publicas (meta.source = "public").
 * Es un adelanto: el feed completo "para ti" vive en la pestana Foro de /explore.
 *
 * `sellCta` es la tarjeta de "empeza a vender" que arma el home. Se recibe como
 * prop (en vez de ponerla al lado desde alla) porque los controles del carrusel
 * tienen que quedar pegados debajo de ella: compartiendo caja, su posicion
 * depende solo del alto de esa tarjeta, que no cambia, y una publicacion larga
 * ya no los empuja hacia abajo.
 */
export function TalkHighlights({ sellCta }: { sellCta?: ReactNode }) {
  const { t } = useLanguage()
  const { isLoggedIn } = useCurrentUser()
  const posts = useHomePosts()

  const items = flattenUniquePosts(posts.data?.pages).slice(0, HIGHLIGHT_LIMIT)
  const source = posts.data?.pages[0]?.meta.source

  if (posts.isPending) {
    return (
      <div className={CARRUSEL} aria-busy="true">
        {Array.from({ length: HIGHLIGHT_LIMIT }, (_, index) => (
          <div key={index} className={`${TARJETA} px-0.5`}>
            <div className="h-64 animate-pulse rounded-2xl bg-white" />
          </div>
        ))}
      </div>
    )
  }

  if (posts.isError) {
    return (
      <QueryErrorState
        error={posts.error}
        onRetry={() => void posts.refetch()}
        variant="compact"
        texts={{ error: { description: t('talk.loadError') } }}
      />
    )
  }

  if (items.length === 0) {
    return <ErrorState kind="empty" variant="compact" title={t('talk.empty.title')} description={t('talk.empty.body')} />
  }

  const notice = source === 'public' && (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-mynted-border bg-mynted-white px-4 py-3 text-sm text-mynted-gray">
      {t(isLoggedIn ? 'home.talk.publicNote' : 'home.talk.publicNoteSignedOut')}
      {isLoggedIn ? (
        <Link to="/discover-communities" className="font-semibold text-mynted-blue hover:underline">
          {t('home.talk.joinCommunities')}
        </Link>
      ) : (
        <Link to="/login" search={{ mode: 'register' }} className="font-semibold text-mynted-blue hover:underline">
          {t('home.talk.createAccount')}
        </Link>
      )}
    </p>
  )

  return <PostCarousel posts={items} notice={notice} sellCta={sellCta} />
}

function PostCarousel({
  posts,
  notice,
  sellCta,
}: {
  posts: FeedPost[]
  notice?: ReactNode
  sellCta?: ReactNode
}) {
  const { t } = useLanguage()
  const trackRef = useRef<HTMLUListElement>(null)
  const [active, setActive] = useState(0)
  const [trackHeight, setTrackHeight] = useState<number>()

  /**
   * La pista toma el alto de la publicacion que se esta viendo. Sin esto se
   * queda con el de la mas alta y, al pasar a una que dice tres palabras,
   * queda medio metro de nada debajo.
   *
   * Se vuelve a medir cuando cambia la publicacion y tambien cuando cambia su
   * tamano: las fotos llegan despues y el texto se reacomoda al cambiar el
   * ancho de la ventana.
   */
  useEffect(() => {
    const card = trackRef.current?.children[active]?.firstElementChild
    if (!card) return

    const observer = new ResizeObserver(([entry]) => {
      if (entry) setTrackHeight(entry.target.getBoundingClientRect().height)
    })
    observer.observe(card)
    return () => observer.disconnect()
  }, [active, posts])

  /**
   * En que publicacion estamos. Sale de donde quedo el desplazamiento y no de
   * un estado que llevemos nosotros, asi vale igual si se llego con las
   * flechas, con los puntos, deslizando con el dedo o tabulando hasta un
   * enlace de la tarjeta siguiente.
   */
  function handleScroll() {
    const track = trackRef.current
    if (!track) return
    setActive(Math.round(track.scrollLeft / track.clientWidth))
  }

  /**
   * Mueve exactamente una publicacion, sin pasarse de los extremos.
   *
   * El salto es instantaneo y no `behavior: 'smooth'`: en un contenedor con
   * anclaje obligatorio y alto animado, el desplazamiento suave se cancela
   * solo y la pista se queda donde estaba — las flechas y los puntos no
   * hacian nada. Medido en Chromium: con 'instant' llega, con 'smooth' no se
   * mueve ni un pixel.
   */
  function goTo(index: number) {
    const track = trackRef.current
    if (!track) return
    const target = Math.min(Math.max(index, 0), posts.length - 1)
    track.scrollTo({ left: target * track.clientWidth, behavior: 'instant' })
  }

  const isFirst = active === 0
  const isLast = active === posts.length - 1

  return (
    <div className={cx('grid items-start gap-6', sellCta && 'lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]')}>
      {/*
        min-w-0: sin esto la columna del grid crece hasta el ancho del
        carrusel (los elementos de un grid valen min-width:auto) y la pagina
        entera se desborda a lo ancho en vez de deslizarse solo el carrusel.
      */}
      <div className="flex min-w-0 flex-col gap-4">
        {notice}
        {/*
          Sin StaggerItem a proposito: su animacion se dispara al entrar en la
          pantalla, y las tarjetas corridas a la derecha dentro del carrusel
          no cuentan como visibles, asi que se quedarian invisibles hasta
          moverse.
        */}
        <ul ref={trackRef} onScroll={handleScroll} style={{ height: trackHeight }} className={CARRUSEL}>
          {posts.map((post, index) => (
            <li key={post.id} className={TARJETA_POST}>
              <GlobalPostCard post={post} index={index} />
            </li>
          ))}
        </ul>
      </div>

      {/*
        Los controles comparten caja con la tarjeta de vender, no con el
        carrusel: asi su posicion depende del alto de esa tarjeta, que no
        cambia, y una publicacion larga no los mueve de lugar. En telefono no
        hay dos columnas, y ahi van arriba de la tarjeta (flex-col-reverse)
        para quedar pegados al carrusel.
      */}
      <div className="flex flex-col-reverse gap-3 lg:flex-col">
        {sellCta}

        {posts.length > 1 && (
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="icon-sm"
              shape="pill"
              disabled={isFirst}
              onClick={() => goTo(active - 1)}
              aria-label={t('home.talk.previousPost')}
              className="hidden sm:inline-flex"
            >
              <ChevronLeft aria-hidden="true" />
            </Button>

            {/* Los puntos dicen cuantas hay y en cual estamos; tambien llevan a una. */}
            <div className="flex items-center gap-2">
              {posts.map((post, index) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={t('home.talk.goToPost', { position: index + 1, total: posts.length })}
                  aria-current={index === active}
                  className={cx(
                    'size-2 cursor-pointer rounded-full transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid',
                    index === active ? 'bg-mynted-orange' : 'bg-mynted-border hover:bg-mynted-gray-light',
                  )}
                />
              ))}
            </div>

            <Button
              variant="secondary"
              size="icon-sm"
              shape="pill"
              disabled={isLast}
              onClick={() => goTo(active + 1)}
              aria-label={t('home.talk.nextPost')}
              className="hidden sm:inline-flex"
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
