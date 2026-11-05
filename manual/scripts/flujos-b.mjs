// Flujos 7 en adelante: foro, marketplace, venta, chat, compra, pedido, reseñas,
// moderación, administración, Pro y configuración.
import path from 'node:path'
import { ROOT } from './lib.mjs'
import { byRole, openAccountMenu, openDemo, settleSoft } from './flujos.mjs'

export const FLOWS = [
  // ---------------------------------------------------------------- 07
  {
    num: 7,
    slug: 'foro',
    async run({ open, shot, BASE, state }) {
      const page = await openDemo(open, BASE)
      await page.goto(BASE + '/explore?tab=talk')
      await shot('talk', { mark: page.getByRole('tab', { selected: true }) })
      await page.goto(BASE + '/communities/seed-pokemon-tcg-latam')
      await settleSoft(page)
      await shot('foro-comunidad', { mark: byRole(page, 'button', 'Crear publicación') })
      await byRole(page, 'button', 'Crear publicación').click()
      const dialog = page.getByRole('dialog')
      await dialog.getByLabel('Título').fill('¿Cómo guardan sus cartas holográficas?')
      await dialog.getByLabel('Contenido').fill(
        'Estoy empezando mi colección y quiero protegerlas bien. ¿Usan fundas dobles, carpetas o cajas? ¡Gracias!',
      )
      await dialog.locator('button[aria-pressed]').first().click()
      await shot('nueva-publicacion', { mark: byRole(dialog, 'button', 'Publicar') })
      await byRole(dialog, 'button', 'Publicar').click()
      await dialog.waitFor({ state: 'hidden' })
      await shot('publicacion-creada', { mark: page.getByRole('article').first() })
      await page.getByRole('link', { name: '¿Cómo guardan sus cartas holográficas?' }).first().click()
      await page.waitForURL(/\/posts\//)
      state.demoPostUrl = page.url()
      await shot('detalle-publicacion')
      const replyBox = page.getByPlaceholder('Escribe una respuesta…').first()
      await replyBox.fill('Yo uso fundas dobles y una carpeta con anillas, ¡funciona muy bien!')
      await shot('escribir-respuesta', { mark: replyBox })
      await byRole(page, 'button', 'Enviar').first().click()
      await page.waitForTimeout(1500)
      await shot('respuesta-publicada')
      const up = page.getByRole('button', { name: 'Votar a favor' }).first()
      if ((await up.getAttribute('aria-pressed')) !== 'true') await up.click()
      const save = page.getByRole('button', { name: /^(Guardar|Quitar de guardados)$/ }).first()
      if ((await save.getAttribute('aria-pressed')) !== 'true') await save.click()
      await shot('votar-y-guardar', { mark: up.locator('xpath=..') })
    },
  },

  // ---------------------------------------------------------------- 08
  {
    num: 8,
    slug: 'marketplace',
    async run({ open, shot, BASE }) {
      const page = await open('buyer')
      await page.goto(BASE + '/explore')
      await shot('explorar-tienda', { mark: page.getByRole('complementary', { name: 'Filtros' }) })
      await page.getByRole('group', { name: 'Tipo' }).getByRole('button', { name: 'Venta' }).click()
      await page.getByRole('group', { name: 'Condición' }).getByRole('button', { name: 'Como nuevo' }).click()
      await shot('filtros-aplicados', { mark: page.getByRole('complementary', { name: 'Filtros' }) })
      await page.goto(BASE + '/')
      await settleSoft(page)
      await page.getByRole('link', { name: /Ver todo/ }).first().click()
      await page.waitForURL(/\/shop\/tag\//)
      await shot('ver-todo-etiqueta')
      await page.goto(BASE + '/explore')
      await settleSoft(page)
      await page.getByRole('main').getByRole('article').getByRole('link').first().click()
      await page.waitForURL(/\/products\//)
      await shot('detalle-producto', { mark: byRole(page, 'button', 'Contactar vendedor') })
      const fav = page.getByRole('main').getByRole('button', { name: /^(Agregar a|Quitar de) favoritos$/ }).first()
      if ((await fav.getAttribute('aria-label'))?.startsWith('Agregar')) await fav.click()
      await shot('agregar-favorito', { mark: fav })
      await page.mouse.wheel(0, 1100)
      await shot('detalle-mas-abajo', { wait: 1000 })
      await page.goto(BASE + '/favorites')
      await shot('mis-favoritos')
    },
  },

  // ---------------------------------------------------------------- 09
  {
    num: 9,
    slug: 'vender',
    async run({ open, shot, BASE, state }) {
      const page = await open('seller')
      await page.goto(BASE + '/my-products')
      await shot('mis-productos', { mark: byRole(page, 'button', 'Publicar producto') })
      await shot('comision', {
        mark: page.getByRole('heading', { name: 'Tu comisión' }).locator('xpath=ancestor::section[1]'),
      })
      await page.goto(BASE + '/products/new')
      await settleSoft(page)
      await shot('formulario-vacio')
      const title = 'Figura Ganso Mynted edición limitada'
      await page
        .locator('input[type="file"]')
        .first()
        .setInputFiles(path.join(ROOT, 'assets', 'figura-demo.png'))
      await page.getByRole('combobox', { name: 'Comunidad' }).click()
      await page.getByRole('option', { name: 'My Little Pony Collectors MX' }).click()
      await page.getByLabel('Título', { exact: true }).fill(title)
      await page.getByLabel('Precio (USD)').fill('35')
      await page.getByLabel('Unidades disponibles').fill('5')
      await byRole(page, 'radio', 'Nuevo').click()
      await shot('datos-basicos', { mark: page.getByLabel('Título', { exact: true }) })
      const tags = page.getByRole('group', { name: 'Etiquetas' })
      for (const t of ['Coleccionismo', 'Funko Pop', 'My Little Pony']) await byRole(tags, 'button', t).click()
      await page
        .getByLabel('Descripción')
        .fill('Figura de vinilo de 15 cm con su caja original, nunca abierta. Ideal para coleccionistas.')
      await page.getByRole('combobox').filter({ hasText: 'Agregar un país' }).click()
      await page.keyboard.type('Costa')
      await page.getByRole('option', { name: /Costa Rica/ }).click()
      await shot('etiquetas-y-envio', { mark: tags })
      await byRole(page, 'button', 'Publicar').click()
      await page.getByText('¡Tu producto ya está publicado!').waitFor()
      await shot('producto-publicado')
      await page.goto(BASE + '/my-products')
      await settleSoft(page)
      const link = page.getByRole('link', { name: title }).first()
      const href = await link.getAttribute('href')
      state.productId = Number(href.match(/\/products\/(\d+)/)[1])
      state.productTitle = title
      await shot('producto-en-panel', { mark: link.locator('xpath=ancestor::article[1]') })
      await page.goto(BASE + `/products/${state.productId}/edit`)
      await shot('editar-producto')
    },
  },

  // ---------------------------------------------------------------- 10
  {
    num: 10,
    slug: 'chat',
    async run({ open, use, shot, BASE, state }) {
      const buyer = await open('buyer')
      await buyer.goto(BASE + `/products/${state.productId}`)
      await settleSoft(buyer)
      await byRole(buyer, 'button', 'Contactar vendedor').click()
      const composer = buyer.getByPlaceholder('Escribe un mensaje…')
      await composer.waitFor()
      await shot('chat-abierto', { mark: buyer.getByRole('group', { name: 'Preguntas rápidas' }).or(composer).first() })
      await composer.fill('¡Hola! ¿Sigue disponible? Me interesa una unidad con envío a San José.')
      await shot('escribir-mensaje', { mark: composer })
      await composer.press('Enter')
      await buyer.waitForTimeout(1500)
      await shot('mensaje-enviado')

      const seller = await open('seller')
      await seller.goto(BASE + '/messages')
      await settleSoft(seller)
      await shot('bandeja-vendedor', { mark: seller.getByRole('link', { name: new RegExp(state.productTitle) }).first() })
      await seller.getByRole('link', { name: new RegExp(state.productTitle) }).first().click()
      await seller.waitForURL(/\/messages\/\d+/)
      state.conversationUrl = seller.url().replace(BASE, '')
      const sellerComposer = seller.getByPlaceholder('Escribe un mensaje…')
      await sellerComposer.fill('¡Hola! Sí, está disponible y envío a todo Costa Rica. Puedes comprarla desde aquí.')
      await sellerComposer.press('Enter')
      await seller.waitForTimeout(1500)
      await shot('respuesta-vendedor')

      use(buyer)
      await buyer.goto(BASE + state.conversationUrl)
      await settleSoft(buyer)
      await shot('vendedor-respondio', { mark: buyer.getByRole('main').getByText('Comprar', { exact: true }).last() })
    },
  },

  // ---------------------------------------------------------------- 11
  {
    num: 11,
    slug: 'compra',
    async run({ open, shot, BASE, state }) {
      const page = await open('buyer')
      await page.goto(BASE + state.conversationUrl)
      await settleSoft(page)
      await page.getByRole('main').getByText('Comprar', { exact: true }).last().click()
      await page.waitForURL(/\/checkout\//)
      await shot('checkout', { mark: page.getByText('Pago simulado: no se realizan cargos reales.') })
      await page.getByLabel('Nombre de quien recibe').fill('Elein Rodríguez')
      await page.getByLabel('Teléfono').fill('8888 0000')
      const country = page.getByRole('combobox', { name: 'País' })
      if (!(await country.textContent()).includes('Costa Rica')) {
        await country.click()
        await page.getByRole('option', { name: /Costa Rica/ }).click()
      }
      await page.getByLabel('Provincia o estado').fill('San José')
      await page.getByLabel('Ciudad').fill('San Pedro')
      await page.getByLabel('Dirección', { exact: true }).fill('Avenida Central, casa 12')
      await page.getByLabel('Código postal').fill('11501')
      await shot('direccion-envio', { mark: page.getByText('Dirección de envío').locator('xpath=ancestor::section[1]') })
      await page.getByText('Ver tarjetas de prueba').click()
      await shot('tarjetas-prueba', { mark: page.getByText('Ver tarjetas de prueba').locator('xpath=..') })
      await page.getByLabel('Número de tarjeta').fill('4242424242424242')
      await page.getByLabel('Vencimiento').fill('1230')
      await page.getByLabel('CVV').fill('123')
      await page.getByLabel('Nombre del titular').fill('Elein Rodriguez')
      await shot('datos-tarjeta', { mark: byRole(page, 'button', 'Pagar') })
      await byRole(page, 'button', 'Pagar').click()
      await page.getByText('¡Compra realizada!').waitFor({ timeout: 30000 })
      state.receiptUrl = page.url().replace(BASE, '')
      await shot('compra-realizada')
      await page.goto(BASE + '/compras')
      await shot('mis-compras')
    },
  },

  // ---------------------------------------------------------------- 12
  {
    num: 12,
    slug: 'pedido',
    async run({ open, use, shot, BASE, state }) {
      const seller = await open('seller')
      await seller.goto(BASE + '/ventas')
      await shot('mis-ventas', { mark: seller.getByRole('table').getByRole('row').nth(1) })
      await seller.goto(BASE + state.receiptUrl)
      await settleSoft(seller)
      await shot('venta-recibo', { mark: byRole(seller, 'button', 'Marcar como enviado') })
      await byRole(seller, 'button', 'Marcar como enviado').click()
      const dialog = seller.getByRole('dialog')
      await dialog.getByLabel('Empresa de envío (opcional)').fill('Correos de Costa Rica')
      await dialog.getByLabel('Número de guía').fill('CR123456789')
      await shot('marcar-enviado', { mark: dialog })
      await dialog.getByRole('button', { name: 'Marcar como enviado' }).click()
      await dialog.waitFor({ state: 'hidden' })
      await shot('pedido-enviado')

      const buyer = await open('buyer')
      await buyer.goto(BASE + state.receiptUrl)
      await settleSoft(buyer)
      await shot('comprador-ve-envio', { mark: byRole(buyer, 'button', 'Lo recibí') })
      await byRole(buyer, 'button', 'Lo recibí').click()
      const confirm = buyer.getByRole('dialog').or(buyer.getByRole('alertdialog')).first()
      await shot('confirmar-recibido', { mark: confirm })
      await confirm.getByRole('button', { name: 'Lo recibí' }).click()
      await confirm.waitFor({ state: 'hidden' })
      await shot('pedido-entregado', { mark: byRole(buyer, 'button', 'Abrir un reclamo') })
      await byRole(buyer, 'button', 'Abrir un reclamo').click()
      await shot('abrir-reclamo', { mark: buyer.getByRole('dialog').first() })
      await buyer.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click()
    },
  },

  // ---------------------------------------------------------------- 13
  {
    num: 13,
    slug: 'resenas',
    async run({ open, shot, BASE, state }) {
      const page = await open('buyer')
      await page.goto(BASE + `/products/${state.productId}`)
      await settleSoft(page)
      const form = page.getByRole('heading', { name: 'Deja tu reseña' }).locator('xpath=ancestor::form[1]')
      await shot('formulario-resena', { mark: form })
      await form.getByRole('radio').nth(4).click({ force: true }).catch(async () => {
        await form.getByRole('button', { name: /5/ }).first().click()
      })
      await form.getByLabel('Comentario (opcional)').fill('Llegó rapidísimo y en perfecto estado. ¡Muy recomendado!')
      await shot('resena-completa', { mark: byRole(form, 'button', 'Publicar reseña') })
      await byRole(form, 'button', 'Publicar reseña').click()
      await page.waitForTimeout(1500)
      await shot('resena-publicada', { scrollTo: page.getByRole('region', { name: 'Reseñas' }) })
    },
  },

  // ---------------------------------------------------------------- 14
  {
    num: 14,
    slug: 'moderacion',
    async run({ open, use, shot, BASE }) {
      const COMMUNITY = '/communities/my-little-pony-collectors-mx'
      // Una persona reporta una publicación
      const buyer = await open('buyer')
      await buyer.goto(BASE + COMMUNITY)
      await settleSoft(buyer)
      const post = buyer.getByRole('article').filter({ hasText: '[SEED]' }).first()
      await post.getByRole('button', { name: 'Más opciones' }).click()
      await shot('menu-reportar', { mark: buyer.getByText('Reportar', { exact: true }) })
      await buyer.getByText('Reportar', { exact: true }).click()
      const dialog = buyer.getByRole('dialog')
      await dialog.getByText('Spam', { exact: true }).click()
      await dialog.getByLabel('Contanos más (opcional)').fill('Parece publicidad repetida de otra tienda.')
      await shot('dialogo-reporte', { mark: dialog })
      await byRole(dialog, 'button', 'Enviar reporte').click()
      await dialog.getByText(/Reporte enviado|Ya reportaste/).waitFor()
      await shot('reporte-enviado', { mark: dialog })

      // La moderadora lo atiende desde el panel de la comunidad
      const mod = await open('mod')
      await mod.goto(BASE + COMMUNITY)
      await settleSoft(mod)
      await shot('boton-gestionar', { mark: byRole(mod, 'link', 'Gestionar').or(byRole(mod, 'button', 'Gestionar')).first() })
      await mod.goto(BASE + COMMUNITY + '/moderacion')
      await settleSoft(mod)
      await shot('panel-reportes', { mark: mod.getByRole('navigation', { name: 'Panel de administración' }) })
      const resolve = mod.getByRole('button', { name: 'Resolver' }).first()
      if (await resolve.isVisible()) {
        await resolve.click()
        const rd = mod.getByRole('dialog')
        await rd.getByLabel('Nota interna').fill('Revisado: no es spam, se cierra con nota.')
        await shot('resolver-reporte', { mark: rd })
        await rd.getByRole('button', { name: 'Resolver' }).click()
        await rd.waitFor({ state: 'hidden' })
      }
      for (const [tab, id] of [
        ['Solicitudes', 'solicitudes'],
        ['Miembros', 'miembros'],
        ['Reglas', 'reglas'],
        ['Configuración', 'configuracion'],
      ]) {
        await mod.getByRole('navigation', { name: 'Panel de administración' }).getByRole('button', { name: tab }).click()
        await shot(id)
      }
      use(mod)
    },
  },

  // ---------------------------------------------------------------- 15
  {
    num: 15,
    slug: 'admin',
    async run({ open, shot, BASE }) {
      const page = await open('admin')
      await page.goto(BASE + '/')
      await openAccountMenu(page, 'admin')
      await shot('entrar-panel', { mark: page.getByText('Panel de administración').first() })
      const go = (section, tab = 'overview') => page.goto(`${BASE}/admin?section=${section}&tab=${tab}`)
      await go('reports')
      await shot('reportes', { mark: page.getByRole('navigation', { name: 'Secciones del panel' }) })
      await go('reports', 'manage')
      await shot('reportes-gestionar', { mark: page.getByRole('tablist', { name: 'Vistas de la sección' }) })
      await go('users')
      await shot('usuarios')
      await go('users', 'manage')
      await shot('usuarios-gestionar')
      await page.getByRole('main').getByRole('button', { name: 'Revisar usuario' }).first().click()
      await shot('revision-usuario', { mark: page.getByRole('dialog').first() })
      await page.keyboard.press('Escape')
      await go('sellers', 'manage')
      await shot('vendedores')
      await go('sellerRequests', 'manage')
      await shot('solicitudes-vendedor')
      const view = page.getByRole('main').getByRole('button', { name: 'Ver solicitud' }).first()
      if (await view.isVisible()) {
        await view.click()
        await shot('detalle-solicitud', { mark: page.getByRole('dialog').first() })
        await page.keyboard.press('Escape')
      }
      await go('communities')
      await shot('comunidades')
      await go('categories', 'manage')
      await shot('categorias')
      await page.getByRole('button', { name: 'Nueva categoría' }).click()
      await shot('nueva-categoria', { mark: page.getByRole('dialog').first() })
      await page.keyboard.press('Escape')
      await go('commissions', 'manage')
      await shot('comisiones')
      await go('disputes')
      await shot('reclamos')
      await go('moderationLog')
      await shot('registro')
    },
  },

  // ---------------------------------------------------------------- 16
  {
    num: 16,
    slug: 'pro',
    async run({ open, shot, BASE }) {
      const page = await openDemo(open, BASE)
      await page.goto(BASE + '/pro')
      await shot('pro-inicio')
      await page.getByRole('heading', { name: 'Elige tu plan' }).scrollIntoViewIfNeeded()
      const cta = page.getByRole('link', { name: /Hazte Pro|Extender mi Pro|Renovar Pro/ })
        .or(page.getByRole('button', { name: /Hazte Pro|Extender mi Pro|Renovar Pro/ }))
      await shot('planes', { mark: cta.first() })
      await cta.first().click()
      await page.waitForURL(/\/pro\/checkout/)
      await shot('pago-pro')
      await page.getByLabel('Número de tarjeta').fill('4242424242424242')
      await page.getByLabel('Vencimiento').fill('1230')
      await page.getByLabel('CVV').fill('123')
      await page.getByLabel('Nombre del titular').fill('Coleccionista Demo')
      const pay = page.getByRole('button', { name: /^Pagar/ })
      await shot('pago-pro-completo', { mark: pay })
      await pay.click()
      await page.getByText(/¡Ya eres Pro!|¡Renovaste tu Pro!/).waitFor({ timeout: 30000 })
      await shot('ya-eres-pro')
      await page.goto(BASE + '/settings?tab=appearance')
      await settleSoft(page)
      await page.getByText('Ganso ninja').click()
      await page.getByText('Marco dorado').click()
      await shot('personalizar-perfil', { mark: byRole(page, 'button', 'Guardar cambios') })
      await byRole(page, 'button', 'Guardar cambios').click()
      await page.waitForTimeout(1200)
      await page.goto(BASE + '/settings?tab=subscription')
      await shot('suscripcion')
      await page.goto(BASE + '/profile')
      await shot('perfil-pro', { wait: 1500 })
    },
  },

  // ---------------------------------------------------------------- 17
  {
    num: 17,
    slug: 'configuracion',
    async run({ open, shot, BASE }) {
      const page = await openDemo(open, BASE)
      await page.goto(BASE + '/settings?tab=account')
      await shot('cuenta', { mark: page.getByRole('main').getByRole('link', { name: 'Cuenta' }).or(page.getByRole('main').getByRole('button', { name: 'Cuenta' })).first() })
      await page.getByRole('heading', { name: 'País de envío' }).scrollIntoViewIfNeeded()
      await shot('pais-envio', { mark: page.getByRole('heading', { name: 'País de envío' }).locator('xpath=ancestor::section[1]') })
      await page.goto(BASE + '/settings?tab=profile')
      await settleSoft(page)
      const currency = page.getByRole('combobox', { name: 'Ver precios en' })
      await currency.scrollIntoViewIfNeeded()
      await currency.click()
      await shot('moneda-opciones', { mark: currency })
      await page.keyboard.type('dólar')
      await page.getByRole('option', { name: /USD/ }).first().click()
      const saveCurrency = currency.locator('xpath=ancestor::section[1]').getByRole('button', { name: 'Guardar cambios' })
      await shot('moneda-cambiada', { mark: saveCurrency })
      await saveCurrency.click()
      await page.waitForTimeout(1200)
      await page.goto(BASE + '/explore')
      await shot('precios-en-nueva-moneda', { wait: 1500 })
      // Idioma
      const lang = page.getByRole('button', { name: /^Cambiar idioma/ })
      await lang.click()
      await shot('idiomas', { mark: page.getByRole('dialog', { name: 'Cambiar idioma' }) })
      await page.getByRole('button', { name: 'English' }).click()
      await page.waitForTimeout(1200)
      await shot('app-en-ingles', { mark: page.getByRole('button', { name: /^Switch language/ }) })
      await page.getByRole('button', { name: /^Switch language/ }).click()
      await page.getByRole('button', { name: 'Español' }).click()
      await page.waitForTimeout(800)
      for (const [tab, id] of [
        ['privacy', 'privacidad'],
        ['notifications', 'notificaciones'],
      ]) {
        await page.goto(`${BASE}/settings?tab=${tab}`)
        await shot(id)
      }
    },
  },
]

export { openAccountMenu }
