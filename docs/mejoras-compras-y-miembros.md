# Mejoras pendientes: flujo de compra y miembros de comunidad

Revisión del 28 de octubre de 2026 sobre `features-orlando` (frontend) y `orlando-features` (backend, al día con `main` en `b54bbd3`).

Cada punto dice si lo puede hacer el frontend con lo que ya hay o si primero necesita un cambio en el backend.

---

## 1. Flujo de compra

### Cómo funciona hoy

**Comprador**

1. En el detalle del producto toca "Comprar".
2. Va a `/checkout/:productId`. Ahí se ve la cotización (`GET /payments/quote/:id`) y el formulario de tarjeta. La pasarela es simulada.
3. Paga con `POST /payments/checkout`, que lleva `Idempotency-Key` para que un doble clic no cobre dos veces.
4. Llega al recibo, `/compras/:transactionId`.
5. Tiene la página "Mis compras".

**Vendedor**

- Recibe la notificación `sale_completed`.
- Tiene "Mis ventas", con resumen del periodo y la comisión de cada venta.

**Lo que ya funciona bien**

- Idempotencia del cobro.
- Monto convertido a la moneda de quien compra.
- Mensajes claros cuando la tarjeta se rechaza.
- Bloqueo si el producto está vendido, es propio o es de intercambio.

**El problema**

La compra termina en el recibo. No se sabe:

- a dónde se envía;
- si el vendedor ya lo despachó;
- si llegó;
- qué hacer si algo sale mal.

### 1.1 Se puede hacer ya (solo frontend)

#### A. Cantidad y stock

El backend ya lo soporta:

- `GET /payments/quote/:id?quantity=N` cotiza N unidades. El máximo es el stock.
- `POST /payments/checkout` acepta `quantity` (de 1 a 9999).
- El checkout descuenta el stock en la misma transacción. Cuando llega a 0, el producto pasa a `sold`.
- `quantity` existe en el producto y se valida al crear y editar (`create-product.dto.ts`).

El frontend no lo usa en ningún lado: siempre compra 1 unidad, y el vendedor no puede indicar cuántas tiene.

Qué hacer:

- [ ] Selector de cantidad en el checkout, limitado al stock, que vuelve a pedir la cotización con `?quantity=`.
- [ ] Mostrar "Quedan N" en el detalle cuando el stock es mayor que 1.
- [ ] Campo de stock en el formulario de crear y editar producto.
- [ ] Mostrar la cantidad en el recibo, en "Mis compras" y en "Mis ventas" (la respuesta del checkout ya trae `quantity`).

#### B. Aviso de envío antes de pagar

- El producto trae `shipsTo`, la lista de países a los que envía.
- El comprador ya eligió su país en `ShipToDialog`.

Hoy se puede pagar aunque el vendedor no envíe a ese país.

- [ ] En el checkout, si `shipsTo` no incluye el país del comprador, mostrar un aviso y bloquear el pago.
- [ ] En el detalle, avisar antes de llegar al checkout.

> Hace falta igual la validación en el backend (ver 1.2-D): el frontend solo evita el error, no lo garantiza.

#### C. Qué sigue después del recibo

El recibo hoy es un callejón sin salida.

- [ ] Botón "Escribir al vendedor", que abre el chat del producto con `useContactSeller`, el mismo de "Contactar".
- [ ] Botón "Dejar reseña" cuando `canReview` sea `true`.
- [ ] En "Mis ventas", mostrar quién compró y un botón para escribirle.

#### D. Checkout más claro

- [ ] Pasos visibles: Revisar → Pagar → Listo.
- [ ] Resumen con cantidad, precio por unidad, total y país de envío antes de confirmar.

### 1.2 Necesita backend

#### A. Dirección de envío (prioridad alta)

El checkout no pide ni guarda ninguna dirección, así que el vendedor no sabe a dónde mandar el paquete.

Propuesta:

- `POST /payments/checkout` acepta `shippingAddress`:
  ```json
  {
    "fullName": "string",
    "phone": "string",
    "country": "CR",
    "province": "string",
    "city": "string",
    "line1": "string",
    "line2": "string | null",
    "postalCode": "string | null",
    "notes": "string | null"
  }
  ```
- Se guarda como copia en la transacción, no como referencia: si el usuario cambia su dirección después, el pedido no cambia.
- El comprador la ve en el recibo y el vendedor la ve en el detalle de la venta.
- Opcional: `GET/PUT /users/me/addresses` para guardar direcciones y no escribirlas cada vez.

#### B. Estados del pedido (prioridad alta)

Hoy `TransactionStatus` es `pending | completed | failed | refunded`. Eso describe el cobro, no el envío.

Propuesta: un estado de envío aparte en la transacción.

| Estado | Lo cambia | Notifica a |
|---|---|---|
| `paid` (al cobrar) | backend | vendedor (`sale_completed`, ya existe) |
| `shipped` | vendedor, con `trackingNumber` y `carrier` opcionales | comprador |
| `delivered` | comprador ("Lo recibí") | vendedor |
| `cancelled` | vendedor (antes de enviar) o superadmin | la otra parte |

Endpoints:

- `PATCH /payments/:id/ship`, solo el vendedor. Recibe `{ trackingNumber?, carrier? }`.
- `PATCH /payments/:id/deliver`, solo el comprador.
- Notificaciones nuevas: `order_shipped` y `order_delivered`. Su `data` debe traer `transactionId`, `productId` y `productTitle`, para que el frontend arme el texto traducido.

Con esto el recibo puede mostrar una línea de tiempo, y "Mis ventas" una lista de "pendientes de enviar".

Detalle importante: hoy las reseñas se habilitan al completar el pago. Con estados de envío, tendría más sentido habilitarlas cuando el pedido se entrega.

#### C. Cancelación, reembolso y reclamos (prioridad media)

El estado `refunded` existe en el enum, pero ningún endpoint lo usa.

- `POST /payments/:id/cancel`: el vendedor cancela antes de enviar. Reembolsa en la pasarela simulada y devuelve el stock.
- `POST /payments/:id/dispute`: el comprador abre un reclamo ("no llegó", "no es lo prometido") con un motivo. Lo resuelve el superadmin, que puede reembolsar o cerrar.
- La resolución queda en el registro de moderación, igual que las demás acciones.

#### D. Validar `shipsTo` al pagar (prioridad media)

`POST /payments/checkout` no revisa que el país de envío esté en `product.shipsTo`. Con la dirección de 1.2-A hay contra qué compararlo. Si no envía a ese país, debería responder 409.

#### E. Costo de envío (opcional)

Hoy el precio lo es todo. El vendedor podría indicar un costo de envío por país o fijo. Sumaría a la cotización y al total, pero no a la base de la comisión (a definir).

#### F. Retener el pago hasta la entrega (opcional, avanzado)

El vendedor cobra cuando el comprador confirma `delivered`, o automáticamente a los N días de `shipped`. Le da confianza al comprador, pero cambia cómo se calculan las ventas y el resumen del vendedor.

### Orden sugerido

1. **Frontend ya:** 1.1-A (cantidad y stock) y 1.1-C (qué sigue después del recibo).
2. **Pedir al backend:** 1.2-A (dirección) y 1.2-B (estados del pedido). Son los que convierten esto en una tienda real.
3. **Después:** 1.2-C (cancelar y reclamar) y 1.2-D (validar envío).

---

## 2. Miembros en la moderación de una comunidad

### Cómo funciona hoy

La moderación de una comunidad (`/communities/:slug/moderacion`) tiene las pestañas Reportes, Solicitudes, Miembros, Reglas y Configuración.

**Miembros está marcada como "Pronto"** (`available: false` en `CommunityModerationPage.tsx`) y no tiene sección. En el frontend no hay ningún servicio de miembros.

Lo que expone el backend:

| Endpoint | Quién | Qué hace |
|---|---|---|
| `POST /communities/:id/join` | cualquiera | unirse (o pedir unirse, si es privada) |
| `DELETE /communities/:id/leave` | el miembro | salirse |
| `GET /communities/:id/join-requests` y aceptar o rechazar | dueño y moderadores | solicitudes (ya está en el panel) |
| `POST /communities/:id/moderators/:profileId` | solo el dueño | nombrar moderador |
| `DELETE /communities/:id/moderators/:profileId` | solo el dueño | quitar moderador |
| `GET /communities/:id/stats` | — | solo trae `memberCount`, no la lista |

**El bloqueo:** nombrar o quitar moderadores existe, pero pide el `profileId` y **no hay forma de listar los miembros** para elegirlo. Por eso la pestaña no se puede armar todavía.

### 2.1 Necesita backend

#### A. Listar miembros (bloqueante)

`GET /communities/:id/members?page=&limit=&role=&search=`

- Solo para dueño y moderadores. El superadmin entra a todas.
- Cada fila:
  ```json
  {
    "communityProfileId": 12,
    "userId": "uuid",
    "username": "string",
    "displayName": "string",
    "photoUrl": "string | null",
    "role": "member | moderator | owner",
    "joinedAt": "ISO",
    "postCount": 0,
    "replyCount": 0,
    "hiddenContentCount": 0
  }
  ```
- Paginado con el mismo formato `{ data, pagination }` que el resto.
- `search` busca por username o displayName.

#### B. Expulsar miembro

`DELETE /communities/:id/members/:profileId` con `{ reason }`.

- Lo puede hacer el dueño con cualquiera, o un moderador con un `member`. Nadie expulsa al dueño.
- Puede volver a unirse.
- Notificación `community_member_removed` al expulsado, con `communityId`, `communityName` y `reason`.
- Queda en el registro de moderación.

#### C. Bloquear (ban) y desbloquear

- `POST /communities/:id/bans` con `{ userId, reason }` y `DELETE /communities/:id/bans/:userId`.
- `GET /communities/:id/bans` para la lista.
- Un bloqueado no puede volver a unirse ni pedir unirse: el join responde 403 con un mensaje claro.
- Sin esto, un expulsado vuelve a entrar enseguida en una comunidad pública.

#### D. Transferir la comunidad

`POST /communities/:id/transfer` con `{ profileId }`, solo el dueño.

- El nuevo dueño debe ser miembro.
- El dueño anterior queda como moderador.
- Hoy no hay forma de que un dueño deje su comunidad en otras manos.

#### E. Notificaciones de rol

Al nombrar o quitar un moderador, avisarle a la persona con `community_moderator_added` y `community_moderator_removed`, con `communityId`, `communityName` y `communitySlug`.

### 2.2 Lo que haría el frontend (cuando esté 2.1-A)

Una sección `ModerationMembersSection` con la misma tabla del panel (`AdminDataTable`):

- [ ] Columnas: miembro (avatar, displayName y @username), rol, fecha de ingreso y actividad (publicaciones y respuestas, contenido oculto).
- [ ] Filtro por rol, buscador y paginación del servidor (`AdminPageFooter`).
- [ ] Acciones según quién mira:
  - **Dueño:** nombrar o quitar moderador (ya existen los endpoints), expulsar, bloquear y transferir.
  - **Moderador:** expulsar y bloquear a miembros comunes.
  - Nadie actúa sobre sí mismo ni sobre el dueño. El botón se muestra deshabilitado, con el motivo.
- [ ] Confirmación con motivo obligatorio (`ConfirmWithReasonDialog`) para expulsar y bloquear.
- [ ] Sub-pestaña "Bloqueados" con desbloquear (cuando esté 2.1-C).
- [ ] Quitar la etiqueta "Pronto" de la pestaña.
- [ ] Textos de las notificaciones nuevas en los 6 idiomas.

### Orden sugerido

1. **Pedir al backend 2.1-A (listar miembros).** Sin eso no hay pestaña.
2. **Frontend:** la tabla con nombrar y quitar moderador, que ya funciona en el backend.
3. **Pedir al backend 2.1-B y 2.1-C (expulsar y bloquear)**, y sumar esas acciones a la tabla.
4. **Después:** 2.1-D (transferir) y 2.1-E (notificaciones de rol).
