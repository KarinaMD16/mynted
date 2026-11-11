/**
 * Aviso sonoro de las notificaciones.
 *
 * El sonido se sintetiza con la Web Audio API en vez de reproducir un archivo:
 * son dos notas cortas, no hay que sumar un binario al repo ni depender de una
 * licencia, y no se descarga nada.
 *
 * La preferencia vive en este navegador y no en el perfil: el volumen es algo
 * del dispositivo. Uno quiere que suene en su portátil y no en la máquina
 * compartida del laboratorio, aunque sea la misma cuenta.
 */

const STORAGE_KEY = 'mynted_notification_sound'

/** Las dos notas del aviso (La5 y Re6) y cuánto dura cada una. */
const NOTES = [
  { frequency: 880, startsAt: 0 },
  { frequency: 1174.7, startsAt: 0.09 },
]
const NOTE_SECONDS = 0.16
/** Bajo a propósito: tiene que avisar, no pegar un susto. */
const PEAK_GAIN = 0.09

/** Está activado salvo que se haya apagado antes. */
export function isNotificationSoundOn(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    // Sin localStorage (modo privado, permisos): se asume activado.
    return true
  }
}

export function setNotificationSoundOn(isOn: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, isOn ? 'on' : 'off')
  } catch {
    // Sin localStorage la preferencia dura lo que la pestaña, y ya.
  }
}

let context: AudioContext | null = null
let isUnlockArmed = false

/**
 * El navegador crea el contexto en estado "suspended" hasta que la persona
 * interactúa con la página (política de autoplay). Si una notificación llega
 * antes del primer clic no hay forma de sonar, así que se deja armado un
 * listener que lo despierta en cuanto haya una interacción.
 */
function armUnlock(ctx: AudioContext): void {
  if (isUnlockArmed) return
  isUnlockArmed = true
  const unlock = () => {
    void ctx.resume().catch(() => undefined)
  }
  window.addEventListener('pointerdown', unlock, { once: true })
  window.addEventListener('keydown', unlock, { once: true })
}

function getContext(): AudioContext | null {
  if (context) return context
  if (typeof AudioContext === 'undefined') return null
  try {
    context = new AudioContext()
  } catch {
    return null
  }
  armUnlock(context)
  return context
}

/**
 * Suena el aviso. No hace nada si está apagado, si el navegador no tiene Web
 * Audio o si el contexto todavía está bloqueado por la política de autoplay:
 * en ninguno de esos casos tiene sentido molestar con un error.
 */
export function playNotificationSound(): void {
  if (!isNotificationSoundOn()) return

  const ctx = getContext()
  if (!ctx) return

  if (ctx.state === 'suspended') {
    // Puede resolverse a tiempo o no; si no, esta notificación pasa en silencio
    // y la siguiente ya suena.
    void ctx.resume().catch(() => undefined)
    if (ctx.state === 'suspended') return
  }

  const startedAt = ctx.currentTime
  for (const { frequency, startsAt } of NOTES) {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency

    // Ataque muy corto y caída exponencial: suena a campanita y no a pitido.
    const noteStart = startedAt + startsAt
    gain.gain.setValueAtTime(0.0001, noteStart)
    gain.gain.exponentialRampToValueAtTime(PEAK_GAIN, noteStart + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + NOTE_SECONDS)

    oscillator.connect(gain).connect(ctx.destination)
    oscillator.start(noteStart)
    oscillator.stop(noteStart + NOTE_SECONDS)
  }
}
