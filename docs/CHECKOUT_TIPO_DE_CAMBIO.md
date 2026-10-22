# Pendiente para el checkout: tipo de cambio

Decisión de UX (2026-10-21): en toda la app se muestra **un solo precio**, el convertido a la moneda del usuario, con "≈" cuando es aproximado. El precio en la moneda original y el aviso del tipo de cambio **no aparecen** en tarjetas, búsqueda, detalle ni chat. Esa información se deja para el **checkout**.

Por eso, cuando se haga el checkout, **tiene que** mostrar lo siguiente antes de que la persona confirme el pago.

## Qué mostrar

1. **El monto que se cobra de verdad**, en la moneda del producto. Ejemplo: "Se cobra US$27,00".
   - Sale de `GET /payments/quote/:productId` (`amount` + `currency`). Es la fuente oficial. **No** usar `displayFinalPrice`, que es solo referencial.
2. **La referencia en su moneda**, si el producto está en otra moneda. Ejemplo: "≈ ₡13 656,60 al tipo de cambio de hoy".
   - Debe coincidir con lo que la persona vio antes en la tarjeta y el detalle (ver el aviso de abajo).
3. **Un aviso corto**: "El monto en tu moneda es aproximado. Tu banco puede aplicar su propio tipo de cambio o comisiones."

El punto 1 tiene que estar **visible sin abrir nada**. Si se quiere un "detalle avanzado" desplegable, que contenga la tasa, la fuente (BCCR / Frankfurter) y la hora; el monto que se cobra no puede quedar escondido ahí.

Si el producto ya está en la moneda del usuario (`isConverted: false`), no hace falta nada de esto: se muestra el precio y listo.

## Aviso para el backend

`GET /payments/quote/:productId` convierte `convertedAmount` a la moneda `currency` del usuario, **no** a `displayCurrency`, y usa la tasa directa del par (no pasa por USD). En la sección 8 de `mynted-backend/docs/GUIA_MONEDA_FRONTEND.md` está como pendiente.

Hay que pedir que use `displayCurrency` y las mismas tasas que los productos. Si no, la referencia del checkout puede no coincidir con el "≈" que la persona vio en la tarjeta.

## Dónde está lo que ya existe en el frontend

- `src/utils/displayCurrency.ts`: cómo se decide la moneda de visualización y el header `X-Display-Currency`.
- `src/utils/price.ts`: `shownPrice()` elige entre el precio convertido y el original.
- `src/features/products/components/ProductPrice.tsx`: precio con "≈", sin el original.
