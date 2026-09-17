import type { ReactNode } from 'react'
import type { AppLanguage } from '@/utils/locale'

interface PolicySection {
  heading: string
  body: ReactNode
}

interface PolicyContent {
  title: string
  sections: PolicySection[]
}

/**
 * Contenido completo de la Política de Cookies en cada idioma soportado.
 * Mismo criterio que privacyPolicyContent.tsx: texto completo escrito a
 * mano por idioma, no un mosaico armado con el diccionario genérico de
 * src/i18n — y ahora incluye la cookie de idioma (mynted_language) junto a
 * las que ya existían.
 */
export const cookiesPolicyContent: Record<AppLanguage, PolicyContent> = {
  es: {
    title: 'Política de Cookies de Mynted',
    sections: [
      {
        heading: '1. Qué son las cookies',
        body: (
          <p>
            Son archivos pequeños que tu navegador guarda cuando visitás un sitio, para recordar información
            entre una visita y otra (por ejemplo, que ya iniciaste sesión, que ya elegiste una respuesta en un
            aviso como este, o en qué idioma preferís ver la app).
          </p>
        ),
      },
      {
        heading: '2. Qué cookies usamos hoy',
        body: (
          <ul>
            <li>
              <strong>Necesarias (siempre activas):</strong>
              <ul>
                <li>
                  <code>access_token</code> y <code>refresh_token</code>: mantienen tu sesión iniciada. Son
                  httpOnly (tu navegador las envía al backend, pero ningún script del sitio puede leerlas).
                </li>
                <li>
                  <code>mynted_cookie_consent</code>: guarda la elección que hiciste en este aviso, para no
                  mostrártelo de nuevo en cada visita.
                </li>
                <li>
                  <code>mynted_language</code>: guarda el idioma que elegiste a mano con el selector ES/EN del
                  header. Si nunca lo tocás, no se crea esta cookie y la app sigue detectando el idioma
                  automáticamente en cada visita a partir de tu navegador y tu ubicación aproximada.
                </li>
              </ul>
            </li>
            <li>
              <strong>Marketing/analítica:</strong> por ahora no usamos ninguna. El interruptor de "Marketing"
              en el aviso de cookies queda preparado para cuando agreguemos analítica (por ejemplo, para
              entender qué comunidades o productos generan más interés), pero activarlo hoy no habilita ningún
              rastreo todavía.
            </li>
          </ul>
        ),
      },
      {
        heading: '3. Cómo cambiar tu elección',
        body: (
          <p>
            Si borrás la cookie <code>mynted_cookie_consent</code> desde la configuración de tu navegador, el
            aviso va a volver a aparecer la próxima vez que entrés a Mynted. De la misma forma, borrar{' '}
            <code>mynted_language</code> hace que la app vuelva a detectar tu idioma automáticamente en la
            siguiente visita, en vez de recordar tu elección manual.
          </p>
        ),
      },
      {
        heading: '4. Contacto',
        body: (
          <p>
            Para consultas sobre esta política, escribinos a{' '}
            <a href="mailto:myntedstate@gmail.com">myntedstate@gmail.com</a>. También podés revisar nuestra{' '}
            <a href="/legal/privacidad">Política de Privacidad</a>.
          </p>
        ),
      },
    ],
  },
  en: {
    title: 'Mynted Cookies Policy',
    sections: [
      {
        heading: '1. What cookies are',
        body: (
          <p>
            Cookies are small files your browser stores when you visit a site, so it can remember information
            between visits — for example, that you're already signed in, that you already made a choice on a
            notice like this one, or which language you prefer to see the app in.
          </p>
        ),
      },
      {
        heading: '2. Which cookies we use today',
        body: (
          <ul>
            <li>
              <strong>Necessary (always on):</strong>
              <ul>
                <li>
                  <code>access_token</code> and <code>refresh_token</code>: keep you signed in. They are
                  httpOnly (your browser sends them to the backend, but no script on the site can read them).
                </li>
                <li>
                  <code>mynted_cookie_consent</code>: stores the choice you made on this notice, so we don't
                  show it to you again on every visit.
                </li>
                <li>
                  <code>mynted_language</code>: stores the language you picked by hand with the ES/EN switcher
                  in the header. If you never touch it, this cookie is never created, and the app keeps
                  auto-detecting your language on every visit from your browser and approximate location.
                </li>
              </ul>
            </li>
            <li>
              <strong>Marketing/analytics:</strong> we don't use any right now. The "Marketing" toggle on the
              cookie notice is there for when we add analytics later (for example, to understand which
              communities or products generate the most interest), but turning it on today doesn't enable any
              tracking yet.
            </li>
          </ul>
        ),
      },
      {
        heading: '3. How to change your choice',
        body: (
          <p>
            If you delete the <code>mynted_cookie_consent</code> cookie from your browser settings, the notice
            will show up again the next time you visit Mynted. The same goes for <code>mynted_language</code>:
            deleting it makes the app auto-detect your language again on your next visit, instead of remembering
            your manual choice.
          </p>
        ),
      },
      {
        heading: '4. Contact',
        body: (
          <p>
            For questions about this policy, write to us at{' '}
            <a href="mailto:myntedstate@gmail.com">myntedstate@gmail.com</a>. You can also check our{' '}
            <a href="/legal/privacidad">Privacy Policy</a>.
          </p>
        ),
      },
    ],
  },
}
