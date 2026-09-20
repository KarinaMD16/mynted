import type { ReactNode } from 'react'

/**
 * Portada generada para las comunidades que no subieron una: una composicion
 * abstracta de formas sueltas (manchas, circulos, anillos, garabatos,
 * triangulos, pildoras y puntitos) repartidas sin grilla.
 *
 * Todo sale de `seed` (el id de la comunidad) con un generador pseudoaleatorio,
 * asi cada comunidad tiene "su" portada y es la misma en la lista y en el detalle.
 *
 * Se dibuja en un lienzo ancho (WIDTH x HEIGHT) con `slice`: la portada del
 * detalle muestra una franja horizontal y las tarjetas cuadradas de explorar
 * muestran el centro, y en los dos casos quedan formas a la vista.
 */
interface CommunityPatternProps {
  seed: number
  className?: string
}

const WIDTH = 1200
const HEIGHT = 400

/** [fondo, colores de las formas...]. Tonos de la marca + variaciones. */
const PALETTES = [
  ['#fff1e6', '#fd8552', '#2f5fff', '#fbe36b', '#1c1c1f'],
  ['#e8efff', '#2f5fff', '#0b8fb3', '#fd8552', '#fbe36b'],
  ['#fdeef4', '#e0527d', '#7c5cf0', '#fbe36b', '#1c1c1f'],
  ['#e7f6f0', '#0f9f7a', '#2f5fff', '#fbe36b', '#fd8552'],
  ['#fff5de', '#d9831f', '#d64545', '#2f5fff', '#1c1c1f'],
  ['#f0ecff', '#7c5cf0', '#e0527d', '#0f9f7a', '#fbe36b'],
  ['#f6e6db', '#c2603a', '#2f7f8f', '#e8b84a', '#1c1c1f'],
  ['#e4f6f5', '#0b8fb3', '#fd8552', '#7c5cf0', '#fbe36b'],
] as const

type Rng = () => number

/** mulberry32: generador pseudoaleatorio chico y determinista a partir de una semilla. */
function createRng(seed: number): Rng {
  let state = (seed * 2654435761) >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const between = (rng: Rng, min: number, max: number) => min + rng() * (max - min)
const pick = <T,>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)]

/** Mancha organica: puntos alrededor de un centro con radios distintos, unidos con curvas suaves. */
function blobPath(rng: Rng, cx: number, cy: number, radius: number): string {
  const points = Array.from({ length: 7 }, (_, index) => {
    const angle = (index / 7) * Math.PI * 2
    const r = radius * between(rng, 0.7, 1.15)
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]
  })

  // Curva cuadratica que pasa por los puntos medios: cierra la forma sin esquinas
  const mid = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const start = mid(points[points.length - 1], points[0])
  let path = `M${start[0].toFixed(1)} ${start[1].toFixed(1)}`
  points.forEach((point, index) => {
    const next = mid(point, points[(index + 1) % points.length])
    path += ` Q${point[0].toFixed(1)} ${point[1].toFixed(1)} ${next[0].toFixed(1)} ${next[1].toFixed(1)}`
  })
  return `${path} Z`
}

/** Garabato ondulado. */
function squigglePath(rng: Rng, x: number, y: number, length: number): string {
  const waves = Math.round(between(rng, 3, 5))
  const step = length / waves
  const amplitude = between(rng, 8, 16)
  let path = `M${x.toFixed(1)} ${y.toFixed(1)}`
  for (let i = 0; i < waves; i++) {
    const direction = i % 2 === 0 ? -1 : 1
    path += ` q${(step / 2).toFixed(1)} ${(amplitude * direction).toFixed(1)} ${step.toFixed(1)} 0`
  }
  return path
}

type ShapeBuilder = (rng: Rng, color: string, x: number, y: number, key: number) => ReactNode

/** Formas medianas y chicas que se reparten encima de las manchas grandes, centradas en (x, y). */
const SHAPES: ShapeBuilder[] = [
  // Circulo
  (rng, color, x, y, key) => <circle key={key} cx={x} cy={y} r={between(rng, 14, 36)} fill={color} />,
  // Anillo
  (rng, color, x, y, key) => (
    <circle key={key} cx={x} cy={y} r={between(rng, 18, 40)} fill="none" stroke={color} strokeWidth={between(rng, 6, 11)} />
  ),
  // Garabato
  (rng, color, x, y, key) => {
    const length = between(rng, 100, 170)
    return (
      <path
        key={key}
        d={squigglePath(rng, x - length / 2, y, length)}
        fill="none"
        stroke={color}
        strokeWidth={between(rng, 6, 10)}
        strokeLinecap="round"
        transform={`rotate(${between(rng, -45, 45).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`}
      />
    )
  },
  // Triangulo girado
  (rng, color, x, y, key) => {
    const size = between(rng, 26, 52)
    return (
      <polygon
        key={key}
        points={`${x},${y - size} ${x + size * 0.9},${y + size * 0.6} ${x - size * 0.9},${y + size * 0.6}`}
        fill={color}
        transform={`rotate(${between(rng, 0, 360).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`}
      />
    )
  },
  // Pildora girada
  (rng, color, x, y, key) => {
    const length = between(rng, 70, 120)
    const thickness = between(rng, 18, 26)
    return (
      <rect
        key={key}
        x={x - length / 2}
        y={y - thickness / 2}
        width={length}
        height={thickness}
        rx={thickness / 2}
        fill={color}
        transform={`rotate(${between(rng, 0, 180).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`}
      />
    )
  },
  // Grupito de puntos
  (rng, color, x, y, key) => {
    const gap = between(rng, 14, 20)
    return (
      <g key={key} fill={color}>
        {Array.from({ length: 9 }, (_, index) => (
          <circle key={index} cx={x - gap + (index % 3) * gap} cy={y - gap + Math.floor(index / 3) * gap} r={3.5} />
        ))}
      </g>
    )
  },
]

/**
 * Posiciones "sin orden" pero repartidas: el lienzo se divide en celdas y cada
 * forma cae en un punto al azar dentro de la suya. Con posiciones puramente
 * aleatorias las formas se amontonaban y quedaban huecos grandes.
 */
const COLUMNS = 9
const ROWS = 3

function scatteredPoints(rng: Rng): [number, number][] {
  const cellWidth = WIDTH / COLUMNS
  const cellHeight = HEIGHT / ROWS
  const points: [number, number][] = []

  for (let row = 0; row < ROWS; row++) {
    for (let column = 0; column < COLUMNS; column++) {
      // Algunas celdas quedan vacias para que no se vea parejo
      if (rng() < 0.2) continue
      points.push([
        (column + between(rng, 0.1, 0.9)) * cellWidth,
        (row + between(rng, 0.1, 0.9)) * cellHeight,
      ])
    }
  }
  return points
}

export function CommunityPattern({ seed, className = '' }: CommunityPatternProps) {
  const rng = createRng(seed)
  const [background, ...colors] = pick(rng, PALETTES)

  // Capa de fondo: 3 o 4 manchas grandes, algunas saliendose del borde
  const blobs = Array.from({ length: Math.round(between(rng, 3, 4)) }, (_, index) => (
    <path
      key={`blob-${index}`}
      d={blobPath(rng, between(rng, 0, WIDTH), between(rng, 0, HEIGHT), between(rng, 90, 150))}
      fill={pick(rng, colors)}
      opacity={0.35}
    />
  ))

  // Capa de arriba: una forma al azar en cada punto repartido
  const shapes = scatteredPoints(rng).map(([x, y], index) =>
    pick(rng, SHAPES)(rng, pick(rng, colors), x, y, index),
  )

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      className={`h-full w-full ${className}`}
    >
      <rect width={WIDTH} height={HEIGHT} fill={background} />
      {blobs}
      {shapes}
    </svg>
  )
}
