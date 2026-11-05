// Genera manual/manual.html a partir de contenido.mjs + capturas/manifest.json
// y lo exporta a manual/Manual-de-usuario-Mynted.pdf con Playwright.
//
// La paginación se arma aquí mismo (cada .page es una hoja A4), así el índice
// puede llevar los números de página exactos. Al final se comprueba que
// ningún contenido se haya salido de su hoja.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { ROOT } from './lib.mjs'
import { FAQ, INTRO, PORTADA, SECCIONES } from '../contenido.mjs'

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'capturas', 'manifest.json'), 'utf8'))
const STEPS_PER_PAGE = 2
const FAQ_PER_PAGE = 8

// ---------------------------------------------------------------- datos
const faltan = []
const secciones = SECCIONES.map((s, i) => {
  const capturas = Object.entries(manifest)
    .filter(([, v]) => v.flow === s.flujo)
    .sort((a, b) => a[1].step - b[1].step)
  const ids = capturas.map(([k]) => k.split('/')[1])
  for (const id of Object.keys(s.pasos)) if (!ids.includes(id)) faltan.push(`${s.flujo}/${id} (texto sin captura)`)
  for (const id of ids) if (!s.pasos[id]) faltan.push(`${s.flujo}/${id} (captura sin texto)`)
  const pasos = capturas.map(([k, v]) => ({ img: `.auth/jpg/${v.file.replace('.png', '.jpg')}`, png: v.file, texto: s.pasos[k.split('/')[1]] }))
  return { ...s, num: i + 1, pasos }
})
if (faltan.length) {
  console.error('Pasos y capturas no coinciden:\n  ' + faltan.join('\n  '))
  process.exit(1)
}

// ---------------------------------------------------------------- paginación
const pages = [] // { kind, ... } en orden; el número de página es el índice + 1
pages.push({ kind: 'cover' })
pages.push({ kind: 'intro' })
pages.push({ kind: 'toc' })
for (const s of secciones) {
  s.page = pages.length + 1
  // Primera hoja: título + 1 paso; las siguientes: 2 pasos.
  pages.push({ kind: 'section', s, pasos: s.pasos.slice(0, 1), from: 0, first: true })
  for (let i = 1; i < s.pasos.length; i += STEPS_PER_PAGE) {
    pages.push({ kind: 'section', s, pasos: s.pasos.slice(i, i + STEPS_PER_PAGE), from: i })
  }
}
const faqPage = pages.length + 1
for (let i = 0; i < FAQ.length; i += FAQ_PER_PAGE) pages.push({ kind: 'faq', items: FAQ.slice(i, i + FAQ_PER_PAGE), first: i === 0, from: i })
const total = pages.length

// ---------------------------------------------------------------- HTML
const footer = (n) =>
  `<footer><span>Mynted · Manual de usuario</span><span>${n} / ${total}</span></footer>`

function renderPage(p, n) {
  if (p.kind === 'cover') {
    return `<section class="page cover">
      <div class="cover-band"></div>
      <img class="cover-logo" src="assets/logo-mynted.png" alt="Mynted">
      <p class="eyebrow">${PORTADA.curso}</p>
      <h1>${PORTADA.titulo}</h1>
      <p class="cover-sub">${PORTADA.subtitulo}</p>
      <img class="cover-shot" src="${secciones[0].pasos[4].img}" alt="Página de presentación de Mynted">
      <p class="cover-authors">${PORTADA.autores}</p>
      <p class="cover-date">Noviembre de 2026</p>
    </section>`
  }
  if (p.kind === 'intro') {
    return `<section class="page">
      <h2 class="page-title">${INTRO.titulo}</h2>
      ${INTRO.parrafos.map((t) => `<p class="lead">${t}</p>`).join('')}
      <h3>Tipos de cuenta</h3>
      <table class="roles">${INTRO.roles.map(([r, d]) => `<tr><th>${r}</th><td>${d}</td></tr>`).join('')}</table>
      <div class="note">${INTRO.nota}</div>
      <h3>Cómo leer cada sección</h3>
      <ul class="howto">
        <li>Cada sección corresponde a una tarea (por ejemplo, «Comprar» o «Publicar un producto») e indica <b>quién</b> puede hacerla.</li>
        <li>Los pasos están numerados y van en orden. Debajo de cada paso está la captura de esa pantalla.</li>
        <li>El <b>recuadro rojo</b> marca el botón o la zona que se usa en ese paso.</li>
      </ul>
      ${footer(n)}
    </section>`
  }
  if (p.kind === 'toc') {
    return `<section class="page">
      <h2 class="page-title">Índice</h2>
      <ol class="toc">
        <li><a href="#intro"><span>Antes de empezar</span><i></i><b>2</b></a></li>
        ${secciones
          .map((s) => `<li><a href="#s${s.num}"><span><em>${s.num}.</em> ${s.titulo}</span><i></i><b>${s.page}</b></a></li>`)
          .join('')}
        <li><a href="#faq"><span>Preguntas frecuentes</span><i></i><b>${faqPage}</b></a></li>
      </ol>
      ${footer(n)}
    </section>`
  }
  if (p.kind === 'section') {
    const { s } = p
    const head = p.first
      ? `<header class="sec-head" id="s${s.num}">
          <p class="eyebrow">Sección ${s.num}</p>
          <h2>${s.titulo}</h2>
          <p class="who"><b>Quién:</b> ${s.quien}</p>
          <p class="sec-intro">${s.intro}</p>
        </header>`
      : `<p class="running">${s.num}. ${s.titulo} <span>(continuación)</span></p>`
    const steps = p.pasos
      .map(
        (st, i) => `<article class="step">
          <div class="step-text"><span class="badge">${p.from + i + 1}</span><p>${st.texto}</p></div>
          <img src="${st.img}" alt="">
        </article>`,
      )
      .join('')
    return `<section class="page">${head}${steps}${footer(n)}</section>`
  }
  if (p.kind === 'faq') {
    return `<section class="page">
      ${p.first ? '<h2 class="page-title" id="faq">Preguntas frecuentes</h2>' : '<p class="running">Preguntas frecuentes <span>(continuación)</span></p>'}
      <dl class="faq">${p.items.map(([q, a]) => `<dt>${q}</dt><dd>${a}</dd>`).join('')}</dl>
      ${footer(n)}
    </section>`
  }
  return ''
}

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>Manual de usuario · Mynted</title>
<style>
  @page { size: A4; margin: 0; }
  :root { --orange: #ff8a4c; --blue: #2f5bff; --ink: #1d1d1f; --gray: #5f6368; --line: #e6e2dc; --bg: #faf8f5; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #ccc; }
  img { image-rendering: auto; }
  body { font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; color: var(--ink); font-size: 10.5pt; line-height: 1.45; }
  .page { width: 210mm; height: 297mm; padding: 16mm 18mm 18mm; margin: 0 auto 6mm; background: #fff; position: relative; overflow: hidden; page-break-after: always; break-after: page; }
  @media print { html, body { background: #fff; } .page { margin: 0; } }
  footer { position: absolute; left: 18mm; right: 18mm; bottom: 9mm; display: flex; justify-content: space-between; font-size: 8.5pt; color: var(--gray); border-top: 1px solid var(--line); padding-top: 2.5mm; }
  b { font-weight: 650; }
  .eyebrow { margin: 0; font-size: 9pt; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--orange); }
  .page-title { font-size: 22pt; margin: 0 0 6mm; }
  h3 { font-size: 13pt; margin: 7mm 0 3mm; }
  .lead { margin: 0 0 3.5mm; font-size: 11pt; }

  /* portada */
  .cover { padding: 0; display: flex; flex-direction: column; align-items: center; text-align: center; background: var(--bg); }
  .cover-band { position: absolute; inset: 0 0 auto 0; height: 70mm; background: linear-gradient(120deg, var(--blue), #6b8bff); }
  .cover-logo { position: relative; width: 70mm; margin-top: 40mm; padding: 6mm 9mm; background: #fff; border-radius: 8mm; box-shadow: 0 6px 20px rgba(0,0,0,.18); }
  .cover .eyebrow { margin-top: 10mm; }
  .cover h1 { font-size: 38pt; margin: 3mm 0 1mm; }
  .cover-sub { font-size: 14pt; color: var(--gray); margin: 0 0 10mm; }
  .cover-shot { width: 150mm; border-radius: 4mm; border: 1px solid var(--line); box-shadow: 0 10px 30px rgba(0,0,0,.12); }
  .cover-authors { margin: 12mm 20mm 1mm; font-size: 10.5pt; }
  .cover-date { margin: 0; color: var(--gray); font-size: 10pt; }

  /* intro */
  .roles { width: 100%; border-collapse: collapse; }
  .roles th, .roles td { text-align: left; vertical-align: top; padding: 2.5mm 3mm; border-bottom: 1px solid var(--line); }
  .roles th { width: 38mm; color: var(--blue); }
  .note { margin-top: 6mm; padding: 4mm 5mm; border-radius: 3mm; background: #fff4df; border: 1px solid #f6d38f; }
  .howto { padding-left: 5mm; margin: 0; } .howto li { margin-bottom: 2mm; }

  /* índice */
  .toc { list-style: none; padding: 0; margin: 0; font-size: 12pt; }
  .toc a { display: flex; align-items: baseline; gap: 2mm; color: inherit; text-decoration: none; padding: 2.4mm 0; }
  .toc em { font-style: normal; color: var(--orange); font-weight: 700; display: inline-block; width: 8mm; }
  .toc i { flex: 1; border-bottom: 1.5px dotted #bbb; transform: translateY(-1mm); }
  .toc b { min-width: 8mm; text-align: right; }

  /* secciones */
  .sec-head { border-left: 4px solid var(--orange); padding: 1mm 0 1mm 5mm; margin-bottom: 6mm; }
  .sec-head h2 { font-size: 21pt; margin: 1mm 0 2mm; }
  .who { margin: 0 0 2mm; display: inline-block; background: #eef2ff; color: #2338a8; border-radius: 99px; padding: 1mm 4mm; font-size: 9.5pt; }
  .sec-intro { margin: 0; color: var(--gray); font-size: 11pt; }
  .running { margin: 0 0 5mm; font-size: 9.5pt; font-weight: 700; color: var(--gray); }
  .running span { font-weight: 400; }
  .step { margin-bottom: 7mm; break-inside: avoid; }
  .step-text { display: flex; gap: 3mm; align-items: flex-start; margin-bottom: 2.5mm; }
  .step-text p { margin: 0; font-size: 10.5pt; }
  .badge { flex: none; width: 7mm; height: 7mm; border-radius: 50%; background: var(--orange); color: #fff; font-weight: 700; font-size: 9.5pt; display: grid; place-items: center; }
  .step img { display: block; width: 160mm; margin-left: 10mm; border: 1px solid var(--line); border-radius: 2mm; }

  /* faq */
  .faq { margin: 0; }
  .faq dt { font-weight: 700; font-size: 11pt; margin-top: 5mm; color: var(--blue); }
  .faq dd { margin: 1.5mm 0 0; }
</style></head>
<body>
${pages.map((p, i) => renderPage(p, i + 1)).join('\n').replace('<section class="page">\n      <h2 class="page-title">Antes', '<section class="page" id="intro">\n      <h2 class="page-title">Antes')}
</body></html>`

const htmlPath = path.join(ROOT, 'manual.html')
fs.writeFileSync(htmlPath, html)

// ---------------------------------------------------------------- PDF
const browser = await chromium.launch()
// Copias JPEG de las capturas solo para el PDF (las PNG originales quedan en capturas/).
const jpgDir = path.join(ROOT, '.auth', 'jpg')
fs.mkdirSync(jpgDir, { recursive: true })
const conv = await browser.newPage({ viewport: { width: 1440, height: 900 } })
for (const s of secciones) {
  for (const st of s.pasos) {
    await conv.goto(pathToFileURL(path.join(ROOT, 'capturas', st.png)).href)
    await conv.screenshot({ path: path.join(jpgDir, st.png.replace('.png', '.jpg')), type: 'jpeg', quality: 85 })
  }
}
await conv.close()
const page = await browser.newPage()
await page.goto(pathToFileURL(htmlPath).href)
await page.emulateMedia({ media: 'print' })
await page.waitForFunction(() => [...document.images].every((img) => img.complete))
const desbordes = await page.$$eval('.page', (els) =>
  els
    .map((el, i) => ({ n: i + 1, sobra: el.scrollHeight - el.clientHeight }))
    .filter((x) => x.sobra > 1),
)
if (desbordes.length) console.warn('⚠ Hojas con contenido que no entra:', desbordes)
const pdfPath = path.join(ROOT, 'Manual-de-usuario-Mynted.pdf')
await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, preferCSSPageSize: true })

// Vista previa de algunas hojas en PNG (para revisar sin abrir el PDF)
if (process.argv.includes('--preview')) {
  const out = path.join(ROOT, '.auth', 'preview')
  fs.mkdirSync(out, { recursive: true })
  await page.emulateMedia({ media: 'screen' })
  await page.setViewportSize({ width: 794, height: 1123 })
  const els = await page.$$('.page')
  for (const [i, el] of els.entries()) await el.screenshot({ path: path.join(out, `hoja-${String(i + 1).padStart(2, '0')}.png`) })
}
await browser.close()
console.log(`PDF: ${pdfPath} (${total} páginas)`)
