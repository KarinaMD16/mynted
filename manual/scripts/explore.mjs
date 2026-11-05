// Exploración: node scripts/explore.mjs <rol|anon> <outdir> ruta1 ruta2 ...
import { launch, newContext, BASE, login } from './lib.mjs'
import fs from 'node:fs'
const [role, out, ...routes] = process.argv.slice(2)
const browser = await launch()
const r = role === 'anon' ? undefined : role
if (r && !fs.existsSync(`.auth/${r}.json`)) await login(browser, r)
const ctx = await newContext(browser, r)
const page = await ctx.newPage()
for (const [i, route] of routes.entries()) {
  await page.goto(BASE + route)
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(1500)
  const snap = await page.locator('body').ariaSnapshot()
  console.log(`\n===== ${route} -> ${page.url()}\n` + snap.split('\n').slice(0, 120).join('\n'))
  const name = `${role}_${i}_${route.replace(/[^a-z0-9]+/gi, '_')}.png`
  await page.screenshot({ path: `${out}/${name}` })
}
await browser.close()
