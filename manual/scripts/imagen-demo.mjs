// Genera la imagen del producto de ejemplo (assets/figura-demo.png) sin descargar nada.
import { chromium } from 'playwright'
import path from 'node:path'
import { ROOT } from './lib.mjs'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 800, height: 800 } })
await p.setContent(`<body style="margin:0;width:800px;height:800px;display:grid;place-items:center;
  background:radial-gradient(circle at 30% 25%,#ffe8a3,#ff9a6b 55%,#e2574c);font-family:sans-serif">
  <svg width="520" height="620" viewBox="0 0 520 620">
    <rect x="40" y="60" width="440" height="540" rx="28" fill="#2f5bff"/>
    <rect x="70" y="150" width="380" height="380" rx="20" fill="#dfe7ff"/>
    <ellipse cx="260" cy="500" rx="120" ry="18" fill="#9fb2f5"/>
    <circle cx="260" cy="270" r="80" fill="#fff"/><rect x="215" y="300" width="90" height="190" rx="45" fill="#fff"/>
    <circle cx="232" cy="255" r="10" fill="#222"/><circle cx="288" cy="255" r="10" fill="#222"/>
    <path d="M240 290 q20 22 40 0 z" fill="#ff8a3d"/>
    <text x="260" y="118" text-anchor="middle" font-size="42" font-weight="700" fill="#fff">MYNTED</text>
    <text x="260" y="570" text-anchor="middle" font-size="26" fill="#fff">Figura de colección · Edición limitada</text>
  </svg></body>`)
await p.screenshot({ path: path.join(ROOT, 'assets', 'figura-demo.png') })
await b.close()
