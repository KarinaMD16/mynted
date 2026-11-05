// node scripts/links.mjs <rol> <ruta> <regex href>
import { launch, newContext, BASE } from './lib.mjs'
const [role, route, re] = process.argv.slice(2)
const b = await launch(); const ctx = await newContext(b, role); const p = await ctx.newPage()
await p.goto(BASE + route); await p.waitForLoadState('networkidle'); await p.waitForTimeout(1000)
const links = await p.$$eval('a', (as) => as.map((a) => [a.getAttribute('href'), a.innerText.replace(/\s+/g, ' ').slice(0, 60)]))
for (const [h, t] of links) if (h && new RegExp(re).test(h)) console.log(h, '|', t)
await b.close()
