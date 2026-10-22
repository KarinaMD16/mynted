import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { ErrorState } from '@/components/errors/ErrorState'
import { QueryErrorState, SignedOutState } from '@/components/errors/QueryErrorState'
import { Button } from '@/components/ui/Button'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { PeriodFilter } from '@/features/payments/components/PeriodFilter'
import { SalesSummaryCards } from '@/features/payments/components/SalesSummaryCards'
import { SalesTable } from '@/features/payments/components/SalesTable'
import { useMySales, useMySalesSummary } from '@/features/payments/hooks/usePaymentQueries'
import type { PaymentPeriodFilters } from '@/features/payments/models/payment'
import { useLanguage } from '@/i18n/LanguageContext'
import { SiteHeader } from '../components/layout/SiteHeader'

/**
 * "Mis ventas" (/ventas): el historial de ventas con la comisión de cada una y
 * el resumen del periodo.
 *
 * Solo para vendedores: el backend responde 403 a quien no lo sea, y eso es lo
 * que muestra QueryErrorState. El filtro de fechas afecta al resumen (que es
 * lo que el backend sabe filtrar); la tabla es el historial completo paginado.
 */
export default function MySalesPage() {
  const { t } = useLanguage()
  const { isLoggedIn, isLoading: isLoadingUser, data: user } = useCurrentUser()
  const isSeller = user?.role === 'seller' || user?.role === 'superadmin'

  const [period, setPeriod] = useState<PaymentPeriodFilters>({})
  // Un rango al revés lo rechaza el backend: no se consulta hasta corregirlo.
  const isValidPeriod = !(period.from && period.to && period.from > period.to)

  const sales = useMySales(isLoggedIn && isSeller)
  const summary = useMySalesSummary(period, isLoggedIn && isSeller && isValidPeriod)
  const rows = sales.data?.pages.flatMap((page) => page.data) ?? []

  return (
    <div className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-2">
          <Link to="/my-products" className="flex w-fit items-center gap-1.5 text-sm font-medium text-mynted-gray hover:text-mynted-ink">
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t('sales.backToPanel')}
          </Link>
          <h1 className="font-heading text-[26px] font-semibold text-mynted-ink">{t('sales.title')}</h1>
          <p className="text-sm text-mynted-gray">{t('sales.subtitle')}</p>
        </div>

        {isLoadingUser ? (
          <div className="h-72 animate-pulse rounded-2xl bg-white" aria-busy="true" />
        ) : !isLoggedIn ? (
          <SignedOutState description={t('sales.signedOut')} />
        ) : !isSeller ? (
          <ErrorState kind="forbidden" variant="compact" title={t('sales.notSeller')} description={t('sales.notSellerHint')} />
        ) : (
          <>
            <PeriodFilter value={period} onChange={setPeriod} />

            {summary.isLoading ? (
              <div className="h-24 animate-pulse rounded-2xl bg-white" aria-busy="true" />
            ) : summary.isError ? (
              <QueryErrorState
                error={summary.error}
                onRetry={() => void summary.refetch()}
                texts={{ error: { description: t('sales.summaryError') } }}
              />
            ) : summary.data ? (
              <SalesSummaryCards summary={summary.data} />
            ) : null}

            {sales.isLoading ? (
              <div className="h-72 animate-pulse rounded-2xl bg-white" aria-busy="true" />
            ) : sales.isError ? (
              <QueryErrorState
                error={sales.error}
                onRetry={() => void sales.refetch()}
                texts={{ error: { description: t('sales.loadError') } }}
              />
            ) : rows.length === 0 ? (
              <ErrorState kind="empty" variant="compact" title={t('sales.empty.title')} description={t('sales.empty.subtitle')} />
            ) : (
              <div className="flex flex-col gap-5">
                <SalesTable sales={rows} />
                {sales.hasNextPage && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void sales.fetchNextPage()}
                    isLoading={sales.isFetchingNextPage}
                    className="mx-auto"
                  >
                    {t('products.list.loadMore')}
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
