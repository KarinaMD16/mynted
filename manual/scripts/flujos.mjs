// Flujos que recorre capturas.mjs. Cada uno abre las cuentas que necesita,
// hace los pasos reales en la app y llama a shot() en cada paso a documentar.
import fs from 'node:fs'
import path from 'node:path'
import { ROOT } from './lib.mjs'

export const byRole = (page, role, name, opts = {}) => page.getByRole(role, { name, exact: true, ...opts })

/** Cuenta nueva para el flujo de registro. Se genera una vez y queda en .env (fuera de git). */
export function demoAccount() {
  const envPath = path.join(ROOT, '.env')
  let env = fs.readFileSync(envPath, 'utf8')
  if (!/^DEMO_USER=/m.test(env)) {
    const id = Date.now().toString(36).slice(-5)
    const pass = 'Demo' + Math.random().toString(36).slice(2, 8) + '1!'
    env += `\nDEMO_EMAIL=coleccionista.${id}@example.com\nDEMO_USER=coleccionista_${id}\nDEMO_PASS=${pass}\n`
    fs.writeFileSync(envPath, env)
  }
  const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))[1]
  return { email: get('DEMO_EMAIL'), user: get('DEMO_USER'), pass: get('DEMO_PASS') }
}

export const FLOWS = [
  // ---------------------------------------------------------------- 01
  {
    num: 1,
    slug: 'primeros-pasos',
    async run({ open, shot, BASE }) {
      const page = await open('anon', { fresh: true })
      await page.goto(BASE + '/')
      await shot('aviso-cookies', { mark: page.getByRole('dialog', { name: /Usamos cookies/ }) })
      await byRole(page, 'button', 'Gestionar cookies').click()
      await shot('gestionar-cookies', { mark: page.getByRole('dialog', { name: /Usamos cookies/ }) })
      await byRole(page, 'button', 'Guardar preferencias').click()
      // El aviso de país aparece después de resolver las cookies.
      const shipTo = page.getByRole('dialog', { name: '¿Dónde recibes tus compras?' })
      await shipTo.waitFor({ timeout: 8000 }).catch(() => {})
      if (await shipTo.isVisible()) {
        await shot('pais-de-envio', { mark: shipTo })
        await byRole(shipTo, 'button', 'Confirmar').click()
      }
      await shot('inicio-sin-sesion', { mark: page.getByRole('banner') })
      await page.mouse.wheel(0, 900)
      await shot('inicio-destacados', { wait: 1200 })
      await page.goto(BASE + '/mynted')
      await shot('landing', { wait: 1500 })
    },
  },

  // ---------------------------------------------------------------- 02
  {
    num: 2,
    slug: 'registro',
    async run({ open, shot, BASE, state }) {
      const demo = demoAccount()
      const page = await open('anon')
      await page.goto(BASE + '/login')
      await shot('pantalla-login', { mark: byRole(page, 'button', '¿No tienes una cuenta? Crea una') })
      await byRole(page, 'button', '¿No tienes una cuenta? Crea una').click()
      await page.getByLabel('Correo electrónico').fill(demo.email)
      await page.getByLabel('Nombre de usuario').fill(demo.user)
      await page.getByLabel('Contraseña', { exact: true }).fill(demo.pass)
      await shot('formulario-registro', { mark: byRole(page, 'button', 'Registrarse') })
      await byRole(page, 'button', 'Registrarse').click()

      await page.getByText('Paso 2 de 3').waitFor()
      await shot('paso-intereses')
      const interests = page.locator('button[aria-pressed]')
      for (let i = 0; i < 4; i++) await interests.nth(i).click()
      await page.getByRole('checkbox').check()
      await shot('intereses-elegidos', { mark: byRole(page, 'button', 'Continuar') })
      await byRole(page, 'button', 'Continuar').click()

      await page.getByText('Paso 3 de 3').waitFor()
      await shot('paso-comunidades')
      const communities = page.locator('button[aria-pressed]')
      if ((await communities.count()) > 0) await communities.first().click()
      await shot('comunidades-elegidas', { mark: byRole(page, 'button', 'Continuar') })
      await byRole(page, 'button', 'Continuar').click()
      await page.waitForURL(BASE + '/')
      await shot('inicio-con-sesion', { mark: page.getByRole('banner') })
      state.demo = demo
    },
  },

  // ---------------------------------------------------------------- 03
  {
    num: 3,
    slug: 'sesion',
    async run({ open, shot, BASE }) {
      const demo = demoAccount()
      const page = await open('anon')
      await page.goto(BASE + '/login')
      await page.getByLabel('Usuario o correo electrónico').fill(demo.user)
      await page.getByLabel('Contraseña', { exact: true }).fill('••••••••••')
      await shot('login-completo', { mark: byRole(page, 'button', 'Iniciar sesión') })
      await page.getByLabel('Contraseña', { exact: true }).fill('incorrecta')
      await byRole(page, 'button', 'Iniciar sesión').click()
      await page.waitForTimeout(1500)
      await shot('login-error')
      await byRole(page, 'button', '¿Olvidaste tu contraseña?').click()
      await page.getByLabel('Correo electrónico').fill(demo.email)
      await shot('olvide-contrasena', { mark: byRole(page, 'button', 'Enviar enlace de recuperación') })
      await byRole(page, 'button', 'Enviar enlace de recuperación').click()
      await page.getByText('Revisa tu correo').waitFor()
      await shot('revisa-tu-correo')

      // Cerrar sesión desde el menú de la cuenta
      const buyer = await open('buyer')
      await buyer.goto(BASE + '/')
      await openAccountMenu(buyer, 'buyer')
      await shot('menu-cuenta', { mark: buyer.getByText('Cerrar sesión', { exact: true }) })
    },
  },
  // ---------------------------------------------------------------- 04
  {
    num: 4,
    slug: 'navegacion',
    async run({ open, shot, BASE }) {
      const page = await open('buyer')
      await page.goto(BASE + '/')
      await shot('barra-superior', { mark: page.getByRole('banner').getByRole('navigation') })
      await page.getByRole('banner').getByRole('button', { name: /^Notificaciones/ }).click()
      await shot('notificaciones', { mark: page.getByRole('dialog').first() })
      await page.keyboard.press('Escape')
      await openAccountMenu(page, 'buyer')
      await shot('menu-cuenta', { mark: page.getByRole('dialog').first() })
      await page.keyboard.press('Escape')
      const search = page.getByRole('searchbox', { name: 'Buscar' })
      await search.click()
      await search.fill('pikachu')
      await page.waitForTimeout(1200)
      await shot('busqueda-sugerencias', { mark: search })
      await search.press('Enter')
      await page.waitForURL(/\/search/)
      await shot('busqueda-resultados')
      await page.getByRole('button', { name: 'Abrir mensajes' }).click()
      await shot('boton-mensajes', { wait: 1200 })
    },
  },

  // ---------------------------------------------------------------- 05
  {
    num: 5,
    slug: 'perfil',
    async run({ open, shot, BASE }) {
      const page = await open('buyer')
      await page.goto(BASE + '/profile')
      await shot('mi-perfil', { mark: page.getByRole('group').filter({ has: page.getByRole('button', { name: 'Hilos' }) }) })
      await page.getByRole('heading', { name: /^Insignias/ }).scrollIntoViewIfNeeded()
      await shot('insignias', { mark: page.getByRole('region', { name: /^Insignias/ }) })
      await byRole(page, 'button', 'Compras').click()
      await shot('pestana-compras', { wait: 1200 })
      await page.mouse.wheel(0, -3000)
      // "Editar perfil" lleva a Configuración → Perfil
      await byRole(page, 'button', 'Editar perfil').click()
      await page.waitForURL(/settings/)
      await shot('editar-perfil', { mark: page.getByText('Perfil público').locator('xpath=ancestor::section[1]') })
      await page.goto(BASE + '/profile')
      await byRole(page, 'button', 'Conviértete en vendedor').click()
      await shot('solicitud-vendedor', { mark: page.getByRole('dialog') })
      await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click()

      // Perfil público de otra persona y tienda del vendedor (desde un producto)
      await page.goto(BASE + '/search?q=Funko%20Corner&type=stores')
      await settleSoft(page)
      const storeLink = page.getByRole('main').getByRole('link', { name: /Funko Corner/ }).first()
      await storeLink.click()
      await page.waitForURL(/\/sellers\//)
      await shot('tienda-vendedor')
      await page.getByRole('link', { name: 'Ver perfil del vendedor' }).click()
      await page.waitForURL(/\/users\//)
      await shot('perfil-publico')
    },
  },

  // ---------------------------------------------------------------- 06
  {
    num: 6,
    slug: 'comunidades',
    async run({ open, shot, BASE, state }) {
      const page = await openDemo(open, BASE)
      await page.goto(BASE + '/communities')
      await shot('comunidades', { mark: byRole(page, 'button', 'Crear comunidad') })
      await page.getByRole('link', { name: 'Ver todas' }).last().click()
      await page.waitForURL(/discover-communities/)
      await shot('explorar-comunidades')
      // Comunidad pública a la que el usuario demo todavía no pertenece
      await page.goto(BASE + '/communities/hunter-x-hunter')
      await settleSoft(page)
      if (await byRole(page, 'button', 'Miembro').isVisible()) {
        // Ya se había unido en una corrida anterior: sale para repetir el paso.
        await byRole(page, 'button', 'Miembro').click()
        await page.getByRole('button', { name: 'Salir de la comunidad' }).click()
        await settleSoft(page)
      }
      const join = byRole(page, 'button', 'Unirse')
      await shot('detalle-comunidad', { mark: join })
      await join.click()
      await byRole(page, 'button', 'Miembro').waitFor()
      await shot('ya-eres-miembro', { mark: byRole(page, 'button', 'Miembro') })
      await byRole(page, 'button', 'Miembro').click()
      await shot('salir-comunidad', { mark: page.getByRole('dialog').or(page.getByRole('alertdialog')).first() })
      await page.getByRole('button', { name: 'Cancelar' }).click()
      await byRole(page, 'tab', 'Tienda').click()
      await shot('tienda-comunidad', { mark: byRole(page, 'tab', 'Tienda') })
      // Comunidad privada: se pide unirse
      await page.goto(BASE + '/communities/seed-vault-privada')
      await settleSoft(page)
      await shot('comunidad-privada', { mark: page.getByRole('button', { name: /Solicitar unirme|Solicitud enviada/ }) })
      // Crear comunidad: formulario con vista previa (no se envía)
      await page.goto(BASE + '/communities')
      await byRole(page, 'button', 'Crear comunidad').click()
      const dialog = page.getByRole('dialog')
      await dialog.getByLabel('Nombre de la comunidad').fill('Coleccionistas de Demo')
      await dialog.getByLabel('Descripción').fill('Un espacio para compartir figuras, cartas y hallazgos de colección.')
      await shot('crear-comunidad', { mark: dialog.getByLabel('Nombre de la comunidad') })
      await dialog.getByText('Reglas de la comunidad').scrollIntoViewIfNeeded()
      await shot('crear-comunidad-reglas', { mark: dialog.getByText('Privacidad').first() })
    },
  },
]

const ACCOUNT_NAME = { buyer: 'elein', seller: 'testtuser', mod: 'nayeli', admin: 'elein06' }

/** Abre el menú de la cuenta (botón con el nombre de usuario en el header). */
export async function openAccountMenu(page, role) {
  await page.waitForLoadState('networkidle').catch(() => {})
  const name = ACCOUNT_NAME[role] ?? role
  await page.getByRole('banner').getByRole('button', { name, exact: true }).click()
  await page.waitForTimeout(500)
}

export async function settleSoft(page) {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(600)
}

/** Abre una pestaña sin sesión e inicia sesión con la cuenta demo creada en el flujo de registro. */
export async function openDemo(open, BASE) {
  const demo = demoAccount()
  const page = await open('anon')
  await page.goto(BASE + '/login')
  await page.getByLabel('Usuario o correo electrónico').fill(demo.user)
  await page.getByLabel('Contraseña', { exact: true }).fill(demo.pass)
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
  await page.waitForURL((u) => !u.pathname.startsWith('/login'))
  await settleSoft(page)
  return page
}
