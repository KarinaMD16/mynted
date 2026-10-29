/**
 * Tipos de la pasarela de pagos simulada (módulo `payments` del backend).
 *
 * Los montos llegan como números: las columnas numeric de Postgres salen como
 * string y el backend las convierte con su NumericTransformer antes de
 * responder. Las tasas (`commissionRate`, `discount`) vienen en fracción
 * —0.05 es 5 %—, nunca en porcentaje.
 */

/** Espeja el enum TransactionStatus del backend. */
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded'

/**
 * Estado del envío, aparte del pago (ShippingStatus del backend):
 * pagado → enviado → entregado. `null` en compras anteriores al seguimiento
 * de envíos: no se asume `paid` y no admiten las acciones nuevas.
 */
export type ShippingStatus = 'paid' | 'shipped' | 'delivered'

/** Espeja PaymentFailureReason: por qué la pasarela rechazó el cobro. */
export type PaymentFailureReason = 'card_declined' | 'insufficient_funds' | 'expired_card'

/** Espeja CommissionTierType: los rangos son por cantidad de ventas o por precio. */
export type CommissionTierType = 'sales' | 'price'

// -----------------------------------------------------------------------------
// Checkout
// -----------------------------------------------------------------------------

/**
 * Tarjeta tal como la recibe POST /payments/checkout (PaymentCardDto). El
 * backend valida con whitelist + forbidNonWhitelisted, así que no acepta
 * campos de más: estos cuatro y ninguno otro.
 */
export interface PaymentCardPayload {
  cardNumber: string
  expiryMonth: number
  /** Año de 4 dígitos. */
  expiryYear: number
  cvv: string
  /**
   * Nombre del titular, obligatorio. El backend lo normaliza (recorta y
   * colapsa espacios) antes de validarlo y lo guarda con la transacción.
   */
  cardHolderName: string
}

/**
 * Dirección de envío (ShippingAddressDto). Se guarda como copia en la
 * transacción: si después cambia el perfil, el pedido no cambia. Los
 * opcionales van en null, no como texto vacío.
 */
export interface ShippingAddressPayload {
  fullName: string
  phone: string
  /** ISO 3166-1 alfa-2. Tiene que estar en `shipsTo` del producto. */
  country: string
  province: string
  city: string
  line1: string
  line2: string | null
  postalCode: string | null
  notes: string | null
}

export interface CheckoutPayload {
  productId: number
  /** Unidades (1 por defecto). No puede superar el stock. */
  quantity?: number
  card: PaymentCardPayload
  /** Obligatoria para comprar un producto. */
  shippingAddress: ShippingAddressPayload
}

/** Comisión que se le cobró al vendedor en esta transacción. */
export interface CheckoutCommissionSnapshot {
  salesTierName: string
  salesDiscount: number
  priceTierName: string
  priceDiscount: number
  commissionRate: number
  commissionAmount: number
  sellerNet: number
  exchangeRate: number | null
  normalizedAmountCrc: number | null
}

/** Respuesta de un checkout aprobado. */
export interface CheckoutResult {
  id: string
  status: TransactionStatus
  amount: number
  currency: string
  commission: CheckoutCommissionSnapshot
  gatewayReference: string | null
  cardBrand: string | null
  cardLast4: string | null
  /** null en transacciones anteriores a que el backend guardara este dato. */
  cardHolderName: string | null
  failureReason: string | null
  completedAt: string | null
}

/**
 * Cuerpo del 402 con el que el backend responde un pago rechazado (ver
 * `paymentRequired` en payments.service.ts). No es un error de la petición:
 * la transacción se guardó como `failed` y se puede reintentar con otra
 * tarjeta — y con otra Idempotency-Key, porque la anterior ya quedó usada.
 */
export interface PaymentDeclinedBody {
  statusCode: number
  transactionId: string
  failureReason: PaymentFailureReason | null
}

// -----------------------------------------------------------------------------
// Cotización
// -----------------------------------------------------------------------------

/** El mismo monto en la moneda del usuario, para que sepa cuánto es "en lo suyo". */
export interface QuoteConvertedAmount {
  amount: number
  currency: string
  exchangeRate: number
  /** Fecha del tipo de cambio usado (YYYY-MM-DD). */
  rateDate: string
}

/** Comisión del producto. El backend solo la manda si quien cotiza es el vendedor. */
export interface QuoteCommission {
  rate: number
  amount: number
  sellerNet: number
  salesTierName: string
  priceTierName: string
  salesDiscount: number
  priceDiscount: number
}

export interface PaymentQuote {
  productId: number
  /** Unidades cotizadas; `amount` es `unitPrice × quantity`. */
  quantity: number
  unitPrice: number
  /** Stock vigente: el tope del selector de cantidad. */
  availableQuantity: number
  amount: number
  currency: string
  convertedAmount?: QuoteConvertedAmount
  commission?: QuoteCommission
}

// -----------------------------------------------------------------------------
// Historial
// -----------------------------------------------------------------------------

export interface PaymentPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaymentProductSummary {
  id: number
  title: string
  imageUrl: string | null
}

export interface PurchaseItem {
  id: string
  /** `completed` o `refunded` (cancelada o reembolsada): el listado no trae fallidas. */
  paymentStatus: TransactionStatus
  shippingStatus: ShippingStatus | null
  product: PaymentProductSummary
  seller: { sellerId: number; displayName: string }
  amount: number
  currency: string
  completedAt: string | null
  cardLast4: string | null
  /** null en compras anteriores a que el backend guardara este dato. */
  cardHolderName: string | null
  gatewayReference: string | null
}

export interface PurchasePage {
  data: PurchaseItem[]
  pagination: PaymentPagination
}

export interface SaleItem {
  id: string
  paymentStatus: TransactionStatus
  shippingStatus: ShippingStatus | null
  completedAt: string | null
  product: PaymentProductSummary
  buyer: { id: string; username: string; photoUrl: string | null }
  amount: number
  currency: string
  salesTierName: string
  priceTierName: string
  commissionRate: number
  commissionAmount: number
  sellerNet: number
}

export interface SalePage {
  data: SaleItem[]
  pagination: PaymentPagination
}

export interface SalesTotals {
  gross: number
  commissions: number
  net: number
}

export interface SalesBreakdown extends SalesTotals {
  currency: string
  transactionCount: number
}

/**
 * GET /payments/me/sales/summary. `totals` viene en una sola moneda
 * (`currency`); `approximate` avisa de que hubo que convertir con el tipo de
 * cambio porque las ventas no estaban todas en esa moneda.
 */
export interface SalesSummary {
  currency: string
  period: { from: string | null; to: string | null }
  totals: SalesTotals
  breakdown: SalesBreakdown[]
  approximate: boolean
}

/** Rango de fechas (YYYY-MM-DD) del resumen de ventas y del resumen de admin. */
export interface PaymentPeriodFilters {
  from?: string
  to?: string
}

/** Reclamo de una compra, como lo ven comprador y vendedor en el recibo. */
export interface ReceiptDispute {
  id: string
  status: 'open' | 'resolved_refund' | 'resolved_closed'
  reason: string
  resolution: string | null
  /** La explicación de quien lo resolvió. */
  resolutionNote: string | null
  createdAt: string
  resolvedAt: string | null
}

export interface PaymentReceipt {
  id: string
  status: TransactionStatus
  product: PaymentProductSummary
  seller: { sellerId: number; displayName: string }
  amount: number
  currency: string
  date: string
  cardLast4: string | null
  /**
   * Solo le llega al comprador: para el vendedor el backend omite el campo,
   * porque es un dato personal de quien compró. `null` en transacciones
   * anteriores a que se guardara.
   */
  cardHolderName?: string | null
  gatewayReference: string | null
  failureReason: PaymentFailureReason | null
  /** Solo la ven comprador y vendedor; `null` en compras sin dirección guardada. */
  shippingAddress: ShippingAddressPayload | null
  shippingStatus: ShippingStatus | null
  trackingNumber: string | null
  carrier: string | null
  shippedAt: string | null
  deliveredAt: string | null
  commission?: {
    salesTierName: string
    priceTierName: string
    commissionRate: number
    commissionAmount: number
    sellerNet: number
  }
  /** El reclamo de esta compra (uno por compra); null si no hay. */
  dispute?: ReceiptDispute | null
}

// -----------------------------------------------------------------------------
// Comisiones
// -----------------------------------------------------------------------------

/** Un rango de comisión como se muestra: por ventas (sin moneda) o por precio. */
export interface CommissionTierDisplay {
  name: string
  minValue: number
  /** null = el último rango, sin tope. */
  maxValue: number | null
  discount: number
}

export interface PriceTierDisplay extends CommissionTierDisplay {
  currency: string
  /** Los límites se convirtieron desde otra moneda, así que son aproximados. */
  approximate: boolean
}

/** Una celda de la matriz: qué comisión paga ese nivel en ese rango de precio. */
export interface CommissionRateCell {
  priceTierName: string
  priceDiscount: number
  commissionRate: number
}

export interface CommissionMatrixRow {
  salesTierName: string
  salesDiscount: number
  rates: CommissionRateCell[]
}

/** GET /commission-tiers?currency= — rangos activos, público. */
export interface CommissionTiers {
  currency: string
  salesTiers: CommissionTierDisplay[]
  priceTiers: PriceTierDisplay[]
}

/**
 * GET /sellers/me/commission — nivel del vendedor y la matriz completa.
 * `salesRemaining` es cuántas ventas le faltan para `nextTier` (null si ya
 * está en el último).
 */
export interface CommissionProfile {
  currency: string
  completedSalesCount: number
  currentTier: CommissionTierDisplay
  nextTier: CommissionTierDisplay | null
  salesRemaining: number | null
  priceTiers: PriceTierDisplay[]
  matrix: CommissionMatrixRow[]
}

/** GET /sellers/me/commission/estimate?amount= — cuánto recibiría por ese precio. */
export interface CommissionEstimate {
  amount: number
  currency: string
  commissionRate: number
  commissionAmount: number
  sellerNet: number
  salesTierName: string
  priceTierName: string
  salesDiscount: number
  priceDiscount: number
}

// -----------------------------------------------------------------------------
// Administración
// -----------------------------------------------------------------------------

/** Un rango tal como lo edita el superadmin (incluye los inactivos). */
export interface AdminCommissionTier {
  id: number
  type: CommissionTierType
  name: string
  minValue: number
  maxValue: number | null
  /** Los rangos por ventas no llevan moneda. */
  currency: string | null
  discount: number
  isActive: boolean
}

export interface AdminCommissionTierFilters {
  type?: CommissionTierType
  currency?: string
}

/** Cuerpo de POST /admin/commission-tiers. En PATCH todo es opcional. */
export interface AdminCommissionTierPayload {
  type: CommissionTierType
  name: string
  minValue: number
  maxValue: number | null
  currency: string | null
  discount: number
  isActive: boolean
}

export interface AdminPaymentSummaryGroup {
  currency: string
  transactionCount: number
  gross: number
  commissions: number
  sellerNet: number
}

export interface AdminPaymentSummary {
  period: { from: string | null; to: string | null }
  totalsByCurrency: AdminPaymentSummaryGroup[]
  bySalesTier: (AdminPaymentSummaryGroup & { salesTierName: string })[]
  byPriceTier: (AdminPaymentSummaryGroup & { priceTierName: string })[]
}
