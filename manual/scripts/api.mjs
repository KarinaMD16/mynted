// node scripts/api.mjs <rol> <GET path>
import { request } from 'playwright'
const [role, p] = process.argv.slice(2)
const ctx = await request.newContext({ baseURL: 'http://localhost:3000', storageState: `.auth/${role}.json` })
const r = await ctx.get(p)
console.log(r.status(), JSON.stringify(await r.json().catch(() => null), null, 0).slice(0, Number(process.env.MAX ?? 6000)))
await ctx.dispose()
