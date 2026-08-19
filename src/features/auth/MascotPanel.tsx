import { Suspense, lazy, useEffect, useRef, useState, type RefObject } from 'react'
import type { Application } from '@splinetool/runtime'
import { ErrorBoundary } from '../../components/ui/ErrorBoundary'
import { Loader } from '../../components/ui/Loader'

// Carga diferida: el runtime de Spline es pesado, así que no se incluye
// en el bundle inicial de la app, solo cuando se entra a /login.
const Spline = lazy(() => import('@splinetool/react-spline'))

// Escena servida localmente desde /public/scene.splinecode (self-hosted,
// no depende de que el archivo de Spline siga publicado en la comunidad).
const SPLINE_SCENE_URL = '/scene.splinecode'

/**
 * Log de diagnóstico: objetos de la escena + tamaño real del canvas.
 * Se imprime como un solo string con JSON.stringify para poder
 * seleccionar y copiar el log completo de una, sin tener que
 * desplegar cada objeto a mano en la consola.
 */
function logSceneObjects(app: Application) {
  const objects = app.getAllObjects().map((object) => ({
    name: object.name,
    visible: object.visible,
    position: object.position,
    scale: object.scale,
  }))
  console.log(
    `[Spline] escena cargada — ${objects.length} objeto(s), canvas ${app.canvas.width}x${app.canvas.height}\n` +
      JSON.stringify(objects, null, 2),
  )
}

/** Panel derecho del AuthCard ("Mascot Panel" en el mockup de Figma): escena 3D de Spline. */
export function MascotPanel() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      className="relative hidden h-full flex-1 items-center justify-center self-stretch overflow-hidden bg-mynted-blue sm:flex"
    >
      {/*
        El runtime de Spline descarga un módulo WASM desde un CDN externo
        (unpkg.com) la primera vez que carga. Si eso falla (sin internet,
        firewall, CDN caído), no queremos que se caiga toda la pantalla de
        login: el ErrorBoundary atrapa errores síncronos y `onError` de
        <Spline> atrapa los fallos de carga asíncronos.
      */}
      <ErrorBoundary fallback={<MascotFallback label="No se pudo cargar la escena 3D" />}>
        <Suspense fallback={<MascotFallback label="Cargando mascota…" />}>
          <SplineScene containerRef={containerRef} />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

/** Si la escena no terminó de cargar en este tiempo, se asume que algo falló (sin red, CDN caído, etc.) y se muestra el fallback. */
const LOAD_TIMEOUT_MS = 12_000

function SplineScene({ containerRef }: { containerRef: RefObject<HTMLDivElement | null> }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  // @splinetool/react-spline no expone un callback de error para fallos de
  // carga (WASM/CDN caído, etc.), así que si `onLoad` no dispara a tiempo
  // asumimos error y mostramos el fallback en vez de dejar el spinner para siempre.
  useEffect(() => {
    if (status !== 'loading') return
    const timeoutId = window.setTimeout(() => setStatus('error'), LOAD_TIMEOUT_MS)
    return () => window.clearTimeout(timeoutId)
  }, [status])

  // El "seguimiento del mouse" que trae la escena de Spline solo escucha
  // eventos dentro de su propio <canvas>. Para que la mascota reaccione al
  // cursor en toda la pantalla (no solo cuando el mouse pasa sobre el panel
  // celeste), reenviamos cada movimiento global del mouse como un evento
  // sobre ese canvas.
  useEffect(() => {
    if (status !== 'loaded') return

    const canvas = containerRef.current?.querySelector('canvas')
    if (!canvas) return

    let isForwarding = false

    function handlePointerMove(event: PointerEvent) {
      // Evita el loop infinito: si el evento ya lo generamos nosotros (o
      // viene del propio canvas), no lo reenviamos de nuevo.
      if (isForwarding || event.target === canvas) return

      // Spline calcula la posición del mouse en base al clientX/clientY
      // relativo a su PROPIO canvas (rect.left/top/width/height). Si le
      // pasamos las coordenadas reales del mouse cuando está sobre el
      // formulario, quedan "afuera" de ese rect y Spline las descarta.
      // Solución: reproyectamos la posición del mouse en toda la ventana
      // hacia un punto equivalente DENTRO del rect del canvas, así
      // siempre le llega una coordenada "válida" pero que refleja en qué
      // parte de la pantalla completa está el mouse.
      const rect = canvas!.getBoundingClientRect()
      const ratioX = event.clientX / window.innerWidth
      const ratioY = event.clientY / window.innerHeight
      const projectedX = rect.left + ratioX * rect.width
      const projectedY = rect.top + ratioY * rect.height

      isForwarding = true
      canvas!.dispatchEvent(
        new PointerEvent('pointermove', {
          clientX: projectedX,
          clientY: projectedY,
          // Three.js/Spline suelen ignorar eventos de pointer que no sean
          // "primary" (piensan que es un dedo secundario en pantallas
          // táctiles).
          isPrimary: true,
          pointerId: event.pointerId,
          pointerType: event.pointerType || 'mouse',
          // bubbles: false a propósito. Spline escucha directamente sobre
          // el canvas; si el evento burbujeara volvería a llegar al
          // listener de window de abajo y se generaría un loop infinito.
          bubbles: false,
          cancelable: true,
        }),
      )
      isForwarding = false
    }

    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [status, containerRef])

  if (status === 'error') {
    return <MascotFallback label="No se pudo cargar la escena 3D" />
  }

  return (
    <>
      {status === 'loading' && <MascotFallback label="Cargando mascota…" />}
      <Spline
        scene={SPLINE_SCENE_URL}
        className="h-full w-full"
        style={{ visibility: status === 'loaded' ? 'visible' : 'hidden', position: status === 'loaded' ? 'static' : 'absolute' }}
        onLoad={(app) => {
          // Ayuda para depurar en consola si algún objeto de la escena
          // (ej. el ganso) no aparece: lista lo que Spline realmente cargó,
          // con visibilidad/posición/escala de cada objeto.
          logSceneObjects(app)
          setStatus('loaded')
        }}
      />
    </>
  )
}

function MascotFallback({ label }: { label: string }) {
  return <Loader label={label} size={80} labelClassName="text-white/80" />
}
