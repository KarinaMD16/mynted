import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.resolve(__dirname, '..')

// Carga manual/.env (credenciales de prueba, fuera de git)
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}
export const BASE = process.env.BASE_URL ?? 'http://localhost:5173'
export const ROLES = {
  admin: { user: process.env.ADMIN_USER, pass: process.env.ADMIN_PASS },
  buyer: { user: process.env.BUYER_USER, pass: process.env.BUYER_PASS },
  seller: { user: process.env.SELLER_USER, pass: process.env.SELLER_PASS },
  mod: { user: process.env.MOD_USER, pass: process.env.MOD_PASS },
}
export const VIEWPORT = { width: 1440, height: 900 }
const AUTH_DIR = path.join(ROOT, '.auth')

// Cookies aceptadas de antemano + idioma español, para que el banner no tape las capturas.
export async function newContext(browser, role, { fresh = false } = {}) {
  const statePath = role ? path.join(AUTH_DIR, `${role}.json`) : undefined
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    locale: 'es-CR',
    deviceScaleFactor: 1,
    storageState: statePath && fs.existsSync(statePath) ? statePath : undefined,
  })
  await prepare(ctx, { fresh })
  return ctx
}

export async function prepare(ctx, { fresh = false } = {}) {
  await ctx.addCookies([...(fresh ? [] : [{
    name: 'mynted_cookie_consent',
    value: encodeURIComponent(JSON.stringify({ consent: true, marketing: false })),
    url: BASE,
  }]), {
    // Idioma elegido "a mano" en este navegador: gana sobre el de la cuenta
    // sin modificar la cuenta de prueba.
    name: 'mynted_language',
    value: encodeURIComponent(JSON.stringify('es')),
    url: BASE,
  }])
  if (!fresh) {
    await ctx.addInitScript(() => {
      try { sessionStorage.setItem('mynted_shipto_dismissed', '1') } catch {}
    })
  }
}

export async function login(browser, role) {
  fs.mkdirSync(AUTH_DIR, { recursive: true })
  const ctx = await browser.newContext({ viewport: VIEWPORT, locale: 'es-CR' })
  await prepare(ctx)
  const page = await ctx.newPage()
  await page.goto(BASE + '/login')
  await page.getByLabel('Usuario o correo electrónico').fill(ROLES[role].user)
  await page.getByLabel('Contraseña', { exact: true }).fill(ROLES[role].pass)
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).last().click()
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 })
  await page.waitForLoadState('networkidle')
  await ctx.storageState({ path: path.join(AUTH_DIR, `${role}.json`) })
  await ctx.close()
}

export async function launch() {
  return chromium.launch({ headless: true })
}
