// Recorre los flujos de Mynted y guarda una captura por paso en manual/capturas.
//
// Requisitos: frontend en http://localhost:5173 y backend en http://localhost:3000,
// y las cuentas de prueba en manual/.env (ver .env.example de esta carpeta).
//
// Uso:
//   node scripts/capturas.mjs              -> todos los flujos, en orden
//   node scripts/capturas.mjs foro compra  -> solo esos flujos (por slug)
//
// Las capturas se llaman <sección>-<paso>-<descripción>.png, así quedan ordenadas.
// manifest.json guarda qué captura corresponde a cada paso (lo usa el generador del PDF).
import fs from 'node:fs'
import path from 'node:path'
import { BASE, ROOT, launch, login, newContext } from './lib.mjs'
import { FLOWS as A } from './flujos.mjs'
import { FLOWS as B } from './flujos-b.mjs'
const FLOWS = [...A, ...B].sort((x, y) => x.num - y.num)

const OUT = path.join(ROOT, 'capturas')
const MANIFEST = path.join(OUT, 'manifest.json')
const STATE = path.join(ROOT, '.auth', 'estado.json') // datos que un flujo deja para otro (ids, usuario demo…)

fs.mkdirSync(OUT, { recursive: true })
const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {}
const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {}
const saveState = () => fs.writeFileSync(STATE, JSON.stringify(state, null, 2))

const wanted = process.argv.slice(2)
const flows = wanted.length ? FLOWS.filter((f) => wanted.includes(f.slug)) : FLOWS
if (wanted.length && flows.length !== wanted.length) {
  console.error('Flujos desconocidos. Disponibles:', FLOWS.map((f) => f.slug).join(', '))
  process.exit(1)
}

const browser = await launch()
for (const role of ['buyer', 'seller', 'mod', 'admin']) await login(browser, role)

let current = null
/**
 * Abre una pestaña con la sesión del rol (o sin sesión con 'anon') y la deja
 * como pestaña actual para shot(). `fresh: true` = navegador "nuevo", sin la
 * cookie de consentimiento (para capturar el aviso de cookies).
 */
async function open(role, { fresh = false } = {}) {
  const ctx = await newContext(browser, role === 'anon' ? undefined : role, { fresh })
  const page = await ctx.newPage()
  page.setDefaultTimeout(15000)
  current = page
  return page
}
/** Cambia la pestaña actual (cuando un flujo alterna entre dos cuentas). */
const use = (page) => (current = page)

/** Espera a que la pantalla termine de cargar (red quieta, sin loaders, animaciones terminadas). */
async function settle(page, ms = 700) {
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
  await page
    .waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 8000 })
    .catch(() => {})
  await page.waitForTimeout(ms)
}

let failures = 0
for (const flow of flows) {
  const num = String(flow.num).padStart(2, '0')
  // Borra las capturas viejas de este flujo para no dejar pasos huérfanos.
  for (const f of fs.readdirSync(OUT)) if (f.startsWith(num + '-')) fs.rmSync(path.join(OUT, f))
  for (const k of Object.keys(manifest)) if (manifest[k].flow === flow.slug) delete manifest[k]

  let step = 0
  /**
   * Captura el viewport (1440x900). `mark` resalta con un borde el elemento sobre
   * el que hay que actuar en ese paso; `scrollTo` lo centra antes de capturar.
   */
  async function shot(id, { mark, scrollTo, page, wait = 700, fullPage = false } = {}) {
    step += 1
    const p = page ?? current
    await settle(p, wait)
    // Oculta los avisos emergentes (insignias, etc.) para que no tapen la pantalla.
    await p.addStyleTag({ content: '[data-sonner-toaster]{display:none!important}' }).catch(() => {})
    const target = scrollTo ?? mark
    if (target) await target.first().scrollIntoViewIfNeeded().catch(() => {})
    if (target) await p.waitForTimeout(300)
    const marked = mark ? await mark.first().elementHandle().catch(() => null) : null
    if (marked) {
      await marked.evaluate((el) => {
        el.dataset.prevOutline = el.style.outline
        el.style.outline = '3px solid #e5484d'
        el.style.outlineOffset = '3px'
        el.style.borderRadius ||= '8px'
      })
    }
    const file = `${num}-${String(step).padStart(2, '0')}-${id}.png`
    await p.screenshot({ path: path.join(OUT, file), fullPage })
    if (marked) await marked.evaluate((el) => (el.style.outline = el.dataset.prevOutline ?? '')).catch(() => {})
    manifest[`${flow.slug}/${id}`] = { file, flow: flow.slug, step, url: p.url().replace(BASE, '') }
    console.log('  ✓', file)
  }

  console.log(`\n▶ ${num} ${flow.slug}`)
  try {
    await flow.run({ open, use, shot, settle, state, saveState, BASE })
  } catch (err) {
    failures += 1
    console.error(`  ✗ ${flow.slug}:`, err.message.split('\n').slice(0, 6).join('\n'))
    if (current) await current.screenshot({ path: path.join(ROOT, '.auth', `error-${flow.slug}.png`) }).catch(() => {})
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2))
  saveState()
}

await browser.close()
console.log(failures ? `\n${failures} flujo(s) con errores` : '\nListo.')
process.exit(failures ? 1 : 0)
