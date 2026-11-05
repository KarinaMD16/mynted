// Hoja de contactos para revisar capturas: node scripts/hoja.mjs <salida.png> <prefijo>
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { ROOT } from './lib.mjs'
const [out, prefix = ''] = process.argv.slice(2)
const dir = path.join(ROOT, 'capturas')
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png') && new RegExp('^' + prefix).test(f)).sort()
const html = `<body style="margin:0;font:12px sans-serif;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:6px;background:#333">${files
  .map((f) => `<figure style="margin:0;background:#fff"><img style="width:100%;display:block" src="${pathToFileURL(path.join(dir, f))}"><figcaption style="padding:2px 4px">${f}</figcaption></figure>`)
  .join('')}</body>`
const tmp = path.join(ROOT, '.auth', 'hoja.html')
fs.writeFileSync(tmp, html)
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1500, height: 800 } })
await p.goto(pathToFileURL(tmp).href)
await p.waitForTimeout(500)
await p.screenshot({ path: out, fullPage: true })
await b.close()
console.log(files.length, 'capturas')
