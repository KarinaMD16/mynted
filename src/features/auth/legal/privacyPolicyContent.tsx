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
 * idioma tiene acá su propio texto, escrito completo, y todos se mantienen
 * en paralelo a mano — si cambia una sección, hay que revisar/actualizar la
 * misma sección en los demás idiomas en el mismo commit.
 *
 * El contenido en español es el original (ver historial); el de inglés,
 * alemán, francés, portugués (Brasil) y coreano son adaptaciones fieles
 * pensadas para leerse igual de natural, no una traducción automática — pero, igual que el español, sigue siendo un
 * borrador de trabajo para un proyecto académico y no reemplaza una revisión
 * legal real antes de cualquier lanzamiento fuera de ese contexto. La
 * jurisdicción de referencia (Ley N.º 8968 de Costa Rica) es la misma en
 * todas las versiones, porque es la ley que de verdad aplica, sin importar en qué
 * idioma la esté leyendo la persona usuaria.
 *
 * Si el contenido cambia de forma sustancial en cualquiera de los
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
              cifrada), o el identificador que nos entrega Google/Facebook si te registras con esos proveedores.
            </li>
            <li>
              <strong>Datos de perfil:</strong> biografía, ubicación general (ciudad/provincia) y foto de perfil.
            </li>
            <li>
              <strong>Preferencias:</strong> los intereses/franquicias y las comunidades a las que te unes, para
              personalizar lo que te mostramos.
            </li>
            <li>
              <strong>Configuración regional:</strong> idioma y moneda que detectamos automáticamente de tu
              navegador y tu ubicación aproximada, para mostrarte la app y los precios correctamente. Si eliges
              el idioma a mano con el selector del header, guardamos esa elección en vez de la detectada.
            </li>
            <li>
              <strong>Datos de vendedor</strong> (solo si solicitas ese rol): nombre personal o de tienda,
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
            registro, y en lo necesario para ejecutar el servicio que solicitas (crear tu cuenta, procesar tus
            publicaciones y transacciones).
          </p>
        ),
      },
      {
        heading: '5. Con quién compartimos tus datos',
        body: (
          <ul>
            <li>
              <strong>Google / Facebook:</strong> si eliges iniciar sesión con esos proveedores, ellos verifican
              tu identidad; nosotros solo recibimos tu correo, nombre y foto pública.
            </li>
            <li>
              <strong>Cloudinary:</strong> almacena las imágenes que subes (foto de perfil, imágenes de
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
            Conservamos tus datos mientras tu cuenta esté activa. Si la desactivas, o un superadministrador la
            desactiva, tus datos dejan de mostrarse públicamente, pero podemos conservar un respaldo por un
            período razonable antes de eliminarlos definitivamente.
          </p>
        ),
      },
      {
        heading: '7. Tus derechos',
        body: (
          <p>
            De acuerdo con la Ley N.º 8968 de Costa Rica, tienes derecho a acceder, rectificar, cancelar u
            oponerte al tratamiento de tus datos personales (derechos ARCO). Puedes ejercerlos escribiéndonos a
            través de los medios de contacto de la aplicación, o editando directamente tu información desde tu
            perfil cuando esa función esté disponible.
          </p>
        ),
      },
      {
        heading: '8. Menores de edad',
        body: (
          <p>
            Mynted no está dirigido a personas menores de 18 años. Si crees que una cuenta pertenece a una
            persona menor de edad, contáctanos para desactivarla.
          </p>
        ),
      },
      {
        heading: '9. Cambios a esta política',
        body: (
          <p>
            Si cambiamos esta política de forma sustancial —en uno o varios de los idiomas disponibles—
            actualizaremos el número de versión indicado arriba y te pediremos aceptarla de nuevo, sin importar en
            qué idioma la hayas aceptado la primera vez.
          </p>
        ),
      },
      {
        heading: '10. Contacto',
        body: (
          <p>
            Para consultas sobre tus datos personales, escríbenos a{' '}
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
            If we make a substantial change to this policy — in one or more of the available languages — we
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
  de: {
    title: 'Datenschutzerklärung von Mynted',
    versionLabel: 'Version',
    sections: [
      {
        heading: '1. Wer für Ihre Daten verantwortlich ist',
        body: (
          <p>
            Mynted ist ein akademisches Projekt, das im Rahmen eines Universitätskurses in Costa Rica entwickelt
            wird. Im Sinne dieser Erklärung ist das Entwicklungsteam von Mynted der Verantwortliche für die
            personenbezogenen Daten, die die Plattform erhebt.
          </p>
        ),
      },
      {
        heading: '2. Welche Daten wir erheben',
        body: (
          <ul>
            <li>
              <strong>Kontodaten:</strong> E-Mail-Adresse, Benutzername und Passwort (verschlüsselt gespeichert)
              oder die Kennung, die uns Google/Facebook übermittelt, wenn Sie sich über einen dieser Anbieter
              registrieren.
            </li>
            <li>
              <strong>Profildaten:</strong> Bio, allgemeiner Standort (Stadt/Region) und Profilfoto.
            </li>
            <li>
              <strong>Präferenzen:</strong> Ihre Interessen/Franchises und die Communitys, denen Sie beitreten,
              um die Inhalte, die wir Ihnen zeigen, zu personalisieren.
            </li>
            <li>
              <strong>Regionale Einstellungen:</strong> Sprache und Währung, die wir automatisch anhand Ihres
              Browsers und Ihres ungefähren Standorts erkennen, damit die App und die Preise korrekt angezeigt
              werden. Wenn Sie die Sprache selbst über die Sprachauswahl im Header wählen, speichern wir diese
              Auswahl anstelle der erkannten Sprache.
            </li>
            <li>
              <strong>Verkäuferdaten</strong> (nur wenn Sie diese Rolle beantragen): persönlicher Name oder
              Shop-Name, Beschreibung, Standort sowie die Daten Ihres Auszahlungskontos (Name des
              Kontoinhabers, ein Alias, die Kontonummer und die Art – Bankkonto oder PayPal).
            </li>
            <li>
              <strong>Nutzung der Plattform:</strong> Beiträge, Nachrichten, Favoriten und simulierte
              Transaktionen innerhalb der App.
            </li>
          </ul>
        ),
      },
      {
        heading: '3. Wofür wir Ihre Daten verwenden',
        body: (
          <ul>
            <li>Um Ihr Konto zu erstellen und zu verwalten und Ihnen die Anmeldung zu ermöglichen.</li>
            <li>Um Ihnen Communitys, Beiträge und Produkte zu zeigen, die zu Ihren Interessen passen.</li>
            <li>
              Um Ihre Anfrage, Verkäufer zu werden, zu bearbeiten und – falls sie genehmigt wird – Ihre
              Kontakt- und Auszahlungsdaten der Käuferin oder dem Käufer anzuzeigen, sobald ein Kauf bestätigt
              wurde.
            </li>
            <li>Um Ihnen betriebliche E-Mails zu senden (Passwort-Wiederherstellung, Benachrichtigungen zu Ihrer Aktivität).</li>
            <li>Um gemeldete Inhalte zu moderieren und die Regeln der einzelnen Communitys durchzusetzen.</li>
            <li>Um Ihnen die App in der Sprache und Währung anzuzeigen, die zu Ihren Einstellungen oder Ihrem Standort passen.</li>
          </ul>
        ),
      },
      {
        heading: '4. Rechtsgrundlage',
        body: (
          <p>
            Wir verarbeiten Ihre Daten auf Grundlage der Einwilligung, die Sie uns mit der Annahme dieser
            Erklärung bei der Registrierung erteilen, sowie soweit dies zur Erbringung des von Ihnen angeforderten
            Dienstes erforderlich ist (Erstellung Ihres Kontos, Verarbeitung Ihrer Beiträge und Transaktionen).
          </p>
        ),
      },
      {
        heading: '5. An wen wir Ihre Daten weitergeben',
        body: (
          <ul>
            <li>
              <strong>Google / Facebook:</strong> Wenn Sie sich über einen dieser Anbieter anmelden, bestätigt
              dieser Ihre Identität; wir erhalten nur Ihre E-Mail-Adresse, Ihren Namen und Ihr öffentliches
              Foto.
            </li>
            <li>
              <strong>Cloudinary:</strong> speichert die Bilder, die Sie hochladen (Profilfoto, Produkt- und
              Community-Bilder).
            </li>
            <li>
              <strong>Andere Nutzer:</strong> Ihr Benutzername, Ihr Foto und Ihre Bio sind öffentlich
              sichtbar; Ihre Auszahlungsdaten als Verkäufer werden nur mit der Person geteilt, die einen Kauf
              bei Ihnen bestätigt.
            </li>
            <li>
              Wir verkaufen Ihre Daten nicht an Dritte und verwenden sie nicht für Werbezwecke außerhalb der
              Plattform.
            </li>
          </ul>
        ),
      },
      {
        heading: '6. Wie lange wir Ihre Daten speichern',
        body: (
          <p>
            Wir speichern Ihre Daten, solange Ihr Konto aktiv ist. Wenn Sie es deaktivieren oder ein
            Superadministrator es deaktiviert, werden Ihre Daten nicht mehr öffentlich angezeigt; wir können
            jedoch für einen angemessenen Zeitraum eine Sicherungskopie aufbewahren, bevor wir sie endgültig
            löschen.
          </p>
        ),
      },
      {
        heading: '7. Ihre Rechte',
        body: (
          <p>
            Gemäß dem Gesetz Nr. 8968 von Costa Rica (Gesetz zum Schutz natürlicher Personen bei der
            Verarbeitung ihrer personenbezogenen Daten) haben Sie das Recht auf Auskunft, Berichtigung, Löschung
            und Widerspruch gegen die Verarbeitung Ihrer personenbezogenen Daten (sogenannte ARCO-Rechte). Sie
            können diese Rechte ausüben, indem Sie uns über die Kontaktmöglichkeiten der App schreiben oder Ihre
            Daten direkt in Ihrem Profil bearbeiten, sobald diese Funktion verfügbar ist.
          </p>
        ),
      },
      {
        heading: '8. Minderjährige',
        body: (
          <p>
            Mynted richtet sich nicht an Personen unter 18 Jahren. Wenn Sie glauben, dass ein Konto einer
            minderjährigen Person gehört, kontaktieren Sie uns bitte, damit wir es deaktivieren können.
          </p>
        ),
      },
      {
        heading: '9. Änderungen dieser Erklärung',
        body: (
          <p>
            Wenn wir diese Erklärung wesentlich ändern – in einer oder mehreren der verfügbaren Sprachen –,
            aktualisieren wir die oben angegebene Versionsnummer und bitten Sie, sie erneut zu akzeptieren,
            unabhängig davon, in welcher Sprache Sie sie ursprünglich akzeptiert haben.
          </p>
        ),
      },
      {
        heading: '10. Kontakt',
        body: (
          <p>
            Bei Fragen zu Ihren personenbezogenen Daten schreiben Sie uns an{' '}
            <a href="mailto:myntedstate@gmail.com">myntedstate@gmail.com</a>.
          </p>
        ),
      },
    ],
  },
  fr: {
    title: 'Politique de confidentialité de Mynted',
    versionLabel: 'Version',
    sections: [
      {
        heading: '1. Qui est responsable de vos données',
        body: (
          <p>
            Mynted est un projet académique développé dans le cadre d’un cours universitaire au Costa Rica. Aux
            fins de la présente politique, l’équipe de développement de Mynted agit en tant que responsable du
            traitement des données personnelles collectées par la plateforme.
          </p>
        ),
      },
      {
        heading: '2. Quelles données nous collectons',
        body: (
          <ul>
            <li>
              <strong>Données de compte&nbsp;:</strong> adresse e-mail, nom d’utilisateur et mot de passe
              (stocké chiffré), ou l’identifiant que Google/Facebook nous transmet si vous vous inscrivez via
              l’un de ces fournisseurs.
            </li>
            <li>
              <strong>Données de profil&nbsp;:</strong> bio, localisation générale (ville/région) et photo de
              profil.
            </li>
            <li>
              <strong>Préférences&nbsp;:</strong> les centres d’intérêt/franchises et les communautés que vous
              rejoignez, afin de personnaliser ce que nous vous montrons.
            </li>
            <li>
              <strong>Paramètres régionaux&nbsp;:</strong> la langue et la devise que nous détectons
              automatiquement à partir de votre navigateur et de votre localisation approximative, pour afficher
              correctement l’application et les prix. Si vous choisissez la langue vous-même avec le sélecteur de
              l’en-tête, nous enregistrons ce choix à la place de la langue détectée.
            </li>
            <li>
              <strong>Données de vendeur</strong> (uniquement si vous demandez ce rôle)&nbsp;: nom personnel ou
              nom de la boutique, description, localisation, ainsi que les informations de votre compte de
              versement (nom du titulaire, un alias, le numéro de compte et le type&nbsp;: compte bancaire ou
              PayPal).
            </li>
            <li>
              <strong>Utilisation de la plateforme&nbsp;:</strong> publications, messages, favoris et
              transactions simulées au sein de l’application.
            </li>
          </ul>
        ),
      },
      {
        heading: '3. À quoi servent vos données',
        body: (
          <ul>
            <li>Créer et gérer votre compte, et vous permettre de vous connecter.</li>
            <li>Vous montrer des communautés, des publications et des produits pertinents selon vos centres d’intérêt.</li>
            <li>
              Traiter votre demande pour devenir vendeur et, si elle est approuvée, communiquer vos
              coordonnées et informations de versement à l’acheteur lorsqu’il confirme un achat.
            </li>
            <li>Vous envoyer des e-mails de service (récupération du mot de passe, notifications sur votre activité).</li>
            <li>Modérer les contenus signalés et faire respecter les règles de chaque communauté.</li>
            <li>Vous afficher l’application dans la langue et la devise correspondant à vos paramètres ou à votre localisation.</li>
          </ul>
        ),
      },
      {
        heading: '4. Base juridique',
        body: (
          <p>
            Nous traitons vos données sur la base du consentement que vous nous donnez en acceptant la présente
            politique lors de votre inscription, ainsi que dans la mesure nécessaire à la fourniture du service
            que vous demandez (création de votre compte, traitement de vos publications et transactions).
          </p>
        ),
      },
      {
        heading: '5. Avec qui nous partageons vos données',
        body: (
          <ul>
            <li>
              <strong>Google / Facebook&nbsp;:</strong> si vous choisissez de vous connecter via l’un de ces
              fournisseurs, celui-ci vérifie votre identité&nbsp;; nous ne recevons que votre adresse e-mail,
              votre nom et votre photo publique.
            </li>
            <li>
              <strong>Cloudinary&nbsp;:</strong> stocke les images que vous importez (photo de profil, images de
              produits et de communautés).
            </li>
            <li>
              <strong>Autres utilisateurs&nbsp;:</strong> votre nom d’utilisateur, votre photo et votre bio sont
              visibles publiquement&nbsp;; vos informations de versement en tant que vendeur ne sont partagées
              qu’avec la personne qui confirme un achat auprès de vous.
            </li>
            <li>
              Nous ne vendons pas vos données à des tiers et ne les utilisons pas à des fins publicitaires en
              dehors de la plateforme.
            </li>
          </ul>
        ),
      },
      {
        heading: '6. Durée de conservation de vos données',
        body: (
          <p>
            Nous conservons vos données tant que votre compte reste actif. Si vous le désactivez, ou si un
            super-administrateur le désactive, vos données cessent d’être affichées publiquement, mais nous
            pouvons en conserver une sauvegarde pendant une durée raisonnable avant de les supprimer
            définitivement.
          </p>
        ),
      },
      {
        heading: '7. Vos droits',
        body: (
          <p>
            Conformément à la loi n°&nbsp;8968 du Costa Rica (loi sur la protection des personnes à l’égard du
            traitement de leurs données personnelles), vous disposez d’un droit d’accès, de rectification,
            d’effacement et d’opposition au traitement de vos données personnelles (droits dits «&nbsp;ARCO&nbsp;»).
            Vous pouvez exercer ces droits en nous écrivant via les moyens de contact de l’application, ou en
            modifiant directement vos informations depuis votre profil lorsque cette fonctionnalité sera
            disponible.
          </p>
        ),
      },
      {
        heading: '8. Mineurs',
        body: (
          <p>
            Mynted ne s’adresse pas aux personnes de moins de 18&nbsp;ans. Si vous pensez qu’un compte appartient
            à une personne mineure, contactez-nous afin que nous puissions le désactiver.
          </p>
        ),
      },
      {
        heading: '9. Modifications de la présente politique',
        body: (
          <p>
            Si nous modifions cette politique de manière substantielle, dans une ou plusieurs des langues
            disponibles, nous mettrons à jour le numéro de version indiqué ci-dessus et vous demanderons de
            l’accepter à nouveau, quelle que soit la langue dans laquelle vous l’aviez acceptée la première fois.
          </p>
        ),
      },
      {
        heading: '10. Contact',
        body: (
          <p>
            Pour toute question concernant vos données personnelles, écrivez-nous à{' '}
            <a href="mailto:myntedstate@gmail.com">myntedstate@gmail.com</a>.
          </p>
        ),
      },
    ],
  },
  pt: {
    title: 'Política de Privacidade do Mynted',
    versionLabel: 'Versão',
    sections: [
      {
        heading: '1. Quem é responsável pelos seus dados',
        body: (
          <p>
            O Mynted é um projeto acadêmico desenvolvido no âmbito de um curso universitário na Costa Rica. Para
            os fins desta política, a equipe de desenvolvimento do Mynted atua como responsável pelo tratamento
            dos dados pessoais coletados pela plataforma.
          </p>
        ),
      },
      {
        heading: '2. Quais dados coletamos',
        body: (
          <ul>
            <li>
              <strong>Dados da conta:</strong> e-mail, nome de usuário e senha (armazenada de forma
              criptografada), ou o identificador que o Google/Facebook nos fornece se você se cadastrar por meio
              de um desses provedores.
            </li>
            <li>
              <strong>Dados do perfil:</strong> bio, localização geral (cidade/estado) e foto de perfil.
            </li>
            <li>
              <strong>Preferências:</strong> os interesses/franquias e as comunidades de que você participa, para
              personalizar o que mostramos a você.
            </li>
            <li>
              <strong>Configurações regionais:</strong> idioma e moeda que detectamos automaticamente a partir do
              seu navegador e da sua localização aproximada, para exibir o app e os preços corretamente. Se você
              escolher o idioma manualmente no seletor do cabeçalho, salvamos essa escolha no lugar do idioma
              detectado.
            </li>
            <li>
              <strong>Dados de vendedor</strong> (somente se você solicitar essa função): nome pessoal ou da loja,
              descrição, localização e os dados da sua conta de recebimento (nome do titular, um apelido, o número
              da conta e o tipo — conta bancária ou PayPal).
            </li>
            <li>
              <strong>Uso da plataforma:</strong> publicações, mensagens, favoritos e transações simuladas dentro
              do app.
            </li>
          </ul>
        ),
      },
      {
        heading: '3. Para que usamos seus dados',
        body: (
          <ul>
            <li>Criar e manter sua conta e permitir que você faça login.</li>
            <li>Mostrar comunidades, publicações e produtos relevantes de acordo com seus interesses.</li>
            <li>
              Processar sua solicitação para se tornar vendedor e, se aprovada, mostrar suas informações de
              contato/recebimento ao comprador quando ele confirmar uma compra.
            </li>
            <li>Enviar e-mails operacionais (recuperação de senha, notificações sobre sua atividade).</li>
            <li>Moderar conteúdos denunciados e fazer cumprir as regras de cada comunidade.</li>
            <li>Exibir o app no idioma e na moeda correspondentes às suas configurações ou à sua localização.</li>
          </ul>
        ),
      },
      {
        heading: '4. Base legal',
        body: (
          <p>
            Tratamos seus dados com base no consentimento que você nos dá ao aceitar esta política durante o
            cadastro e no que for necessário para prestar o serviço que você solicita (criar sua conta, processar
            suas publicações e transações).
          </p>
        ),
      },
      {
        heading: '5. Com quem compartilhamos seus dados',
        body: (
          <ul>
            <li>
              <strong>Google / Facebook:</strong> se você optar por entrar com um desses provedores, eles
              verificam sua identidade; nós recebemos apenas seu e-mail, nome e foto pública.
            </li>
            <li>
              <strong>Cloudinary:</strong> armazena as imagens que você envia (foto de perfil, imagens de
              produtos e de comunidades).
            </li>
            <li>
              <strong>Outros usuários:</strong> seu nome de usuário, foto e bio são visíveis publicamente; suas
              informações de recebimento como vendedor são compartilhadas apenas com quem confirmar uma compra
              com você.
            </li>
            <li>Não vendemos seus dados a terceiros nem os usamos para fins publicitários fora da plataforma.</li>
          </ul>
        ),
      },
      {
        heading: '6. Por quanto tempo guardamos seus dados',
        body: (
          <p>
            Guardamos seus dados enquanto sua conta estiver ativa. Se você a desativar, ou se um
            superadministrador a desativar, seus dados deixam de ser exibidos publicamente, mas podemos manter
            uma cópia de segurança por um período razoável antes de excluí-los definitivamente.
          </p>
        ),
      },
      {
        heading: '7. Seus direitos',
        body: (
          <p>
            De acordo com a Lei n.º 8968 da Costa Rica (Lei de Proteção da Pessoa frente ao Tratamento de seus
            Dados Pessoais), você tem direito de acessar, retificar, cancelar ou se opor ao tratamento dos seus
            dados pessoais (direitos ARCO). Você pode exercê-los escrevendo para nós pelos canais de contato do
            app ou editando suas informações diretamente no seu perfil, quando esse recurso estiver disponível.
          </p>
        ),
      },
      {
        heading: '8. Menores de idade',
        body: (
          <p>
            O Mynted não é destinado a menores de 18 anos. Se você acredita que uma conta pertence a um menor de
            idade, entre em contato conosco para que possamos desativá-la.
          </p>
        ),
      },
      {
        heading: '9. Alterações nesta política',
        body: (
          <p>
            Se alterarmos esta política de forma substancial — em um ou mais dos idiomas disponíveis —,
            atualizaremos o número da versão indicado acima e pediremos que você a aceite novamente,
            independentemente do idioma em que a aceitou pela primeira vez.
          </p>
        ),
      },
      {
        heading: '10. Contato',
        body: (
          <p>
            Para dúvidas sobre seus dados pessoais, escreva para{' '}
            <a href="mailto:myntedstate@gmail.com">myntedstate@gmail.com</a>.
          </p>
        ),
      },
    ],
  },
  ko: {
    title: 'Mynted 개인정보 처리방침',
    versionLabel: '버전',
    sections: [
      {
        heading: '1. 개인정보 처리 책임자',
        body: (
          <p>
            Mynted는 코스타리카의 한 대학 수업의 일환으로 개발된 학술 프로젝트입니다. 본 방침에서 Mynted 개발팀은
            플랫폼이 수집하는 개인정보의 처리 책임자 역할을 합니다.
          </p>
        ),
      },
      {
        heading: '2. 수집하는 정보',
        body: (
          <ul>
            <li>
              <strong>계정 정보:</strong> 이메일 주소, 사용자 이름, 비밀번호(암호화하여 저장) 또는 Google/Facebook을
              통해 가입한 경우 해당 서비스가 제공하는 식별자.
            </li>
            <li>
              <strong>프로필 정보:</strong> 자기소개, 대략적인 지역(도시/도), 프로필 사진.
            </li>
            <li>
              <strong>선호 정보:</strong> 회원님께 보여 드리는 콘텐츠를 맞춤화하기 위한 관심사/프랜차이즈 및 가입한
              커뮤니티.
            </li>
            <li>
              <strong>지역 설정:</strong> 앱과 가격을 올바르게 표시하기 위해 브라우저와 대략적인 위치를 바탕으로
              자동 감지하는 언어와 통화. 헤더의 언어 선택기에서 직접 언어를 고르면, 감지된 언어 대신 선택한 언어를
              저장합니다.
            </li>
            <li>
              <strong>판매자 정보</strong>(판매자 역할을 신청한 경우에만): 개인 또는 상점 이름, 설명, 지역, 그리고
              정산 계좌 정보(예금주 이름, 별칭, 계좌번호, 계좌 유형 — 은행 계좌 또는 PayPal).
            </li>
            <li>
              <strong>플랫폼 이용 정보:</strong> 앱 내 게시물, 메시지, 즐겨찾기, 모의 거래 내역.
            </li>
          </ul>
        ),
      },
      {
        heading: '3. 정보 이용 목적',
        body: (
          <ul>
            <li>계정을 생성·유지하고 로그인할 수 있도록 하기 위해</li>
            <li>관심사에 맞는 커뮤니티, 게시물, 상품을 보여 드리기 위해</li>
            <li>
              판매자 신청을 처리하고, 승인된 경우 구매자가 구매를 확정하면 해당 구매자에게 판매자의 연락처/정산
              정보를 보여 주기 위해
            </li>
            <li>서비스 운영 관련 이메일(비밀번호 재설정, 활동 알림)을 보내기 위해</li>
            <li>신고된 콘텐츠를 검토하고 각 커뮤니티의 규칙을 적용하기 위해</li>
            <li>회원님의 설정이나 위치에 맞는 언어와 통화로 앱을 표시하기 위해</li>
          </ul>
        ),
      },
      {
        heading: '4. 처리의 법적 근거',
        body: (
          <p>
            Mynted는 회원가입 시 본 방침에 동의함으로써 회원님이 제공한 동의, 그리고 회원님이 요청한 서비스(계정
            생성, 게시물 및 거래 처리)를 제공하는 데 필요한 범위를 근거로 개인정보를 처리합니다.
          </p>
        ),
      },
      {
        heading: '5. 정보 제공 대상',
        body: (
          <ul>
            <li>
              <strong>Google / Facebook:</strong> 해당 서비스로 로그인하기로 선택한 경우 본인 확인은 해당
              서비스가 수행하며, Mynted는 이메일, 이름, 공개 프로필 사진만 받습니다.
            </li>
            <li>
              <strong>Cloudinary:</strong> 회원님이 업로드한 이미지(프로필 사진, 상품 및 커뮤니티 이미지)를
              저장합니다.
            </li>
            <li>
              <strong>다른 사용자:</strong> 사용자 이름, 사진, 자기소개는 공개됩니다. 판매자의 정산 정보는
              회원님의 상품 구매를 확정한 사람에게만 공유됩니다.
            </li>
            <li>Mynted는 회원님의 정보를 제3자에게 판매하지 않으며, 플랫폼 외부의 광고 목적으로 사용하지 않습니다.</li>
          </ul>
        ),
      },
      {
        heading: '6. 보관 기간',
        body: (
          <p>
            계정이 활성 상태인 동안 정보를 보관합니다. 회원님이 계정을 비활성화하거나 최고 관리자가 계정을
            비활성화하면 정보는 더 이상 공개되지 않지만, 영구 삭제하기 전까지 합리적인 기간 동안 백업본을 보관할
            수 있습니다.
          </p>
        ),
      },
      {
        heading: '7. 회원님의 권리',
        body: (
          <p>
            코스타리카 법률 제8968호(개인정보 처리에 관한 개인 보호법)에 따라 회원님은 자신의 개인정보에 대한
            열람, 정정, 삭제 및 처리 거부 권리(ARCO 권리)를 가집니다. 이러한 권리는 앱의 문의 채널을 통해
            요청하거나, 해당 기능이 제공되면 프로필에서 직접 정보를 수정하는 방식으로 행사할 수 있습니다.
          </p>
        ),
      },
      {
        heading: '8. 미성년자',
        body: (
          <p>
            Mynted는 만 18세 미만을 대상으로 하지 않습니다. 미성년자의 계정으로 보이는 경우 비활성화할 수 있도록
            연락해 주세요.
          </p>
        ),
      },
      {
        heading: '9. 방침 변경',
        body: (
          <p>
            제공되는 언어 중 하나 이상에서 본 방침을 중대하게 변경하는 경우, 위에 표시된 버전 번호를 업데이트하고
            처음 동의한 언어와 관계없이 다시 동의를 요청합니다.
          </p>
        ),
      },
      {
        heading: '10. 문의',
        body: (
          <p>
            개인정보에 관한 문의는{' '}
            <a href="mailto:myntedstate@gmail.com">myntedstate@gmail.com</a>으로 보내 주세요.
          </p>
        ),
      },
    ],
  },
}
