import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url'; import { chromium } from 'playwright'; import { ROOT } from './lib.mjs'
const [out, ...nums] = process.argv.slice(2)
const dir = path.join(ROOT, '.auth', 'preview')
const files = fs.readdirSync(dir).filter((f) => nums.length === 0 || nums.includes(f.match(/\d+/)[0].replace(/^0/, ''))).sort()
const html = `<body style="margin:0;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:8px;background:#555">${files.map((f) => `<img style="width:100%" src="${pathToFileURL(path.join(dir, f))}">`).join('')}</body>`
const tmp = path.join(ROOT, '.auth', 'hoja-pdf.html'); fs.writeFileSync(tmp, html)
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto(pathToFileURL(tmp).href); await p.waitForTimeout(500); await p.screenshot({ path: out, fullPage: true }); await b.close()
