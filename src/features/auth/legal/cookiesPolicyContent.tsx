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
            Son archivos pequeños que tu navegador guarda cuando visitas un sitio, para recordar información
            entre una visita y otra (por ejemplo, que ya iniciaste sesión, que ya elegiste una respuesta en un
            aviso como este, o en qué idioma prefieres ver la app).
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
                  <code>mynted_language</code>: guarda el idioma que elegiste a mano con el selector de idioma
                  del header. Si nunca lo usas, no se crea esta cookie y la app sigue detectando el idioma
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
            Si borras la cookie <code>mynted_cookie_consent</code> desde la configuración de tu navegador, el
            aviso volverá a aparecer la próxima vez que entres a Mynted. De la misma forma, borrar{' '}
            <code>mynted_language</code> hace que la app vuelva a detectar tu idioma automáticamente en la
            siguiente visita, en vez de recordar tu elección manual.
          </p>
        ),
      },
      {
        heading: '4. Contacto',
        body: (
          <p>
            Para consultas sobre esta política, escríbenos a{' '}
            <a href="mailto:myntedstate@gmail.com">myntedstate@gmail.com</a>. También puedes consultar nuestra{' '}
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
                  <code>mynted_language</code>: stores the language you picked by hand with the language
                  switcher in the header. If you never touch it, this cookie is never created, and the app keeps
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
  de: {
    title: 'Cookie-Richtlinie von Mynted',
    sections: [
      {
        heading: '1. Was Cookies sind',
        body: (
          <p>
            Cookies sind kleine Dateien, die Ihr Browser speichert, wenn Sie eine Website besuchen, damit
            Informationen von einem Besuch zum nächsten erhalten bleiben – zum Beispiel, dass Sie bereits
            angemeldet sind, dass Sie in einem Hinweis wie diesem schon eine Auswahl getroffen haben oder in
            welcher Sprache Sie die App sehen möchten.
          </p>
        ),
      },
      {
        heading: '2. Welche Cookies wir derzeit verwenden',
        body: (
          <ul>
            <li>
              <strong>Notwendig (immer aktiv):</strong>
              <ul>
                <li>
                  <code>access_token</code> und <code>refresh_token</code>: halten Sie angemeldet. Sie sind
                  httpOnly (Ihr Browser sendet sie an das Backend, aber kein Skript der Website kann sie
                  auslesen).
                </li>
                <li>
                  <code>mynted_cookie_consent</code>: speichert Ihre Auswahl in diesem Hinweis, damit wir ihn
                  Ihnen nicht bei jedem Besuch erneut anzeigen.
                </li>
                <li>
                  <code>mynted_language</code>: speichert die Sprache, die Sie selbst über die Sprachauswahl im
                  Header gewählt haben. Wenn Sie sie nie verwenden, wird dieses Cookie nicht erstellt, und die
                  App erkennt Ihre Sprache bei jedem Besuch automatisch anhand Ihres Browsers und Ihres
                  ungefähren Standorts.
                </li>
              </ul>
            </li>
            <li>
              <strong>Marketing/Analyse:</strong> Derzeit verwenden wir keine. Der Schalter „Marketing“ im
              Cookie-Hinweis ist für den Zeitpunkt vorbereitet, an dem wir Analysefunktionen hinzufügen (zum
              Beispiel, um zu verstehen, welche Communitys oder Produkte das meiste Interesse wecken); wenn Sie
              ihn heute aktivieren, wird aber noch kein Tracking eingeschaltet.
            </li>
          </ul>
        ),
      },
      {
        heading: '3. So ändern Sie Ihre Auswahl',
        body: (
          <p>
            Wenn Sie das Cookie <code>mynted_cookie_consent</code> in den Einstellungen Ihres Browsers löschen,
            wird der Hinweis beim nächsten Besuch von Mynted erneut angezeigt. Genauso gilt: Wenn Sie{' '}
            <code>mynted_language</code> löschen, erkennt die App Ihre Sprache beim nächsten Besuch wieder
            automatisch, statt sich an Ihre manuelle Auswahl zu erinnern.
          </p>
        ),
      },
      {
        heading: '4. Kontakt',
        body: (
          <p>
            Bei Fragen zu dieser Richtlinie schreiben Sie uns an{' '}
            <a href="mailto:myntedstate@gmail.com">myntedstate@gmail.com</a>. Sie können sich auch unsere{' '}
            <a href="/legal/privacidad">Datenschutzerklärung</a> ansehen.
          </p>
        ),
      },
    ],
  },
  fr: {
    title: 'Politique relative aux cookies de Mynted',
    sections: [
      {
        heading: '1. Qu’est-ce qu’un cookie',
        body: (
          <p>
            Les cookies sont de petits fichiers que votre navigateur enregistre lorsque vous visitez un site,
            afin de mémoriser des informations d’une visite à l’autre (par exemple, que vous êtes déjà
            connecté, que vous avez déjà fait un choix dans un avis comme celui-ci, ou la langue dans laquelle
            vous préférez voir l’application).
          </p>
        ),
      },
      {
        heading: '2. Les cookies que nous utilisons aujourd’hui',
        body: (
          <ul>
            <li>
              <strong>Nécessaires (toujours actifs)&nbsp;:</strong>
              <ul>
                <li>
                  <code>access_token</code> et <code>refresh_token</code>&nbsp;: maintiennent votre session
                  ouverte. Ils sont httpOnly (votre navigateur les envoie au serveur, mais aucun script du site
                  ne peut les lire).
                </li>
                <li>
                  <code>mynted_cookie_consent</code>&nbsp;: enregistre le choix que vous avez fait dans cet avis,
                  pour ne pas vous l’afficher à chaque visite.
                </li>
                <li>
                  <code>mynted_language</code>&nbsp;: enregistre la langue que vous avez choisie vous-même avec
                  le sélecteur de langue de l’en-tête. Si vous ne l’utilisez jamais, ce cookie n’est pas créé et
                  l’application continue de détecter automatiquement votre langue à chaque visite, à partir de
                  votre navigateur et de votre localisation approximative.
                </li>
              </ul>
            </li>
            <li>
              <strong>Marketing/mesure d’audience&nbsp;:</strong> nous n’en utilisons aucun pour le moment.
              L’interrupteur «&nbsp;Marketing&nbsp;» de l’avis sur les cookies est prévu pour le jour où nous
              ajouterons des outils d’analyse (par exemple, pour comprendre quelles communautés ou quels produits
              suscitent le plus d’intérêt), mais l’activer aujourd’hui n’active encore aucun suivi.
            </li>
          </ul>
        ),
      },
      {
        heading: '3. Comment modifier votre choix',
        body: (
          <p>
            Si vous supprimez le cookie <code>mynted_cookie_consent</code> depuis les paramètres de votre
            navigateur, l’avis s’affichera de nouveau lors de votre prochaine visite sur Mynted. De même,
            supprimer <code>mynted_language</code> permet à l’application de détecter à nouveau automatiquement
            votre langue lors de votre prochaine visite, au lieu de mémoriser votre choix manuel.
          </p>
        ),
      },
      {
        heading: '4. Contact',
        body: (
          <p>
            Pour toute question concernant cette politique, écrivez-nous à{' '}
            <a href="mailto:myntedstate@gmail.com">myntedstate@gmail.com</a>. Vous pouvez également consulter
            notre <a href="/legal/privacidad">Politique de confidentialité</a>.
          </p>
        ),
      },
    ],
  },
  pt: {
    title: 'Política de Cookies do Mynted',
    sections: [
      {
        heading: '1. O que são cookies',
        body: (
          <p>
            São pequenos arquivos que seu navegador salva quando você visita um site, para lembrar informações
            de uma visita para outra (por exemplo, que você já fez login, que já escolheu uma opção em um aviso
            como este ou em qual idioma prefere ver o app).
          </p>
        ),
      },
      {
        heading: '2. Quais cookies usamos hoje',
        body: (
          <ul>
            <li>
              <strong>Necessários (sempre ativos):</strong>
              <ul>
                <li>
                  <code>access_token</code> e <code>refresh_token</code>: mantêm sua sessão iniciada. São
                  httpOnly (seu navegador os envia ao backend, mas nenhum script do site consegue lê-los).
                </li>
                <li>
                  <code>mynted_cookie_consent</code>: salva a escolha que você fez neste aviso, para não
                  mostrá-lo novamente a cada visita.
                </li>
                <li>
                  <code>mynted_language</code>: salva o idioma que você escolheu manualmente no seletor de idioma
                  do cabeçalho. Se você nunca usá-lo, esse cookie não é criado, e o app continua detectando seu
                  idioma automaticamente a cada visita, com base no seu navegador e na sua localização
                  aproximada.
                </li>
              </ul>
            </li>
            <li>
              <strong>Marketing/análise:</strong> por enquanto não usamos nenhum. A opção "Marketing" no aviso de
              cookies está preparada para quando adicionarmos ferramentas de análise (por exemplo, para entender
              quais comunidades ou produtos despertam mais interesse), mas ativá-la hoje ainda não habilita nenhum
              rastreamento.
            </li>
          </ul>
        ),
      },
      {
        heading: '3. Como alterar sua escolha',
        body: (
          <p>
            Se você apagar o cookie <code>mynted_cookie_consent</code> nas configurações do navegador, o aviso
            vai aparecer de novo na próxima vez que você acessar o Mynted. Da mesma forma, apagar{' '}
            <code>mynted_language</code> faz o app voltar a detectar seu idioma automaticamente na próxima visita,
            em vez de lembrar sua escolha manual.
          </p>
        ),
      },
      {
        heading: '4. Contato',
        body: (
          <p>
            Para dúvidas sobre esta política, escreva para{' '}
            <a href="mailto:myntedstate@gmail.com">myntedstate@gmail.com</a>. Você também pode consultar nossa{' '}
            <a href="/legal/privacidad">Política de Privacidade</a>.
          </p>
        ),
      },
    ],
  },
  ko: {
    title: 'Mynted 쿠키 정책',
    sections: [
      {
        heading: '1. 쿠키란 무엇인가요',
        body: (
          <p>
            쿠키는 웹사이트를 방문할 때 브라우저에 저장되는 작은 파일로, 방문과 방문 사이에 정보를 기억하는 데
            사용됩니다. 예를 들어 이미 로그인했는지, 이 안내와 같은 알림에서 이미 선택을 했는지, 앱을 어떤 언어로
            보고 싶은지 등을 기억합니다.
          </p>
        ),
      },
      {
        heading: '2. 현재 사용 중인 쿠키',
        body: (
          <ul>
            <li>
              <strong>필수(항상 활성화):</strong>
              <ul>
                <li>
                  <code>access_token</code> 및 <code>refresh_token</code>: 로그인 상태를 유지합니다. httpOnly
                  쿠키이므로 브라우저가 백엔드로 전송하지만 사이트의 어떤 스크립트도 읽을 수 없습니다.
                </li>
                <li>
                  <code>mynted_cookie_consent</code>: 이 안내에서 선택한 내용을 저장해 방문할 때마다 다시 표시되지
                  않도록 합니다.
                </li>
                <li>
                  <code>mynted_language</code>: 헤더의 언어 선택기에서 직접 고른 언어를 저장합니다. 언어 선택기를
                  사용하지 않으면 이 쿠키는 생성되지 않으며, 앱은 방문할 때마다 브라우저와 대략적인 위치를 바탕으로
                  언어를 자동 감지합니다.
                </li>
              </ul>
            </li>
            <li>
              <strong>마케팅/분석:</strong> 현재는 사용하지 않습니다. 쿠키 안내의 "마케팅" 스위치는 나중에 분석
              기능을 추가할 때(예: 어떤 커뮤니티나 상품이 가장 관심을 끄는지 파악하기 위해)를 대비한 것으로, 지금
              켜더라도 어떠한 추적도 활성화되지 않습니다.
            </li>
          </ul>
        ),
      },
      {
        heading: '3. 선택을 변경하는 방법',
        body: (
          <p>
            브라우저 설정에서 <code>mynted_cookie_consent</code> 쿠키를 삭제하면 다음에 Mynted를 방문할 때 안내가
            다시 표시됩니다. 마찬가지로 <code>mynted_language</code>를 삭제하면 앱이 직접 선택한 언어를 기억하지
            않고, 다음 방문 시 언어를 다시 자동 감지합니다.
          </p>
        ),
      },
      {
        heading: '4. 문의',
        body: (
          <p>
            본 정책에 관한 문의는{' '}
            <a href="mailto:myntedstate@gmail.com">myntedstate@gmail.com</a>으로 보내 주세요.{' '}
            <a href="/legal/privacidad">개인정보 처리방침</a>도 확인하실 수 있습니다.
          </p>
        ),
      },
    ],
  },
}
