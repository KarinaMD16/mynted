import type { ReactNode } from 'react'
import type { AppLanguage } from '@/utils/locale'

interface PolicySection {
  heading: string
  body: ReactNode
}

interface PolicyContent {
  title: string
  versionLabel: string
  sections: PolicySection[]
}

/**
 * Contenido completo de la Política de Privacidad en cada idioma soportado.
 *
 * A propósito NO es una traducción palabra-por-palabra armada con el
 * diccionario genérico de src/i18n (ver TranslationKey): un documento legal
 * necesita que cada versión se lea natural y completa en su propio idioma,
 * no un mosaico de frases sueltas traducidas una por una. Por eso cada
 * idioma tiene acá su propio texto, escrito completo, y ambos se mantienen
 * en paralelo a mano — si cambia una sección, hay que revisar/actualizar la
 * misma sección en el otro idioma en el mismo commit.
 *
 * El contenido en español es el original (ver historial); el de inglés es
 * una adaptación fiel pensada para leerse igual de natural, no una
 * traducción automática — pero, igual que el español, sigue siendo un
 * borrador de trabajo para un proyecto académico y no reemplaza una revisión
 * legal real antes de cualquier lanzamiento fuera de ese contexto. La
 * jurisdicción de referencia (Ley N.º 8968 de Costa Rica) es la misma en las
 * dos versiones, porque es la ley que de verdad aplica, sin importar en qué
 * idioma la esté leyendo la persona usuaria.
 *
 * Si el contenido cambia de forma sustancial en cualquiera de los dos
 * idiomas, subí CURRENT_PRIVACY_POLICY_VERSION (ver privacyPolicy.ts) para
 * que las próximas aceptaciones queden registradas contra la versión nueva.
 */
export const privacyPolicyContent: Record<AppLanguage, PolicyContent> = {
  es: {
    title: 'Política de Privacidad de Mynted',
    versionLabel: 'Versión',
    sections: [
      {
        heading: '1. Quién es responsable de tus datos',
        body: (
          <p>
            Mynted es un proyecto académico desarrollado en el marco de un curso universitario en Costa Rica.
            Para efectos de esta política, el equipo de desarrollo de Mynted actúa como responsable del
            tratamiento de los datos personales que recolecta la plataforma.
          </p>
        ),
      },
      {
        heading: '2. Qué datos recopilamos',
        body: (
          <ul>
            <li>
              <strong>Datos de cuenta:</strong> correo electrónico, nombre de usuario y contraseña (guardada
              cifrada), o el identificador que nos entrega Google/Facebook si te registrás con esos proveedores.
            </li>
            <li>
              <strong>Datos de perfil:</strong> biografía, ubicación general (ciudad/provincia) y foto de perfil.
            </li>
            <li>
              <strong>Preferencias:</strong> los intereses/franquicias y las comunidades a las que te unís, para
              personalizar lo que te mostramos.
            </li>
            <li>
              <strong>Configuración regional:</strong> idioma y moneda que detectamos automáticamente de tu
              navegador y tu ubicación aproximada, para mostrarte la app y los precios correctamente. Si elegís
              el idioma a mano con el selector del header, guardamos esa elección en vez de la detectada.
            </li>
            <li>
              <strong>Datos de vendedor</strong> (solo si solicitás ese rol): nombre personal o de tienda,
              descripción, ubicación, y los datos de tu cuenta de cobro (nombre del titular, un alias, el número
              de cuenta y el tipo — cuenta bancaria o PayPal).
            </li>
            <li>
              <strong>Uso de la plataforma:</strong> publicaciones, mensajes, favoritos y transacciones simuladas
              dentro de la app.
            </li>
          </ul>
        ),
      },
      {
        heading: '3. Para qué usamos tus datos',
        body: (
          <ul>
            <li>Crear y mantener tu cuenta, y permitirte iniciar sesión.</li>
            <li>Mostrarte comunidades, publicaciones y productos relevantes según tus intereses.</li>
            <li>
              Procesar tu solicitud para convertirte en vendedor y, si es aprobada, mostrar tu información de
              contacto/cobro a la persona compradora cuando confirma una compra.
            </li>
            <li>Enviarte correos operativos (recuperación de contraseña, notificaciones de tu actividad).</li>
            <li>Moderar contenido reportado y hacer cumplir las reglas de cada comunidad.</li>
            <li>Mostrarte la app en el idioma y la moneda que corresponden a tu configuración o ubicación.</li>
          </ul>
        ),
      },
      {
        heading: '4. Base legal',
        body: (
          <p>
            Tratamos tus datos con base en el consentimiento que nos das al aceptar esta política durante el
            registro, y en lo necesario para ejecutar el servicio que solicitás (crear tu cuenta, procesar tus
            publicaciones y transacciones).
          </p>
        ),
      },
      {
        heading: '5. Con quién compartimos tus datos',
        body: (
          <ul>
            <li>
              <strong>Google / Facebook:</strong> si elegís iniciar sesión con esos proveedores, ellos verifican
              tu identidad; nosotros solo recibimos tu correo, nombre y foto pública.
            </li>
            <li>
              <strong>Cloudinary:</strong> almacena las imágenes que subís (foto de perfil, imágenes de
              productos y comunidades).
            </li>
            <li>
              <strong>Otras personas usuarias:</strong> tu nombre de usuario, foto y biografía son visibles
              públicamente; tu información de cobro como vendedor solo se comparte con quien confirma una
              compra tuya.
            </li>
            <li>No vendemos tus datos a terceros ni los usamos con fines publicitarios fuera de la plataforma.</li>
          </ul>
        ),
      },
      {
        heading: '6. Cuánto tiempo conservamos tus datos',
        body: (
          <p>
            Conservamos tus datos mientras tu cuenta esté activa. Si la desactivás, o un superadministrador la
            desactiva, tus datos dejan de mostrarse públicamente, pero podemos conservar un respaldo por un
            período razonable antes de eliminarlos definitivamente.
          </p>
        ),
      },
      {
        heading: '7. Tus derechos',
        body: (
          <p>
            De acuerdo con la Ley N.º 8968 de Costa Rica, tenés derecho a acceder, rectificar, cancelar u
            oponerte al tratamiento de tus datos personales (derechos ARCO). Podés ejercerlos escribiéndonos a
            través de los medios de contacto de la aplicación, o editando directamente tu información desde tu
            perfil cuando esa función esté disponible.
          </p>
        ),
      },
      {
        heading: '8. Menores de edad',
        body: (
          <p>
            Mynted no está dirigido a personas menores de 18 años. Si creés que una cuenta pertenece a una
            persona menor de edad, contactanos para desactivarla.
          </p>
        ),
      },
      {
        heading: '9. Cambios a esta política',
        body: (
          <p>
            Si cambiamos esta política de forma sustancial —en español, en inglés, o en ambos idiomas— actualizaremos
            el número de versión indicado arriba y te pediremos aceptarla de nuevo, sin importar en qué idioma la
            hayas aceptado la primera vez.
          </p>
        ),
      },
      {
        heading: '10. Contacto',
        body: (
          <p>
            Para consultas sobre tus datos personales, escribinos a{' '}
            <a href="mailto:myntedstate@gmail.com">myntedstate@gmail.com</a>.
          </p>
        ),
      },
    ],
  },
  en: {
    title: 'Mynted Privacy Policy',
    versionLabel: 'Version',
    sections: [
      {
        heading: '1. Who is responsible for your data',
        body: (
          <p>
            Mynted is an academic project developed as part of a university course in Costa Rica. For the
            purposes of this policy, the Mynted development team acts as the data controller for the personal
            data the platform collects.
          </p>
        ),
      },
      {
        heading: '2. What data we collect',
        body: (
          <ul>
            <li>
              <strong>Account data:</strong> email address, username, and password (stored encrypted), or the
              identifier Google/Facebook gives us if you sign up through one of those providers.
            </li>
            <li>
              <strong>Profile data:</strong> bio, general location (city/province), and profile photo.
            </li>
            <li>
              <strong>Preferences:</strong> the interests/franchises and communities you join, used to
              personalize what we show you.
            </li>
            <li>
              <strong>Regional settings:</strong> the language and currency we detect automatically from your
              browser and approximate location, so the app and prices display correctly. If you pick a language
              by hand with the switcher in the header, we store that choice instead of the detected one.
            </li>
            <li>
              <strong>Seller data</strong> (only if you request that role): personal or store name, description,
              location, and your payout details (account holder's name, a display alias, the account number, and
              the type — bank account or PayPal).
            </li>
            <li>
              <strong>Platform activity:</strong> listings, messages, favorites, and simulated transactions
              within the app.
            </li>
          </ul>
        ),
      },
      {
        heading: '3. What we use your data for',
        body: (
          <ul>
            <li>Creating and maintaining your account, and letting you sign in.</li>
            <li>Showing you communities, listings, and products relevant to your interests.</li>
            <li>
              Processing your request to become a seller and, if approved, showing your contact/payout
              information to a buyer once they confirm a purchase.
            </li>
            <li>Sending you operational emails (password recovery, activity notifications).</li>
            <li>Moderating reported content and enforcing each community's rules.</li>
            <li>Showing you the app in the language and currency that match your settings or location.</li>
          </ul>
        ),
      },
      {
        heading: '4. Legal basis',
        body: (
          <p>
            We process your data based on the consent you give us by accepting this policy during registration,
            and on what is necessary to provide the service you request (creating your account, processing your
            listings and transactions).
          </p>
        ),
      },
      {
        heading: '5. Who we share your data with',
        body: (
          <ul>
            <li>
              <strong>Google / Facebook:</strong> if you choose to sign in through one of these providers, they
              verify your identity; we only receive your email, name, and public photo.
            </li>
            <li>
              <strong>Cloudinary:</strong> stores the images you upload (profile photo, product and community
              images).
            </li>
            <li>
              <strong>Other users:</strong> your username, photo, and bio are publicly visible; your payout
              information as a seller is only shared with whoever confirms a purchase from you.
            </li>
            <li>We do not sell your data to third parties or use it for advertising outside the platform.</li>
          </ul>
        ),
      },
      {
        heading: '6. How long we keep your data',
        body: (
          <p>
            We keep your data for as long as your account stays active. If you deactivate it, or a
            super-administrator deactivates it, your data stops being shown publicly, but we may keep a backup
            for a reasonable period before deleting it permanently.
          </p>
        ),
      },
      {
        heading: '7. Your rights',
        body: (
          <p>
            Under Costa Rica's Law No. 8968 (Protection of Individuals with Regard to the Processing of Their
            Personal Data), you have the right to access, rectify, cancel, or object to the processing of your
            personal data (ARCO rights). You can exercise these rights by writing to us through the app's
            contact channels, or by editing your information directly from your profile once that feature is
            available.
          </p>
        ),
      },
      {
        heading: '8. Minors',
        body: (
          <p>
            Mynted is not directed at anyone under 18 years old. If you believe an account belongs to a minor,
            please contact us so we can deactivate it.
          </p>
        ),
      },
      {
        heading: '9. Changes to this policy',
        body: (
          <p>
            If we make a substantial change to this policy — in Spanish, in English, or in both languages — we
            will update the version number shown above and ask you to accept it again, regardless of which
            language you accepted it in the first time.
          </p>
        ),
      },
      {
        heading: '10. Contact',
        body: (
          <p>
            For questions about your personal data, write to us at{' '}
            <a href="mailto:myntedstate@gmail.com">myntedstate@gmail.com</a>.
          </p>
        ),
      },
    ],
  },
}
